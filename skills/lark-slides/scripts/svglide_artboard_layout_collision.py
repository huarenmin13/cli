#!/usr/bin/env python3
# Copyright (c) 2026 Lark Technologies Pte. Ltd.
# SPDX-License-Identifier: MIT

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


VERSION = "svglide-artboard-layout-collision/v1"
RAW_RECEIPT = Path("04-artboard/raw/layout-collision.json")
STAGE_RECEIPT = Path("receipts/artboard-layout-collision.json")
DEFAULT_CANVAS = {"width": 960.0, "height": 540.0}
DEFAULT_SUBTITLE_CTA_GAP = 14.0
TEXT_OVERLAP_RATIO = 0.18
TEXT_OVERLAP_VERTICAL_RATIO = 0.35


class LayoutCollisionError(Exception):
    pass


def now_iso() -> str:
    return datetime.now().astimezone().replace(microsecond=0).isoformat()


def read_json(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except OSError as error:
        raise LayoutCollisionError(f"cannot read {path}: {error}") from error
    except json.JSONDecodeError as error:
        raise LayoutCollisionError(f"invalid json {path}: {error}") from error
    if not isinstance(payload, dict):
        raise LayoutCollisionError(f"expected object json: {path}")
    return payload


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return "sha256:" + digest.hexdigest()


def relpath(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def number(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    return None


def node_bbox(node: dict[str, Any]) -> dict[str, float] | None:
    raw = node.get("measured_bbox") if isinstance(node.get("measured_bbox"), dict) else node
    values = {key: number(raw.get(key)) for key in ["x", "y", "width", "height"]}
    if any(value is None for value in values.values()):
        return None
    return {key: float(value) for key, value in values.items() if value is not None}


def bbox_bottom(bbox: dict[str, float]) -> float:
    return bbox["y"] + bbox["height"]


def bbox_right(bbox: dict[str, float]) -> float:
    return bbox["x"] + bbox["width"]


def bbox_area(bbox: dict[str, float]) -> float:
    return max(0.0, bbox["width"]) * max(0.0, bbox["height"])


def intersect(left: dict[str, float], right: dict[str, float]) -> dict[str, float]:
    x = max(left["x"], right["x"])
    y = max(left["y"], right["y"])
    r = min(bbox_right(left), bbox_right(right))
    b = min(bbox_bottom(left), bbox_bottom(right))
    return {"x": x, "y": y, "width": max(0.0, r - x), "height": max(0.0, b - y)}


def union_bbox(items: list[dict[str, float]]) -> dict[str, float] | None:
    if not items:
        return None
    x1 = min(item["x"] for item in items)
    y1 = min(item["y"] for item in items)
    x2 = max(bbox_right(item) for item in items)
    y2 = max(bbox_bottom(item) for item in items)
    return {"x": x1, "y": y1, "width": x2 - x1, "height": y2 - y1}


def text_value(node: dict[str, Any]) -> str:
    value = node.get("text")
    return value.strip() if isinstance(value, str) else ""


def text_preview(text: str) -> str:
    normalized = " ".join(text.split())
    return normalized[:60] + ("..." if len(normalized) > 60 else "")


def text_nodes(layout_map: dict[str, Any]) -> list[dict[str, Any]]:
    nodes = layout_map.get("nodes")
    if not isinstance(nodes, list):
        return []
    return [
        node
        for node in nodes
        if isinstance(node, dict) and node.get("kind") == "text" and text_value(node) and node_bbox(node) is not None
    ]


def text_node_items(layout_map: dict[str, Any]) -> list[tuple[dict[str, Any], dict[str, float], str]]:
    return [(node, node_bbox(node) or {}, text_value(node)) for node in text_nodes(layout_map)]


def same_line_fragments(left: dict[str, float], right: dict[str, float]) -> bool:
    return abs(left["y"] - right["y"]) <= 1.5 and abs(left["height"] - right["height"]) <= 2.0


def is_canvas_overflow(bbox: dict[str, float], canvas: dict[str, float], tolerance: float = 0.5) -> bool:
    return (
        bbox["x"] < -tolerance
        or bbox["y"] < -tolerance
        or bbox_right(bbox) > canvas["width"] + tolerance
        or bbox_bottom(bbox) > canvas["height"] + tolerance
    )


def content_candidates(items: list[tuple[dict[str, Any], dict[str, float], str]], content: str) -> list[tuple[dict[str, Any], dict[str, float], str]]:
    target = content.strip()
    if not target:
        return []
    candidates = []
    for node, bbox, text in items:
        if text == target or text in target or target in text:
            candidates.append((node, bbox, text))
    return candidates


def content_bbox(items: list[tuple[dict[str, Any], dict[str, float], str]], content: str) -> dict[str, float] | None:
    candidates = content_candidates(items, content)
    exact = [bbox for _, bbox, text in candidates if text == content.strip()]
    if exact:
        return union_bbox(exact)
    long_candidates = [bbox for _, bbox, text in candidates if len(text) > 1]
    if long_candidates:
        return union_bbox(long_candidates)
    return union_bbox([bbox for _, bbox, _ in candidates])


def cta_bbox_after(
    items: list[tuple[dict[str, Any], dict[str, float], str]],
    cta: str,
    *,
    after_y: float,
) -> dict[str, float] | None:
    candidates = [
        bbox
        for _, bbox, _ in content_candidates(items, cta)
        if bbox["y"] >= after_y - 2.0
    ]
    return union_bbox(candidates)


def issue(
    code: str,
    page: int,
    message: str,
    *,
    severity: str = "error",
    node_id: str | None = None,
    bbox: dict[str, float] | None = None,
    related_bbox: dict[str, float] | None = None,
    text: str | None = None,
    related_text: str | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {"severity": severity, "code": code, "page": page, "message": message}
    if node_id:
        payload["node_id"] = node_id
    if bbox:
        payload["bbox"] = {key: round(value, 3) for key, value in bbox.items()}
    if related_bbox:
        payload["related_bbox"] = {key: round(value, 3) for key, value in related_bbox.items()}
    if text:
        payload["text"] = text_preview(text)
    if related_text:
        payload["related_text"] = text_preview(related_text)
    return payload


def check_page(
    project: Path,
    page_entry: dict[str, Any],
    *,
    minimum_subtitle_cta_gap: float = DEFAULT_SUBTITLE_CTA_GAP,
) -> dict[str, Any]:
    page = int(page_entry.get("page") or 0)
    node_layout_rel = page_entry.get("node_layout_map")
    if not isinstance(node_layout_rel, str) or not node_layout_rel:
        return {
            "page": page,
            "status": "failed",
            "issues": [issue("node_layout_map_missing", page, "raw visual manifest page is missing node_layout_map")],
        }
    node_layout_path = project / node_layout_rel
    layout_map = read_json(node_layout_path)
    spec_path = node_layout_path.with_name(node_layout_path.name.replace(".node-layout-map.json", ".canvas-spec.json"))
    spec = read_json(spec_path) if spec_path.exists() else {}
    canvas_spec = spec.get("canvas") if isinstance(spec.get("canvas"), dict) else {}
    canvas = {
        "width": number(canvas_spec.get("width")) or DEFAULT_CANVAS["width"],
        "height": number(canvas_spec.get("height")) or DEFAULT_CANVAS["height"],
    }
    items = text_node_items(layout_map)
    issues: list[dict[str, Any]] = []
    for node, bbox, text in items:
        if is_canvas_overflow(bbox, canvas):
            issues.append(
                issue(
                    "text_canvas_overflow",
                    page,
                    "text bbox exceeds canvas bounds",
                    node_id=str(node.get("id") or ""),
                    bbox=bbox,
                    text=text,
                )
            )
    for left_index, (left_node, left_bbox, left_text) in enumerate(items):
        for right_node, right_bbox, right_text in items[left_index + 1 :]:
            if same_line_fragments(left_bbox, right_bbox):
                continue
            hit = intersect(left_bbox, right_bbox)
            if hit["width"] <= 2.0 or hit["height"] <= 0:
                continue
            smaller = max(1.0, min(bbox_area(left_bbox), bbox_area(right_bbox)))
            area_ratio = bbox_area(hit) / smaller
            vertical_ratio = hit["height"] / max(1.0, min(left_bbox["height"], right_bbox["height"]))
            if area_ratio >= TEXT_OVERLAP_RATIO and vertical_ratio >= TEXT_OVERLAP_VERTICAL_RATIO:
                issues.append(
                    issue(
                        "text_text_overlap",
                        page,
                        "text boxes overlap in raw artboard layout",
                        node_id=str(left_node.get("id") or ""),
                        bbox=left_bbox,
                        related_bbox=right_bbox,
                        text=left_text,
                        related_text=right_text,
                    )
                )
    content = spec.get("content") if isinstance(spec.get("content"), dict) else {}
    subtitle = content.get("subtitle") if isinstance(content.get("subtitle"), str) else ""
    cta = content.get("cta") if isinstance(content.get("cta"), str) else ""
    subtitle_bbox = content_bbox(items, subtitle) if subtitle else None
    cta_bbox = cta_bbox_after(items, cta, after_y=bbox_bottom(subtitle_bbox) - 20.0) if cta and subtitle_bbox else None
    if subtitle_bbox and cta_bbox:
        gap = cta_bbox["y"] - bbox_bottom(subtitle_bbox)
        if gap < minimum_subtitle_cta_gap:
            issues.append(
                issue(
                    "subtitle_cta_overlap",
                    page,
                    f"closing subtitle and CTA gap is {gap:.1f}px; expected at least {minimum_subtitle_cta_gap:.1f}px",
                    bbox=subtitle_bbox,
                    related_bbox=cta_bbox,
                    text=subtitle,
                    related_text=cta,
                )
            )
    errors = [item for item in issues if item.get("severity") == "error"]
    return {
        "page": page,
        "status": "failed" if errors else "passed",
        "node_layout_map": node_layout_rel,
        "node_layout_map_sha256": file_sha256(node_layout_path),
        "canvas_spec": relpath(spec_path, project) if spec_path.exists() else None,
        "canvas_spec_sha256": file_sha256(spec_path) if spec_path.exists() else None,
        "text_count": len(items),
        "issues": issues,
    }


def check_project(
    project: Path,
    *,
    minimum_subtitle_cta_gap: float = DEFAULT_SUBTITLE_CTA_GAP,
    write: bool = False,
) -> dict[str, Any]:
    project = project.resolve()
    manifest_path = project / "04-artboard" / "raw" / "manifest.json"
    manifest = read_json(manifest_path)
    pages = manifest.get("pages")
    if not isinstance(pages, list):
        raise LayoutCollisionError("raw visual manifest pages must be a list")
    page_results = [
        check_page(project, page, minimum_subtitle_cta_gap=minimum_subtitle_cta_gap)
        for page in pages
        if isinstance(page, dict)
    ]
    error_count = sum(1 for page in page_results for item in page.get("issues", []) if item.get("severity") == "error")
    warning_count = sum(1 for page in page_results for item in page.get("issues", []) if item.get("severity") == "warning")
    status = "failed" if error_count else "passed"
    payload = {
        "version": VERSION,
        "stage": "artboard-layout-collision",
        "status": status,
        "inputs": {
            "raw_visual_manifest": "04-artboard/raw/manifest.json",
            "raw_visual_manifest_sha256": file_sha256(manifest_path),
        },
        "policy": {
            "minimum_subtitle_cta_gap": minimum_subtitle_cta_gap,
            "text_overlap_ratio": TEXT_OVERLAP_RATIO,
            "text_overlap_vertical_ratio": TEXT_OVERLAP_VERTICAL_RATIO,
        },
        "pages": page_results,
        "summary": {
            "page_count": len(page_results),
            "error_count": error_count,
            "warning_count": warning_count,
        },
        "created_at": now_iso(),
        "path": RAW_RECEIPT.as_posix(),
        "receipt": STAGE_RECEIPT.as_posix(),
    }
    if write:
        write_json(project / RAW_RECEIPT, payload)
        write_json(project / STAGE_RECEIPT, payload)
    return payload


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Check SVGlide raw artboard layout collisions.")
    parser.add_argument("--project", required=True, help="SVGlide project root")
    parser.add_argument("--minimum-subtitle-cta-gap", type=float, default=DEFAULT_SUBTITLE_CTA_GAP)
    parser.add_argument("--pretty", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)
    try:
        result = check_project(
            Path(args.project),
            minimum_subtitle_cta_gap=args.minimum_subtitle_cta_gap,
            write=True,
        )
    except LayoutCollisionError as error:
        print(f"svglide_artboard_layout_collision: {error}", file=sys.stderr)
        return 2
    print(json.dumps(result, ensure_ascii=False, indent=2 if args.pretty else None, sort_keys=True))
    return 1 if result["status"] != "passed" else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
