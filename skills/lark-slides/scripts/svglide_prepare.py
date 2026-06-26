#!/usr/bin/env python3
# Copyright (c) 2026 Lark Technologies Pte. Ltd.
# SPDX-License-Identifier: MIT

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from xml.sax.saxutils import escape
from typing import Any

import svglide_satori_text_style_manifest


SVG_NS = "http://www.w3.org/2000/svg"
SLIDE_NS = "https://slides.bytedance.com/ns"
XHTML_NS = "http://www.w3.org/1999/xhtml"
XLINK_NS = "http://www.w3.org/1999/xlink"
SVG_IMAGE_TAG_RE = re.compile(r"<image\b[^>]*>", re.IGNORECASE | re.DOTALL)
SVG_IMAGE_HREF_RE = re.compile(r"""(?:^|\s)(?:xlink:href|href)\s*=\s*["']([^"']+)["']""", re.IGNORECASE)
ZERO_RADIUS_ARC_RE = re.compile(
    r"([Aa])\s*0(?:\.0+)?\s*,\s*0(?:\.0+)?\s+0\s+0\s+1\s+([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)"
)
PATH_NUMBER = r"[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?"
ARC_COMMAND_RE = re.compile(
    rf"([Aa])\s*({PATH_NUMBER})[,\s]+({PATH_NUMBER})[,\s]+({PATH_NUMBER})[,\s]+([01])[,\s]+([01])[,\s]+({PATH_NUMBER})[,\s]+({PATH_NUMBER})"
)
MATRIX_TRANSFORM_RE = re.compile(
    r"matrix\(\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)"
)
CONTRACT_MANIFEST = Path("04-svg/contract/manifest.json")
GENERATOR_RECEIPT = Path("receipts/generate_svg.json")

ET.register_namespace("", SVG_NS)
ET.register_namespace("slide", SLIDE_NS)
ET.register_namespace("xlink", XLINK_NS)


