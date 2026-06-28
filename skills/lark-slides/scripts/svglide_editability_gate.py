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
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SLIDE_NS = "https://slides.bytedance.com/ns"
READBACK_CHECK = Path("08-readback/readback-check.json")
READBACK_RAW = Path("08-readback/xml-presentations-get.json")
PREPARED_DIR = Path("04-svg/prepared")
SOURCE_DIR = Path("04-svg")
OUTPUT_READBACK_REPORT = Path("08-readback/editability-report.json")
OUTPUT_CHECK = Path("06-check/editability-gate.json")
OUTPUT_RECEIPT = Path("receipts/editability_gate.json")
LOCAL_RASTER_PAGE_AREA_LIMIT = 0.25
LOCAL_RASTER_DECK_AREA_LIMIT = 0.15
ROLE_FONT_RE = re.compile(r"^svglide[a-z0-9_-]*(display|body|label|metric|font)", re.IGNORECASE)
CJK_CHAR_RE = re.compile(r"[\u3400-\u9fff]")
TEXT_FRAGMENT_MIN_SHAPES = 30
TEXT_FRAGMENT_RATIO_LIMIT = 0.5


class EditabilityGateError(Exception):
    pass


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def optional_sha256(path: Path) -> str | None:
    return file_sha256(path) if path.exists() and path.is_file() else None


def read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise EditabilityGateError(f"invalid JSON: {path}: {exc}") from exc


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def compact_text(value: str) -> str:
    return re.sub(r"\s+", "", value or "")


def slide_attr(name: str) -> str:
    return f"{{{SLIDE_NS}}}{name}"


def attr(element: ET.Element, name: str) -> str | None:
    return element.attrib.get(name) or element.attrib.get(slide_attr(name))


