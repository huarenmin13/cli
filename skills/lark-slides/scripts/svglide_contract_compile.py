#!/usr/bin/env python3
# Copyright (c) 2026 Lark Technologies Pte. Ltd.
# SPDX-License-Identifier: MIT

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from html import escape
from pathlib import Path
from typing import Any, Sequence

import svglide_asset_injector
import svglide_svg_contract as contract
import svg_raster_renderer


RAW_MANIFEST = Path("04-artboard/raw/manifest.json")
CONTRACT_DIR = Path("04-svg/contract")
CONTRACT_MANIFEST = CONTRACT_DIR / "manifest.json"
TEXT_STYLE_MANIFEST_ID = "svglide-text-style-manifest"
TEXT_STYLE_MANIFEST_VERSION = "svglide-satori-text-style/v1"
RAW_LOWERING_MODE = "raw_satori_lowering"
SEMANTIC_FALLBACK_MODE = "semantic_fallback"
LEGACY_PASSTHROUGH_MODE = "legacy_passthrough"
VISIBLE_SHAPE_TAGS = {"rect", "circle", "ellipse", "line", "path", "polygon", "polyline"}
VISIBLE_IMAGE_TAGS = {"image"}
VISIBLE_TEXT_TAGS = {"text"}
HARD_EFFECT_ATTRS = {"filter", "mask", "clip-path"}
HARD_EFFECT_STYLE_PROPS = {"filter", "mask", "clip-path"}
LOCAL_RASTER_PAGE_AREA_LIMIT = 0.25
SUPPORT_RETENTION_TAGS = ["defs", "style", "clipPath", "mask", "filter", "metadata"]
SUPPORT_SUBTREE_TAGS = {
    "defs",
    "clipPath",
    "mask",
    "metadata",
    "style",
    "linearGradient",
    "radialGradient",
    "pattern",
    "filter",
    "symbol",
    "marker",
}
PRESERVED_CONTAINER_TAGS = {"svg", "g", *SUPPORT_SUBTREE_TAGS}

ET.register_namespace("", contract.SVG_NS)
ET.register_namespace("slide", contract.SLIDE_NS)
ET.register_namespace("xlink", "http://www.w3.org/1999/xlink")


class ContractCompileError(Exception):
    pass


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise ContractCompileError(f"missing json file: {path}") from exc
    except json.JSONDecodeError as exc:
        raise ContractCompileError(f"invalid json file: {path}: {exc}") from exc


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def rel(project: Path, path: Path) -> str:
    return path.relative_to(project).as_posix()


def number(value: Any, default: float = 0.0) -> float:
    try:
        if isinstance(value, str) and value.strip().endswith("px"):
            value = value.strip()[:-2]
        return float(value)
    except (TypeError, ValueError):
        return default


def scalar(value: float) -> str:
    return f"{value:g}"


def local_name(tag: str) -> str:
    if "}" in tag:
        return tag.rsplit("}", 1)[1]
    return tag


def slide_attr(name: str) -> str:
    return f"{{{contract.SLIDE_NS}}}{name}"


def xlink_attr(name: str) -> str:
    return f"{{http://www.w3.org/1999/xlink}}{name}"


def get_xml_attr(element: ET.Element, name: str) -> str | None:
    value = element.attrib.get(name)
    if value is not None:
        return value
    for key, candidate in element.attrib.items():
        if key.endswith("}" + name):
            return candidate
    return None


def set_slide_role(element: ET.Element, role: str) -> None:
    element.attrib[slide_attr("role")] = role


def ensure_node_id(element: ET.Element, fallback: str) -> str:
    existing = get_xml_attr(element, "id") or get_xml_attr(element, "data-node-id")
    node_id = str(existing or fallback)
    element.attrib.setdefault("id", node_id)
    element.attrib.setdefault("data-node-id", node_id)
    return node_id


def normalize_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def parse_style_attr(style_value: str | None) -> dict[str, str]:
    out: dict[str, str] = {}
    if not style_value:
        return out
    for part in style_value.split(";"):
        if ":" not in part:
            continue
        key, value = part.split(":", 1)
        out[key.strip().lower()] = value.strip()
    return out


def style_attr_from_dict(style: dict[str, str]) -> str:
    return ";".join(f"{key}:{value}" for key, value in style.items() if key and value)


def style_or_attr(element: ET.Element, name: str, default: str | None = None) -> str | None:
    direct = get_xml_attr(element, name)
    if direct is not None:
        return direct
    return parse_style_attr(get_xml_attr(element, "style")).get(name.lower(), default)


def semantic_text_source_refs(semantic_map: dict[str, Any]) -> list[dict[str, str]]:
    refs: list[dict[str, str]] = []
    elements = semantic_map.get("elements") if isinstance(semantic_map.get("elements"), list) else []
    for raw in elements:
        if not isinstance(raw, dict):
            continue
        text = normalize_text(raw.get("text"))
        source_ref = raw.get("source_ref")
        if text and isinstance(source_ref, str) and source_ref:
            refs.append({"text": text, "source_ref": source_ref})
    return refs


def source_ref_for_text(text: str, refs: list[dict[str, str]]) -> str | None:
    normalized = normalize_text(text)
    if not normalized:
        return None
    for ref in refs:
        if ref["text"] == normalized:
            return ref["source_ref"]
    if len(normalized) >= 4:
        candidates = [ref["source_ref"] for ref in refs if normalized in ref["text"]]
        if len(candidates) == 1:
            return candidates[0]
    return None


def text_transform_policy(text: str) -> str:
    compact = re.sub(r"[^A-Za-z]+", "", text)
    if compact and compact.upper() == compact:
        return "uppercase"
    return "none"


def numeric_style_value(value: str | None, default: float = 0.0) -> float:
    if not value:
        return default
    return number(value.strip(), default)


def parse_points(value: str | None) -> list[tuple[float, float]]:
    if not value:
        return []
    nums = [float(part) for part in re.findall(r"-?\d+(?:\.\d+)?", value)]
    return list(zip(nums[0::2], nums[1::2]))


def bbox_from_points(points: list[tuple[float, float]]) -> dict[str, float] | None:
    if not points:
        return None
    xs = [point[0] for point in points]
    ys = [point[1] for point in points]
    return {"x": min(xs), "y": min(ys), "width": max(xs) - min(xs), "height": max(ys) - min(ys)}


def root_dimensions(root: ET.Element) -> tuple[float, float]:
    view_box = get_xml_attr(root, "viewBox")
    if view_box:
        parts = re.findall(r"-?\d+(?:\.\d+)?", view_box)
        if len(parts) == 4:
            return float(parts[2]), float(parts[3])
    return number(get_xml_attr(root, "width"), 960.0), number(get_xml_attr(root, "height"), 540.0)