class PrepareError(Exception):
    pass


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def load_assets(project: Path) -> dict[str, str]:
    assets_path = project / "03-assets" / "assets.json"
    if not assets_path.exists():
        return {}
    try:
        data = json.loads(assets_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise PrepareError(f"invalid assets json: {assets_path}: {exc}") from exc
    if not isinstance(data, dict):
        raise PrepareError(f"invalid assets json: {assets_path}: expected object")
    out: dict[str, str] = {}
    for key, value in data.items():
        if not isinstance(key, str) or not isinstance(value, str):
            raise PrepareError(f"invalid assets json: {assets_path}: keys and values must be strings")
        out[key] = value
    return out


def read_json_object(path: Path, label: str) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise PrepareError(f"invalid {label} json: {path}: {exc}") from exc
    if not isinstance(data, dict):
        raise PrepareError(f"invalid {label} json: {path}: expected object")
    return data


def generation_mode(project: Path) -> str | None:
    path = project / GENERATOR_RECEIPT
    if not path.exists():
        return None
    data = read_json_object(path, "generator receipt")
    raw = data.get("generation_mode")
    return raw if isinstance(raw, str) else None


def source_svg_files(project: Path) -> list[Path]:
    svg_dir = project / "04-svg"
    if not svg_dir.exists():
        raise PrepareError(f"missing svg directory: {svg_dir}")
    files = sorted(path for path in svg_dir.glob("*.svg") if path.is_file())
    if not files:
        raise PrepareError(f"no source SVG files found in {svg_dir}")
    return files


def validate_contract_manifest(project: Path, sources: list[Path]) -> dict[str, Any] | None:
    manifest_path = project / CONTRACT_MANIFEST
    mode = generation_mode(project)
    if not manifest_path.exists():
        if mode == "artboard_satori":
            raise PrepareError(f"missing contract manifest for artboard_satori generation: {manifest_path}")
        return None

    manifest = read_json_object(manifest_path, "contract manifest")
    if manifest.get("status") == "failed":
        raise PrepareError(f"contract manifest status is failed: {manifest_path}")
    pages = manifest.get("pages")
    if not isinstance(pages, list) or not pages:
        raise PrepareError(f"contract manifest has no pages: {manifest_path}")

    source_hashes = {str(path.relative_to(project)): file_sha256(path) for path in sources}
    manifest_outputs: set[str] = set()
    page_summaries: list[dict[str, Any]] = []
    for page in pages:
        if not isinstance(page, dict):
            raise PrepareError(f"contract manifest page must be an object: {manifest_path}")
        if page.get("status") == "failed":
            raise PrepareError(f"contract manifest page status is failed: {page.get('page')}")
        output = page.get("output")
        output_sha256 = page.get("output_sha256")
        report = page.get("report")
        if not isinstance(output, str) or not output:
            raise PrepareError("contract manifest page is missing output")
        if not isinstance(output_sha256, str) or not output_sha256:
            raise PrepareError(f"contract manifest page output_sha256 is missing: {output}")
        if output not in source_hashes:
            raise PrepareError(f"contract manifest output is not a prepared source SVG: {output}")
        if source_hashes[output] != output_sha256:
            raise PrepareError(f"contract manifest output hash is stale: {output}")
        if not isinstance(report, str) or not (project / report).exists():
            raise PrepareError(f"contract manifest report is missing: {report}")
        report_payload = read_json_object(project / report, "contract report")
        if report_payload.get("status") == "failed":
            raise PrepareError(f"contract report status is failed: {report}")
        if report_payload.get("output") != output or report_payload.get("output_sha256") != output_sha256:
            raise PrepareError(f"contract report output does not match manifest: {report}")
        manifest_outputs.add(output)
        page_summaries.append({"page": page.get("page"), "output": output, "status": page.get("status"), "report": report})

    missing = sorted(set(source_hashes) - manifest_outputs)
    extra = sorted(manifest_outputs - set(source_hashes))
    if missing or extra:
        raise PrepareError(f"contract manifest outputs do not match source SVG files: missing={missing}, extra={extra}")

    return {
        "path": CONTRACT_MANIFEST.as_posix(),
        "sha256": file_sha256(manifest_path),
        "status": manifest.get("status"),
        "pages": page_summaries,
    }


def image_hrefs(svg_text: str) -> list[str]:
    hrefs: list[str] = []
    for tag in SVG_IMAGE_TAG_RE.findall(svg_text):
        match = SVG_IMAGE_HREF_RE.search(tag)
        if match:
            hrefs.append(match.group(1))
    return hrefs


def local_asset_path(project: Path, href: str) -> Path:
    if href.startswith("@./"):
        rel = href[3:]
    elif href.startswith("@/"):
        rel = href[2:]
    else:
        raise PrepareError(f"not a local SVGlide asset placeholder: {href}")
    candidate = (project / rel).resolve()
    project_root = project.resolve()
    if candidate != project_root and project_root not in candidate.parents:
        raise PrepareError(f"asset path escapes project root: {href}")
    return candidate


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def ns_name(namespace: str, name: str) -> str:
    return f"{{{namespace}}}{name}"


def slide_attr(name: str) -> str:
    return ns_name(SLIDE_NS, name)


def attr(element: ET.Element, name: str) -> str | None:
    return element.attrib.get(name) or element.attrib.get(ns_name(XLINK_NS, name))


def normalize_zero_radius_arc_path_data(path_data: str) -> tuple[str, int]:
    replacements = 0

    def replace(match: re.Match[str]) -> str:
        nonlocal replacements
        replacements += 1
        command = "L" if match.group(1) == "A" else "l"
        return f"{command}{match.group(2)},{match.group(3)}"

    return ZERO_RADIUS_ARC_RE.sub(replace, path_data), replacements


def normalize_zero_radius_arc_paths(root: ET.Element) -> dict[str, Any]:
    path_count = 0
    replacement_count = 0
    examples: list[dict[str, str]] = []
    for element in root.iter():
        if local_name(element.tag) != "path":
            continue
        path_data = attr(element, "d")
        if not path_data:
            continue
        normalized, count = normalize_zero_radius_arc_path_data(path_data)
        if count <= 0:
            continue
        element.set("d", normalized)
        path_count += 1
        replacement_count += count
        if len(examples) < 20:
            examples.append({"id": element.attrib.get("id", ""), "from": path_data, "to": normalized})
    return {"path_count": path_count, "replacement_count": replacement_count, "examples": examples}


def normalize_arc_path_data(path_data: str) -> tuple[str, int]:
    replacements = 0

    def replace(match: re.Match[str]) -> str:
        nonlocal replacements
        replacements += 1
        command = "L" if match.group(1) == "A" else "l"
        return f"{command}{match.group(7)},{match.group(8)}"

    return ARC_COMMAND_RE.sub(replace, path_data), replacements


def normalize_arc_paths(root: ET.Element) -> dict[str, Any]:
    path_count = 0
    replacement_count = 0
    examples: list[dict[str, str]] = []
    for element in root.iter():
        if local_name(element.tag) != "path":
            continue
        path_data = attr(element, "d")
        if not path_data:
            continue
        normalized, count = normalize_arc_path_data(path_data)
        if count <= 0:
            continue
        element.set("d", normalized)
        element.set("data-svglide-prepare-arc-normalized", "line-endpoint")
        path_count += 1
        replacement_count += count
        if len(examples) < 20:
            examples.append({"id": element.attrib.get("id", ""), "from": path_data, "to": normalized})
    return {"path_count": path_count, "replacement_count": replacement_count, "examples": examples}


def number_attr(element: ET.Element, name: str, fallback: float) -> float:
    value = attr(element, name)
    if not value:
        return fallback
    match = re.search(r"-?\d+(?:\.\d+)?", value)
    if not match:
        return fallback
    return float(match.group(0))


def css_number(value: str | None, fallback: str) -> str:
    if not value:
        return fallback
    stripped = value.strip()
    if re.fullmatch(r"-?\d+(?:\.\d+)?", stripped):
        return f"{stripped}px"
    return stripped


def css_font_family(value: str | None) -> str:
    if not value:
        return "Source Sans Pro, Arial, sans-serif"
    families = [item.strip() for item in value.split(",") if item.strip()]
    fallback = ["Source Sans Pro", "Arial", "sans-serif"]
    for item in fallback:
        if item not in families:
            families.append(item)
    return ", ".join(families)


def text_compatibility_style(element: ET.Element, *, width: float, height: float) -> str:
    font_size = css_number(attr(element, "font-size"), "16px")
    font_size_number = number_attr(element, "font-size", 16.0)
    raw_line_height = attr(element, "line-height")
    if raw_line_height:
        line_height = raw_line_height
    elif font_size_number > 0 and height > 0:
        line_height = f"{height / font_size_number:.3g}"
    else:
        line_height = "1.2"
    declarations = [
        "margin:0",
        "padding:0",
        "display:block",
        f"width:{width:g}px",
        f"height:{height:g}px",
        "overflow:visible",
        "white-space:pre",
        f"font-family:{css_font_family(attr(element, 'font-family'))}",
        f"font-size:{font_size}",
        f"font-weight:{attr(element, 'font-weight') or '400'}",
        f"font-style:{attr(element, 'font-style') or 'normal'}",
        f"line-height:{line_height}",
        f"letter-spacing:{css_number(attr(element, 'letter-spacing'), '0px')}",
        f"color:{attr(element, 'fill') or attr(element, 'color') or '#111827'}",
    ]
    text_decoration = attr(element, "text-decoration")
    if text_decoration:
        declarations.append(f"text-decoration:{text_decoration}")
    text_transform = attr(element, "text-transform")
    if text_transform:
        declarations.append(f"text-transform:{text_transform}")
    return ";".join(declarations)


def compatible_transform(value: str | None) -> tuple[str | None, list[str]]:
    if not value:
        return None, []
    stripped = value.strip()
    matrix = re.fullmatch(
        r"matrix\(\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)",
        stripped,
    )
    if matrix:
        tx = float(matrix.group(5))
        ty = float(matrix.group(6))
        return f"translate({tx:g} {ty:g})", ["approximated matrix transform to translate for live-create compatibility"]
    return stripped, []


def is_native_slide_text(element: ET.Element) -> bool:
    return local_name(element.tag) == "text" and element.attrib.get(slide_attr("role")) == "text"


def text_to_foreign_object(element: ET.Element, index: int) -> tuple[ET.Element, dict[str, Any]]:
    text = "".join(element.itertext())
    x = number_attr(element, "x", 0.0)
    y = number_attr(element, "y", 0.0)
    font_size = number_attr(element, "font-size", 16.0)
    width = number_attr(element, "width", max(len(text), 1) * font_size * 0.62)
    height = number_attr(element, "height", max(font_size * 1.2, 1.0))
    foreign_object = ET.Element(ns_name(SVG_NS, "foreignObject"))
    for key in ("id", "data-node-id", "data-source-ref", "data-svglide-text-style-id", "opacity"):
        value = element.attrib.get(key)
        if value is not None:
            foreign_object.set(key, value)
    transform, transform_losses = compatible_transform(element.attrib.get("transform"))
    if transform:
        foreign_object.set("transform", transform)
    foreign_object.set("x", f"{x:g}")
    foreign_object.set("y", f"{y:g}")
    foreign_object.set("width", f"{width:g}")
    foreign_object.set("height", f"{height:g}")
    foreign_object.set(slide_attr("role"), "shape")
    foreign_object.set(slide_attr("shape-type"), "text")
    foreign_object.set("data-svglide-compat-source", "native-text")
    color = attr(element, "fill") or attr(element, "color")
    if color:
        foreign_object.set("fill", color)
        foreign_object.set("color", color)
    div = ET.SubElement(foreign_object, "div")
    div.set("xmlns", XHTML_NS)
    div.set("style", text_compatibility_style(element, width=width, height=height))
    div.text = text
    loss_notes: list[str] = [*transform_losses]
    if attr(element, "clip-path"):
        loss_notes.append("dropped clip-path on text compatibility fallback")
    return (
        foreign_object,
        {
            "index": index,
            "text_style_id": element.attrib.get("data-svglide-text-style-id"),
            "source_id": element.attrib.get("id") or element.attrib.get("data-node-id"),
            "text_length": len(text),
            "x": x,
            "y": y,
            "width": width,
            "height": height,
            "loss_notes": loss_notes,
        },
    )


def lower_native_text_to_foreign_object(svg_text: str) -> tuple[str, dict[str, Any]]:
    root = ET.fromstring(svg_text)
    lowered: list[dict[str, Any]] = []

    def walk(parent: ET.Element) -> None:
        for index, child in enumerate(list(parent)):
            if is_native_slide_text(child):
                replacement, record = text_to_foreign_object(child, len(lowered) + 1)
                parent.remove(child)
                parent.insert(index, replacement)
                lowered.append(record)
                continue
            walk(child)

    walk(root)
    receipt = {
        "mode": "foreignObject_text_shape",
        "native_text_nodes_lowered": len(lowered),
        "lowered_nodes": lowered[:50],
        "loss_count": sum(len(item["loss_notes"]) for item in lowered),
    }
    return ET.tostring(root, encoding="unicode", short_empty_elements=True), receipt


def normalize_prepared_svg(svg_text: str) -> tuple[str, dict[str, Any]]:
    root = ET.fromstring(svg_text)
    zero_radius_arc_result = normalize_zero_radius_arc_paths(root)
    arc_result = normalize_arc_paths(root)
    transform_result = normalize_matrix_transforms_and_edge_bounds(root)
    return (
        ET.tostring(root, encoding="unicode", short_empty_elements=True),
        {
            "zero_radius_arc_paths": zero_radius_arc_result,
            "arc_paths": arc_result,
            "transforms_and_bounds": transform_result,
        },
    )


def validate_asset_refs(project: Path, svg_file: Path, svg_text: str, assets: dict[str, str]) -> list[dict[str, str]]:
    refs: list[dict[str, str]] = []
    for href in image_hrefs(svg_text):
        if not href.startswith("@"):
            continue
        if href in assets:
            refs.append({"href": href, "status": "mapped", "token": assets[href]})
            continue
        path = local_asset_path(project, href)
        if not path.exists() or not path.is_file():
            raise PrepareError(f"{svg_file}: unresolved image placeholder {href}; add file or map it in 03-assets/assets.json")
        refs.append({"href": href, "status": "local", "path": str(path.relative_to(project))})
    return refs


def full_page_raster_path_for_source(project: Path, source: Path) -> Path:
    stem = source.stem
    candidate = project / "04-artboard" / "raw" / f"{stem}.visual.png"
    if not candidate.exists() or not candidate.is_file():
        raise PrepareError(
            f"{source}: missing artboard_satori full-page raster source {candidate.relative_to(project)}; "
            "rerun generate_svg before prepare"
        )
    return candidate


def full_page_raster_svg(project: Path, source: Path, raster_path: Path) -> str:
    href = "@./" + raster_path.relative_to(project).as_posix()
    source_rel = source.relative_to(project).as_posix()
    return (
        f'<svg xmlns="{SVG_NS}" xmlns:slide="{SLIDE_NS}" width="960" height="540" viewBox="0 0 960 540" '
        f'slide:role="slide" slide:contract-version="svglide-authoring-contract/v1">'
        f'<image id="{escape(source.stem)}-full-page-raster" slide:role="image" '
        f'data-svglide-prepared-source="{escape(source_rel)}" '
        f'data-svglide-raster-source="{escape(raster_path.relative_to(project).as_posix())}" '
        f'href="{escape(href)}" x="0" y="0" width="960" height="540" />'
        "</svg>"
    )


def root_dimensions(root: ET.Element) -> tuple[float, float]:
    view_box = root.attrib.get("viewBox")
    if view_box:
        parts = re.findall(r"-?\d+(?:\.\d+)?", view_box)
        if len(parts) == 4:
            return float(parts[2]), float(parts[3])
    return number_attr(root, "width", 960.0), number_attr(root, "height", 540.0)


def normalize_matrix_transforms_and_edge_bounds(root: ET.Element) -> dict[str, Any]:
    page_width, page_height = root_dimensions(root)
    transform_count = 0
    clipped_count = 0
    examples: list[dict[str, str]] = []
    for element in root.iter():
        raw_transform = element.attrib.get("transform")
        if raw_transform and MATRIX_TRANSFORM_RE.fullmatch(raw_transform.strip()):
            element.attrib.pop("transform", None)
            element.set("data-svglide-prepare-transform-normalized", "matrix-dropped")
            transform_count += 1
            if len(examples) < 20:
                examples.append({"id": element.attrib.get("id", ""), "transform": raw_transform})

        if local_name(element.tag) != "rect":
            continue
        x = number_attr(element, "x", 0.0)
        y = number_attr(element, "y", 0.0)
        width = number_attr(element, "width", 0.0)
        height = number_attr(element, "height", 0.0)
        if page_width <= 0 or page_height <= 0 or width <= 0 or height <= 0:
            continue
        full_height_edge = y <= 0.0 and height >= page_height and x < page_width and x + width > page_width
        if full_height_edge:
            element.set("width", f"{max(page_width - x, 0.0):g}")
            element.set("data-svglide-prepare-bounds-normalized", "right-edge-clipped")
            clipped_count += 1
    return {"matrix_transform_count": transform_count, "edge_rect_clipped_count": clipped_count, "examples": examples}


def is_full_page_image(element: ET.Element, *, page_width: float, page_height: float) -> bool:
    if local_name(element.tag) != "image":
        return False
    x = number_attr(element, "x", 0.0)
    y = number_attr(element, "y", 0.0)
    width = number_attr(element, "width", 0.0)
    height = number_attr(element, "height", 0.0)
    if page_width <= 0 or page_height <= 0:
        return False
    return x <= page_width * 0.02 and y <= page_height * 0.02 and width >= page_width * 0.9 and height >= page_height * 0.9


def protocol_node_counts(svg_text: str) -> dict[str, int]:
    counts = {
        "text": 0,
        "shape": 0,
        "line": 0,
        "image": 0,
        "path": 0,
        "full_page_raster": 0,
        "local_raster_island": 0,
        "local_raster_area_ratio": 0,
    }
    try:
        root = ET.fromstring(svg_text)
    except ET.ParseError:
        return counts
    page_width, page_height = root_dimensions(root)
    for element in root.iter():
        tag = local_name(element.tag)
        role = element.attrib.get(slide_attr("role"))
        if tag == "text" or role == "text" or (tag == "foreignObject" and element.attrib.get(slide_attr("shape-type")) == "text"):
            counts["text"] += 1
        if tag == "line":
            counts["line"] += 1
        if tag == "image":
            counts["image"] += 1
            if is_full_page_image(element, page_width=page_width, page_height=page_height):
                counts["full_page_raster"] += 1
            if element.attrib.get("data-svglide-raster-island") == "true":
                counts["local_raster_island"] += 1
                page_area = max(page_width * page_height, 1.0)
                counts["local_raster_area_ratio"] += int(round((number_attr(element, "width", 0.0) * number_attr(element, "height", 0.0) / page_area) * 1_000_000))
        if tag == "path":
            counts["path"] += 1
        if role == "shape" or tag in {"rect", "circle", "ellipse", "path", "polygon", "polyline"}:
            counts["shape"] += 1
    return counts


def prepare_project(project: Path, *, allow_visual_fallback: bool = False) -> dict[str, Any]:
    project = project.resolve()
    assets = load_assets(project)
    sources = source_svg_files(project)
    contract_manifest = validate_contract_manifest(project, sources)
    prepared_dir = project / "04-svg" / "prepared"
    prepared_dir.mkdir(parents=True, exist_ok=True)
    receipts_dir = project / "receipts"
    receipts_dir.mkdir(parents=True, exist_ok=True)

    started_at = now_iso()
    prepared_files: list[dict[str, Any]] = []
    asset_refs: list[dict[str, Any]] = []
    text_style_manifest_count = 0
    text_style_manifest_bound_count = 0
    text_style_manifest_loss_count = 0
    text_style_manifest_deduped_count = 0
    text_style_manifest_losses: list[dict[str, Any]] = []
    text_compatibility: list[dict[str, Any]] = []
    live_compatibility_normalizations: list[dict[str, Any]] = []
    full_page_raster_submissions: list[dict[str, Any]] = []
    is_artboard_satori = generation_mode(project) == "artboard_satori"
    should_inject_text_style_manifest = is_artboard_satori
    for source in sources:
        svg_text = source.read_text(encoding="utf-8")
        target = prepared_dir / source.name
        if should_inject_text_style_manifest:
            manifest_result = svglide_satori_text_style_manifest.inject_text_style_manifest(svg_text)
            if allow_visual_fallback:
                raster_path = full_page_raster_path_for_source(project, source)
                prepared_svg_text = full_page_raster_svg(project, source, raster_path)
                full_page_raster_submissions.append(
                    {
                        "source": str(source.relative_to(project)),
                        "raster": str(raster_path.relative_to(project)),
                        "prepared": str(target.relative_to(project)),
                        "text_style_manifest_items": manifest_result.item_count,
                    }
                )
            else:
                prepared_svg_text = manifest_result.svg_text
            prepared_svg_text, normalization_result = normalize_prepared_svg(prepared_svg_text)
            target.write_text(prepared_svg_text, encoding="utf-8")
            text_style_manifest_count += manifest_result.item_count
            text_style_manifest_bound_count += manifest_result.bound_count
            text_style_manifest_loss_count += manifest_result.loss_count
            text_style_manifest_deduped_count += manifest_result.deduped_count
            text_style_manifest_losses.extend(manifest_result.losses)
            if (
                normalization_result["zero_radius_arc_paths"]["replacement_count"]
                or normalization_result["arc_paths"]["replacement_count"]
                or normalization_result["transforms_and_bounds"]["matrix_transform_count"]
                or normalization_result["transforms_and_bounds"]["edge_rect_clipped_count"]
            ):
                live_compatibility_normalizations.append({"source": str(source.relative_to(project)), **normalization_result})
        else:
            refs = validate_asset_refs(project, source, svg_text, assets)
            shutil.copyfile(source, target)
            if refs:
                asset_refs.append({"source": str(source.relative_to(project)), "refs": refs})
            prepared_svg_text = target.read_text(encoding="utf-8")
        if should_inject_text_style_manifest:
            refs = validate_asset_refs(project, target, prepared_svg_text, assets)
            if refs:
                asset_refs.append({"source": str(source.relative_to(project)), "refs": refs})
        prepared_files.append(
            {
                "source": str(source.relative_to(project)),
                "prepared": str(target.relative_to(project)),
                "sha256": file_sha256(target),
                "protocol_node_counts": protocol_node_counts(prepared_svg_text),
            }
        )

    full_page_raster_count = sum(item["protocol_node_counts"]["full_page_raster"] for item in prepared_files)
    protocol_counts = {
        key: sum(item["protocol_node_counts"][key] for item in prepared_files)
        for key in ["text", "shape", "line", "image", "path", "full_page_raster", "local_raster_island"]
    }
    local_raster_area_ratio = round(sum(item["protocol_node_counts"]["local_raster_area_ratio"] for item in prepared_files) / 1_000_000, 6)
    submission_mode = "none"
    submission_tradeoff = None
    if is_artboard_satori:
        if allow_visual_fallback:
            submission_mode = "full_page_raster_submission"
            submission_tradeoff = "explicit visual fallback preserves raw Satori visual fidelity; online text is not editable"
        else:
            submission_mode = "editable_protocol_svg"
            submission_tradeoff = "preserves contract SVG protocol nodes for slide direct parser editability"

    receipt: dict[str, Any] = {
        "stage": "prepare",
        "status": "passed",
        "started_at": started_at,
        "ended_at": now_iso(),
        "source_files": [item["source"] for item in prepared_files],
        "prepared_files": prepared_files,
        "assets_json": "03-assets/assets.json" if (project / "03-assets" / "assets.json").exists() else None,
        "contract_manifest": contract_manifest,
        "asset_refs": asset_refs,
        "normalizations": [],
        "live_compatibility_normalizations": live_compatibility_normalizations,
        "text_style_manifest_count": text_style_manifest_count,
        "text_style_manifest_bound_count": text_style_manifest_bound_count,
        "text_style_manifest_loss_count": text_style_manifest_loss_count,
        "text_style_manifest": {
            "item_count": text_style_manifest_count,
            "bound_count": text_style_manifest_bound_count,
            "loss_count": text_style_manifest_loss_count,
            "deduped_count": text_style_manifest_deduped_count,
            "losses": text_style_manifest_losses,
        },
        "text_compatibility": {
            "mode": submission_mode,
            "files": text_compatibility,
            "native_text_nodes_lowered": sum(item["native_text_nodes_lowered"] for item in text_compatibility),
            "loss_count": sum(item["loss_count"] for item in text_compatibility),
        },
        "submission_compatibility": {
            "mode": submission_mode,
            "rasterized_page_count": len(full_page_raster_submissions),
            "full_page_raster_count": full_page_raster_count,
            "local_raster_island_count": protocol_counts["local_raster_island"],
            "local_raster_area_ratio": local_raster_area_ratio,
            "editable_protocol_node_counts": protocol_counts,
            "files": full_page_raster_submissions,
            "tradeoff": submission_tradeoff,
        },
    }
    receipt_path = receipts_dir / "prepare.json"
    receipt_path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return receipt


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Prepare SVGlide SVG files for CLI create-svg consumption.")
    parser.add_argument("project", help="SVGlide project directory under .lark-slides/plan/<deck-id>")
    parser.add_argument(
        "--allow-visual-fallback",
        action="store_true",
        help="Allow explicit full-page raster fallback for debugging; never use for editable production live submission.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        receipt = prepare_project(Path(args.project), allow_visual_fallback=args.allow_visual_fallback)
    except PrepareError as exc:
        print(f"svglide_prepare: error: {exc}", file=sys.stderr)
        return 1
    print(json.dumps(receipt, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
