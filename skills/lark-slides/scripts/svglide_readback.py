#!/usr/bin/env python3
# Copyright (c) 2026 Lark Technologies Pte. Ltd.
# SPDX-License-Identifier: MIT

from __future__ import annotations

import argparse
import html
import hashlib
import json
import os
import re
import shlex
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any, Callable
from urllib.parse import quote


CREATE_DIR = Path("07-create")
READBACK_DIR = Path("08-readback")
LIVE_CREATE_NAME = "live-create.json"
RAW_READBACK_NAME = "xml-presentations-get.json"
READBACK_CHECK_NAME = "readback-check.json"
LARK_CLI_COMMAND_ENV = "SVGLIDE_LARK_CLI_CMD"
ROLE_FONT_RE = re.compile(r"^svglide[a-z0-9_-]*(display|body|label|metric|font)", re.IGNORECASE)


class ReadbackError(Exception):
    pass


CommandRunner = Callable[..., subprocess.CompletedProcess[str]]


def relpath(path: Path, base: Path) -> str:
    try:
        return path.resolve().relative_to(base.resolve()).as_posix()
    except ValueError:
        return path.as_posix()


def read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise ReadbackError(f"missing required file: {path}") from error
    except json.JSONDecodeError as error:
        raise ReadbackError(f"invalid JSON in {path}: {error}") from error


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def optional_sha256(path: Path) -> str | None:
    return file_sha256(path) if path.exists() else None


def find_first_key(value: Any, keys: set[str]) -> Any:
    if isinstance(value, dict):
        for key, child in value.items():
            if key in keys:
                return child
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


def extract_presentation_id(live_create: Any) -> str | None:
    raw = find_first_key(live_create, {"xml_presentation_id", "presentation_id"})
    return raw if isinstance(raw, str) and raw.strip() else None


def extract_slide_ids(live_create: Any) -> list[str]:
    raw = find_first_key(live_create, {"slide_ids", "created_slide_ids"})
    if isinstance(raw, list):
        return [item for item in raw if isinstance(item, str) and item.strip()]
    return []


def lark_cli_command_prefix() -> list[str]:
    raw = os.environ.get(LARK_CLI_COMMAND_ENV, "").strip()
    if not raw:
        return ["lark-cli"]
    parsed = shlex.split(raw)
    return parsed if parsed else ["lark-cli"]


def extract_request_headers(live_create: Any) -> dict[str, str]:
    raw = find_first_key(live_create, {"request_headers"})
    if not isinstance(raw, dict):
        return {}
    headers: dict[str, str] = {}
    allowed_headers = {
        "env": ("Env", "Pre_release"),
        "x-tt-env": ("x-tt-env", "ppe_pure_svg"),
        "x-use-ppe": ("x-use-ppe", "1"),
    }
    for key, value in raw.items():
        if not isinstance(key, str) or not isinstance(value, str):
            raise ReadbackError("live-create request_headers must be a string key/value object")
        normalized_key = key.strip().lower()
        normalized_value = value.strip()
        allowed = allowed_headers.get(normalized_key)
        if allowed is None or normalized_value != allowed[1]:
            raise ReadbackError("readback supports only Env=Pre_release, x-tt-env=ppe_pure_svg, x-use-ppe=1 request headers")
        headers[allowed[0]] = normalized_value
    return headers


def build_readback_command(live_create: Any, xml_presentation_id: str) -> tuple[list[str], dict[str, str]]:
    request_headers = extract_request_headers(live_create)
    prefix = lark_cli_command_prefix()
    if request_headers:
        command = prefix + [
            "api",
            "GET",
            f"/open-apis/slides_ai/v1/xml_presentations/{quote(xml_presentation_id, safe='')}",
            "--as",
            "user",
        ]
        return command, request_headers

    params = json.dumps({"xml_presentation_id": xml_presentation_id}, separators=(",", ":"))
    return prefix + ["slides", "xml_presentations", "get", "--as", "user", "--params", params], {}


