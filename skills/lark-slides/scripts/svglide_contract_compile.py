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
from copy import deepcopy
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
SLIDE_DEFAULT_FONT_FAMILY = "思源黑体"
ROLE_FONT_RE = re.compile(r"^svglide[a-z0-9_-]*(display|body|label|metric|font)", re.IGNORECASE)
CJK_RE = re.compile(r"^[\u3400-\u9fff\u3000-\u303f\uff00-\uffef]+$")
CJK_CHAR_RE = re.compile(r"[\u3400-\u9fff]")
ASCII_WORD_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9./%+_-]*$")
PATH_COMMAND_RE = re.compile(r"[AaCcHhLlMmQqSsTtVvZz]")

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


def path_commands(value: str) -> set[str]:
    return set(PATH_COMMAND_RE.findall(value or ""))


def unsupported_path_commands(value: str) -> set[str]:
    allowed = set("MLHVZCQmlhvzcq")
    return {command for command in path_commands(value) if command not in allowed}


def matrix_values(value: str | None) -> list[float] | None:
    match = re.search(r"matrix\(([^)]+)\)", value or "")
    if not match:
        return None
    values: list[float] = []
    for part in re.split(r"[,\s]+", match.group(1).strip()):
        if not part:
            continue
        try:
            values.append(float(part))
        except ValueError:
            return None
    return values if len(values) == 6 else None


def has_shear_matrix_transform(element: ET.Element) -> bool:
    values = matrix_values(get_xml_attr(element, "transform"))
    if not values:
        return False
    _a, b, c, _d, _e, _f = values
    # Rotation matrices have b ~= -c. Satori skewY/skewX emits shear-like
    # matrices that the slide parser cannot decompose reliably.
    return abs(b + c) > 0.02


def drop_unsupported_shape_matrix_transform(element: ET.Element, report: dict[str, Any]) -> None:
    if not has_shear_matrix_transform(element):
        return
    node_id = ensure_node_id(element, f"raw-{local_name(element.tag)}-matrix")
    source_transform = get_xml_attr(element, "transform")
    element.attrib.pop("transform", None)
    element.attrib["data-svglide-transform-lowered"] = "unsupported-matrix-dropped"
    report["loss_notes"].append(
        {
            "node": local_name(element.tag),
            "element_id": node_id,
            "reason": "unsupported non-text matrix transform dropped during protocol lowering",
            "source_transform": source_transform,
        }
    )


def rounded_rect_path_bbox(data: str) -> dict[str, float] | None:
    tokens = re.findall(r"[A-Za-z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?", data or "")
    if not tokens:
        return None
    index = 0
    command = ""
    x = y = 0.0
    start_x = start_y = 0.0
    points: list[tuple[float, float]] = []

    def read_float() -> float | None:
        nonlocal index
        if index >= len(tokens) or re.match(r"^[A-Za-z]$", tokens[index]):
            return None
        value = number(tokens[index], 0.0)
        index += 1
        return value

    while index < len(tokens):
        if re.match(r"^[A-Za-z]$", tokens[index]):
            command = tokens[index]
            index += 1
        if command in {"M", "m"}:
            first = True
            while index < len(tokens):
                raw_x = read_float()
                raw_y = read_float()
                if raw_x is None or raw_y is None:
                    break
                x = x + raw_x if command == "m" else raw_x
                y = y + raw_y if command == "m" else raw_y
                points.append((x, y))
                if first:
                    start_x, start_y = x, y
                    first = False
                command = "l" if command == "m" else "L"
        elif command in {"H", "h"}:
            while index < len(tokens):
                raw_x = read_float()
                if raw_x is None:
                    break
                x = x + raw_x if command == "h" else raw_x
                points.append((x, y))
        elif command in {"V", "v"}:
            while index < len(tokens):
                raw_y = read_float()
                if raw_y is None:
                    break
                y = y + raw_y if command == "v" else raw_y
                points.append((x, y))
        elif command in {"A", "a"}:
            while index < len(tokens):
                values = [read_float() for _ in range(7)]
                if any(value is None for value in values):
                    break
                end_x = float(values[5] or 0.0)
                end_y = float(values[6] or 0.0)
                x = x + end_x if command == "a" else end_x
                y = y + end_y if command == "a" else end_y
                points.append((x, y))
        elif command in {"Z", "z"}:
            x, y = start_x, start_y
            points.append((x, y))
            command = ""
        else:
            break
    return bbox_from_points(points)


def rounded_rect_radius_from_path(data: str) -> tuple[float, float] | None:
    match = re.search(
        r"[aA]\s*([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)\s*,?\s*([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)",
        data or "",
    )
    if not match:
        return None
    return (number(match.group(1), 0.0), number(match.group(2), 0.0))