def svg_element_bbox(element: ET.Element) -> dict[str, float] | None:
    name = local_name(element.tag)
    if name in {"rect", "image"}:
        width = number(get_xml_attr(element, "width"), -1)
        height = number(get_xml_attr(element, "height"), -1)
        if width <= 0 or height <= 0:
            return None
        return {
            "x": number(get_xml_attr(element, "x"), 0.0),
            "y": number(get_xml_attr(element, "y"), 0.0),
            "width": width,
            "height": height,
        }
    if name == "text":
        x = number(get_xml_attr(element, "x"), 0.0)
        y = number(get_xml_attr(element, "y"), 0.0)
        width = number(get_xml_attr(element, "width"), -1)
        height = number(get_xml_attr(element, "height"), -1)
        if width <= 0:
            font_size = numeric_style_value(style_or_attr(element, "font-size"), 16)
            width = max(len(normalize_text("".join(element.itertext()))) * font_size * 0.58, font_size)
        if height <= 0:
            height = numeric_style_value(style_or_attr(element, "font-size"), 16) * 1.2
        return {"x": x, "y": y, "width": width, "height": height}
    if name == "circle":
        cx = number(get_xml_attr(element, "cx"), 0.0)
        cy = number(get_xml_attr(element, "cy"), 0.0)
        r = number(get_xml_attr(element, "r"), 0.0)
        if r <= 0:
            return None
        return {"x": cx - r, "y": cy - r, "width": 2 * r, "height": 2 * r}
    if name == "ellipse":
        cx = number(get_xml_attr(element, "cx"), 0.0)
        cy = number(get_xml_attr(element, "cy"), 0.0)
        rx = number(get_xml_attr(element, "rx"), 0.0)
        ry = number(get_xml_attr(element, "ry"), 0.0)
        if rx <= 0 or ry <= 0:
            return None
        return {"x": cx - rx, "y": cy - ry, "width": 2 * rx, "height": 2 * ry}
    if name == "line":
        x1 = number(get_xml_attr(element, "x1"), 0.0)
        y1 = number(get_xml_attr(element, "y1"), 0.0)
        x2 = number(get_xml_attr(element, "x2"), x1)
        y2 = number(get_xml_attr(element, "y2"), y1)
        return {"x": min(x1, x2), "y": min(y1, y2), "width": max(abs(x2 - x1), 1.0), "height": max(abs(y2 - y1), 1.0)}
    if name in {"polygon", "polyline"}:
        return bbox_from_points(parse_points(get_xml_attr(element, "points")))
    if name == "path":
        nums = [float(part) for part in re.findall(r"-?\d+(?:\.\d+)?", get_xml_attr(element, "d") or "")]
        return bbox_from_points(list(zip(nums[0::2], nums[1::2]))) if nums else None
    if name == "g":
        boxes = [svg_element_bbox(child) for child in list(element)]
        boxes = [box for box in boxes if box is not None]
        if not boxes:
            return None
        x1 = min(box["x"] for box in boxes)
        y1 = min(box["y"] for box in boxes)
        x2 = max(box["x"] + box["width"] for box in boxes)
        y2 = max(box["y"] + box["height"] for box in boxes)
        return {"x": x1, "y": y1, "width": x2 - x1, "height": y2 - y1}
    return None


def bbox_to_list(box: dict[str, float]) -> list[float]:
    return [round(box["x"], 4), round(box["y"], 4), round(box["width"], 4), round(box["height"], 4)]


def area_ratio(box: dict[str, float], page_width: float, page_height: float) -> float:
    page_area = max(page_width * page_height, 1.0)
    return round(max(box["width"], 0.0) * max(box["height"], 0.0) / page_area, 6)


def parent_map(root: ET.Element) -> dict[ET.Element, ET.Element]:
    return {child: parent for parent in root.iter() for child in list(parent)}


def element_in_support(element: ET.Element, parents: dict[ET.Element, ET.Element], root: ET.Element) -> bool:
    cursor = element
    while cursor is not root:
        if local_name(cursor.tag) in SUPPORT_SUBTREE_TAGS:
            return True
        parent = parents.get(cursor)
        if parent is None:
            return False
        cursor = parent
    return False


def hard_effect_attrs(element: ET.Element) -> list[str]:
    found: list[str] = []
    for attr_name in HARD_EFFECT_ATTRS:
        if get_xml_attr(element, attr_name):
            found.append(attr_name)
    style = parse_style_attr(get_xml_attr(element, "style"))
    for prop in HARD_EFFECT_STYLE_PROPS:
        if style.get(prop):
            found.append(prop)
    return sorted(set(found))


def hard_effect_ref_ids(element: ET.Element) -> list[str]:
    refs: list[str] = []
    for attr_name in HARD_EFFECT_ATTRS:
        ref_id = url_ref_id(get_xml_attr(element, attr_name))
        if ref_id:
            refs.append(ref_id)
    style = parse_style_attr(get_xml_attr(element, "style"))
    for prop in HARD_EFFECT_STYLE_PROPS:
        ref_id = url_ref_id(style.get(prop))
        if ref_id:
            refs.append(ref_id)
    return refs


def is_satori_layout_effect(element: ET.Element) -> bool:
    attrs = hard_effect_attrs(element)
    if not attrs or "filter" in attrs:
        return False
    refs = hard_effect_ref_ids(element)
    return bool(refs) and all(ref.startswith("satori_") for ref in refs)


def remove_hard_effect_attrs(element: ET.Element) -> list[str]:
    removed: list[str] = []
    for key in list(element.attrib.keys()):
        if local_name(key) in HARD_EFFECT_ATTRS:
            removed.append(local_name(key))
            element.attrib.pop(key, None)
    style = parse_style_attr(get_xml_attr(element, "style"))
    for prop in HARD_EFFECT_STYLE_PROPS:
        if prop in style:
            removed.append(prop)
            style.pop(prop, None)
    if removed:
        if style:
            element.attrib["style"] = style_attr_from_dict(style)
        else:
            for key in list(element.attrib.keys()):
                if local_name(key) == "style":
                    element.attrib.pop(key, None)
    return sorted(set(removed))


def url_ref_id(value: str | None) -> str | None:
    if not value:
        return None
    match = re.search(r"url\(\s*#([^)'\"]+)\s*\)", value)
    return match.group(1) if match else None


def support_by_id(root: ET.Element, tag_name: str, element_id: str) -> ET.Element | None:
    for element in root.iter():
        if local_name(element.tag) == tag_name and get_xml_attr(element, "id") == element_id:
            return element
    return None


def clip_rect_bbox(root: ET.Element, clip_value: str | None) -> dict[str, float] | None:
    clip_id = url_ref_id(clip_value)
    if not clip_id:
        return None
    clip = support_by_id(root, "clipPath", clip_id)
    if clip is None:
        return None
    rects = [child for child in list(clip) if local_name(child.tag) == "rect"]
    if len(rects) != 1:
        return None
    return svg_element_bbox(rects[0])


def bbox_covers(inner: dict[str, float], outer: dict[str, float]) -> bool:
    return (
        outer["x"] <= inner["x"] + 1
        and outer["y"] <= inner["y"] + 1
        and outer["x"] + outer["width"] >= inner["x"] + inner["width"] - 1
        and outer["y"] + outer["height"] >= inner["y"] + inner["height"] - 1
    )