def build_input_binding(project: Path, live_create: Any) -> dict[str, Any]:
    revision = find_first_key(live_create, {"revision_id", "revision"})
    slide_ids = extract_slide_ids(live_create)
    return {
        "plan_sha256": optional_sha256(project / "02-plan" / "slide_plan.json"),
        "quality_gate_sha256": optional_sha256(project / "06-check" / "quality-gate.json"),
        "dry_run_sha256": optional_sha256(project / CREATE_DIR / "dry-run.json"),
        "ppe_proof_sha256": optional_sha256(project / CREATE_DIR / "ppe-proof.json"),
        "live_create_sha256": optional_sha256(project / CREATE_DIR / LIVE_CREATE_NAME),
        "revision_id": revision if isinstance(revision, (str, int)) else None,
        "expected_slide_count": expected_page_count(project),
        "created_slide_count": len(slide_ids),
    }


def expected_page_count(project: Path) -> int | None:
    plan_path = project / "02-plan" / "slide_plan.json"
    if not plan_path.exists():
        return None
    plan = read_json(plan_path)
    if not isinstance(plan, dict):
        return None
    for key in ["slides", "svg_files", "pages"]:
        value = plan.get(key)
        if isinstance(value, list):
            return len(value)
    raw = plan.get("page_count") or plan.get("target_slide_count")
    if isinstance(raw, int) and raw > 0:
        return raw
    return None


def find_slide_list(value: Any) -> list[Any] | None:
    if isinstance(value, dict):
        for key, child in value.items():
            if key in {"slides", "slide_list", "slide_metas", "items"} and isinstance(child, list):
                return child
        for child in value.values():
            found = find_slide_list(child)
            if found is not None:
                return found
    elif isinstance(value, list):
        for child in value:
            found = find_slide_list(child)
            if found is not None:
                return found
    return None


def extract_presentation_content(readback: Any) -> str | None:
    value = find_first_key(readback, {"content"})
    if isinstance(value, str) and "<presentation" in value and "<slide" in value:
        return value
    return None


def slide_ids_from_content(content: str) -> list[str]:
    return re.findall(r"<slide\b[^>]*\bid=\"([^\"]+)\"", content)


def slide_ids_from_readback(readback: Any) -> list[str]:
    content = extract_presentation_content(readback)
    if content:
        return slide_ids_from_content(content)
    slides = find_slide_list(readback)
    ids: list[str] = []
    if slides is not None:
        for slide in slides:
            if isinstance(slide, dict):
                raw = slide.get("id") or slide.get("slide_id")
                if isinstance(raw, str) and raw.strip():
                    ids.append(raw)
    return ids


def actual_page_count(readback: Any) -> int | None:
    raw = find_first_key(readback, {"page_count", "slide_count"})
    if isinstance(raw, int) and raw >= 0:
        return raw
    slides = find_slide_list(readback)
    if slides is not None:
        return len(slides)
    content = extract_presentation_content(readback)
    if content:
        return len(slide_ids_from_content(content))
    return None


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def element_visible_text(element: ET.Element) -> str:
    return " ".join(text.strip() for text in element.itertext() if text.strip())


def element_font_families(element: ET.Element) -> list[str]:
    names: list[str] = []
    for node in element.iter():
        for key in ["fontFamily", "font-family", "font_family"]:
            value = node.attrib.get(key)
            if isinstance(value, str) and value.strip():
                names.append(value.strip())
    return names