def lower_satori_rounded_rect_path(element: ET.Element, report: dict[str, Any]) -> bool:
    if local_name(element.tag) != "path":
        return False
    data = get_xml_attr(element, "d") or ""
    commands = path_commands(data)
    if not commands or not any(command in commands for command in {"a", "A"}):
        return False
    if not commands.issubset(set("MmHhVvAaZz")):
        return False
    x = number(get_xml_attr(element, "x"), float("nan"))
    y = number(get_xml_attr(element, "y"), float("nan"))
    width = number(get_xml_attr(element, "width"), float("nan"))
    height = number(get_xml_attr(element, "height"), float("nan"))
    if not all(value == value for value in [width, height]) or width <= 0 or height <= 0:
        return False
    if not all(value == value for value in [x, y]):
        inferred = rounded_rect_path_bbox(data)
        if inferred is None:
            return False
        x = inferred["x"]
        y = inferred["y"]
    node_id = ensure_node_id(element, "raw-rounded-rect-path")
    radius = rounded_rect_radius_from_path(data)
    element.tag = f"{{{contract.SVG_NS}}}rect"
    element.attrib.pop("d", None)
    element.attrib["x"] = scalar(x)
    element.attrib["y"] = scalar(y)
    element.attrib["width"] = scalar(width)
    element.attrib["height"] = scalar(height)
    if radius:
        rx = min(max(radius[0], 0.0), width / 2)
        ry = min(max(radius[1], 0.0), height / 2)
        if rx > 0:
            element.attrib["rx"] = scalar(rx)
        if ry > 0:
            element.attrib["ry"] = scalar(ry)
    element.attrib["data-svglide-path-lowered-as"] = "rounded-rect"
    report["loss_notes"].append(
        {
            "node": "path",
            "element_id": node_id,
            "reason": "raw Satori rounded-rect path lowered to slide rect to avoid unsupported arc path commands",
        }
    )
    return True


def lower_satori_arc_blob_path_to_ellipse(element: ET.Element, report: dict[str, Any]) -> bool:
    if local_name(element.tag) != "path":
        return False
    data = get_xml_attr(element, "d") or ""
    commands = path_commands(data)
    if not commands or not any(command in commands for command in {"a", "A"}):
        return False
    if not unsupported_path_commands(data):
        return False
    bbox = svg_element_bbox(element)
    if bbox is None or bbox["width"] <= 0 or bbox["height"] <= 0:
        return False
    node_id = ensure_node_id(element, "raw-arc-blob-path")
    element.tag = f"{{{contract.SVG_NS}}}ellipse"
    element.attrib.pop("d", None)
    element.attrib.pop("x", None)
    element.attrib.pop("y", None)
    element.attrib.pop("width", None)
    element.attrib.pop("height", None)
    element.attrib["cx"] = scalar(bbox["x"] + bbox["width"] / 2)
    element.attrib["cy"] = scalar(bbox["y"] + bbox["height"] / 2)
    element.attrib["rx"] = scalar(max(bbox["width"] / 2, 1.0))
    element.attrib["ry"] = scalar(max(bbox["height"] / 2, 1.0))
    element.attrib["data-svglide-path-lowered-as"] = "ellipse-approximation"
    report["loss_notes"].append(
        {
            "node": "path",
            "element_id": node_id,
            "reason": "raw Satori arc/blob path approximated as slide ellipse to avoid unsupported arc path commands",
            "source_bbox": bbox_to_list(bbox),
        }
    )
    return True


def lower_thin_rect_to_line(element: ET.Element, report: dict[str, Any]) -> bool:
    if local_name(element.tag) != "rect":
        return False
    bbox = svg_element_bbox(element)
    if bbox is None:
        return False
    width = bbox["width"]
    height = bbox["height"]
    horizontal = width >= 8 and height <= 3
    vertical = height >= 8 and width <= 3
    if not horizontal and not vertical:
        return False
    node_id = ensure_node_id(element, "raw-rule-rect")
    fill = get_xml_attr(element, "fill") or parse_style_attr(get_xml_attr(element, "style")).get("fill") or "#111111"
    opacity = get_xml_attr(element, "opacity")
    transform = get_xml_attr(element, "transform")
    if horizontal:
        y = bbox["y"] + height / 2
        coords = {"x1": bbox["x"], "y1": y, "x2": bbox["x"] + width, "y2": y}
        stroke_width = max(height, 1.0)
    else:
        x = bbox["x"] + width / 2
        coords = {"x1": x, "y1": bbox["y"], "x2": x, "y2": bbox["y"] + height}
        stroke_width = max(width, 1.0)
    element.tag = f"{{{contract.SVG_NS}}}line"
    element.attrib.clear()
    element.attrib["id"] = node_id
    element.attrib["data-node-id"] = node_id
    element.attrib["x1"] = scalar(coords["x1"])
    element.attrib["y1"] = scalar(coords["y1"])
    element.attrib["x2"] = scalar(coords["x2"])
    element.attrib["y2"] = scalar(coords["y2"])
    element.attrib["stroke"] = fill
    element.attrib["stroke-width"] = scalar(stroke_width)
    if opacity:
        element.attrib["opacity"] = opacity
    if transform:
        element.attrib["transform"] = transform
    element.attrib["data-svglide-rect-lowered-as"] = "line"
    report["loss_notes"].append(
        {
            "node": "rect",
            "element_id": node_id,
            "reason": "thin Satori rect lowered to slide line primitive",
            "source_bbox": bbox_to_list(bbox),
        }
    )
    return True


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