def strip_text_clip_or_block(root: ET.Element, report: dict[str, Any]) -> None:
    for element in list(root.iter()):
        if local_name(element.tag) != "text":
            continue
        clip_value = get_xml_attr(element, "clip-path") or parse_style_attr(get_xml_attr(element, "style")).get("clip-path")
        if not clip_value:
            continue
        node_id = ensure_node_id(element, "raw-text-clipped")
        text_box = svg_element_bbox(element)
        clip_box = clip_rect_bbox(root, clip_value)
        clip_id = url_ref_id(clip_value) or ""
        if clip_id.startswith("satori_cp") or (text_box is not None and clip_box is not None and bbox_covers(text_box, clip_box)):
            remove_hard_effect_attrs(element)
            report["redundant_text_clip_removed_count"] += 1
            report["loss_notes"].append(
                {
                    "node": "text",
                    "element_id": node_id,
                    "reason": "redundant_text_clip_removed",
                    "clip_path": clip_value,
                }
            )
            continue
        record_decision(
            report,
            element=raw_element_record(element, element_id=node_id, kind="text", importance="semantic_required"),
            decision="blocked",
            reason="semantic_text_clip_not_rasterized",
            output_ref=node_id,
        )


def drop_text_visual_effects(root: ET.Element, report: dict[str, Any]) -> None:
    for element in root.iter():
        if local_name(element.tag) != "text":
            continue
        effects = [effect for effect in hard_effect_attrs(element) if effect != "clip-path"]
        if not effects:
            continue
        node_id = ensure_node_id(element, "raw-text-effect")
        remove_hard_effect_attrs(element)
        report["loss_notes"].append(
            {
                "node": "text",
                "element_id": node_id,
                "reason": "semantic_text_effect_dropped_to_preserve_editability",
                "effects": effects,
            }
        )


def cleanup_unreferenced_hard_support(root: ET.Element) -> None:
    refs: set[str] = set()
    parents = parent_map(root)
    for element in root.iter():
        if element is not root and element_in_support(element, parents, root):
            continue
        for value in list(element.attrib.values()) + list(parse_style_attr(get_xml_attr(element, "style")).values()):
            ref_id = url_ref_id(value)
            if ref_id:
                refs.add(ref_id)
    for element in list(root.iter()):
        name = local_name(element.tag)
        if name not in {"clipPath", "mask", "filter"}:
            continue
        element_id_value = get_xml_attr(element, "id")
        if not element_id_value or element_id_value not in refs:
            parent = parents.get(element)
            if parent is not None:
                parent.remove(element)


def local_effect_candidates(root: ET.Element) -> list[ET.Element]:
    parents = parent_map(root)
    out: list[ET.Element] = []
    for element in root.iter():
        name = local_name(element.tag)
        if element is root or element_in_support(element, parents, root) or name == "text":
            continue
        if not hard_effect_attrs(element):
            continue
        if name in VISIBLE_SHAPE_TAGS | VISIBLE_IMAGE_TAGS | {"g"}:
            out.append(element)
    return out


def strip_satori_layout_effects(root: ET.Element, report: dict[str, Any]) -> None:
    parents = parent_map(root)
    for element in root.iter():
        name = local_name(element.tag)
        if element is root or element_in_support(element, parents, root) or name == "text":
            continue
        if not is_satori_layout_effect(element):
            continue
        node_id = ensure_node_id(element, f"satori-layout-{name}")
        refs = hard_effect_ref_ids(element)
        removed = remove_hard_effect_attrs(element)
        report["loss_notes"].append(
            {
                "node": name,
                "element_id": node_id,
                "reason": "satori_layout_clip_mask_removed",
                "effects": removed,
                "refs": refs,
            }
        )


def replace_with_raster_image(root: ET.Element, target: ET.Element, island: dict[str, Any], href: str) -> None:
    parents = parent_map(root)
    parent = parents.get(target)
    if parent is None:
        raise ContractCompileError("cannot replace root SVG with local raster island")
    bbox = island["bbox"]
    image = ET.Element(f"{{{contract.SVG_NS}}}image")
    image.attrib[slide_attr("role")] = "image"
    image.attrib["href"] = href
    image.attrib["x"] = scalar(float(bbox[0]))
    image.attrib["y"] = scalar(float(bbox[1]))
    image.attrib["width"] = scalar(float(bbox[2]))
    image.attrib["height"] = scalar(float(bbox[3]))
    image.attrib["data-svglide-raster-island"] = "true"
    image.attrib["data-svglide-raster-reason"] = island["reason"]
    image.attrib["data-svglide-source-node-ids"] = ",".join(island["source_node_ids"])
    children = list(parent)
    index = children.index(target)
    parent.remove(target)
    parent.insert(index, image)


def rasterize_local_effects(project: Path, root: ET.Element, *, page: int, report: dict[str, Any]) -> None:
    page_width, page_height = root_dimensions(root)
    strip_satori_layout_effects(root, report)
    candidates = local_effect_candidates(root)
    if not candidates:
        cleanup_unreferenced_hard_support(root)
        return

    islands: list[dict[str, Any]] = []
    candidate_by_id: dict[str, ET.Element] = {}
    for index, candidate in enumerate(candidates, start=1):
        node_id = ensure_node_id(candidate, f"raster-source-{index:03d}")
        box = svg_element_bbox(candidate)
        if box is None:
            record_decision(
                report,
                element=raw_element_record(candidate, element_id=node_id, kind=local_name(candidate.tag), importance="visual_required"),
                decision="blocked",
                reason="local_raster_island_missing_bbox",
                output_ref=node_id,
            )
            continue
        ratio = area_ratio(box, page_width, page_height)
        if ratio > LOCAL_RASTER_PAGE_AREA_LIMIT:
            record_decision(
                report,
                element=raw_element_record(candidate, element_id=node_id, kind=local_name(candidate.tag), importance="visual_required"),
                decision="blocked",
                reason=f"local_raster_island_area_ratio_exceeds_limit:{ratio}",
                output_ref=node_id,
            )
            continue
        reason = "unsupported-filter" if get_xml_attr(candidate, "filter") else "unsupported-mask-or-clip"
        island = {
            "id": f"island-{index:03d}",
            "kind": "local",
            "bbox": bbox_to_list(box),
            "source_node_ids": [node_id],
            "reason": reason,
            "area_ratio": ratio,
        }
        islands.append(island)
        candidate_by_id[node_id] = candidate

    if not islands:
        return
    svg_text = ET.tostring(root, encoding="unicode", short_empty_elements=True)
    asset_dir = project / "04-svg" / "rasterized" / f"page-{page:03d}"
    try:
        rendered_assets = svg_raster_renderer.render_islands(svg_text, islands, asset_dir, scale=2)
    except svg_raster_renderer.RasterRenderError as exc:
        report["blocking_issues"].append(
            {
                "element_id": f"page-{page:03d}-local-raster",
                "source_ref": None,
                "importance": "visual_required",
                "source_tag": "raster_island",
                "decision": "blocked",
                "reason": f"local_raster_renderer_failed: {exc}",
                "output_ref": None,
            }
        )
        report["summary"]["blocking_issues"] += 1
        report["summary"]["visual_required"] += 1
        return

    for island, rendered in zip(islands, rendered_assets):
        source_node_id = island["source_node_ids"][0]
        target = candidate_by_id[source_node_id]
        png_path = Path(str(rendered["output_png"]))
        href = "@./" + png_path.relative_to(project).as_posix()
        replace_with_raster_image(root, target, island, href)
        report["rasterized_regions"].append(
            {
                "bbox": island["bbox"],
                "source_node_ids": island["source_node_ids"],
                "reason": island["reason"],
                "png_href": href,
                "area_ratio": island["area_ratio"],
            }
        )
        report["rasterized_area_ratio"] = round(float(report["rasterized_area_ratio"]) + float(island["area_ratio"]), 6)
        record_decision(
            report,
            element={"element_id": source_node_id, "kind": "raster_island", "importance": "visual_required"},
            decision="rasterized",
            reason=island["reason"],
            output_ref=href,
        )
    cleanup_unreferenced_hard_support(root)