def parse_number(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    if not isinstance(value, str):
        return None
    match = re.search(r"-?\d+(?:\.\d+)?", value)
    return float(match.group(0)) if match else None


def is_short_ascii_label(value: str) -> bool:
    compact = compact_text(value)
    if not 2 <= len(compact) <= 16:
        return False
    return bool(re.match(r"^[A-Z0-9][A-Z0-9./%+_-]*$", compact)) and compact.upper() == compact


def is_short_cjk_text(value: str) -> bool:
    compact = compact_text(value)
    return bool(compact) and bool(CJK_CHAR_RE.search(compact)) and len(compact) <= 8


def estimated_slide_text_width(text: str, font_size: float, letter_spacing: float) -> float:
    normalized = re.sub(r"\s+", " ", (text or "").strip())
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


def text_wrap_risk(
    text: str,
    width: float | None,
    font_size: float | None,
    letter_spacing: float = 0.0,
    *,
    role_font_mapped: bool = False,
    source_width: float | None = None,
) -> bool:
    if not text or width is None or font_size is None:
        return False
    short_ascii = is_short_ascii_label(text)
    short_cjk = is_short_cjk_text(text)
    letter_spacing_risk = abs(letter_spacing) > 0.01 and len(compact_text(text)) > 1
    if not (short_ascii or short_cjk or letter_spacing_risk):
        return False
    min_width = estimated_slide_text_width(text, font_size, letter_spacing)
    if role_font_mapped:
        min_width = max(min_width, (source_width or width) * 1.18)
    if short_ascii:
        min_width *= 1.08
    if short_cjk:
        min_width = max(min_width, len(compact_text(text)) * font_size * 1.08)
    min_width += font_size * 0.55
    return width < min_width * 0.98


def root_dimensions(root: ET.Element) -> tuple[float, float]:
    view_box = root.attrib.get("viewBox")
    if view_box:
        parts = re.findall(r"-?\d+(?:\.\d+)?", view_box)
        if len(parts) == 4:
            return float(parts[2]), float(parts[3])
    return parse_number(root.attrib.get("width")) or 960.0, parse_number(root.attrib.get("height")) or 540.0


def is_full_page_box(x: float, y: float, width: float, height: float, page_width: float, page_height: float) -> bool:
    if page_width <= 0 or page_height <= 0:
        return False
    return x <= page_width * 0.02 and y <= page_height * 0.02 and width >= page_width * 0.9 and height >= page_height * 0.9


def is_svg_text_node(element: ET.Element) -> bool:
    tag = local_name(element.tag)
    role = attr(element, "role")
    shape_type = attr(element, "shape-type")
    return tag == "text" or role == "text" or (tag == "foreignObject" and shape_type == "text")


def element_visible_text(element: ET.Element) -> str:
    return " ".join(text.strip() for text in element.itertext() if text.strip())


def shape_font_families(element: ET.Element) -> list[str]:
    names = []
    for node in element.iter():
        for key in ["fontFamily", "font-family", "font_family"]:
            value = node.attrib.get(key)
            if value:
                names.append(value.strip())
    return [name for name in names if name]


def renderable_svg_nodes(root: ET.Element) -> list[ET.Element]:
    ignored = {"defs", "style", "metadata", "title", "desc", "clipPath", "mask", "filter"}
    renderable = []
    for element in root.iter():
        tag = local_name(element.tag)
        if element is root or tag in ignored:
            continue
        if tag in {"g"}:
            continue
        renderable.append(element)
    return renderable


def source_svgs_for_gate(project: Path) -> list[Path]:
    prepared = project / PREPARED_DIR
    if prepared.exists():
        files = sorted(path for path in prepared.glob("*.svg") if path.is_file())
        if files:
            return files
    source = project / SOURCE_DIR
    return sorted(path for path in source.glob("*.svg") if path.is_file()) if source.exists() else []


def prepared_svg_stats(project: Path) -> dict[str, Any]:
    files = source_svgs_for_gate(project)
    if not files:
        raise EditabilityGateError(f"no prepared/source SVG files found under {project / PREPARED_DIR} or {project / SOURCE_DIR}")
    pages: list[dict[str, Any]] = []
    totals = {
        "page_count": 0,
        "source_text_count": 0,
        "prepared_image_count": 0,
        "prepared_full_page_raster_count": 0,
        "prepared_image_only_page_count": 0,
        "local_raster_island_count": 0,
        "local_raster_area_ratio_sum": 0.0,
        "local_raster_area_ratio_max": 0.0,
        "prepared_text_wrap_risk_count": 0,
    }
    for path in files:
        root = ET.fromstring(path.read_text(encoding="utf-8"))
        page_width, page_height = root_dimensions(root)
        nodes = renderable_svg_nodes(root)
        text_count = sum(1 for element in root.iter() if is_svg_text_node(element) and "".join(element.itertext()).strip())
        image_count = 0
        full_page_image_count = 0
        local_raster_island_count = 0
        local_raster_area = 0.0
        prepared_text_wrap_risk_count = 0
        for element in root.iter():
            if not is_svg_text_node(element):
                continue
            text = element_visible_text(element)
            if not text:
                continue
            font_size = parse_number(element.attrib.get("font-size"))
            width = parse_number(element.attrib.get("width"))
            letter_spacing = parse_number(element.attrib.get("letter-spacing")) or 0.0
            role_font_mapped = element.attrib.get("data-svglide-font-mapping-reason") == "role_font_family_mapped_to_slide_default"
            source_width = parse_number(element.attrib.get("data-svglide-source-width"))
            if text_wrap_risk(text, width, font_size, letter_spacing, role_font_mapped=role_font_mapped, source_width=source_width):
                prepared_text_wrap_risk_count += 1
        for element in root.iter():
            if local_name(element.tag) != "image":
                continue
            image_count += 1
            x = parse_number(element.attrib.get("x")) or 0.0
            y = parse_number(element.attrib.get("y")) or 0.0
            width = parse_number(element.attrib.get("width")) or 0.0
            height = parse_number(element.attrib.get("height")) or 0.0
            if is_full_page_box(x, y, width, height, page_width, page_height):
                full_page_image_count += 1
            if element.attrib.get("data-svglide-raster-island") == "true":
                local_raster_island_count += 1
                local_raster_area += max(width, 0.0) * max(height, 0.0)
        image_only = len(nodes) == 1 and image_count == 1 and full_page_image_count == 1
        page_area = max(page_width * page_height, 1.0)
        local_raster_area_ratio = local_raster_area / page_area
        page = {
            "path": path.relative_to(project).as_posix(),
            "source_text_count": text_count,
            "image_count": image_count,
            "full_page_raster_count": full_page_image_count,
            "image_only": image_only,
            "local_raster_island_count": local_raster_island_count,
            "local_raster_area_ratio": round(local_raster_area_ratio, 6),
            "prepared_text_wrap_risk_count": prepared_text_wrap_risk_count,
            "sha256": file_sha256(path),
        }
        pages.append(page)
        totals["page_count"] += 1
        totals["source_text_count"] += text_count
        totals["prepared_image_count"] += image_count
        totals["prepared_full_page_raster_count"] += full_page_image_count
        totals["prepared_image_only_page_count"] += 1 if image_only else 0
        totals["local_raster_island_count"] += local_raster_island_count
        totals["local_raster_area_ratio_sum"] += local_raster_area_ratio
        totals["local_raster_area_ratio_max"] = max(totals["local_raster_area_ratio_max"], local_raster_area_ratio)
        totals["prepared_text_wrap_risk_count"] += prepared_text_wrap_risk_count
    totals["local_raster_area_ratio_sum"] = round(totals["local_raster_area_ratio_sum"], 6)
    totals["local_raster_area_ratio_max"] = round(totals["local_raster_area_ratio_max"], 6)
    return {"totals": totals, "pages": pages}


def find_first_key(value: Any, keys: set[str]) -> Any:
    if isinstance(value, dict):
        for key in keys:
            if key in value:
                return value[key]
        for child in value.values():
            found = find_first_key(child, keys)
            if found is not None:
                return found
    elif isinstance(value, list):
        for child in value:
            found = find_first_key(child, keys)
            if found is not None:
                return found
    return None


def readback_json_payload(raw_record: Any) -> Any:
    if isinstance(raw_record, dict):
        payload = raw_record.get("json")
        if payload:
            return payload
        stdout = raw_record.get("stdout")
        if isinstance(stdout, str) and stdout.strip():
            try:
                return json.loads(stdout)
            except json.JSONDecodeError:
                return raw_record
    return raw_record


def presentation_xml(readback_payload: Any) -> str | None:
    content = find_first_key(readback_payload, {"content"})
    return content if isinstance(content, str) and content.strip().startswith("<") else None


def xml_block_stats(xml_text: str) -> dict[str, Any]:
    root = ET.fromstring(xml_text)
    stats = {
        "editable_text_count": 0,
        "editable_shape_count": 0,
        "editable_line_count": 0,
        "image_block_count": 0,
        "chart_block_count": 0,
        "full_page_raster_count": 0,
        "image_only_page_count": 0,
        "raster_area_ratio_max": 0.0,
        "page_count": 0,
        "single_char_text_shape_count": 0,
        "short_text_shape_count": 0,
        "role_font_family_count": 0,
        "text_shape_count_max_per_page": 0,
        "single_char_text_shape_ratio": 0.0,
        "short_text_shape_ratio": 0.0,
        "text_wrap_risk_count": 0,
    }
    for slide in [element for element in root.iter() if local_name(element.tag) == "slide"]:
        stats["page_count"] += 1
        page_width = parse_number(slide.attrib.get("width")) or parse_number(root.attrib.get("width")) or 960.0
        page_height = parse_number(slide.attrib.get("height")) or parse_number(root.attrib.get("height")) or 540.0
        slide_images = 0
        slide_non_image = 0
        slide_image_area = 0.0
        slide_text_shapes = 0
        for element in slide.iter():
            name = local_name(element.tag)
            if element is slide or name in {"style", "data", "fill", "fillColor", "content"}:
                continue
            if name == "shape":
                slide_non_image += 1
                content_text = element_visible_text(element)
                shape_type = element.attrib.get("type", "").lower()
                if content_text or shape_type == "text":
                    stats["editable_text_count"] += 1
                    slide_text_shapes += 1
                    compact = compact_text(content_text)
                    if len(compact) == 1:
                        stats["single_char_text_shape_count"] += 1
                    if 0 < len(compact) <= 2:
                        stats["short_text_shape_count"] += 1
                    if any(ROLE_FONT_RE.match(font) for font in shape_font_families(element)):
                        stats["role_font_family_count"] += 1
                    width = parse_number(element.attrib.get("width"))
                    height = parse_number(element.attrib.get("height"))
                    font_size = find_first_key({local_name(node.tag): node.attrib for node in element.iter()}, {"fontSize", "font-size"})
                    parsed_font_size = parse_number(font_size) or (height * 0.75 if height else None)
                    if text_wrap_risk(content_text, width, parsed_font_size, 0.0):
                        stats["text_wrap_risk_count"] += 1
                else:
                    stats["editable_shape_count"] += 1
            elif name == "line":
                stats["editable_line_count"] += 1
                slide_non_image += 1
            elif name in {"image", "img"}:
                stats["image_block_count"] += 1
                slide_images += 1
                x = parse_number(element.attrib.get("topLeftX") or element.attrib.get("x")) or 0.0
                y = parse_number(element.attrib.get("topLeftY") or element.attrib.get("y")) or 0.0
                width = parse_number(element.attrib.get("width")) or 0.0
                height = parse_number(element.attrib.get("height")) or 0.0
                area = max(width, 0.0) * max(height, 0.0)
                slide_image_area += area
                if is_full_page_box(x, y, width, height, page_width, page_height):
                    stats["full_page_raster_count"] += 1
            elif "chart" in name.lower():
                stats["chart_block_count"] += 1
                slide_non_image += 1
        if slide_images > 0 and slide_non_image == 0:
            stats["image_only_page_count"] += 1
        page_area = page_width * page_height
        if page_area > 0:
            stats["raster_area_ratio_max"] = max(stats["raster_area_ratio_max"], slide_image_area / page_area)
        stats["text_shape_count_max_per_page"] = max(stats["text_shape_count_max_per_page"], slide_text_shapes)
    if stats["editable_text_count"] > 0:
        stats["single_char_text_shape_ratio"] = round(
            stats["single_char_text_shape_count"] / stats["editable_text_count"],
            6,
        )
        stats["short_text_shape_ratio"] = round(
            stats["short_text_shape_count"] / stats["editable_text_count"],
            6,
        )
    return stats


def textify(value: Any) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return " ".join(textify(child) for child in value.values())
    if isinstance(value, list):
        return " ".join(textify(child) for child in value)
    return ""


def json_block_stats(value: Any) -> dict[str, Any]:
    text = textify(value).lower()
    return {
        "editable_text_count": len(re.findall(r"shape(type)?\.?text|shape_type['\"]?\s*:\s*['\"]?text|textblock|text shape", text)),
        "editable_shape_count": len(re.findall(r"shapeblocktype|shape block|shape", text)),
        "editable_line_count": len(re.findall(r"lineblocktype|line block", text)),
        "image_block_count": len(re.findall(r"imageblocktype|image block|<image|image", text)),
        "chart_block_count": len(re.findall(r"chartembedblocktype|chart block|chart", text)),
        "full_page_raster_count": len(re.findall(r"full[-_ ]page[-_ ]raster", text)),
        "image_only_page_count": 0,
        "raster_area_ratio_max": 0.0,
        "page_count": 0,
        "single_char_text_shape_count": 0,
        "short_text_shape_count": 0,
        "role_font_family_count": len(re.findall(r"svglide[a-z0-9_-]*(?:display|body|label|metric|font)", text)),
        "text_shape_count_max_per_page": 0,
        "single_char_text_shape_ratio": 0.0,
        "short_text_shape_ratio": 0.0,
        "text_wrap_risk_count": 0,
    }


def readback_block_stats(project: Path) -> dict[str, Any]:
    raw_path = project / READBACK_RAW
    if not raw_path.exists():
        raise EditabilityGateError(f"missing readback raw payload: {raw_path}")
    raw_record = read_json(raw_path)
    payload = readback_json_payload(raw_record)
    xml_text = presentation_xml(payload)
    if xml_text:
        stats = xml_block_stats(xml_text)
        stats["mode"] = "xml_presentation_content"
        return stats
    stats = json_block_stats(payload)
    stats["mode"] = "json_marker_scan"
    return stats


def check_status(status: str, **extra: Any) -> dict[str, Any]:
    return {"status": status, **extra}


def run_editability_gate(project: Path) -> dict[str, Any]:
    project = project.resolve()
    started_at = now_iso()
    readback_check_path = project / READBACK_CHECK
    if not readback_check_path.exists():
        raise EditabilityGateError(f"missing readback check: {readback_check_path}")
    readback_check = read_json(readback_check_path)
    prepared = prepared_svg_stats(project)
    readback = readback_block_stats(project)
    checks: dict[str, dict[str, Any]] = {}

    checks["readback_status"] = check_status(
        "passed" if readback_check.get("status") == "passed" else "failed",
        actual=readback_check.get("status"),
    )
    checks["prepared_not_full_page_raster"] = check_status(
        "passed" if prepared["totals"]["prepared_full_page_raster_count"] == 0 else "failed",
        full_page_raster_count=prepared["totals"]["prepared_full_page_raster_count"],
    )
    checks["prepared_not_image_only"] = check_status(
        "passed" if prepared["totals"]["prepared_image_only_page_count"] == 0 else "failed",
        image_only_page_count=prepared["totals"]["prepared_image_only_page_count"],
    )
    checks["readback_not_full_page_raster"] = check_status(
        "passed" if readback["full_page_raster_count"] == 0 else "failed",
        full_page_raster_count=readback["full_page_raster_count"],
        raster_area_ratio_max=readback["raster_area_ratio_max"],
    )
    checks["readback_not_image_only"] = check_status(
        "passed" if readback["image_only_page_count"] == 0 else "failed",
        image_only_page_count=readback["image_only_page_count"],
    )
    checks["local_raster_page_area"] = check_status(
        "passed" if prepared["totals"]["local_raster_area_ratio_max"] <= LOCAL_RASTER_PAGE_AREA_LIMIT else "failed",
        local_raster_area_ratio_max=prepared["totals"]["local_raster_area_ratio_max"],
        limit=LOCAL_RASTER_PAGE_AREA_LIMIT,
    )
    checks["local_raster_deck_area"] = check_status(
        "passed" if prepared["totals"]["local_raster_area_ratio_sum"] <= LOCAL_RASTER_DECK_AREA_LIMIT else "failed",
        local_raster_area_ratio_sum=prepared["totals"]["local_raster_area_ratio_sum"],
        limit=LOCAL_RASTER_DECK_AREA_LIMIT,
    )
    checks["prepared_text_box_width"] = check_status(
        "passed" if prepared["totals"]["prepared_text_wrap_risk_count"] == 0 else "failed",
        prepared_text_wrap_risk_count=prepared["totals"]["prepared_text_wrap_risk_count"],
    )
    checks["readback_text_box_width"] = check_status(
        "passed" if readback["text_wrap_risk_count"] == 0 else "failed",
        readback_text_wrap_risk_count=readback["text_wrap_risk_count"],
    )
    checks["editable_text"] = check_status(
        "passed" if readback["editable_text_count"] > 0 else "failed",
        source_text_count=prepared["totals"]["source_text_count"],
        editable_text_count=readback["editable_text_count"],
    )
    checks["readback_role_font_family"] = check_status(
        "passed" if readback["role_font_family_count"] == 0 else "failed",
        role_font_family_count=readback["role_font_family_count"],
    )
    text_fragment_status = "passed"
    if (
        readback["editable_text_count"] >= TEXT_FRAGMENT_MIN_SHAPES
        and readback["single_char_text_shape_ratio"] > TEXT_FRAGMENT_RATIO_LIMIT
    ):
        text_fragment_status = "failed"
    checks["readback_text_fragmentation"] = check_status(
        text_fragment_status,
        editable_text_count=readback["editable_text_count"],
        single_char_text_shape_count=readback["single_char_text_shape_count"],
        single_char_text_shape_ratio=readback["single_char_text_shape_ratio"],
        short_text_shape_count=readback["short_text_shape_count"],
        short_text_shape_ratio=readback["short_text_shape_ratio"],
        text_shape_count_max_per_page=readback["text_shape_count_max_per_page"],
        min_shapes=TEXT_FRAGMENT_MIN_SHAPES,
        ratio_limit=TEXT_FRAGMENT_RATIO_LIMIT,
    )

    failed = [name for name, check in checks.items() if check.get("status") == "failed"]
    result = {
        "version": "svglide-editability-gate/v1",
        "stage": "editability_gate",
        "status": "failed" if failed else "passed",
        "started_at": started_at,
        "ended_at": now_iso(),
        "inputs": {
            "readback_json": READBACK_RAW.as_posix(),
            "readback_json_sha256": optional_sha256(project / READBACK_RAW),
            "readback_check_sha256": optional_sha256(readback_check_path),
            "readback_raw_sha256": optional_sha256(project / READBACK_RAW),
            "prepared_files": [{"path": item["path"], "sha256": item["sha256"]} for item in prepared["pages"]],
            "svg_sources": [{"path": item["path"], "sha256": item["sha256"]} for item in prepared["pages"]],
        },
        "summary": {
            "editable_text_count": readback["editable_text_count"],
            "editable_shape_count": readback["editable_shape_count"],
            "editable_line_count": readback["editable_line_count"],
            "single_char_text_shape_count": readback["single_char_text_shape_count"],
            "single_char_text_shape_ratio": readback["single_char_text_shape_ratio"],
            "short_text_shape_count": readback["short_text_shape_count"],
            "short_text_shape_ratio": readback["short_text_shape_ratio"],
            "role_font_family_count": readback["role_font_family_count"],
            "prepared_text_wrap_risk_count": prepared["totals"]["prepared_text_wrap_risk_count"],
            "readback_text_wrap_risk_count": readback["text_wrap_risk_count"],
            "text_shape_count_max_per_page": readback["text_shape_count_max_per_page"],
            "image_only_page_count": readback["image_only_page_count"],
            "full_page_raster_count": readback["full_page_raster_count"],
            "raster_area_ratio": readback["raster_area_ratio_max"],
            "source_text_count": prepared["totals"]["source_text_count"],
            "source_full_page_raster_count": prepared["totals"]["prepared_full_page_raster_count"],
            "local_raster_island_count": prepared["totals"]["local_raster_island_count"],
            "local_raster_area_ratio_max": prepared["totals"]["local_raster_area_ratio_max"],
            "local_raster_area_ratio_sum": prepared["totals"]["local_raster_area_ratio_sum"],
        },
        "prepared": prepared,
        "readback": readback,
        "checks": checks,
        "failed_checks": failed,
    }
    (project / OUTPUT_READBACK_REPORT).parent.mkdir(parents=True, exist_ok=True)
    (project / OUTPUT_CHECK).parent.mkdir(parents=True, exist_ok=True)
    (project / OUTPUT_RECEIPT).parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    (project / OUTPUT_READBACK_REPORT).write_text(payload, encoding="utf-8")
    (project / OUTPUT_CHECK).write_text(payload, encoding="utf-8")
    (project / OUTPUT_RECEIPT).write_text(payload, encoding="utf-8")
    return result


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Validate online SVGlide readback retains editable protocol blocks.")
    parser.add_argument("project", help="SVGlide project directory under .lark-slides/plan/<deck-id>")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON output")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        result = run_editability_gate(Path(args.project))
    except EditabilityGateError as exc:
        print(f"svglide_editability_gate: error: {exc}", file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2 if args.pretty else None))
    return 0 if result.get("status") == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