def text_content(element: ET.Element) -> str:
    return "".join(element.itertext())


def is_cjk_text(value: str) -> bool:
    compact = normalize_text(value).replace(" ", "")
    return bool(compact) and bool(CJK_RE.match(compact))


def is_ascii_word(value: str) -> bool:
    return bool(ASCII_WORD_RE.match(normalize_text(value)))


def is_short_ascii_label(value: str) -> bool:
    compact = re.sub(r"\s+", "", normalize_text(value))
    if not 2 <= len(compact) <= 16:
        return False
    return bool(re.match(r"^[A-Z0-9][A-Z0-9./%+_-]*$", compact)) and compact.upper() == compact


def is_short_cjk_text(value: str) -> bool:
    compact = normalize_text(value).replace(" ", "")
    return bool(compact) and bool(CJK_CHAR_RE.search(compact)) and len(compact) <= 8


def contains_cjk_text(value: str) -> bool:
    return bool(CJK_CHAR_RE.search(normalize_text(value)))


def reset_cjk_letter_spacing(element: ET.Element, text: str) -> bool:
    if not contains_cjk_text(text):
        return False
    changed = False
    current = style_or_attr(element, "letter-spacing")
    if current is not None and normalize_text(current).lower() not in {"0", "0px", "normal", "unset", "initial"}:
        element.attrib["letter-spacing"] = "0"
        changed = True
    style = parse_style_attr(get_xml_attr(element, "style"))
    if "letter-spacing" in style and normalize_text(style["letter-spacing"]).lower() not in {"0", "0px", "normal", "unset", "initial"}:
        style["letter-spacing"] = "0"
        element.attrib["style"] = style_attr_from_dict(style)
        changed = True
    if changed:
        element.attrib["data-svglide-cjk-letter-spacing-reset"] = "true"
    return changed


def reset_cjk_fake_italic(element: ET.Element, text: str) -> bool:
    if not contains_cjk_text(text):
        return False
    changed = False
    current = style_or_attr(element, "font-style")
    if current is not None and normalize_text(current).lower() in {"italic", "oblique"}:
        element.attrib["font-style"] = "normal"
        changed = True
    style = parse_style_attr(get_xml_attr(element, "style"))
    if "font-style" in style and normalize_text(style["font-style"]).lower() in {"italic", "oblique"}:
        style["font-style"] = "normal"
        element.attrib["style"] = style_attr_from_dict(style)
        changed = True
    if changed:
        element.attrib["data-svglide-cjk-font-style-reset"] = "true"
    return changed


def source_font_family(element: ET.Element) -> str:
    return style_or_attr(element, "font-family") or ""


def slide_font_mapping(font_family: str) -> tuple[str, str | None]:
    raw = (font_family or "").strip().strip("\"'")
    if not raw:
        return SLIDE_DEFAULT_FONT_FAMILY, "missing_source_font_family_use_slide_default"
    if ROLE_FONT_RE.match(raw):
        return SLIDE_DEFAULT_FONT_FAMILY, "role_font_family_mapped_to_slide_default"
    return raw, None


def line_height_multiplier(element: ET.Element) -> tuple[float, list[str]]:
    raw = style_or_attr(element, "line-height")
    if raw:
        value = numeric_style_value(raw, 1.2)
        if value > 8:
            font_size = numeric_style_value(style_or_attr(element, "font-size"), 16)
            return max(value / max(font_size, 1.0), 1.0), []
        return max(value, 1.0), []
    return 1.2, ["line_height_not_explicit_in_raw_svg"]


def text_metrics(element: ET.Element) -> dict[str, float]:
    font_size = numeric_style_value(style_or_attr(element, "font-size"), 16)
    width = number(get_xml_attr(element, "width"), -1)
    if width <= 0:
        width = max(len(normalize_text(text_content(element))) * font_size * 0.58, font_size)
    raw_height = number(get_xml_attr(element, "height"), -1)
    line_height, _ = line_height_multiplier(element)
    line_height_px = max(raw_height if raw_height > 0 else 0.0, font_size * line_height)
    ascent = min(max(font_size * 0.8, font_size * 0.62), line_height_px * 0.9)
    descent = max(line_height_px - ascent, font_size * 0.2)
    return {
        "font_size": font_size,
        "width": width,
        "raw_height": raw_height,
        "line_height": line_height,
        "line_height_px": max(ascent + descent, font_size),
        "ascent": ascent,
        "descent": descent,
    }


def estimated_slide_text_width(text: str, font_size: float, letter_spacing: float) -> float:
    normalized = normalize_text(text)
    if not normalized:
        return font_size
    width = 0.0
    visible_chars = 0
    for char in normalized:
        if char.isspace():
            width += font_size * 0.34
        elif CJK_CHAR_RE.match(char):
            width += font_size * 1.0
            visible_chars += 1
        elif char.isupper():
            width += font_size * 0.68
            visible_chars += 1
        elif char.islower():
            width += font_size * 0.56
            visible_chars += 1
        elif char.isdigit():
            width += font_size * 0.58
            visible_chars += 1
        elif char in "./%+_-":
            width += font_size * 0.44
            visible_chars += 1
        else:
            width += font_size * 0.5
            visible_chars += 1
    if visible_chars > 1 and letter_spacing:
        width += abs(letter_spacing) * (visible_chars - 1)
    return max(width, font_size)