def text_decoration_payload(element: ET.Element, color: str) -> dict[str, str]:
    decoration = style_or_attr(element, "text-decoration", "none") or "none"
    return {
        "line": decoration,
        "style": style_or_attr(element, "text-decoration-style", "solid") or "solid",
        "color": style_or_attr(element, "text-decoration-color", color) or color,
        "thickness": style_or_attr(element, "text-decoration-thickness", "1px") or "1px",
    }


def content_hash(text: str) -> str:
    return "sha256:" + hashlib.sha256(text.encode("utf-8")).hexdigest()


def build_text_style_item(element: ET.Element, *, text_style_id: str, source_ref: str | None) -> dict[str, Any]:
    text = "".join(element.itertext())
    font_size = numeric_style_value(style_or_attr(element, "font-size"), 16)
    font_weight = int(numeric_style_value(style_or_attr(element, "font-weight"), 400))
    color = style_or_attr(element, "fill") or style_or_attr(element, "color") or "#111827"
    line_height_raw = style_or_attr(element, "line-height")
    loss_notes: list[str] = []
    if line_height_raw:
        line_height = numeric_style_value(line_height_raw, 1.0)
    else:
        line_height = 1.0
        loss_notes.append("line_height_not_explicit_in_raw_svg")
    return {
        "role": "display" if font_size >= 40 or font_weight >= 800 else "body",
        "content_hash": content_hash(text),
        "font_family": style_or_attr(element, "font-family") or "",
        "font_size": font_size,
        "font_weight": font_weight,
        "font_style": style_or_attr(element, "font-style", "normal") or "normal",
        "line_height": line_height,
        "letter_spacing": numeric_style_value(style_or_attr(element, "letter-spacing"), 0.0),
        "text_transform": style_or_attr(element, "text-transform") or text_transform_policy(text),
        "color": color,
        "decoration": text_decoration_payload(element, color),
        "wrap": "nowrap",
        "source_contract": {"source_ref": source_ref} if source_ref else {},
        "loss_notes": loss_notes,
        "text_style_id": text_style_id,
    }


def remove_existing_text_style_manifest(root: ET.Element) -> None:
    for child in list(root):
        if local_name(child.tag) == "metadata" and get_xml_attr(child, "id") == TEXT_STYLE_MANIFEST_ID:
            root.remove(child)


def insert_text_style_manifest(root: ET.Element, items: dict[str, dict[str, Any]], source: str) -> None:
    remove_existing_text_style_manifest(root)
    metadata = ET.Element(f"{{{contract.SVG_NS}}}metadata")
    metadata.attrib["id"] = TEXT_STYLE_MANIFEST_ID
    metadata.attrib["type"] = "application/json"
    metadata.text = json.dumps(
        {
            "version": TEXT_STYLE_MANIFEST_VERSION,
            "source": "cli-artboard-satori",
            "lowering_source": source,
            "items": items,
        },
        ensure_ascii=False,
        sort_keys=True,
    )
    root.insert(0, metadata)


def iter_visible_elements(root: ET.Element) -> list[ET.Element]:
    visible: list[ET.Element] = []

    def walk(element: ET.Element, *, parent: ET.Element | None = None, in_support: bool = False) -> None:
        name = local_name(element.tag)
        next_in_support = in_support or (element is not root and name in SUPPORT_SUBTREE_TAGS)
        if element is not root and not next_in_support and name in VISIBLE_SHAPE_TAGS | VISIBLE_IMAGE_TAGS | VISIBLE_TEXT_TAGS:
            visible.append(element)
        for child in list(element):
            walk(child, in_support=next_in_support)

    walk(root)
    return visible


def visual_counts(root: ET.Element) -> dict[str, int]:
    counts = {"text": 0, "shape": 0, "path": 0, "image": 0}
    for element in iter_visible_elements(root):
        name = local_name(element.tag)
        if name == "text":
            if normalize_text("".join(element.itertext())):
                counts["text"] += 1
        elif name == "path":
            counts["path"] += 1
            counts["shape"] += 1
        elif name in VISIBLE_SHAPE_TAGS:
            counts["shape"] += 1
        elif name == "image":
            counts["image"] += 1
    return counts


def support_node_counts(root: ET.Element) -> dict[str, int]:
    counts = {key: 0 for key in SUPPORT_RETENTION_TAGS}
    for element in root.iter():
        name = local_name(element.tag)
        if name in counts:
            counts[name] += 1
    return counts


def retention_payload(raw_counts: dict[str, int], output_counts: dict[str, int]) -> dict[str, Any]:
    ratios: dict[str, float | None] = {}
    for key, raw_count in raw_counts.items():
        ratios[f"{key}_retention"] = None if raw_count == 0 else round(output_counts.get(key, 0) / raw_count, 4)
    return {
        "raw_counts": raw_counts,
        "output_counts": output_counts,
        "ratios": ratios,
    }


def load_raw_manifest(project: Path) -> dict[str, Any]:
    path = project / RAW_MANIFEST
    if not path.exists():
        raise ContractCompileError(f"missing raw visual manifest: {path}")
    data = read_json(path)
    if not isinstance(data, dict):
        raise ContractCompileError(f"raw visual manifest must be an object: {path}")
    pages = data.get("pages")
    if not isinstance(pages, list) or not pages:
        raise ContractCompileError(f"raw visual manifest has no pages: {path}")
    return data


def load_assets(project: Path) -> dict[str, str]:
    path = project / "03-assets" / "assets.json"
    if not path.exists():
        return {}
    data = read_json(path)
    if not isinstance(data, dict):
        raise ContractCompileError(f"assets json must be an object: {path}")
    return {str(key): str(value) for key, value in data.items() if isinstance(key, str)}


def page_path(project: Path, value: Any, *, field: str) -> Path:
    if not isinstance(value, str) or not value:
        raise ContractCompileError(f"raw manifest page is missing {field}")
    return project / value


