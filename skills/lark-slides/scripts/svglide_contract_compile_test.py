# Copyright (c) 2026 Lark Technologies Pte. Ltd.
# SPDX-License-Identifier: MIT
from __future__ import annotations

import copy
import json
import sys
import tempfile
import unittest
from html import escape
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parent))

import svglide_schema
import svglide_contract_compile


def valid_report() -> dict[str, object]:
    decision = {
        "element_id": "title",
        "source_ref": "canvas_spec.content.title",
        "importance": "semantic_required",
        "source_tag": "text",
        "decision": "compiled",
        "reason": "lowered raw Satori text to slide text role with text style metadata",
        "output_ref": "title",
    }
    return {
        "version": "svglide-contract-compile/v1",
        "source": "04-artboard/raw/page-001.visual.svg",
        "semantic_map": "04-artboard/raw/page-001.semantic-map.json",
        "output": "04-svg/page-001.svg",
        "compiler_mode": "raw_satori_lowering",
        "lowering_source": "04-artboard/raw visual SVG",
        "visual_retention": {
            "raw_counts": {"text": 1, "shape": 1, "path": 0, "image": 0},
            "output_counts": {"text": 1, "shape": 1, "path": 0, "image": 0},
            "ratios": {"text_retention": 1.0, "shape_retention": 1.0, "path_retention": None, "image_retention": None},
        },
        "support_node_retention": {
            "raw_counts": {"defs": 0, "style": 0, "clipPath": 0, "mask": 0, "filter": 0, "metadata": 0},
            "output_counts": {"defs": 0, "style": 0, "clipPath": 0, "mask": 0, "filter": 0, "metadata": 1},
        },
        "unsupported_support_nodes": [],
        "loss_notes": [],
        "text_style_manifest_items": 1,
        "status": "passed",
        "summary": {
            "semantic_required": 1,
            "visual_required": 0,
            "decorative_optional": 0,
            "compiled_elements": 1,
            "degraded_elements": 0,
            "rasterized_regions": 0,
            "dropped_decorations": 0,
            "blocking_issues": 0,
        },
        "compiled": [decision],
        "degraded": [],
        "rasterized": [],
        "dropped": [],
        "blocking_issues": [],
        "input_sha256": "abc",
        "semantic_map_sha256": "def",
        "output_sha256": "123",
    }


def valid_manifest() -> dict[str, object]:
    return {
        "version": "svglide-contract-compile-manifest/v1",
        "stage": "contract_compile",
        "status": "passed",
        "pages": [
            {
                "page": 1,
                "source": "04-artboard/raw/page-001.visual.svg",
                "semantic_map": "04-artboard/raw/page-001.semantic-map.json",
                "output": "04-svg/page-001.svg",
                "report": "04-svg/contract/page-001.report.json",
                "status": "passed",
                "input_sha256": "abc",
                "semantic_map_sha256": "def",
                "output_sha256": "123",
                "compiler_mode": "raw_satori_lowering",
                "lowering_source": "04-artboard/raw visual SVG",
                "visual_retention": {
                    "raw_counts": {"text": 1, "shape": 1, "path": 0, "image": 0},
                    "output_counts": {"text": 1, "shape": 1, "path": 0, "image": 0},
                    "ratios": {"text_retention": 1.0, "shape_retention": 1.0, "path_retention": None, "image_retention": None},
                },
                "support_node_retention": {
                    "raw_counts": {"defs": 0, "style": 0, "clipPath": 0, "mask": 0, "filter": 0, "metadata": 0},
                    "output_counts": {"defs": 0, "style": 0, "clipPath": 0, "mask": 0, "filter": 0, "metadata": 1},
                },
                "text_style_manifest_items": 1,
            }
        ],
        "summary": {
            "pages": 1,
            "blocking_issues": 0,
            "degraded_elements": 0,
            "rasterized_regions": 0,
            "dropped_decorations": 0,
            "compiler_modes": ["raw_satori_lowering"],
            "raw_text_count": 1,
            "output_text_count": 1,
            "text_style_manifest_items": 1,
        },
    }