def text_width_compensation(
    element: ET.Element,
    font_mapping: dict[str, Any],
    *,
    page_width: float | None = None,
) -> dict[str, Any]:
    text = normalize_text(text_content(element))
    metrics = text_metrics(element)
    source_width = metrics["width"]
    font_size = metrics["font_size"]
    letter_spacing = numeric_style_value(style_or_attr(element, "letter-spacing"), 0.0)
    mapping_reason = str(font_mapping.get("reason") or "source_font_family_preserved")
    role_font_mapped = mapping_reason == "role_font_family_mapped_to_slide_default"
    short_ascii_label = is_short_ascii_label(text)
    short_cjk_text = is_short_cjk_text(text)
    letter_spacing_risk = abs(letter_spacing) > 0.01 and len(text.replace(" ", "")) > 1
    nowrap_risk = short_ascii_label or short_cjk_text or letter_spacing_risk

    estimated_width = estimated_slide_text_width(text, font_size, letter_spacing)
    reasons: list[str] = []
    if role_font_mapped:
        estimated_width = max(estimated_width, source_width * 1.18)
        reasons.append("role_font_mapping")
    if short_ascii_label:
        estimated_width *= 1.08
        reasons.append("short_ascii_label")
    if short_cjk_text:
        estimated_width = max(estimated_width, len(text.replace(" ", "")) * font_size * 1.08)
        reasons.append("short_cjk_text")
    if letter_spacing_risk:
        estimated_width = max(estimated_width, source_width + abs(letter_spacing) * max(len(text.replace(" ", "")) - 1, 1) + font_size * 0.4)
        reasons.append("letter_spacing")
    if nowrap_risk:
        estimated_width += font_size * 0.55
    min_safe_width = max(source_width, estimated_width)
    compiled_width = min_safe_width if min_safe_width > source_width + 0.25 else source_width
    x_value = number(get_xml_attr(element, "x"), 0.0)
    canvas_fit: dict[str, Any] = {"applied": False}
    if page_width and compiled_width > source_width + 0.25:
        available_width = max(page_width - x_value, 0.0)
        if compiled_width > available_width and available_width > 0:
            if nowrap_risk:
                overflow = compiled_width - available_width
                shift_left = min(overflow, x_value)
                if shift_left > 0.25:
                    new_x = x_value - shift_left
                    element.attrib["x"] = scalar(new_x)
                    canvas_fit = {
                        "applied": True,
                        "mode": "shift_left",
                        "original_x": round(x_value, 4),
                        "compiled_x": round(new_x, 4),
                        "shift_x": round(-shift_left, 4),
                        "available_width": round(page_width - new_x, 4),
                    }
                    reasons.append("fit_canvas_right")
            elif available_width >= source_width - 0.25:
                compiled_width = available_width
                canvas_fit = {
                    "applied": True,
                    "mode": "cap_width",
                    "original_width": round(min_safe_width, 4),
                    "compiled_width": round(compiled_width, 4),
                    "available_width": round(available_width, 4),
                }
                reasons.append("fit_canvas_right")
    if page_width and not canvas_fit["applied"]:
        available_width = max(page_width - x_value, 0.0)
        overflow = compiled_width - available_width
        if available_width > 0 and 0 < overflow <= 1.0:
            compiled_width = available_width
            canvas_fit = {
                "applied": True,
                "mode": "cap_width_epsilon",
                "original_width": round(min_safe_width, 4),
                "compiled_width": round(compiled_width, 4),
                "available_width": round(available_width, 4),
            }
            reasons.append("fit_canvas_right_epsilon")
    width_compensated = compiled_width > source_width + 0.25
    if width_compensated or canvas_fit["applied"]:
        element.attrib["width"] = scalar(compiled_width)
    if canvas_fit["applied"]:
        element.attrib["data-svglide-width-canvas-fit"] = str(canvas_fit["mode"])
        if "shift_x" in canvas_fit:
            element.attrib["data-svglide-width-shift-x"] = scalar(canvas_fit["shift_x"])
    if nowrap_risk or role_font_mapped:
        element.attrib["data-svglide-width-compensation"] = "slide-font-safe-width/v1"
    element.attrib["data-svglide-source-width"] = scalar(source_width)
    element.attrib["data-svglide-compiled-width"] = scalar(compiled_width)
    element.attrib["data-svglide-min-safe-width"] = scalar(min_safe_width)
    element.attrib["data-svglide-width-expansion-ratio"] = scalar(round(compiled_width / max(source_width, 1.0), 6))
    element.attrib["data-svglide-width-expansion-reason"] = ",".join(reasons) if reasons else "not_required"
    element.attrib["data-svglide-nowrap-risk"] = "true" if nowrap_risk else "false"
    element.attrib["data-svglide-letter-spacing-accounted"] = "true" if letter_spacing_risk else "false"
    return {
        "element_id": get_xml_attr(element, "id") or get_xml_attr(element, "data-node-id"),
        "text": text,
        "source_width": round(source_width, 4),
        "compiled_width": round(compiled_width, 4),
        "min_safe_width": round(min_safe_width, 4),
        "width_expansion_ratio": round(compiled_width / max(source_width, 1.0), 6),
        "width_expansion_reason": reasons or ["not_required"],
        "width_compensation": get_xml_attr(element, "data-svglide-width-compensation") or "",
        "width_compensated": width_compensated,
        "nowrap_risk": nowrap_risk,
        "font_mapping_reason": mapping_reason,
        "letter_spacing": letter_spacing,
        "letter_spacing_accounted": letter_spacing_risk,
        "short_ascii_label": short_ascii_label,
        "short_cjk_text": short_cjk_text,
        "canvas_fit": canvas_fit,
    }