def readback_text_shape_stats(readback: Any) -> dict[str, Any]:
    content = extract_presentation_content(readback)
    stats = {
        "mode": "xml_presentation_content" if content else "unavailable",
        "page_count": 0,
        "text_shape_count": 0,
        "single_char_text_shape_count": 0,
        "short_text_shape_count": 0,
        "role_font_family_count": 0,
        "text_shape_count_max_per_page": 0,
        "single_char_text_shape_ratio": 0.0,
        "short_text_shape_ratio": 0.0,
    }
    if not content:
        return stats
    try:
        root = ET.fromstring(content)
    except ET.ParseError as error:
        stats["mode"] = "xml_parse_failed"
        stats["parse_error"] = str(error)
        return stats
    for slide in [element for element in root.iter() if local_name(element.tag) == "slide"]:
        stats["page_count"] += 1
        page_text_shapes = 0
        for element in slide.iter():
            if local_name(element.tag) != "shape":
                continue
            text = element_visible_text(element)
            shape_type = element.attrib.get("type", "").lower()
            if not text and shape_type != "text":
                continue
            stats["text_shape_count"] += 1
            page_text_shapes += 1
            compact = compact_text(text)
            if len(compact) == 1:
                stats["single_char_text_shape_count"] += 1
            if 0 < len(compact) <= 2:
                stats["short_text_shape_count"] += 1
            if any(ROLE_FONT_RE.match(font) for font in element_font_families(element)):
                stats["role_font_family_count"] += 1
        stats["text_shape_count_max_per_page"] = max(stats["text_shape_count_max_per_page"], page_text_shapes)
    if stats["text_shape_count"] > 0:
        stats["single_char_text_shape_ratio"] = round(stats["single_char_text_shape_count"] / stats["text_shape_count"], 6)
        stats["short_text_shape_ratio"] = round(stats["short_text_shape_count"] / stats["text_shape_count"], 6)
    return stats


def expected_asset_tokens(project: Path) -> list[str]:
    assets_path = project / "03-assets" / "assets.json"
    if not assets_path.exists():
        return []
    data = read_json(assets_path)
    if not isinstance(data, dict):
        return []
    return [value for value in data.values() if isinstance(value, str) and value.strip()]


def iter_strings(value: Any) -> list[str]:
    strings: list[str] = []
    if isinstance(value, str):
        strings.append(value)
    elif isinstance(value, dict):
        for child in value.values():
            strings.extend(iter_strings(child))
    elif isinstance(value, list):
        for child in value:
            strings.extend(iter_strings(child))
    return strings


def visible_text_candidates(value: Any) -> list[str]:
    candidates: list[str] = []
    for raw in iter_strings(value):
        if not raw:
            continue
        decoded = html.unescape(raw)
        candidates.append(decoded)
        if "<" in decoded and ">" in decoded:
            stripped = re.sub(r"<[^>]+>", "", decoded)
            if stripped and stripped != decoded:
                candidates.append(stripped)
    return candidates


def compact_text(value: str) -> str:
    return re.sub(r"\s+", "", html.unescape(value or ""))


def claim_tokens(fragment: str) -> list[str]:
    tokens: list[str] = []
    tokens.extend(re.findall(r"[A-Za-z0-9]+(?:[./%+-][A-Za-z0-9]+)*", fragment))
    for chunk in re.findall(r"[\u4e00-\u9fff]{2,}", fragment):
        if len(chunk) <= 4:
            tokens.append(chunk)
            continue
        for index in range(0, len(chunk) - 1, 2):
            token = chunk[index : index + 2]
            if len(token) == 2:
                tokens.append(token)
    seen: set[str] = set()
    unique: list[str] = []
    for token in tokens:
        normalized = compact_text(token)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        unique.append(normalized)
    return unique


def fragment_visible(fragment: str, visible_text: str, compact_visible_text: str) -> bool:
    if fragment in visible_text:
        return True
    compact_fragment = compact_text(fragment)
    if compact_fragment and compact_fragment in compact_visible_text:
        return True
    return False