def empty_report(source: str, semantic_map: str, output: str) -> dict[str, Any]:
    return {
        "version": "svglide-contract-compile/v1",
        "source": source,
        "semantic_map": semantic_map,
        "output": output,
        "compiler_mode": RAW_LOWERING_MODE,
        "lowering_source": "04-artboard/raw visual SVG",
        "visual_retention": retention_payload({"text": 0, "shape": 0, "path": 0, "image": 0}, {"text": 0, "shape": 0, "path": 0, "image": 0}),
        "support_node_retention": {"raw_counts": {key: 0 for key in SUPPORT_RETENTION_TAGS}, "output_counts": {key: 0 for key in SUPPORT_RETENTION_TAGS}},
        "unsupported_support_nodes": [],
        "loss_notes": [],
        "text_style_manifest_items": 0,
        "rasterized_regions": [],
        "rasterized_area_ratio": 0.0,
        "rasterized_text_count": 0,
        "redundant_text_clip_removed_count": 0,
        "status": "passed",
        "summary": {
            "semantic_required": 0,
            "visual_required": 0,
            "decorative_optional": 0,
            "compiled_elements": 0,
            "degraded_elements": 0,
            "rasterized_regions": 0,
            "dropped_decorations": 0,
            "blocking_issues": 0,
        },
        "compiled": [],
        "degraded": [],
        "rasterized": [],
        "dropped": [],
        "blocking_issues": [],
        "input_sha256": "",
        "semantic_map_sha256": "",
        "output_sha256": "",
    }


def element_id(element: dict[str, Any], fallback: str) -> str:
    raw = element.get("element_id") or element.get("id") or fallback
    return str(raw)


def element_importance(element: dict[str, Any]) -> str:
    value = str(element.get("importance") or "").strip()
    if value in {"semantic_required", "visual_required", "decorative_optional"}:
        return value
    kind = str(element.get("kind") or "")
    if kind in {"text", "image", "chart"} or element.get("source_ref"):
        return "semantic_required"
    return "visual_required"


def record_decision(
    report: dict[str, Any],
    *,
    element: dict[str, Any],
    decision: str,
    reason: str,
    output_ref: str | None = None,
    fallback: str = "element",
) -> None:
    importance = element_importance(element)
    entry = {
        "element_id": element_id(element, fallback),
        "source_ref": element.get("source_ref"),
        "importance": importance,
        "source_tag": element.get("kind"),
        "decision": decision,
        "reason": reason,
        "output_ref": output_ref,
    }
    if decision == "compiled":
        report["compiled"].append(entry)
        report["summary"]["compiled_elements"] += 1
    elif decision == "degraded":
        report["degraded"].append(entry)
        report["summary"]["degraded_elements"] += 1
    elif decision == "rasterized":
        report["rasterized"].append(entry)
        report["summary"]["rasterized_regions"] += 1
    elif decision == "dropped":
        report["dropped"].append(entry)
        report["summary"]["dropped_decorations"] += 1
    elif decision == "blocked":
        report["blocking_issues"].append(entry)
        report["summary"]["blocking_issues"] += 1
    report["summary"][importance] += 1


def bbox(element: dict[str, Any]) -> dict[str, float]:
    raw = element.get("bbox") if isinstance(element.get("bbox"), dict) else {}
    return {
        "x": number(raw.get("x"), 0),
        "y": number(raw.get("y"), 0),
        "width": max(number(raw.get("width"), 1), 1),
        "height": max(number(raw.get("height"), 1), 1),
    }


def style(element: dict[str, Any]) -> dict[str, Any]:
    return element.get("style") if isinstance(element.get("style"), dict) else {}


def element_common_attrs(element: dict[str, Any]) -> dict[str, str]:
    eid = element_id(element, "element")
    attrs = {"id": eid, "data-node-id": eid}
    source_ref = element.get("source_ref")
    if isinstance(source_ref, str) and source_ref:
        attrs["data-source-ref"] = source_ref
    source_attrs = element.get("attrs") if isinstance(element.get("attrs"), dict) else {}
    for key in ["data-svglide-role", "data-svglide-motif-id", "data-svglide-motif-owner", "data-svglide-origin-template"]:
        value = element.get(key)
        if value is None:
            value = source_attrs.get(key)
        if value is not None:
            attrs[key] = str(value)
    return attrs


def compile_text(element: dict[str, Any], report: dict[str, Any]) -> str:
    box = bbox(element)
    css_style = style(element)
    fill = str(css_style.get("fill") or css_style.get("color") or "#111827")
    font_size = number(css_style.get("font_size") or css_style.get("font-size"), 24)
    font_weight = int(number(css_style.get("font_weight") or css_style.get("font-weight"), 700))
    attrs = contract.text_shape_attrs(
        {
            **element_common_attrs(element),
            "x": scalar(box["x"]),
            "y": scalar(box["y"]),
            "width": scalar(box["width"]),
            "height": scalar(box["height"]),
            "fill": fill,
            "color": fill,
        }
    )
    css = f"color:{fill};font-size:{font_size:g}px;font-weight:{font_weight};font-family:Inter,Arial,sans-serif;line-height:1.18;"
    text = escape(str(element.get("text") or ""))
    record_decision(report, element=element, decision="compiled", reason="compiled to foreignObject text shape", output_ref=attrs["id"])
    return f'<foreignObject {contract.svg_attrs(attrs)}><div xmlns="{contract.XHTML_NS}" style="{escape(css, quote=True)}">{text}</div></foreignObject>'


def compile_shape(element: dict[str, Any], report: dict[str, Any]) -> str | None:
    kind = str(element.get("kind") or "")
    box = bbox(element)
    css_style = style(element)
    fill = str(css_style.get("fill") or "#F8FAFC")
    attrs = contract.shape_attrs(element_common_attrs(element))
    if kind == "rect":
        attrs.update({"x": scalar(box["x"]), "y": scalar(box["y"]), "width": scalar(box["width"]), "height": scalar(box["height"]), "fill": fill})
    elif kind == "circle":
        attrs.update({"cx": scalar(box["x"] + box["width"] / 2), "cy": scalar(box["y"] + box["height"] / 2), "r": scalar(max(min(box["width"], box["height"]) / 2, 1)), "fill": fill})
    elif kind == "ellipse":
        attrs.update({"cx": scalar(box["x"] + box["width"] / 2), "cy": scalar(box["y"] + box["height"] / 2), "rx": scalar(max(box["width"] / 2, 1)), "ry": scalar(max(box["height"] / 2, 1)), "fill": fill})
    elif kind == "line":
        attrs.update(
            {
                "x1": scalar(number(css_style.get("x1"), box["x"])),
                "y1": scalar(number(css_style.get("y1"), box["y"])),
                "x2": scalar(number(css_style.get("x2"), box["x"] + box["width"])),
                "y2": scalar(number(css_style.get("y2"), box["y"] + box["height"])),
                "stroke": str(css_style.get("stroke") or fill),
                "stroke-width": scalar(number(css_style.get("stroke_width") or css_style.get("stroke-width"), 2)),
            }
        )
    elif kind == "path":
        d = css_style.get("d") or element.get("d")
        if not isinstance(d, str) or not d.strip():
            record_decision(report, element=element, decision="blocked", reason="path is missing d data")
            return None
        attrs.update({"d": d, "fill": str(css_style.get("fill") or "none"), "stroke": str(css_style.get("stroke") or fill)})
        if css_style.get("stroke_width") or css_style.get("stroke-width"):
            attrs["stroke-width"] = scalar(number(css_style.get("stroke_width") or css_style.get("stroke-width"), 2))
    else:
        return None
    record_decision(report, element=element, decision="compiled", reason=f"compiled {kind} to slide shape", output_ref=attrs["id"])
    return f"<{kind} {contract.svg_attrs(attrs)}/>"