def convert_text_baseline_to_box(element: ET.Element) -> dict[str, Any]:
    metrics = text_metrics(element)
    baseline_y = number(get_xml_attr(element, "y"), 0.0)
    box_top_y = baseline_y - metrics["ascent"]
    element.attrib["y"] = scalar(box_top_y)
    element.attrib["height"] = scalar(metrics["line_height_px"])
    element.attrib["data-svglide-baseline-y"] = scalar(baseline_y)
    element.attrib["data-svglide-baseline-conversion"] = "svg-baseline-to-slide-box"
    element.attrib["data-svglide-text-ascent"] = scalar(metrics["ascent"])
    element.attrib["data-svglide-text-descent"] = scalar(metrics["descent"])
    return {
        "baseline_y": baseline_y,
        "box_top_y": box_top_y,
        "ascent": metrics["ascent"],
        "descent": metrics["descent"],
        "line_height_px": metrics["line_height_px"],
    }


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
        x = number(get_xml_attr(element, "x"), float("nan"))
        y = number(get_xml_attr(element, "y"), float("nan"))
        width = number(get_xml_attr(element, "width"), float("nan"))
        height = number(get_xml_attr(element, "height"), float("nan"))
        if all(value == value for value in [x, y, width, height]) and width > 0 and height > 0:
            return {"x": x, "y": y, "width": width, "height": height}
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


def bbox_intersection(left: dict[str, float], right: dict[str, float]) -> dict[str, float] | None:
    x1 = max(left["x"], right["x"])
    y1 = max(left["y"], right["y"])
    x2 = min(left["x"] + left["width"], right["x"] + right["width"])
    y2 = min(left["y"] + left["height"], right["y"] + right["height"])
    if x2 <= x1 or y2 <= y1:
        return None
    return {"x": x1, "y": y1, "width": x2 - x1, "height": y2 - y1}


def fit_shape_to_canvas(element: ET.Element, bbox: dict[str, float], page_width: float, page_height: float, report: dict[str, Any]) -> bool:
    canvas = {"x": 0.0, "y": 0.0, "width": page_width, "height": page_height}
    if bbox["x"] >= 0 and bbox["y"] >= 0 and bbox["x"] + bbox["width"] <= page_width and bbox["y"] + bbox["height"] <= page_height:
        return True
    clipped = bbox_intersection(bbox, canvas)
    node_id = ensure_node_id(element, f"raw-{local_name(element.tag)}-canvas-fit")
    if clipped is None:
        report["loss_notes"].append(
            {
                "node": local_name(element.tag),
                "element_id": node_id,
                "reason": "off-canvas non-text shape dropped during protocol lowering",
                "source_bbox": bbox_to_list(bbox),
            }
        )
        return False
    name = local_name(element.tag)
    if name in {"rect", "image", "path"}:
        element.attrib["x"] = scalar(clipped["x"])
        element.attrib["y"] = scalar(clipped["y"])
        element.attrib["width"] = scalar(clipped["width"])
        element.attrib["height"] = scalar(clipped["height"])
        element.attrib["data-svglide-canvas-fit"] = "clip-to-canvas"
        report["loss_notes"].append(
            {
                "node": name,
                "element_id": node_id,
                "reason": "non-text shape clipped to slide canvas during protocol lowering",
                "source_bbox": bbox_to_list(bbox),
                "compiled_bbox": bbox_to_list(clipped),
            }
        )
        return True
    return True


def text_fragment_record(element: ET.Element, index: int) -> dict[str, Any] | None:
    text = text_content(element)
    if not normalize_text(text):
        return None
    metrics = text_metrics(element)
    x = number(get_xml_attr(element, "x"), 0.0)
    baseline_y = number(get_xml_attr(element, "y"), 0.0)
    width = metrics["width"]
    height = metrics["line_height_px"]
    font_family = source_font_family(element)
    return {
        "element": element,
        "index": index,
        "id": get_xml_attr(element, "id") or get_xml_attr(element, "data-node-id") or f"text-{index}",
        "text": text,
        "x": x,
        "y": baseline_y,
        "right": x + width,
        "width": width,
        "height": height,
        "font_family": font_family,
        "font_size": metrics["font_size"],
        "font_weight": int(numeric_style_value(style_or_attr(element, "font-weight"), 400)),
        "fill": style_or_attr(element, "fill") or style_or_attr(element, "color") or "#111827",
        "opacity": style_or_attr(element, "opacity") or "1",
        "letter_spacing": numeric_style_value(style_or_attr(element, "letter-spacing"), 0.0),
    }