def claim_visible(fragment: str, visible_text: str, compact_visible_text: str) -> bool:
    if fragment_visible(fragment, visible_text, compact_visible_text):
        return True
    tokens = claim_tokens(fragment)
    if not tokens:
        return False
    matched = sum(1 for token in tokens if token in compact_visible_text)
    if len(tokens) <= 2:
        return matched == len(tokens)
    return matched >= max(2, len(tokens) // 3)


def expected_business_claim_fragments(project: Path) -> list[str]:
    plan_path = project / "02-plan" / "slide_plan.json"
    if not plan_path.exists():
        return []
    plan = read_json(plan_path)
    if not isinstance(plan, dict):
        return []
    fragments: list[str] = []
    raw_claims = plan.get("business_claims")
    if isinstance(raw_claims, list):
        for item in raw_claims:
            if isinstance(item, str):
                fragments.append(item)
            elif isinstance(item, dict):
                for key in ["fragment", "claim", "text", "visible_text"]:
                    value = item.get(key)
                    if isinstance(value, str) and value.strip():
                        fragments.append(value)
                        break
    for slide in plan.get("slides", []) if isinstance(plan.get("slides"), list) else []:
        if isinstance(slide, dict):
            for item in slide.get("business_claims", []) if isinstance(slide.get("business_claims"), list) else []:
                if isinstance(item, str):
                    fragments.append(item)
                elif isinstance(item, dict):
                    value = item.get("fragment") or item.get("claim") or item.get("text")
                    if isinstance(value, str):
                        fragments.append(value)
    unique_fragments = [fragment.strip() for fragment in fragments if fragment.strip()]
    submitted_fragments = expected_submitted_svg_text_fragments(project)
    if submitted_fragments:
        submitted_text = "\n".join(submitted_fragments)
        compact_submitted_text = compact_text(submitted_text)
        unique_fragments = [
            fragment
            for fragment in unique_fragments
            if claim_visible(fragment, submitted_text, compact_submitted_text)
        ]
    return unique_fragments


def expected_core_visible_text_fragments(project: Path) -> list[str]:
    submitted = expected_submitted_svg_text_fragments(project)
    if submitted:
        return submitted
    plan_path = project / "02-plan" / "slide_plan.json"
    if not plan_path.exists():
        return []
    plan = read_json(plan_path)
    if not isinstance(plan, dict):
        return []
    fragments: list[str] = []
    slides = plan.get("slides")
    if not isinstance(slides, list):
        return []
    for slide in slides:
        if not isinstance(slide, dict):
            continue
        spec = slide.get("canvas_spec")
        content = spec.get("content") if isinstance(spec, dict) else None
        if isinstance(content, dict):
            fragments.extend(item.strip() for item in iter_strings(content) if item.strip())
        else:
            value = slide.get("title")
            if isinstance(value, str) and value.strip():
                fragments.append(value.strip())
    seen: set[str] = set()
    unique: list[str] = []
    for fragment in fragments:
        if fragment not in seen:
            seen.add(fragment)
            unique.append(fragment)
    return unique


def expected_submitted_svg_text_fragments(project: Path) -> list[str]:
    fragments: list[str] = []
    for path in source_svgs_for_readback(project):
        text = path.read_text(encoding="utf-8", errors="ignore")
        for match in re.finditer(r"(?is)<text\b[^>]*>(.*?)</text\s*>", text):
            value = re.sub(r"(?is)<[^>]+>", "", match.group(1))
            value = html.unescape(value).strip()
            if value:
                fragments.append(value)
        for match in re.finditer(r"(?is)<foreignObject\b[^>]*>(.*?)</foreignObject\s*>", text):
            value = re.sub(r"(?is)<[^>]+>", "", match.group(1))
            value = html.unescape(value).strip()
            if value:
                fragments.append(value)
    seen: set[str] = set()
    unique: list[str] = []
    for fragment in fragments:
        if fragment not in seen:
            seen.add(fragment)
            unique.append(fragment)
    return unique


def expected_chart_marker_count(project: Path) -> int:
    count = 0
    for path in source_svgs_for_readback(project):
        text = path.read_text(encoding="utf-8", errors="ignore")
        if 'slide:role="chart"' in text or "data-svglide-chart" in text:
            count += 1
    return count


def source_svgs_for_readback(project: Path) -> list[Path]:
    prepared = project / "04-svg" / "prepared"
    if prepared.exists():
        files = sorted(path for path in prepared.glob("*.svg") if path.is_file())
        if files:
            return files
    source = project / "04-svg"
    return sorted(path for path in source.glob("*.svg") if path.is_file()) if source.exists() else []


def expected_image_asset_count(project: Path) -> int:
    count = 0
    for path in source_svgs_for_readback(project):
        text = path.read_text(encoding="utf-8", errors="ignore")
        count += len(re.findall(r"<image\b", text, flags=re.IGNORECASE))
    return count


def has_blank_marker(value: Any) -> bool:
    if isinstance(value, dict):
        for key, child in value.items():
            if "blank" in key.lower() and child:
                return True
            if has_blank_marker(child):
                return True
    elif isinstance(value, list):
        return any(has_blank_marker(item) for item in value)
    elif isinstance(value, str):
        return value.lower() in {"blank", "blank_page", "empty_slide"}
    return False


def has_any_marker(readback_text: str, markers: list[str]) -> bool:
    lower = readback_text.lower()
    return any(marker.lower() in lower for marker in markers)


def check_status(status: str, **extra: Any) -> dict[str, Any]:
    return {"status": status, **extra}


def build_checks(project: Path, live_create: Any, readback: Any, xml_presentation_id: str) -> dict[str, Any]:
    expected_count = expected_page_count(project)
    actual_count = actual_page_count(readback)
    slide_ids = extract_slide_ids(live_create)
    readback_slide_ids = slide_ids_from_readback(readback)
    tokens = expected_asset_tokens(project)
    readback_text = json.dumps(readback, ensure_ascii=False)
    visible_text = "\n".join(visible_text_candidates(readback))
    compact_visible_text = compact_text(visible_text)
    text_shape_stats = readback_text_shape_stats(readback)

    checks: dict[str, Any] = {}
    if expected_count is None or actual_count is None:
        checks["page_count"] = check_status("skipped", reason="plan or readback page count is unavailable")
    elif expected_count == actual_count:
        checks["page_count"] = check_status("passed", expected=expected_count, actual=actual_count)
    else:
        checks["page_count"] = check_status("failed", expected=expected_count, actual=actual_count)

    if not slide_ids:
        checks["slide_ids"] = check_status("failed", reason="live-create output does not include created slide ids")
    elif expected_count is not None and len(slide_ids) != expected_count:
        checks["slide_ids"] = check_status("failed", expected=expected_count, actual=len(slide_ids))
    else:
        checks["slide_ids"] = check_status("passed", actual=len(slide_ids))

    if not slide_ids or not readback_slide_ids:
        checks["slide_order"] = check_status("skipped", reason="live or readback slide ids are unavailable")
    elif slide_ids == readback_slide_ids:
        checks["slide_order"] = check_status("passed", expected=slide_ids, actual=readback_slide_ids)
    else:
        checks["slide_order"] = check_status("failed", expected=slide_ids, actual=readback_slide_ids)

    checks["blank_page"] = check_status("failed" if has_blank_marker(readback) else "passed")

    if not tokens:
        checks["asset_tokens"] = check_status("skipped", reason="no expected assets")
    else:
        missing = [token for token in tokens if token not in readback_text]
        checks["asset_tokens"] = check_status("failed" if missing else "passed", missing=missing)

    overflow_markers = ["text_overflow", "text-overflow", "overflow_text", "text out of bounds", "text_fit_failed"]
    checks["text_fit"] = check_status(
        "failed" if has_any_marker(readback_text, overflow_markers) else "passed",
        mode="readback_marker_scan",
    )

    bounds_markers = ["out_of_bounds", "out-of-bounds", "clip_error", "clipped_element", "bounds_failed"]
    checks["bounds"] = check_status(
        "failed" if has_any_marker(readback_text, bounds_markers) else "passed",
        mode="readback_marker_scan",
    )

    expected_chart_markers = expected_chart_marker_count(project)
    if expected_chart_markers == 0:
        checks["chart_markers"] = check_status("skipped", reason="no source chart markers")
    else:
        chart_present = has_any_marker(readback_text, ["svglide-chart", "slide:role=\"chart\"", "chart-ref", "chart"])
        checks["chart_markers"] = check_status("passed" if chart_present else "failed", expected=expected_chart_markers)

    expected_images = expected_image_asset_count(project)
    if expected_images == 0:
        checks["image_assets"] = check_status("skipped", reason="no source image assets")
    else:
        image_present = has_any_marker(readback_text, ["<image", "<img", "data-svglide-assets", "image-ref", "imageRef"])
        checks["image_assets"] = check_status("passed" if image_present else "failed", expected=expected_images)

    claims = expected_business_claim_fragments(project)
    if not claims:
        checks["business_claims"] = check_status("skipped", reason="no business claims")
    else:
        missing_claims = [claim for claim in claims if not claim_visible(claim, visible_text, compact_visible_text)]
        checks["business_claims"] = check_status("failed" if missing_claims else "passed", missing=missing_claims)

    core_fragments = expected_core_visible_text_fragments(project)
    if not core_fragments:
        checks["core_visible_text"] = check_status("skipped", reason="no expected core text fragments")
    else:
        missing_fragments = [fragment for fragment in core_fragments if not fragment_visible(fragment, visible_text, compact_visible_text)]
        checks["core_visible_text"] = check_status(
            "failed" if missing_fragments else "passed",
            expected=len(core_fragments),
            missing=missing_fragments,
        )

    failed = [name for name, item in checks.items() if item["status"] == "failed"]
    return {
        "version": "svglide-readback/v1",
        "status": "failed" if failed else "passed",
        "xml_presentation_id": xml_presentation_id,
        "input_binding": build_input_binding(project, live_create),
        "readback_text_stats": text_shape_stats,
        "checks": checks,
        "failed_checks": failed,
    }


def run_readback(project: Path, *, command_runner: CommandRunner = subprocess.run) -> dict[str, Any]:
    project = project.resolve()
    live_create = read_json(project / CREATE_DIR / LIVE_CREATE_NAME)
    xml_presentation_id = extract_presentation_id(live_create)
    output_dir = project / READBACK_DIR
    output_dir.mkdir(parents=True, exist_ok=True)

    if not xml_presentation_id:
        result = {
            "version": "svglide-readback/v1",
            "status": "failed",
            "xml_presentation_id": None,
            "input_binding": build_input_binding(project, live_create),
            "checks": {"presentation_id": check_status("failed", reason="live-create output is missing xml_presentation_id")},
            "failed_checks": ["presentation_id"],
        }
        write_json(output_dir / READBACK_CHECK_NAME, result)
        return result

    try:
        command, request_headers = build_readback_command(live_create, xml_presentation_id)
    except ReadbackError as error:
        result = {
            "version": "svglide-readback/v1",
            "status": "failed",
            "xml_presentation_id": xml_presentation_id,
            "input_binding": build_input_binding(project, live_create),
            "checks": {"readback_command": check_status("failed", reason=str(error))},
            "failed_checks": ["readback_command"],
        }
        write_json(output_dir / READBACK_CHECK_NAME, result)
        return result

    completed = command_runner(command, check=False, capture_output=True, text=True)
    raw_record = {
        "command": command,
        "request_headers": request_headers,
        "returncode": completed.returncode,
        "stdout": completed.stdout,
        "stderr": completed.stderr,
    }
    try:
        readback_payload = json.loads(completed.stdout) if completed.stdout.strip() else {}
    except json.JSONDecodeError as error:
        readback_payload = {"error": f"invalid JSON from readback command: {error}", "raw_stdout": completed.stdout}
    raw_record["json"] = readback_payload
    write_json(output_dir / RAW_READBACK_NAME, raw_record)

    if completed.returncode != 0:
        result = {
            "version": "svglide-readback/v1",
            "status": "failed",
            "xml_presentation_id": xml_presentation_id,
            "input_binding": build_input_binding(project, live_create),
            "checks": {"readback_command": check_status("failed", returncode=completed.returncode, stderr=completed.stderr)},
            "failed_checks": ["readback_command"],
        }
    else:
        result = build_checks(project, live_create, readback_payload, xml_presentation_id)
    write_json(output_dir / READBACK_CHECK_NAME, result)
    return result


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Read back a created SVGlide presentation and validate key delivery checks.")
    parser.add_argument("project", help="SVGlide project directory containing 07-create/live-create.json")
    parser.add_argument("--pretty", action="store_true", help="pretty-print JSON output")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        result = run_readback(Path(args.project))
    except (OSError, ReadbackError) as error:
        print(f"svglide_readback: {error}", file=sys.stderr)
        return 2
    print(json.dumps(result, ensure_ascii=False, indent=2 if args.pretty else None))
    return 0 if result["status"] == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