class SVGlideContractCompileSchemaTest(unittest.TestCase):
    def report_schema(self) -> dict[str, object]:
        return svglide_schema.read_json(svglide_schema.schema_path("svglide-contract-compile-report.schema.json"))

    def manifest_schema(self) -> dict[str, object]:
        return svglide_schema.read_json(svglide_schema.schema_path("svglide-contract-compile-manifest.schema.json"))

    def test_page_report_schema_accepts_element_level_decisions(self) -> None:
        self.assertEqual(svglide_schema.validate_json_schema(valid_report(), self.report_schema()), [])

    def test_page_report_schema_rejects_missing_decision_arrays(self) -> None:
        payload = valid_report()
        payload.pop("compiled")

        issues = svglide_schema.validate_json_schema(payload, self.report_schema())

        self.assertIn("$.compiled", {issue["path"] for issue in issues})

    def test_page_report_schema_rejects_decision_without_reason(self) -> None:
        payload = valid_report()
        compiled = copy.deepcopy(payload["compiled"])
        compiled[0].pop("reason")
        payload["compiled"] = compiled

        issues = svglide_schema.validate_json_schema(payload, self.report_schema())

        self.assertIn("$.compiled[0].reason", {issue["path"] for issue in issues})

    def test_manifest_schema_accepts_page_source_report_output_mapping(self) -> None:
        self.assertEqual(svglide_schema.validate_json_schema(valid_manifest(), self.manifest_schema()), [])

    def test_manifest_schema_rejects_missing_output_sha256(self) -> None:
        payload = valid_manifest()
        pages = copy.deepcopy(payload["pages"])
        pages[0].pop("output_sha256")
        payload["pages"] = pages

        issues = svglide_schema.validate_json_schema(payload, self.manifest_schema())

        self.assertIn("$.pages[0].output_sha256", {issue["path"] for issue in issues})