def text_fragment_style_key(fragment: dict[str, Any]) -> tuple[Any, ...]:
    return (
        fragment["font_family"],
        round(float(fragment["font_size"]), 2),
        int(fragment["font_weight"]),
        fragment["fill"],
        fragment["opacity"],
        round(float(fragment["letter_spacing"]), 2),
    )


def should_join_with_space(previous: dict[str, Any], current: dict[str, Any], gap: float) -> bool:
    if gap <= max(float(previous["font_size"]) * 0.18, 3.0):
        return False
    previous_text = normalize_text(previous["text"])
    current_text = normalize_text(current["text"])
    if is_cjk_text(previous_text) or is_cjk_text(current_text):
        return False
    if is_ascii_word(previous_text) and is_ascii_word(current_text):
        return True
    return gap > max(float(previous["font_size"]) * 0.35, 5.0)


def join_text_fragments(run: list[dict[str, Any]]) -> str:
    parts: list[str] = []
    previous: dict[str, Any] | None = None
    for fragment in sorted(run, key=lambda item: (float(item["x"]), item["index"])):
        value = normalize_text(fragment["text"])
        if not value:
            continue
        if previous is not None and parts:
            gap = float(fragment["x"]) - float(previous["right"])
            if should_join_with_space(previous, fragment, gap):
                parts.append(" ")
        parts.append(value)
        previous = fragment
    return "".join(parts)


def coalesced_text_element(run: list[dict[str, Any]]) -> ET.Element:
    ordered = sorted(run, key=lambda item: (float(item["x"]), item["index"]))
    first = ordered[0]
    base = deepcopy(first["element"])
    for child in list(base):
        base.remove(child)
    text = join_text_fragments(ordered)
    min_x = min(float(item["x"]) for item in ordered)
    max_right = max(float(item["right"]) for item in ordered)
    baseline_y = sum(float(item["y"]) for item in ordered) / len(ordered)
    height = max(float(item["height"]) for item in ordered)
    ids = [str(item["id"]) for item in ordered]
    base.text = text
    base.attrib["x"] = scalar(min_x)
    base.attrib["y"] = scalar(baseline_y)
    base.attrib["width"] = scalar(max(max_right - min_x, float(first["font_size"])))
    base.attrib["height"] = scalar(height)
    base.attrib["id"] = str(first["id"])
    base.attrib["data-node-id"] = str(first["id"])
    base.attrib["data-svglide-coalesced-from"] = ",".join(ids)
    base.attrib["data-svglide-coalesced-count"] = str(len(ordered))
    return base


def coalesce_direct_text_children(parent: ET.Element) -> dict[str, int]:
    children = list(parent)
    fragments = [
        record
        for index, child in enumerate(children)
        if local_name(child.tag) == "text"
        for record in [text_fragment_record(child, index)]
        if record is not None
    ]
    stats = {"raw": len(fragments), "output": len(fragments), "coalesced": 0}
    if len(fragments) < 2:
        return stats
    runs: list[list[dict[str, Any]]] = []
    current: list[dict[str, Any]] = []
    current_key: tuple[Any, ...] | None = None
    current_y: float | None = None
    current_right: float | None = None
    for fragment in sorted(fragments, key=lambda item: (float(item["y"]), float(item["x"]), int(item["index"]))):
        font_size = float(fragment["font_size"])
        y_threshold = max(font_size * 0.22, 3.0)
        gap_threshold = max(font_size * 0.9, 12.0)
        key = text_fragment_style_key(fragment)
        gap = 0.0 if current_right is None else float(fragment["x"]) - current_right
        same_run = (
            bool(current)
            and key == current_key
            and current_y is not None
            and abs(float(fragment["y"]) - current_y) <= y_threshold
            and gap <= gap_threshold
            and gap >= -font_size * 0.2
        )
        if not same_run:
            if current:
                runs.append(current)
            current = [fragment]
            current_key = key
            current_y = float(fragment["y"])
            current_right = float(fragment["right"])
            continue
        current.append(fragment)
        current_y = sum(float(item["y"]) for item in current) / len(current)
        current_right = max(float(current_right or 0), float(fragment["right"]))
    if current:
        runs.append(current)

    replacement_by_index: dict[int, ET.Element] = {}
    remove_set: set[ET.Element] = set()
    output_count = 0
    coalesced = 0
    for run in runs:
        if len(run) == 1:
            output_count += 1
            continue
        replacement = coalesced_text_element(run)
        first_index = min(int(item["index"]) for item in run)
        replacement_by_index[first_index] = replacement
        remove_set.update(item["element"] for item in run)
        output_count += 1
        coalesced += len(run) - 1

    if coalesced <= 0:
        return stats
    rebuilt: list[ET.Element] = []
    for index, child in enumerate(children):
        if index in replacement_by_index:
            rebuilt.append(replacement_by_index[index])
        if child in remove_set:
            continue
        rebuilt.append(child)
    parent[:] = rebuilt
    return {"raw": len(fragments), "output": output_count, "coalesced": coalesced}