def image_href(element: dict[str, Any]) -> str | None:
    css_style = style(element)
    for key in ["href", "src", "asset_href"]:
        value = element.get(key)
        if isinstance(value, str) and value:
            return value
        style_value = css_style.get(key)
        if isinstance(style_value, str) and style_value:
            return style_value
    return None


def compile_image(element: dict[str, Any], report: dict[str, Any], assets: dict[str, str]) -> str | None:
    href = image_href(element)
    if not href:
        record_decision(report, element=element, decision="blocked", reason="semantic image is missing href")
        return None
    resolved = assets.get(href, href)
    if resolved.startswith("data:") or resolved.startswith("http://") or resolved.startswith("https://"):
        if element_importance(element) == "semantic_required":
            record_decision(report, element=element, decision="blocked", reason="semantic image must use local placeholder or file token")
            return None
        record_decision(report, element=element, decision="degraded", reason="external image href cannot be guaranteed for live create")
    box = bbox(element)
    attrs = contract.image_attrs({**element_common_attrs(element), "href": resolved, "x": scalar(box["x"]), "y": scalar(box["y"]), "width": scalar(box["width"]), "height": scalar(box["height"])})
    record_decision(report, element=element, decision="compiled", reason="compiled to slide image", output_ref=attrs["id"])
    return f"<image {contract.svg_attrs(attrs)}/>"


def compile_unknown(element: dict[str, Any], report: dict[str, Any]) -> str | None:
    importance = element_importance(element)
    if importance == "decorative_optional":
        record_decision(report, element=element, decision="dropped", reason="unsupported decorative element dropped with report")
        return None
    if importance == "visual_required":
        box = bbox(element)
        attrs = contract.shape_attrs(
            {
                **element_common_attrs(element),
                "x": scalar(box["x"]),
                "y": scalar(box["y"]),
                "width": scalar(box["width"]),
                "height": scalar(box["height"]),
                "fill": "none",
                "stroke": "#94A3B8",
                "stroke-width": "1",
                "opacity": "0.35",
            }
        )
        record_decision(report, element=element, decision="degraded", reason="unsupported visual element degraded to editable bounding shape", output_ref=attrs["id"])
        return f"<rect {contract.svg_attrs(attrs)}/>"
    record_decision(report, element=element, decision="blocked", reason="unsupported semantic element cannot be compiled")
    return None


def compile_semantic_element(element: dict[str, Any], report: dict[str, Any], assets: dict[str, str]) -> str | None:
    kind = str(element.get("kind") or "")
    if kind == "text":
        return compile_text(element, report)
    if kind in {"rect", "circle", "ellipse", "line", "path"}:
        return compile_shape(element, report)
    if kind == "image":
        return compile_image(element, report, assets)
    return compile_unknown(element, report)


def finalize_report(report: dict[str, Any]) -> None:
    if report["summary"]["blocking_issues"]:
        report["status"] = "failed"
    elif report["summary"]["degraded_elements"] or report["summary"]["rasterized_regions"] or report["summary"]["dropped_decorations"]:
        report["status"] = "passed_with_warnings"
    elif report.get("loss_notes"):
        report["status"] = "passed_with_warnings"
    else:
        report["status"] = "passed"


def raw_element_record(element: ET.Element, *, element_id: str, kind: str, importance: str, source_ref: str | None = None) -> dict[str, Any]:
    return {
        "element_id": element_id,
        "kind": kind,
        "importance": importance,
        "source_ref": source_ref,
    }


def lower_raw_satori_svg(root: ET.Element, *, report: dict[str, Any], semantic_map: dict[str, Any], assets: dict[str, str]) -> None:
    source_refs = semantic_text_source_refs(semantic_map)
    text_style_items: dict[str, dict[str, Any]] = {}
    counters = {"text": 0, "shape": 0, "image": 0, "unsupported": 0}

    def walk(element: ET.Element, *, parent: ET.Element | None = None, in_support: bool = False) -> None:
        name = local_name(element.tag)
        next_in_support = in_support or (element is not root and name in SUPPORT_SUBTREE_TAGS)
        if element is root:
            if not str(element.tag).startswith("{"):
                element.attrib.setdefault("xmlns", contract.SVG_NS)
            set_slide_role(element, "slide")
            element.attrib[slide_attr("contract-version")] = contract.CONTRACT_VERSION
            element.attrib.setdefault("width", "960")
            element.attrib.setdefault("height", "540")
            element.attrib.setdefault("viewBox", "0 0 960 540")
        elif next_in_support:
            if name in {"clipPath", "mask", "filter"}:
                report["loss_notes"].append(
                    {
                        "node": name,
                        "element_id": get_xml_attr(element, "id"),
                        "reason": f"<{name}> preserved from raw Satori; backend fidelity depends on existing SVG support",
                    }
                )
            pass
        elif name == "text":
            text = "".join(element.itertext())
            if not normalize_text(text):
                if parent is not None:
                    parent.remove(element)
                return
            counters["text"] += 1
            fallback_id = f"raw-text-{counters['text']:03d}"
            node_id = ensure_node_id(element, fallback_id)
            set_slide_role(element, "text")
            source_ref = source_ref_for_text(text, source_refs)
            if source_ref:
                element.attrib["data-source-ref"] = source_ref
            text_style_id = f"txt_{counters['text']:03d}"
            element.attrib["data-svglide-text-style-id"] = text_style_id
            text_style_items[text_style_id] = build_text_style_item(element, text_style_id=text_style_id, source_ref=source_ref)
            record_decision(
                report,
                element=raw_element_record(element, element_id=node_id, kind="text", importance="semantic_required", source_ref=source_ref),
                decision="compiled",
                reason="lowered raw Satori text to slide text role with text style metadata",
                output_ref=node_id,
            )
        elif name in VISIBLE_SHAPE_TAGS:
            counters["shape"] += 1
            node_id = ensure_node_id(element, f"raw-{name}-{counters['shape']:03d}")
            set_slide_role(element, "shape")
            if name in {"path", "line", "polyline"}:
                element.attrib.setdefault("data-svglide-semantic-role", f"raw-satori-{name}")
            if name == "path" and not (get_xml_attr(element, "d") or "").strip():
                record_decision(
                    report,
                    element=raw_element_record(element, element_id=node_id, kind=name, importance="visual_required"),
                    decision="blocked",
                    reason="raw Satori path is missing d data",
                    output_ref=node_id,
                )
            else:
                record_decision(
                    report,
                    element=raw_element_record(element, element_id=node_id, kind=name, importance="visual_required"),
                    decision="compiled",
                    reason=f"lowered raw Satori {name} to slide shape role",
                    output_ref=node_id,
                )
        elif name == "image":
            counters["image"] += 1
            node_id = ensure_node_id(element, f"raw-image-{counters['image']:03d}")
            set_slide_role(element, "image")
            href = get_xml_attr(element, "href") or element.attrib.get(xlink_attr("href"))
            if href and href in assets:
                element.attrib["href"] = assets[href]
            resolved_href = get_xml_attr(element, "href") or element.attrib.get(xlink_attr("href"))
            decision = "compiled"
            reason = "lowered raw Satori image to slide image role"
            if not resolved_href:
                decision = "blocked"
                reason = "raw Satori image is missing href"
            elif resolved_href.startswith(("http://", "https://", "data:")):
                decision = "degraded"
                reason = "raw Satori image uses external/data href; preserved but live-create reliability depends on downstream asset handling"
            record_decision(
                report,
                element=raw_element_record(element, element_id=node_id, kind="image", importance="semantic_required"),
                decision=decision,
                reason=reason,
                output_ref=node_id,
            )
        elif name in PRESERVED_CONTAINER_TAGS:
            pass
        else:
            counters["unsupported"] += 1
            node_id = ensure_node_id(element, f"raw-unsupported-{counters['unsupported']:03d}")
            report["unsupported_support_nodes"].append({"tag": name, "element_id": node_id})
            record_decision(
                report,
                element=raw_element_record(element, element_id=node_id, kind=name, importance="visual_required"),
                decision="blocked",
                reason=f"raw Satori node <{name}> is not covered by the lowering allowlist",
                output_ref=node_id,
            )
        for child in list(element):
            walk(child, parent=element, in_support=next_in_support)

    walk(root)
    insert_text_style_manifest(root, text_style_items, report["source"])
    report["text_style_manifest_items"] = len(text_style_items)