class SVGlideContractCompileTest(unittest.TestCase):
    minimal_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\xcf\xc0\xf0\x1f\x00\x05\x00\x01\xff\x89\x99=\x1d\x00\x00\x00\x00IEND\xaeB`\x82"

    def stub_render_islands(self, svg: str, islands: list[dict[str, object]], asset_dir: Path, scale: int) -> list[dict[str, object]]:
        rendered: list[dict[str, object]] = []
        for island in islands:
            output_png = asset_dir / f"{island['id']}.png"
            output_png.parent.mkdir(parents=True, exist_ok=True)
            output_png.write_bytes(self.minimal_png)
            rendered.append(
                {
                    "output_png": str(output_png),
                    "bbox": island["bbox"],
                    "scale": scale,
                    "bytes": output_png.stat().st_size,
                    "render_ms": 1,
                    "alpha_crop": False,
                    "source_node_ids": island.get("source_node_ids", []),
                    "reason": island.get("reason", ""),
                }
            )
        return rendered

    def raw_svg_from_elements(self, elements: list[dict[str, object]]) -> str:
        children = ['<rect x="0" y="0" width="960" height="540" fill="#fff"/>']
        for element in elements:
            kind = str(element.get("kind") or "")
            raw_bbox = element.get("bbox") if isinstance(element.get("bbox"), dict) else {}
            x = raw_bbox.get("x", 80)
            y = raw_bbox.get("y", 80)
            width = raw_bbox.get("width", 300)
            height = raw_bbox.get("height", 60)
            style = element.get("style") if isinstance(element.get("style"), dict) else {}
            elem_id = escape(str(element.get("element_id") or kind or "node"), quote=True)
            data_attrs = ""
            for key in ["data-svglide-role", "data-svglide-motif-owner", "data-svglide-motif-id", "data-svglide-origin-template"]:
                if element.get(key) is not None:
                    data_attrs += f' {key}="{escape(str(element[key]), quote=True)}"'
            if kind == "text":
                text = escape(str(element.get("text") or ""), quote=False)
                font_size = style.get("font_size") or style.get("font-size") or 24
                font_weight = style.get("font_weight") or style.get("font-weight") or 700
                fill = style.get("fill") or "#111111"
                children.append(
                    f'<text id="{elem_id}"{data_attrs} x="{x}" y="{y}" width="{width}" height="{height}" '
                    f'font-family="Source Sans Pro" font-size="{font_size}" font-weight="{font_weight}" '
                    f'letter-spacing="0.5" fill="{fill}">{text}</text>'
                )
            elif kind == "rect":
                children.append(f'<rect id="{elem_id}"{data_attrs} x="{x}" y="{y}" width="{width}" height="{height}" fill="{style.get("fill", "#f8fafc")}"/>')
            elif kind == "circle":
                children.append(
                    f'<circle id="{elem_id}"{data_attrs} cx="{float(x) + float(width) / 2:g}" cy="{float(y) + float(height) / 2:g}" '
                    f'r="{max(min(float(width), float(height)) / 2, 1):g}" fill="{style.get("fill", "#2563eb")}"/>'
                )
            elif kind == "line":
                children.append(
                    f'<line id="{elem_id}"{data_attrs} x1="{x}" y1="{y}" x2="{float(x) + float(width):g}" y2="{float(y) + float(height):g}" '
                    f'stroke="{style.get("stroke", "#111111")}" stroke-width="2"/>'
                )
            elif kind == "path":
                children.append(
                    f'<path id="{elem_id}"{data_attrs} d="{escape(str(style.get("d") or element.get("d") or "M80 360 C160 300 240 420 380 330"), quote=True)}" '
                    f'fill="{style.get("fill", "none")}" stroke="{style.get("stroke", "#2563eb")}"/>'
                )
            elif kind == "image":
                href = escape(str(element.get("href") or "@./assets/hero.png"), quote=True)
                children.append(f'<image id="{elem_id}"{data_attrs} href="{href}" x="{x}" y="{y}" width="{width}" height="{height}"/>')
        return '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">' + "".join(children) + "</svg>"

    def make_project(self, elements: list[dict[str, object]], *, visual_svg: str | None = None) -> Path:
        root = Path(tempfile.mkdtemp())
        project = root / ".lark-slides" / "plan" / "demo"
        raw_dir = project / "04-artboard" / "raw"
        raw_dir.mkdir(parents=True)
        (project / "03-assets").mkdir(parents=True)
        visual = raw_dir / "page-001.visual.svg"
        semantic_map = raw_dir / "page-001.semantic-map.json"
        visual.write_text(visual_svg or self.raw_svg_from_elements(elements), encoding="utf-8")
        semantic_map.write_text(
            json.dumps(
                {
                    "version": "svglide-semantic-map/v1",
                    "page": 1,
                    "theme": {"background": "#ffffff", "text": "#111111", "primary": "#2563eb"},
                    "elements": elements,
                }
            ),
            encoding="utf-8",
        )
        (raw_dir / "manifest.json").write_text(
            json.dumps(
                {
                    "version": "svglide-raw-visual-manifest/v1",
                    "stage": "generate_svg",
                    "pages": [
                        {
                            "page": 1,
                            "source": "04-artboard/raw/page-001.visual.svg",
                            "semantic_map": "04-artboard/raw/page-001.semantic-map.json",
                        }
                    ],
                }
            ),
            encoding="utf-8",
        )
        (project / "03-assets" / "assets.json").write_text("{}", encoding="utf-8")
        return project

    def test_compile_project_requires_raw_manifest(self) -> None:
        project = Path(tempfile.mkdtemp()) / ".lark-slides" / "plan" / "demo"

        with self.assertRaisesRegex(svglide_contract_compile.ContractCompileError, "raw visual manifest"):
            svglide_contract_compile.compile_project(project)

    def test_compile_raw_text_to_slide_text_role(self) -> None:
        project = self.make_project(
            [
                {
                    "element_id": "title",
                    "kind": "text",
                    "importance": "semantic_required",
                    "text": "Quarterly Review",
                    "bbox": {"x": 80, "y": 64, "width": 640, "height": 72},
                    "style": {"font_size": 32, "font_weight": 800, "fill": "#111111"},
                }
            ]
        )

        result = svglide_contract_compile.compile_project(project)

        svg = (project / "04-svg" / "page-001.svg").read_text(encoding="utf-8")
        report = json.loads((project / "04-svg" / "contract" / "page-001.report.json").read_text(encoding="utf-8"))
        self.assertEqual(result["status"], "passed")
        self.assertIn('slide:role="slide"', svg)
        self.assertIn('<text', svg)
        self.assertIn('slide:role="text"', svg)
        self.assertIn('data-svglide-text-style-id="txt_001"', svg)
        self.assertIn('id="svglide-text-style-manifest"', svg)
        self.assertIn("Quarterly Review", svg)
        self.assertEqual(report["compiler_mode"], "raw_satori_lowering")
        self.assertEqual(report["visual_retention"]["raw_counts"]["text"], 1)
        self.assertEqual(report["visual_retention"]["output_counts"]["text"], 1)
        self.assertEqual(report["text_style_manifest_items"], 1)

    def test_raw_text_baseline_is_converted_to_slide_text_box_top(self) -> None:
        visual_svg = """
        <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
          <text id="hero" x="66" y="164" width="488" height="99"
                font-family="svglideboldposterdisplay" font-size="112" font-weight="900"
                fill="#F6E5C3">DIABLO</text>
        </svg>
        """
        project = self.make_project([], visual_svg=visual_svg)

        svglide_contract_compile.compile_project(project)

        svg = (project / "04-svg" / "page-001.svg").read_text(encoding="utf-8")
        report = json.loads((project / "04-svg" / "contract" / "page-001.report.json").read_text(encoding="utf-8"))
        root = svglide_contract_compile.ET.fromstring(svg)
        text_nodes = [node for node in root.iter() if svglide_contract_compile.local_name(node.tag) == "text"]
        self.assertEqual(len(text_nodes), 1)
        node = text_nodes[0]
        self.assertLess(float(node.attrib["y"]), 164)
        self.assertEqual(node.attrib["data-svglide-baseline-y"], "164")
        self.assertEqual(node.attrib["data-svglide-baseline-conversion"], "svg-baseline-to-slide-box")
        self.assertNotIn('<text id="hero" x="66" y="74.4" width="488" height="134.4" font-family="svglideboldposterdisplay"', svg)
        self.assertIn('font-family="思源黑体"', svg)
        self.assertIn("baseline_conversion", json.dumps(report, ensure_ascii=False))

    def test_raw_cjk_single_character_fragments_are_coalesced(self) -> None:
        visual_svg = """
        <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
          <text id="c1" x="58" y="105" width="52" height="52" font-family="svglideboldposterdisplay" font-size="52" font-weight="900" fill="#F6E5C3">怎</text>
          <text id="c2" x="110" y="105" width="52" height="52" font-family="svglideboldposterdisplay" font-size="52" font-weight="900" fill="#F6E5C3">么</text>
          <text id="c3" x="162" y="105" width="52" height="52" font-family="svglideboldposterdisplay" font-size="52" font-weight="900" fill="#F6E5C3">理</text>
          <text id="c4" x="214" y="105" width="52" height="52" font-family="svglideboldposterdisplay" font-size="52" font-weight="900" fill="#F6E5C3">解</text>
        </svg>
        """
        project = self.make_project([], visual_svg=visual_svg)

        svglide_contract_compile.compile_project(project)

        svg = (project / "04-svg" / "page-001.svg").read_text(encoding="utf-8")
        report = json.loads((project / "04-svg" / "contract" / "page-001.report.json").read_text(encoding="utf-8"))
        self.assertEqual(svg.count("<text"), 1)
        self.assertIn("怎么理解", svg)
        self.assertEqual(report["text_lowering"]["raw_text_fragments"], 4)
        self.assertEqual(report["text_lowering"]["output_text_boxes"], 1)
        self.assertGreater(report["text_lowering"]["coalesced_text_fragments"], 0)

    def test_role_font_family_is_mapped_and_kept_only_as_source_metadata(self) -> None:
        visual_svg = """
        <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
          <text id="body" x="80" y="120" width="360" height="24"
                font-family="svglideboldposterbody" font-size="18" font-weight="400"
                fill="#F6E5C3">Readable body copy</text>
        </svg>
        """
        project = self.make_project([], visual_svg=visual_svg)

        svglide_contract_compile.compile_project(project)

        svg = (project / "04-svg" / "page-001.svg").read_text(encoding="utf-8")
        self.assertNotIn('<text id="body" x="80" y="105.6" width="360" height="24" font-family="svglideboldposterbody"', svg)
        self.assertIn('font-family="思源黑体"', svg)
        self.assertIn('data-svglide-source-font-family="svglideboldposterbody"', svg)
        self.assertIn('"source_font_family": "svglideboldposterbody"', svg)
        self.assertIn('"slide_font_family": "思源黑体"', svg)

    def test_compile_raw_lowering_drops_whitespace_only_text_nodes(self) -> None:
        visual_svg = """
        <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
          <text id="empty-fragment" x="80" y="80" font-family="Arial" font-size="16" font-weight="400">   </text>
          <text id="title" x="80" y="120" font-family="Arial" font-size="36" font-weight="800">Keep Me</text>
        </svg>
        """
        project = self.make_project([], visual_svg=visual_svg)

        svglide_contract_compile.compile_project(project)

        svg = (project / "04-svg" / "page-001.svg").read_text(encoding="utf-8")
        report = json.loads((project / "04-svg" / "contract" / "page-001.report.json").read_text(encoding="utf-8"))
        self.assertNotIn("empty-fragment", svg)
        self.assertIn("Keep Me", svg)
        self.assertEqual(report["visual_retention"]["raw_counts"]["text"], 1)
        self.assertEqual(report["visual_retention"]["output_counts"]["text"], 1)
        self.assertEqual(report["text_style_manifest_items"], 1)

    def test_compile_raw_satori_preserves_transform_support_nodes_and_text_manifest(self) -> None:
        visual_svg = """
        <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
          <defs>
            <clipPath id="satori_cp_title"><rect x="60" y="50" width="720" height="120"/></clipPath>
            <mask id="fade-mask"><rect x="0" y="0" width="960" height="540" fill="white"/></mask>
            <filter id="soft-shadow"><feDropShadow dx="2" dy="2" stdDeviation="1"/></filter>
          </defs>
          <rect id="bg" x="0" y="0" width="960" height="540" fill="#fffaf0"/>
          <g id="title-group" transform="translate(12 8)">
            <text id="giant-title" x="68" y="120" width="640" height="96" font-family="Source Sans Pro"
                  font-size="88" font-weight="900" letter-spacing="1.5" fill="#1C1410"
                  clip-path="url(#satori_cp_title)" filter="url(#soft-shadow)">GIANT TEXT</text>
            <path id="accent" d="M80 180 C200 120 340 220 520 160" fill="none" stroke="#EE1A3B" stroke-width="8"/>
          </g>
        </svg>
        """
        project = self.make_project([], visual_svg=visual_svg)

        result = svglide_contract_compile.compile_project(project)

        svg = (project / "04-svg" / "page-001.svg").read_text(encoding="utf-8")
        report = json.loads((project / "04-svg" / "contract" / "page-001.report.json").read_text(encoding="utf-8"))
        self.assertEqual(result["status"], "passed_with_warnings")
        self.assertIn("<svg ", svg.splitlines()[0])
        self.assertNotIn("<svg:svg", svg)
        self.assertIn('xmlns:slide="https://slides.bytedance.com/ns"', svg)
        self.assertIn('slide:contract-version="svglide-authoring-contract/v1"', svg)
        self.assertIn('slide:role="text"', svg)
        self.assertIn('data-svglide-text-style-id="txt_001"', svg)
        self.assertIn('"version": "svglide-satori-text-style/v1"', svg)
        self.assertIn('transform="translate(12 8)"', svg)
        self.assertNotIn('clip-path="', svg)
        self.assertNotIn('filter="', svg)
        self.assertIn("<path", svg)
        self.assertEqual(report["visual_retention"]["raw_counts"]["text"], 1)
        self.assertEqual(report["visual_retention"]["output_counts"]["text"], 1)
        self.assertEqual(report["support_node_retention"]["raw_counts"]["clipPath"], 1)
        self.assertEqual(report["support_node_retention"]["output_counts"]["filter"], 0)
        self.assertEqual(report["redundant_text_clip_removed_count"], 1)
        self.assertGreaterEqual(len(report["loss_notes"]), 1)

    def test_compile_redundant_text_clip_keeps_editable_text_without_raster(self) -> None:
        visual_svg = """
        <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
          <defs><clipPath id="satori_cp_text"><rect x="70" y="80" width="600" height="120"/></clipPath></defs>
          <text id="title" x="80" y="96" width="520" height="72" font-family="Source Sans Pro"
                font-size="48" font-weight="800" clip-path="url(#satori_cp_text)">Editable title</text>
        </svg>
        """
        project = self.make_project([], visual_svg=visual_svg)

        result = svglide_contract_compile.compile_project(project)

        svg = (project / "04-svg" / "page-001.svg").read_text(encoding="utf-8")
        report = json.loads((project / "04-svg" / "contract" / "page-001.report.json").read_text(encoding="utf-8"))
        self.assertEqual(result["status"], "passed_with_warnings")
        self.assertIn('slide:role="text"', svg)
        self.assertIn("Editable title", svg)
        self.assertNotIn('data-svglide-raster-island="true"', svg)
        self.assertNotIn('clip-path="', svg)
        self.assertEqual(report["redundant_text_clip_removed_count"], 1)
        self.assertEqual(report["summary"]["rasterized_regions"], 0)

    def test_compile_decorative_filter_path_to_local_raster_island(self) -> None:
        visual_svg = """
        <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
          <defs><filter id="shadow"><feDropShadow dx="2" dy="2" stdDeviation="2"/></filter></defs>
          <text id="title" x="80" y="100" width="520" height="60" font-family="Source Sans Pro" font-size="48" font-weight="800">Title</text>
          <path id="decor-shadow" data-node-id="decor-shadow" filter="url(#shadow)" d="M120 200 L360 220 L460 280" stroke="#111" fill="none"/>
        </svg>
        """
        project = self.make_project([], visual_svg=visual_svg)
        original = svglide_contract_compile.svg_raster_renderer.render_islands
        svglide_contract_compile.svg_raster_renderer.render_islands = self.stub_render_islands
        try:
            result = svglide_contract_compile.compile_project(project)
        finally:
            svglide_contract_compile.svg_raster_renderer.render_islands = original

        svg = (project / "04-svg" / "page-001.svg").read_text(encoding="utf-8")
        report = json.loads((project / "04-svg" / "contract" / "page-001.report.json").read_text(encoding="utf-8"))
        self.assertEqual(result["status"], "passed_with_warnings")
        self.assertIn('data-svglide-raster-island="true"', svg)
        self.assertIn('data-svglide-raster-reason="unsupported-filter"', svg)
        self.assertIn('href="@./04-svg/rasterized/page-001/island-001.png"', svg)
        self.assertNotIn('id="decor-shadow"', svg)
        self.assertNotIn('filter="url(#shadow)"', svg)
        self.assertEqual(report["summary"]["rasterized_regions"], 1)
        self.assertEqual(report["rasterized_regions"][0]["source_node_ids"], ["decor-shadow"])
        self.assertGreater(report["rasterized_area_ratio"], 0)

    def test_compile_satori_layout_clip_mask_on_shapes_is_removed_not_rasterized(self) -> None:
        visual_svg = """
        <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
          <clipPath id="satori_cp-id"><rect x="0" y="0" width="960" height="540"/></clipPath>
          <clipPath id="satori_bc-id"><rect x="80" y="120" width="240" height="120"/></clipPath>
          <mask id="satori_om-id"><rect x="0" y="0" width="960" height="540" fill="#fff"/></mask>
          <rect id="panel" data-node-id="panel" clip-path="url(#satori_cp-id)" mask="url(#satori_om-id)" x="80" y="120" width="240" height="120" fill="#fff"/>
          <path id="outline" data-node-id="outline" clip-path="url(#satori_bc-id)" d="M80 120 L320 120 L320 240 L80 240 Z" fill="none" stroke="#111"/>
        </svg>
        """
        project = self.make_project([], visual_svg=visual_svg)

        result = svglide_contract_compile.compile_project(project)

        svg = (project / "04-svg" / "page-001.svg").read_text(encoding="utf-8")
        report = json.loads((project / "04-svg" / "contract" / "page-001.report.json").read_text(encoding="utf-8"))
        self.assertEqual(result["status"], "passed_with_warnings")
        self.assertIn('id="panel"', svg)
        self.assertIn('id="outline"', svg)
        self.assertIn('slide:role="shape"', svg)
        self.assertNotIn('data-svglide-raster-island="true"', svg)
        self.assertNotIn('clip-path="', svg)
        self.assertNotIn('mask="', svg)
        self.assertEqual(report["summary"]["rasterized_regions"], 0)
        self.assertTrue(any(note.get("reason") == "satori_layout_clip_mask_removed" for note in report["loss_notes"]))

    def test_compile_semantic_text_true_clip_blocks_without_rasterizing_text(self) -> None:
        visual_svg = """
        <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
          <defs><clipPath id="crop"><rect x="80" y="96" width="80" height="20"/></clipPath></defs>
          <text id="title" x="80" y="96" width="520" height="72" font-family="Source Sans Pro"
                font-size="48" font-weight="800" clip-path="url(#crop)">This title is cropped</text>
        </svg>
        """
        project = self.make_project([], visual_svg=visual_svg)

        result = svglide_contract_compile.compile_project(project)

        svg = (project / "04-svg" / "page-001.svg").read_text(encoding="utf-8")
        report = json.loads((project / "04-svg" / "contract" / "page-001.report.json").read_text(encoding="utf-8"))
        self.assertEqual(result["status"], "failed")
        self.assertIn("semantic_text_clip_not_rasterized", report["blocking_issues"][0]["reason"])
        self.assertIn('slide:role="text"', svg)
        self.assertNotIn('data-svglide-raster-island="true"', svg)

    def test_compile_large_mask_effect_blocks_instead_of_full_page_raster(self) -> None:
        visual_svg = """
        <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
          <defs><mask id="big-mask"><rect x="0" y="0" width="960" height="540" fill="white"/></mask></defs>
          <rect id="masked-bg" data-node-id="masked-bg" mask="url(#big-mask)" x="0" y="0" width="960" height="540" fill="#111"/>
        </svg>
        """
        project = self.make_project([], visual_svg=visual_svg)

        result = svglide_contract_compile.compile_project(project)

        svg = (project / "04-svg" / "page-001.svg").read_text(encoding="utf-8")
        report = json.loads((project / "04-svg" / "contract" / "page-001.report.json").read_text(encoding="utf-8"))
        self.assertEqual(result["status"], "failed")
        self.assertIn("local_raster_island_area_ratio_exceeds_limit", report["blocking_issues"][0]["reason"])
        self.assertNotIn('data-svglide-raster-island="true"', svg)

    def test_compile_raw_polygon_polyline_line_image_and_g_container_roles(self) -> None:
        visual_svg = """
        <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
          <rect id="bg" x="0" y="0" width="960" height="540" fill="#ffffff"/>
          <g id="decor-group" transform="translate(10 20)">
            <polygon id="tri" points="80,80 140,160 40,160" fill="#EE1A3B"/>
            <polyline id="route" points="220,80 260,120 320,90" fill="none" stroke="#1C1410"/>
            <line id="rule" x1="80" y1="240" x2="620" y2="240" stroke="#1C1410" stroke-width="2"/>
            <image id="hero" href="@./assets/hero.png" x="560" y="80" width="220" height="160"/>
          </g>
        </svg>
        """
        project = self.make_project([], visual_svg=visual_svg)

        result = svglide_contract_compile.compile_project(project)

        svg = (project / "04-svg" / "page-001.svg").read_text(encoding="utf-8")
        report = json.loads((project / "04-svg" / "contract" / "page-001.report.json").read_text(encoding="utf-8"))
        self.assertEqual(result["status"], "passed")
        self.assertIn('<g id="decor-group" transform="translate(10 20)">', svg)
        self.assertNotIn('<g id="decor-group" transform="translate(10 20)" slide:role=', svg)
        self.assertIn('<polygon id="tri"', svg)
        self.assertIn('<polyline id="route"', svg)
        self.assertIn('<line id="rule"', svg)
        self.assertIn('<image id="hero"', svg)
        self.assertGreaterEqual(svg.count('slide:role="shape"'), 4)
        self.assertIn('slide:role="image"', svg)
        self.assertEqual(report["visual_retention"]["raw_counts"]["image"], 1)
        self.assertEqual(report["visual_retention"]["output_counts"]["image"], 1)

    def test_compile_raw_rect_circle_line_path_to_shape_role(self) -> None:
        project = self.make_project(
            [
                {"element_id": "panel", "kind": "rect", "bbox": {"x": 0, "y": 0, "width": 960, "height": 540}, "style": {"fill": "#f8fafc"}},
                {"element_id": "dot", "kind": "circle", "bbox": {"x": 100, "y": 120, "width": 30, "height": 30}, "style": {"fill": "#2563eb"}},
                {"element_id": "rule", "kind": "line", "bbox": {"x": 80, "y": 260, "width": 300, "height": 0}, "style": {"stroke": "#111111"}},
                {"element_id": "wave", "kind": "path", "bbox": {"x": 80, "y": 320, "width": 300, "height": 90}, "style": {"d": "M80 360 C160 300 240 420 380 330", "stroke": "#2563eb"}},
            ]
        )

        svglide_contract_compile.compile_project(project)

        svg = (project / "04-svg" / "page-001.svg").read_text(encoding="utf-8")
        self.assertGreaterEqual(svg.count('slide:role="shape"'), 4)
        self.assertIn("<path", svg)

    def test_compile_preserves_decorative_motif_owner_attrs(self) -> None:
        project = self.make_project(
            [
                {
                    "element_id": "steam-one",
                    "kind": "path",
                    "importance": "decorative_optional",
                    "bbox": {"x": 80, "y": 320, "width": 300, "height": 90},
                    "style": {"d": "M80 360 C160 300 240 420 380 330", "stroke": "#2563eb"},
                    "data-svglide-role": "decorative_motif",
                    "data-svglide-motif-owner": "pin-and-paper",
                    "data-svglide-motif-id": "steam-ribbon",
                    "data-svglide-origin-template": "pin-and-paper",
                }
            ]
        )

        svglide_contract_compile.compile_project(project)

        svg = (project / "04-svg" / "page-001.svg").read_text(encoding="utf-8")
        self.assertIn('data-svglide-role="decorative_motif"', svg)
        self.assertIn('data-svglide-motif-owner="pin-and-paper"', svg)
        self.assertIn('data-svglide-motif-id="steam-ribbon"', svg)
        self.assertIn('data-svglide-origin-template="pin-and-paper"', svg)

    def test_compile_raw_image_to_image_role(self) -> None:
        project = self.make_project(
            [
                {
                    "element_id": "hero",
                    "kind": "image",
                    "importance": "semantic_required",
                    "href": "@./assets/hero.png",
                    "bbox": {"x": 560, "y": 96, "width": 320, "height": 220},
                }
            ]
        )

        svglide_contract_compile.compile_project(project)

        svg = (project / "04-svg" / "page-001.svg").read_text(encoding="utf-8")
        self.assertIn('slide:role="image"', svg)
        self.assertIn('href="@./assets/hero.png"', svg)

    def test_compile_injects_assets_and_refreshes_contract_hashes(self) -> None:
        project = self.make_project(
            [
                {
                    "element_id": "background",
                    "kind": "rect",
                    "importance": "visual_required",
                    "bbox": {"x": 0, "y": 0, "width": 960, "height": 540},
                    "style": {"fill": "#07110E"},
                },
                {
                    "element_id": "title",
                    "kind": "text",
                    "importance": "semantic_required",
                    "text": "Asset backed cover",
                    "bbox": {"x": 80, "y": 80, "width": 560, "height": 80},
                },
            ]
        )
        raw_asset = project / "03-assets" / "raw" / "hero.png"
        raw_asset.parent.mkdir(parents=True, exist_ok=True)
        raw_asset.write_bytes(b"fake-png")
        (project / "03-assets" / "asset-manifest.json").write_text(
            json.dumps(
                {
                    "version": "svglide-assets/v1",
                    "status": "passed",
                    "acquired_assets": [
                        {
                            "asset_id": "hero",
                            "page": 1,
                            "placement_role": "cover",
                            "asset_kind": "user_file",
                            "status": "local_file",
                            "file": "03-assets/raw/hero.png",
                            "safe_text_zones": [{"x": 0.05, "y": 0.12, "w": 0.42, "h": 0.72}],
                        }
                    ],
                }
            ),
            encoding="utf-8",
        )

        result = svglide_contract_compile.compile_project(project)

        svg_path = project / "04-svg" / "page-001.svg"
        current_hash = svglide_contract_compile.file_sha256(svg_path)
        report = json.loads((project / "04-svg" / "contract" / "page-001.report.json").read_text(encoding="utf-8"))
        receipt = json.loads((project / "receipts" / "contract_compile.json").read_text(encoding="utf-8"))
        svg = svg_path.read_text(encoding="utf-8")
        self.assertIn('data-svglide-asset-id="hero"', svg)
        self.assertEqual(result["pages"][0]["output_sha256"], current_hash)
        self.assertEqual(report["output_sha256"], current_hash)
        self.assertEqual(receipt["pages"][0]["output_sha256"], current_hash)
        self.assertEqual(receipt["asset_injection_summary"]["used_count"], 1)

    def test_raw_unsupported_visible_node_blocks_with_report(self) -> None:
        project = self.make_project(
            [],
            visual_svg=(
                '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">'
                '<rect x="0" y="0" width="960" height="540" fill="#fff"/>'
                '<foreignObject id="unsupported-html" x="20" y="20" width="120" height="60">'
                '<div xmlns="http://www.w3.org/1999/xhtml">unsafe html</div>'
                '</foreignObject>'
                "</svg>"
            ),
        )

        result = svglide_contract_compile.compile_project(project)

        report = json.loads((project / "04-svg" / "contract" / "page-001.report.json").read_text(encoding="utf-8"))
        self.assertEqual(result["status"], "failed")
        self.assertEqual(report["blocking_issues"][0]["element_id"], "unsupported-html")
        self.assertIn("lowering allowlist", report["blocking_issues"][0]["reason"])

    def test_semantic_content_cards_do_not_drive_visual_repaint(self) -> None:
        project = self.make_project(
            [
                {
                    "element_id": "content-card-1",
                    "kind": "content-card",
                    "importance": "semantic_required",
                    "text": "Generic content-card text must not be rendered",
                    "bbox": {"x": 80, "y": 80, "width": 640, "height": 120},
                }
            ],
            visual_svg=(
                '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">'
                '<rect x="0" y="0" width="960" height="540" fill="#fff"/>'
                '<text id="hero-title" x="80" y="120" width="700" height="90" font-family="Source Sans Pro" font-size="72" '
                'font-weight="900" letter-spacing="1.4" fill="#111111">BOLD POSTER</text>'
                "</svg>"
            ),
        )

        result = svglide_contract_compile.compile_project(project)

        svg = (project / "04-svg" / "page-001.svg").read_text(encoding="utf-8")
        self.assertEqual(result["status"], "passed")
        self.assertIn("BOLD POSTER", svg)
        self.assertNotIn("content-card", svg)
        self.assertNotIn("content-panel", svg)

    def test_contract_manifest_hashes_match_outputs(self) -> None:
        project = self.make_project(
            [{"element_id": "title", "kind": "text", "text": "Hash check", "bbox": {"x": 80, "y": 80, "width": 300, "height": 50}}]
        )

        svglide_contract_compile.compile_project(project)

        manifest = json.loads((project / "04-svg" / "contract" / "manifest.json").read_text(encoding="utf-8"))
        page = manifest["pages"][0]
        self.assertEqual(page["output_sha256"], svglide_contract_compile.file_sha256(project / page["output"]))


if __name__ == "__main__":
    unittest.main()
