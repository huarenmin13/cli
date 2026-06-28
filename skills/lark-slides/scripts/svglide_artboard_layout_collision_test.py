#!/usr/bin/env python3
# Copyright (c) 2026 Lark Technologies Pte. Ltd.
# SPDX-License-Identifier: MIT

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import svglide_artboard_layout_collision as collision


def write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")


class SVGlideArtboardLayoutCollisionTest(unittest.TestCase):
    def write_project(
        self,
        project: Path,
        *,
        subtitle_y: float = 286,
        subtitle_height: float = 57,
        cta_y: float = 337,
        cta_text: str = "进入方案讨论",
    ) -> None:
        subtitle = "置身钉内的价值，是把沟通、任务、文档、审批和智能助手组织成连续工作流，让企业协同从工具使用升级为可治理的组织能力。"
        raw = project / "04-artboard/raw"
        write_json(
            raw / "manifest.json",
            {
                "version": "svglide-raw-visual-manifest/v1",
                "pages": [
                    {
                        "page": 10,
                        "source": "04-artboard/raw/page-010.visual.svg",
                        "node_layout_map": "04-artboard/raw/page-010.node-layout-map.json",
                    }
                ],
            },
        )
        write_json(
            raw / "page-010.canvas-spec.json",
            {
                "canvas": {"width": 960, "height": 540},
                "page_role": "closing",
                "content": {
                    "title": "关键结论",
                    "subtitle": subtitle,
                    "cta": cta_text,
                },
            },
        )
        write_json(
            raw / "page-010.node-layout-map.json",
            {
                "version": "svglide-node-layout-map/v1",
                "nodes": [
                    {
                        "id": "satori-text-title",
                        "kind": "text",
                        "text": "关键结论",
                        "measured_bbox": {"x": 0, "y": 232, "width": 960, "height": 44},
                    },
                    {
                        "id": "satori-text-subtitle",
                        "kind": "text",
                        "text": subtitle,
                        "measured_bbox": {"x": 315, "y": subtitle_y, "width": 330, "height": subtitle_height},
                    },
                    {
                        "id": "satori-text-cta-1",
                        "kind": "text",
                        "text": "进",
                        "measured_bbox": {"x": 449, "y": cta_y, "width": 20, "height": 13.5},
                    },
                    {
                        "id": "satori-text-cta-2",
                        "kind": "text",
                        "text": "入",
                        "measured_bbox": {"x": 459, "y": cta_y, "width": 20, "height": 13.5},
                    },
                    {
                        "id": "satori-text-cta-3",
                        "kind": "text",
                        "text": "方",
                        "measured_bbox": {"x": 469, "y": cta_y, "width": 20, "height": 13.5},
                    },
                    {
                        "id": "satori-text-cta-4",
                        "kind": "text",
                        "text": "案",
                        "measured_bbox": {"x": 479, "y": cta_y, "width": 20, "height": 13.5},
                    },
                    {
                        "id": "satori-text-cta-5",
                        "kind": "text",
                        "text": "讨",
                        "measured_bbox": {"x": 489, "y": cta_y, "width": 20, "height": 13.5},
                    },
                    {
                        "id": "satori-text-cta-6",
                        "kind": "text",
                        "text": "论",
                        "measured_bbox": {"x": 499, "y": cta_y, "width": 20, "height": 13.5},
                    },
                ],
            },
        )
        (raw / "page-010.visual.svg").write_text("<svg />", encoding="utf-8")

    def write_poster_hero_project(self, project: Path) -> None:
        raw = project / "04-artboard/raw"
        write_json(
            raw / "manifest.json",
            {
                "version": "svglide-raw-visual-manifest/v1",
                "pages": [
                    {
                        "page": 1,
                        "source": "04-artboard/raw/page-001.visual.svg",
                        "node_layout_map": "04-artboard/raw/page-001.node-layout-map.json",
                    }
                ],
            },
        )
        write_json(
            raw / "page-001.canvas-spec.json",
            {
                "canvas": {"width": 960, "height": 540},
                "template_id": "poster-stat-punch",
                "page_variant_id": "hero",
                "content": {"title": "DIABLO II LEGACY"},
            },
        )
        write_json(
            raw / "page-001.node-layout-map.json",
            {
                "version": "svglide-node-layout-map/v1",
                "nodes": [
                    {
                        "id": "satori-text-title-top",
                        "kind": "text",
                        "text": "DIABLO",
                        "measured_bbox": {"x": 66, "y": 76, "width": 700, "height": 99},
                    },
                    {
                        "id": "satori-text-title-red",
                        "kind": "text",
                        "text": "II",
                        "measured_bbox": {"x": 58, "y": 135, "width": 264, "height": 178.2},
                    },
                ],
            },
        )
        (raw / "page-001.visual.svg").write_text("<svg />", encoding="utf-8")

    def test_closing_subtitle_cta_collision_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            self.write_project(project)

            result = collision.check_project(project, write=True)

            self.assertEqual(result["status"], "failed")
            codes = [issue["code"] for page in result["pages"] for issue in page["issues"]]
            self.assertIn("subtitle_cta_overlap", codes)
            self.assertTrue((project / "04-artboard/raw/layout-collision.json").exists())
            self.assertTrue((project / "receipts/artboard-layout-collision.json").exists())

    def test_closing_subtitle_cta_minimum_gap_passes(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            self.write_project(project, cta_y=360)

            result = collision.check_project(project)

            self.assertEqual(result["status"], "passed")
            self.assertEqual(result["summary"]["error_count"], 0)

    def test_text_canvas_overflow_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            self.write_project(project, subtitle_y=520, subtitle_height=40, cta_y=570)

            result = collision.check_project(project)

            codes = [issue["code"] for page in result["pages"] for issue in page["issues"]]
            self.assertIn("text_canvas_overflow", codes)
            self.assertEqual(result["status"], "failed")

    def test_same_text_effect_layers_do_not_fail_overlap(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            self.write_project(project, cta_y=380)
            layout_path = project / "04-artboard/raw/page-010.node-layout-map.json"
            payload = json.loads(layout_path.read_text(encoding="utf-8"))
            payload["nodes"].extend(
                [
                    {
                        "id": "satori-text-shadow-1",
                        "kind": "text",
                        "text": "RUNES",
                        "measured_bbox": {"x": 94, "y": 151, "width": 170.5, "height": 74.25},
                    },
                    {
                        "id": "satori-text-shadow-2",
                        "kind": "text",
                        "text": "RUNES",
                        "measured_bbox": {"x": 92, "y": 149, "width": 170.5, "height": 74.25},
                    },
                    {
                        "id": "satori-text-container",
                        "kind": "text",
                        "text": "RUNES",
                        "measured_bbox": {"x": 88, "y": 150, "width": 790, "height": 62},
                    },
                ]
            )
            write_json(layout_path, payload)

            result = collision.check_project(project)

            self.assertEqual(result["status"], "passed")
            codes = [issue["code"] for page in result["pages"] for issue in page["issues"]]
            self.assertNotIn("text_text_overlap", codes)

    def test_different_text_overlap_still_fails(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            self.write_project(project, cta_y=380)
            layout_path = project / "04-artboard/raw/page-010.node-layout-map.json"
            payload = json.loads(layout_path.read_text(encoding="utf-8"))
            payload["nodes"].extend(
                [
                    {
                        "id": "satori-text-left",
                        "kind": "text",
                        "text": "LOOT",
                        "measured_bbox": {"x": 120, "y": 150, "width": 220, "height": 80},
                    },
                    {
                        "id": "satori-text-right",
                        "kind": "text",
                        "text": "BUILD",
                        "measured_bbox": {"x": 180, "y": 170, "width": 220, "height": 80},
                    },
                ]
            )
            write_json(layout_path, payload)

            result = collision.check_project(project)

            self.assertEqual(result["status"], "failed")
            codes = [issue["code"] for page in result["pages"] for issue in page["issues"]]
            self.assertIn("text_text_overlap", codes)

    def test_poster_hero_title_stack_does_not_fail_overlap(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            self.write_poster_hero_project(project)

            result = collision.check_project(project)

            self.assertEqual(result["status"], "passed")
            codes = [issue["code"] for page in result["pages"] for issue in page["issues"]]
            self.assertNotIn("text_text_overlap", codes)


if __name__ == "__main__":
    raise SystemExit(unittest.main())