def compile_page(project: Path, page_entry: dict[str, Any], assets: dict[str, str]) -> dict[str, Any]:
    page = int(number(page_entry.get("page"), 1))
    source_path = page_path(project, page_entry.get("source"), field="source")
    semantic_path = page_path(project, page_entry.get("semantic_map"), field="semantic_map")
    output_path = project / "04-svg" / f"page-{page:03d}.svg"
    report_path = project / "04-svg" / "contract" / f"page-{page:03d}.report.json"
    semantic_map = read_json(semantic_path)
    if not isinstance(semantic_map, dict):
        raise ContractCompileError(f"semantic map must be an object: {semantic_path}")
    report = empty_report(rel(project, source_path), rel(project, semantic_path), rel(project, output_path))
    try:
        root = ET.fromstring(source_path.read_text(encoding="utf-8"))
    except ET.ParseError as exc:
        raise ContractCompileError(f"invalid raw Satori SVG: {source_path}: {exc}") from exc
    if local_name(root.tag) != "svg":
        raise ContractCompileError(f"raw visual source must be an SVG root: {source_path}")
    raw_counts = visual_counts(root)
    raw_support_counts = support_node_counts(root)
    strip_text_clip_or_block(root, report)
    drop_text_visual_effects(root, report)
    lower_raw_satori_svg(root, report=report, semantic_map=semantic_map, assets=assets)
    rasterize_local_effects(project, root, page=page, report=report)
    output_counts = visual_counts(root)
    output_support_counts = support_node_counts(root)
    report["visual_retention"] = retention_payload(raw_counts, output_counts)
    report["support_node_retention"] = {"raw_counts": raw_support_counts, "output_counts": output_support_counts}
    raw_text = raw_counts.get("text", 0)
    output_text = output_counts.get("text", 0)
    if raw_text > 0 and output_text / raw_text < 0.95:
        report["blocking_issues"].append(
            {
                "element_id": f"page-{page:03d}-text-retention",
                "source_ref": None,
                "importance": "semantic_required",
                "source_tag": "text",
                "decision": "blocked",
                "reason": f"raw text retention below threshold: {output_text}/{raw_text}",
                "output_ref": rel(project, output_path),
            }
        )
        report["summary"]["blocking_issues"] += 1
        report["summary"]["semantic_required"] += 1
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(ET.tostring(root, encoding="unicode", short_empty_elements=True) + "\n", encoding="utf-8")
    report["input_sha256"] = file_sha256(source_path)
    report["semantic_map_sha256"] = file_sha256(semantic_path)
    report["output_sha256"] = file_sha256(output_path)
    finalize_report(report)
    write_json(report_path, report)
    return {
        "page": page,
        "source": report["source"],
        "semantic_map": report["semantic_map"],
        "output": report["output"],
        "report": rel(project, report_path),
        "status": report["status"],
        "input_sha256": report["input_sha256"],
        "semantic_map_sha256": report["semantic_map_sha256"],
        "output_sha256": report["output_sha256"],
        "compiler_mode": report["compiler_mode"],
        "lowering_source": report["lowering_source"],
        "visual_retention": report["visual_retention"],
        "support_node_retention": report["support_node_retention"],
        "text_style_manifest_items": report["text_style_manifest_items"],
        "rasterized_regions": report["rasterized_regions"],
        "rasterized_area_ratio": report["rasterized_area_ratio"],
        "rasterized_text_count": report["rasterized_text_count"],
        "redundant_text_clip_removed_count": report["redundant_text_clip_removed_count"],
        "summary": report["summary"],
    }


def refresh_pages_after_asset_injection(project: Path, pages: list[dict[str, Any]], injection_summary: dict[str, Any]) -> None:
    if not pages:
        return
    refreshed_at = injection_summary.get("generated_at")
    for page in pages:
        output_rel = page.get("output")
        report_rel = page.get("report")
        if not isinstance(output_rel, str) or not isinstance(report_rel, str):
            continue
        output_path = project / output_rel
        report_path = project / report_rel
        if not output_path.exists() or not report_path.exists():
            continue
        digest = file_sha256(output_path)
        page["output_sha256"] = digest
        report = read_json(report_path)
        if isinstance(report, dict):
            report["output_sha256"] = digest
            try:
                root = ET.fromstring(output_path.read_text(encoding="utf-8"))
                output_counts = visual_counts(root)
                raw_counts = report.get("visual_retention", {}).get("raw_counts", {}) if isinstance(report.get("visual_retention"), dict) else {}
                if isinstance(raw_counts, dict):
                    report["visual_retention"] = retention_payload(
                        {key: int(raw_counts.get(key, 0)) for key in ["text", "shape", "path", "image"]},
                        output_counts,
                    )
                    page["visual_retention"] = report["visual_retention"]
                support_retention = report.get("support_node_retention")
                raw_support_counts = support_retention.get("raw_counts", {}) if isinstance(support_retention, dict) else {}
                if isinstance(raw_support_counts, dict):
                    report["support_node_retention"] = {
                        "raw_counts": {key: int(raw_support_counts.get(key, 0)) for key in SUPPORT_RETENTION_TAGS},
                        "output_counts": support_node_counts(root),
                    }
                    page["support_node_retention"] = report["support_node_retention"]
            except (OSError, ET.ParseError, ValueError):
                pass
            report["asset_injection_summary"] = injection_summary
            if refreshed_at:
                report["post_asset_injection_refreshed_at"] = refreshed_at
            write_json(report_path, report)