def coalesce_text_fragments(root: ET.Element, report: dict[str, Any]) -> None:
    totals = {"raw": 0, "output": 0, "coalesced": 0}

    def walk(parent: ET.Element, *, in_support: bool = False) -> None:
        name = local_name(parent.tag)
        next_in_support = in_support or (parent is not root and name in SUPPORT_SUBTREE_TAGS)
        if not next_in_support:
            stats = coalesce_direct_text_children(parent)
            for key, value in stats.items():
                totals[key] += value
        for child in list(parent):
            walk(child, in_support=next_in_support)

    walk(root)
    lowering = report.setdefault("text_lowering", {})
    lowering["raw_text_fragments"] = totals["raw"]
    lowering["output_text_boxes"] = totals["output"]
    lowering["coalesced_text_fragments"] = totals["coalesced"]


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
        unsupported_path = name == "path" and bool(unsupported_path_commands(get_xml_attr(element, "d") or ""))
        if not hard_effect_attrs(element) and not unsupported_path:
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
        if local_name(candidate.tag) == "path" and unsupported_path_commands(get_xml_attr(candidate, "d") or ""):
            reason = "unsupported-path-command"
        elif get_xml_attr(candidate, "filter"):
            reason = "unsupported-filter"
        else:
            reason = "unsupported-mask-or-clip"
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
    line_height, loss_notes = line_height_multiplier(element)
    source_font = get_xml_attr(element, "data-svglide-source-font-family") or style_or_attr(element, "font-family") or ""
    slide_font = style_or_attr(element, "font-family") or ""
    baseline_conversion = {
        "mode": get_xml_attr(element, "data-svglide-baseline-conversion") or "",
        "baseline_y": numeric_style_value(get_xml_attr(element, "data-svglide-baseline-y"), 0.0),
        "box_top_y": numeric_style_value(get_xml_attr(element, "y"), 0.0),
        "ascent": numeric_style_value(get_xml_attr(element, "data-svglide-text-ascent"), 0.0),
        "descent": numeric_style_value(get_xml_attr(element, "data-svglide-text-descent"), 0.0),
    }
    return {
        "role": "display" if font_size >= 40 or font_weight >= 800 else "body",
        "content_hash": content_hash(text),
        "font_family": slide_font,
        "source_font_family": source_font,
        "slide_font_family": slide_font,
        "font_mapping_reason": get_xml_attr(element, "data-svglide-font-mapping-reason") or "source_font_family_preserved",
        "font_size": font_size,
        "font_weight": font_weight,
        "font_style": style_or_attr(element, "font-style", "normal") or "normal",
        "line_height": line_height,
        "letter_spacing": numeric_style_value(style_or_attr(element, "letter-spacing"), 0.0),
        "text_transform": style_or_attr(element, "text-transform") or text_transform_policy(text),
        "color": color,
        "decoration": text_decoration_payload(element, color),
        "wrap": "nowrap",
        "source_width": numeric_style_value(get_xml_attr(element, "data-svglide-source-width"), 0.0),
        "compiled_width": numeric_style_value(get_xml_attr(element, "data-svglide-compiled-width"), 0.0),
        "min_safe_width": numeric_style_value(get_xml_attr(element, "data-svglide-min-safe-width"), 0.0),
        "width_expansion_ratio": numeric_style_value(get_xml_attr(element, "data-svglide-width-expansion-ratio"), 1.0),
        "width_expansion_reason": get_xml_attr(element, "data-svglide-width-expansion-reason") or "not_required",
        "nowrap_risk": get_xml_attr(element, "data-svglide-nowrap-risk") == "true",
        "width_compensation": get_xml_attr(element, "data-svglide-width-compensation") or "",
        "source_contract": {"source_ref": source_ref} if source_ref else {},
        "loss_notes": loss_notes,
        "text_style_id": text_style_id,
        "baseline_conversion": baseline_conversion,
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


def apply_text_font_mapping(element: ET.Element) -> dict[str, Any]:
    source_font = source_font_family(element)
    slide_font, reason = slide_font_mapping(source_font)
    style = parse_style_attr(get_xml_attr(element, "style"))
    if style.get("font-family"):
        style["font-family"] = slide_font
        element.attrib["style"] = style_attr_from_dict(style)
    element.attrib["font-family"] = slide_font
    element.attrib["data-svglide-source-font-family"] = source_font
    element.attrib["data-svglide-slide-font-family"] = slide_font
    if reason:
        element.attrib["data-svglide-font-mapping-reason"] = reason
    else:
        element.attrib["data-svglide-font-mapping-reason"] = "source_font_family_preserved"
    return {"source_font_family": source_font, "slide_font_family": slide_font, "reason": reason}


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
        "text_lowering": {
            "raw_text_fragments": 0,
            "output_text_boxes": 0,
            "coalesced_text_fragments": 0,
            "baseline_converted_count": 0,
            "role_font_mapped_count": 0,
            "single_character_text_boxes": 0,
            "width_compensated_count": 0,
            "nowrap_risk_count": 0,
            "letter_spacing_width_accounted_count": 0,
            "width_compensation_records": [],
            "baseline_conversions": [],
        },
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
    coalesce_text_fragments(root, report)
    page_width, page_height = root_dimensions(root)
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
            if reset_cjk_letter_spacing(element, text):
                report["loss_notes"].append(
                    {
                        "node": "text",
                        "element_id": node_id,
                        "reason": "CJK text letter-spacing reset to 0 to avoid inherited Latin tracking in editable slide text",
                    }
                )
            if reset_cjk_fake_italic(element, text):
                report["loss_notes"].append(
                    {
                        "node": "text",
                        "element_id": node_id,
                        "reason": "CJK text font-style reset to normal to avoid fake italic in editable slide text",
                    }
                )
            font_mapping = apply_text_font_mapping(element)
            if font_mapping.get("reason") == "role_font_family_mapped_to_slide_default":
                report["text_lowering"]["role_font_mapped_count"] += 1
            width_compensation = text_width_compensation(element, font_mapping, page_width=page_width)
            report["text_lowering"]["width_compensation_records"].append(width_compensation)
            if width_compensation["width_compensated"]:
                report["text_lowering"]["width_compensated_count"] += 1
            if width_compensation["nowrap_risk"]:
                report["text_lowering"]["nowrap_risk_count"] += 1
            if width_compensation["letter_spacing_accounted"]:
                report["text_lowering"]["letter_spacing_width_accounted_count"] += 1
            baseline_conversion = convert_text_baseline_to_box(element)
            report["text_lowering"]["baseline_converted_count"] += 1
            if len(normalize_text(text)) <= 1:
                report["text_lowering"]["single_character_text_boxes"] += 1
            text_style_id = f"txt_{counters['text']:03d}"
            element.attrib["data-svglide-text-style-id"] = text_style_id
            text_style_items[text_style_id] = build_text_style_item(element, text_style_id=text_style_id, source_ref=source_ref)
            if len(text) >= 24 or numeric_style_value(style_or_attr(element, "font-size"), 16) >= 48:
                element.attrib.setdefault("data-svglide-text-kind", "decorative_text" if numeric_style_value(style_or_attr(element, "font-size"), 16) >= 96 else "text")
            record_decision(
                report,
                element=raw_element_record(element, element_id=node_id, kind="text", importance="semantic_required", source_ref=source_ref),
                decision="compiled",
                reason="lowered raw Satori text to slide text role with coalescing, baseline conversion, and text style metadata",
                output_ref=node_id,
            )
            report["text_lowering"]["baseline_conversions"].append(
                {"element_id": node_id, **baseline_conversion}
            )
        elif name in VISIBLE_SHAPE_TAGS:
            if name == "rect" and lower_thin_rect_to_line(element, report):
                name = local_name(element.tag)
            if name == "path" and lower_satori_rounded_rect_path(element, report):
                name = local_name(element.tag)
            if name == "path" and lower_satori_arc_blob_path_to_ellipse(element, report):
                name = local_name(element.tag)
            bbox = svg_element_bbox(element)
            if name != "line" and (bbox is None or bbox["width"] <= 0 or bbox["height"] <= 0):
                node_id = ensure_node_id(element, f"raw-{name}-zero-size")
                record_decision(
                    report,
                    element=raw_element_record(element, element_id=node_id, kind=name, importance="visual_optional"),
                    decision="dropped",
                    reason="raw Satori visible shape has no positive visual area",
                    output_ref=None,
                )
                if parent is not None:
                    parent.remove(element)
                return
            if bbox is not None and not fit_shape_to_canvas(element, bbox, page_width, page_height, report):
                node_id = get_xml_attr(element, "id") or get_xml_attr(element, "data-node-id") or f"raw-{name}-off-canvas"
                record_decision(
                    report,
                    element=raw_element_record(element, element_id=node_id, kind=name, importance="visual_optional"),
                    decision="dropped",
                    reason="raw Satori non-text shape is fully outside the slide canvas",
                    output_ref=None,
                )
                if parent is not None:
                    parent.remove(element)
                return
            if name != "text":
                drop_unsupported_shape_matrix_transform(element, report)
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
    if report["text_lowering"]["raw_text_fragments"] == 0:
        report["text_lowering"]["raw_text_fragments"] = counters["text"]
        report["text_lowering"]["output_text_boxes"] = counters["text"]


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
    if raw_text > 0 and output_text <= 0:
        report["blocking_issues"].append(
            {
                "element_id": f"page-{page:03d}-text-retention",
                "source_ref": None,
                "importance": "semantic_required",
                "source_tag": "text",
                "decision": "blocked",
                "reason": f"raw text content was lost during lowering: {output_text}/{raw_text}",
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