def write_manifest(project: Path, pages: list[dict[str, Any]], asset_injection_summary: dict[str, Any] | None = None) -> dict[str, Any]:
    blocking = sum(int(page["summary"].get("blocking_issues", 0)) for page in pages)
    degraded = sum(int(page["summary"].get("degraded_elements", 0)) for page in pages)
    rasterized = sum(int(page["summary"].get("rasterized_regions", 0)) for page in pages)
    dropped = sum(int(page["summary"].get("dropped_decorations", 0)) for page in pages)
    page_statuses = {str(page.get("status") or "passed") for page in pages}
    status = "failed" if blocking or "failed" in page_statuses else "passed_with_warnings" if degraded or rasterized or dropped or "passed_with_warnings" in page_statuses else "passed"
    manifest_page_keys = [
        "page",
        "source",
        "semantic_map",
        "output",
        "report",
        "status",
        "input_sha256",
        "semantic_map_sha256",
        "output_sha256",
        "compiler_mode",
        "lowering_source",
        "visual_retention",
        "support_node_retention",
        "text_style_manifest_items",
        "rasterized_regions",
        "rasterized_area_ratio",
        "rasterized_text_count",
        "redundant_text_clip_removed_count",
    ]
    manifest_pages = [{key: page[key] for key in manifest_page_keys if key in page} for page in pages]
    manifest = {
        "version": "svglide-contract-compile-manifest/v1",
        "stage": "contract_compile",
        "status": status,
        "pages": manifest_pages,
        "summary": {
            "pages": len(pages),
            "blocking_issues": blocking,
            "degraded_elements": degraded,
            "rasterized_regions": rasterized,
            "dropped_decorations": dropped,
            "compiler_modes": sorted({str(page.get("compiler_mode") or "unknown") for page in pages}),
            "raw_text_count": sum(int(page.get("visual_retention", {}).get("raw_counts", {}).get("text", 0)) for page in pages),
            "output_text_count": sum(int(page.get("visual_retention", {}).get("output_counts", {}).get("text", 0)) for page in pages),
            "text_style_manifest_items": sum(int(page.get("text_style_manifest_items", 0)) for page in pages),
            "rasterized_area_ratio": round(sum(float(page.get("rasterized_area_ratio", 0.0)) for page in pages), 6),
            "rasterized_text_count": sum(int(page.get("rasterized_text_count", 0)) for page in pages),
            "redundant_text_clip_removed_count": sum(int(page.get("redundant_text_clip_removed_count", 0)) for page in pages),
        },
    }
    if asset_injection_summary is not None:
        manifest["asset_injection_summary"] = asset_injection_summary
    write_json(project / CONTRACT_MANIFEST, manifest)
    receipts_dir = project / "receipts"
    receipts_dir.mkdir(parents=True, exist_ok=True)
    write_json(
        receipts_dir / "contract_compile.json",
        {
            "stage": "contract_compile",
            "status": status,
            "contract_manifest": CONTRACT_MANIFEST.as_posix(),
            "pages": manifest_pages,
            "summary": manifest["summary"],
            "raw_visual_manifest_sha256": file_sha256(project / RAW_MANIFEST) if (project / RAW_MANIFEST).exists() else None,
            "asset_injection_summary": asset_injection_summary,
        },
    )
    return manifest


def existing_svg_files(project: Path) -> list[Path]:
    return sorted(path for path in (project / "04-svg").glob("*.svg") if path.is_file())


def write_passthrough_report(project: Path, svg_path: Path, page: int) -> dict[str, Any]:
    report_path = project / "04-svg" / "contract" / f"page-{page:03d}.report.json"
    source = rel(project, svg_path)
    report = empty_report(source, source, source)
    report["compiler_mode"] = LEGACY_PASSTHROUGH_MODE
    report["lowering_source"] = "existing canonical SVG compatibility path"
    report["compiled"].append(
        {
            "element_id": f"page-{page:03d}",
            "source_ref": None,
            "importance": "semantic_required",
            "source_tag": "svg",
            "decision": "compiled",
            "reason": "existing canonical SVG accepted by compatibility path",
            "output_ref": source,
        }
    )
    report["summary"]["semantic_required"] = 1
    report["summary"]["compiled_elements"] = 1
    digest = file_sha256(svg_path)
    try:
        root = ET.fromstring(svg_path.read_text(encoding="utf-8"))
        counts = visual_counts(root)
    except (OSError, ET.ParseError):
        counts = {"text": 0, "shape": 0, "path": 0, "image": 0}
    report["visual_retention"] = retention_payload(counts, counts)
    try:
        root = ET.fromstring(svg_path.read_text(encoding="utf-8"))
        support_counts = support_node_counts(root)
    except (OSError, ET.ParseError):
        support_counts = {key: 0 for key in SUPPORT_RETENTION_TAGS}
    report["support_node_retention"] = {"raw_counts": support_counts, "output_counts": support_counts}
    report["text_style_manifest_items"] = 0
    report["input_sha256"] = digest
    report["semantic_map_sha256"] = digest
    report["output_sha256"] = digest
    write_json(report_path, report)
    return {
        "page": page,
        "source": source,
        "semantic_map": source,
        "output": source,
        "report": rel(project, report_path),
        "status": "passed",
        "input_sha256": digest,
        "semantic_map_sha256": digest,
        "output_sha256": digest,
        "compiler_mode": report["compiler_mode"],
        "lowering_source": report["lowering_source"],
        "visual_retention": report["visual_retention"],
        "support_node_retention": report["support_node_retention"],
        "text_style_manifest_items": report["text_style_manifest_items"],
        "summary": report["summary"],
    }


def compile_existing_svgs(project: Path) -> dict[str, Any]:
    files = existing_svg_files(project)
    if not files:
        raise ContractCompileError("no existing SVG files found under 04-svg")
    return write_manifest(project, [write_passthrough_report(project, path, index) for index, path in enumerate(files, 1)])


def compile_project(project: Path, *, allow_existing_svg: bool = False) -> dict[str, Any]:
    project = project.resolve()
    if allow_existing_svg and not (project / RAW_MANIFEST).exists():
        return compile_existing_svgs(project)
    manifest = load_raw_manifest(project)
    pages = manifest.get("pages")
    assert isinstance(pages, list)
    assets = load_assets(project)
    compiled_pages = [compile_page(project, page, assets) for page in pages if isinstance(page, dict)]
    if not compiled_pages:
        raise ContractCompileError("raw visual manifest produced no compilable pages")
    injection_summary = svglide_asset_injector.inject_project_assets(project)
    refresh_pages_after_asset_injection(project, compiled_pages, injection_summary)
    return write_manifest(project, compiled_pages, asset_injection_summary=injection_summary)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Compile raw SVGlide visual artifacts into canonical SVGlide SVG.")
    parser.add_argument("--project", required=True, help="SVGlide project directory under .lark-slides/plan/<deck-id>")
    parser.add_argument("--allow-existing-svg", action="store_true", help="Write pass-through contract manifest for legacy direct SVG projects.")
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        manifest = compile_project(Path(args.project), allow_existing_svg=args.allow_existing_svg)
    except ContractCompileError as exc:
        print(f"svglide_contract_compile: {exc}", file=sys.stderr)
        return 2
    print(json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True))
    return 1 if manifest.get("status") == "failed" else 0


if __name__ == "__main__":
    raise SystemExit(main())
