# Copyright (c) 2026 Lark Technologies Pte. Ltd.
# SPDX-License-Identifier: MIT
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import svglide_prepare


MINIMAL_PNG = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xf8\xcf\xc0\xf0\x1f\x00\x05\x00\x01\xff\x89\x99=\x1d\x00\x00\x00\x00IEND\xaeB`\x82"


SIMPLE_SVG = """
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:slide="https://slides.bytedance.com/ns"
     slide:role="slide"
     slide:contract-version="svglide-authoring-contract/v1"
     width="960" height="540" viewBox="0 0 960 540">
  <rect slide:role="shape" x="0" y="0" width="960" height="540" fill="#fff" />
</svg>
"""

TEXT_STYLE_SVG = """
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:slide="https://slides.bytedance.com/ns"
     slide:role="slide"
     slide:contract-version="svglide-authoring-contract/v1"
     width="960" height="540" viewBox="0 0 960 540">
  <foreignObject slide:role="shape" slide:shape-type="text" slide:id="title" x="80" y="96" width="640" height="72">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-size:48px;font-weight:800;line-height:1.08;color:#123456">SVGlide</div>
  </foreignObject>
</svg>
"""

NATIVE_TEXT_STYLE_SVG = """
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:slide="https://slides.bytedance.com/ns"
     slide:role="slide"
     slide:contract-version="svglide-authoring-contract/v1"
     width="960" height="540" viewBox="0 0 960 540">
  <metadata id="svglide-text-style-manifest" type="application/json">{"version":"stale","items":{}}</metadata>
  <text id="title" data-node-id="title" slide:role="text" data-source-ref="canvas_spec.content.title"
        transform="matrix(1.00,-0.07,0.07,1.00,-14.40,29.70)"
        x="80" y="96" width="520" height="68" font-family="svglideboldposterdisplay"
        font-size="48" font-weight="900" line-height="1.08" letter-spacing="-1"
        fill="#123456" clip-path="url(#clip)">SVGlide</text>
  <path id="outline" slide:role="shape" d="M60,120 A0,0 0 0 1 60,120 h300 a0,0 0 0 1 0,0 v120" fill="none" stroke="#123456" />
</svg>
"""


class SVGlidePrepareTest(unittest.TestCase):
    def make_project(self) -> Path:
        root = Path(tempfile.mkdtemp())
        project = root / ".lark-slides" / "plan" / "demo"
        (project / "04-svg").mkdir(parents=True)
        (project / "03-assets").mkdir(parents=True)
        return project

    def write_artboard_generator_receipt(self, project: Path) -> None:
        (project / "receipts").mkdir(parents=True, exist_ok=True)
        (project / "receipts" / "generate_svg.json").write_text(
            json.dumps({"stage": "generate_svg", "status": "passed", "generation_mode": "artboard_satori"}),
            encoding="utf-8",
        )

    def write_contract_manifest(self, project: Path) -> dict[str, object]:
        output = project / "04-svg" / "page-001.svg"
        digest = svglide_prepare.file_sha256(output)
        report = {
            "version": "svglide-contract-compile/v1",
            "source": "04-artboard/raw/page-001.visual.svg",
            "semantic_map": "04-artboard/raw/page-001.semantic-map.json",
            "output": "04-svg/page-001.svg",
            "status": "passed",
            "summary": {},
            "compiled": [],
            "degraded": [],
            "rasterized": [],
            "dropped": [],
            "blocking_issues": [],
            "input_sha256": "raw-hash",
            "semantic_map_sha256": "semantic-hash",
            "output_sha256": digest,
        }
        (project / "04-svg" / "contract").mkdir(parents=True, exist_ok=True)
        (project / "04-svg" / "contract" / "page-001.report.json").write_text(json.dumps(report), encoding="utf-8")
        manifest: dict[str, object] = {
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
                    "input_sha256": "raw-hash",
                    "semantic_map_sha256": "semantic-hash",
                    "output_sha256": digest,
                }
            ],
            "summary": {"pages": 1, "blocking_issues": 0, "degraded_elements": 0, "rasterized_regions": 0, "dropped_decorations": 0},
        }
        (project / "04-svg" / "contract" / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
        raw_dir = project / "04-artboard" / "raw"
        raw_dir.mkdir(parents=True, exist_ok=True)
        (raw_dir / "page-001.visual.png").write_bytes(MINIMAL_PNG)
        return manifest

    def write_render_metadata(self, project: Path) -> None:
        raw_dir = project / "04-artboard" / "raw"
        raw_dir.mkdir(parents=True, exist_ok=True)
        (raw_dir / "page-001.render-metadata.json").write_text(
            json.dumps(
                {
                    "font_roles": {
                        "display": {"family": "Source Sans Pro", "source": "theme.typography.font_roles"},
                        "body": {"family": "Source Sans Pro", "source": "theme.typography.font_roles"},
                        "label": {"family": "Source Sans Pro", "source": "theme.typography.font_roles"},
                        "metric": {"family": "Source Sans Pro", "source": "theme.typography.font_roles"},
                    },
                    "typography_roles": {
                        "display": {"font_size": 48, "font_weight": 800, "line_height": 1.08, "letter_spacing": -0.2},
                        "body": {"font_size": 20, "font_weight": 400, "line_height": 1.35, "letter_spacing": 0},
                        "label": {"font_size": 12, "font_weight": 700, "line_height": 1.1, "letter_spacing": 1.2},
                        "metric": {"font_size": 40, "font_weight": 700, "line_height": 1.0, "letter_spacing": 0},
                    },
                    "text_style_roles": {
                        "display": {
                            "text_transform_policy": "none",
                            "text_decoration_policy": {"underline": {"line": "none"}, "line_through": {"line": "none"}},
                        }
                    },
                }
            ),
            encoding="utf-8",
        )

    def test_prepare_copies_source_to_prepared_and_writes_receipt(self) -> None:
        project = self.make_project()
        (project / "04-svg" / "page-001.svg").write_text(SIMPLE_SVG, encoding="utf-8")

        receipt = svglide_prepare.prepare_project(project)

        prepared = project / "04-svg" / "prepared" / "page-001.svg"
        self.assertTrue(prepared.exists())
        self.assertEqual(receipt["status"], "passed")
        self.assertEqual(receipt["source_files"], ["04-svg/page-001.svg"])
        self.assertEqual(receipt["prepared_files"][0]["prepared"], "04-svg/prepared/page-001.svg")
        self.assertIsNone(receipt["contract_manifest"])
        self.assertTrue((project / "receipts" / "prepare.json").exists())

    def test_prepare_requires_contract_manifest_for_artboard_satori(self) -> None:
        project = self.make_project()
        self.write_artboard_generator_receipt(project)
        (project / "04-svg" / "page-001.svg").write_text(SIMPLE_SVG, encoding="utf-8")

        with self.assertRaisesRegex(svglide_prepare.PrepareError, "missing contract manifest"):
            svglide_prepare.prepare_project(project)

    def test_prepare_records_contract_manifest_when_current(self) -> None:
        project = self.make_project()
        self.write_artboard_generator_receipt(project)
        (project / "04-svg" / "page-001.svg").write_text(SIMPLE_SVG, encoding="utf-8")
        self.write_contract_manifest(project)

        receipt = svglide_prepare.prepare_project(project)

        self.assertEqual(receipt["contract_manifest"]["path"], "04-svg/contract/manifest.json")
        self.assertEqual(receipt["contract_manifest"]["status"], "passed")
        self.assertEqual(receipt["contract_manifest"]["pages"][0]["output"], "04-svg/page-001.svg")

    def test_prepare_records_text_style_manifest_and_writes_editable_protocol_svg_for_artboard_satori(self) -> None:
        project = self.make_project()
        self.write_artboard_generator_receipt(project)
        (project / "04-svg" / "page-001.svg").write_text(TEXT_STYLE_SVG, encoding="utf-8")
        self.write_contract_manifest(project)
        self.write_render_metadata(project)

        receipt = svglide_prepare.prepare_project(project)

        prepared = (project / "04-svg" / "prepared" / "page-001.svg").read_text(encoding="utf-8")
        self.assertNotIn('<image id="page-001-full-page-raster"', prepared)
        self.assertIn('id="svglide-text-style-manifest"', prepared)
        self.assertIn("<foreignObject", prepared)
        self.assertEqual(receipt["text_style_manifest"]["item_count"], 1)
        self.assertEqual(receipt["text_style_manifest"]["bound_count"], 1)
        self.assertEqual(receipt["text_style_manifest"]["loss_count"], 0)
        self.assertEqual(receipt["submission_compatibility"]["mode"], "editable_protocol_svg")
        self.assertEqual(receipt["submission_compatibility"]["rasterized_page_count"], 0)
        self.assertEqual(receipt["submission_compatibility"]["full_page_raster_count"], 0)
        self.assertEqual(receipt["submission_compatibility"]["editable_protocol_node_counts"]["text"], 1)
        self.assertEqual(receipt["submission_compatibility"]["editable_protocol_node_counts"]["shape"], 1)
        self.assertEqual(receipt["prepared_files"][0]["protocol_node_counts"]["text"], 1)

    def test_prepare_preserves_native_slide_text_for_artboard_satori(self) -> None:
        project = self.make_project()
        self.write_artboard_generator_receipt(project)
        (project / "04-svg" / "page-001.svg").write_text(NATIVE_TEXT_STYLE_SVG, encoding="utf-8")
        self.write_contract_manifest(project)
        self.write_render_metadata(project)

        receipt = svglide_prepare.prepare_project(project)

        prepared = (project / "04-svg" / "prepared" / "page-001.svg").read_text(encoding="utf-8")
        self.assertNotIn('<image id="page-001-full-page-raster"', prepared)
        self.assertIn('<text id="title"', prepared)
        self.assertIn('slide:role="text"', prepared)
        self.assertIn('id="svglide-text-style-manifest"', prepared)
        self.assertNotIn("<foreignObject", prepared)
        self.assertNotIn('data-svglide-compat-source="native-text"', prepared)
        self.assertNotIn("A0,0", prepared)
        self.assertNotIn("a0,0", prepared)
        self.assertEqual(receipt["text_style_manifest"]["deduped_count"], 1)
        self.assertEqual(receipt["text_compatibility"]["mode"], "editable_protocol_svg")
        self.assertEqual(receipt["text_compatibility"]["native_text_nodes_lowered"], 0)
        self.assertEqual(receipt["text_compatibility"]["loss_count"], 0)
        self.assertEqual(receipt["submission_compatibility"]["rasterized_page_count"], 0)
        self.assertEqual(receipt["submission_compatibility"]["full_page_raster_count"], 0)
        self.assertEqual(receipt["submission_compatibility"]["editable_protocol_node_counts"]["text"], 1)
        self.assertEqual(receipt["submission_compatibility"]["editable_protocol_node_counts"]["shape"], 1)

    def test_prepare_preserves_compensated_native_text_width_metadata(self) -> None:
        project = self.make_project()
        self.write_artboard_generator_receipt(project)
        svg = NATIVE_TEXT_STYLE_SVG.replace(
            'width="520" height="68"',
            'width="64" height="68" data-svglide-source-width="35" data-svglide-compiled-width="64" '
            'data-svglide-width-expansion-ratio="1.8286" '
            'data-svglide-width-expansion-reason="role_font_mapping,short_ascii_label,letter_spacing" '
            'data-svglide-width-compensation="slide-font-safe-width/v1" '
            'data-svglide-nowrap-risk="true" data-svglide-letter-spacing-accounted="true"',
        )
        (project / "04-svg" / "page-001.svg").write_text(svg, encoding="utf-8")
        self.write_contract_manifest(project)
        self.write_render_metadata(project)

        svglide_prepare.prepare_project(project)

        prepared = (project / "04-svg" / "prepared" / "page-001.svg").read_text(encoding="utf-8")
        self.assertIn('width="64"', prepared)
        self.assertIn('data-svglide-source-width="35"', prepared)
        self.assertIn('data-svglide-width-compensation="slide-font-safe-width/v1"', prepared)
        self.assertIn('data-svglide-nowrap-risk="true"', prepared)

    def test_prepare_records_local_raster_island_stats(self) -> None:
        project = self.make_project()
        self.write_artboard_generator_receipt(project)
        raster = project / "04-svg" / "rasterized" / "page-001" / "island-001.png"
        raster.parent.mkdir(parents=True)
        raster.write_bytes(MINIMAL_PNG)
        svg = NATIVE_TEXT_STYLE_SVG.replace(
            "</svg>",
            '<image slide:role="image" data-svglide-raster-island="true" data-svglide-raster-reason="unsupported-filter" '
            'href="@./04-svg/rasterized/page-001/island-001.png" x="120" y="220" width="180" height="80" /></svg>',
        )
        (project / "04-svg" / "page-001.svg").write_text(svg, encoding="utf-8")
        self.write_contract_manifest(project)
        self.write_render_metadata(project)

        receipt = svglide_prepare.prepare_project(project)

        self.assertEqual(receipt["submission_compatibility"]["mode"], "editable_protocol_svg")
        self.assertEqual(receipt["submission_compatibility"]["full_page_raster_count"], 0)
        self.assertEqual(receipt["submission_compatibility"]["local_raster_island_count"], 1)
        self.assertGreater(receipt["submission_compatibility"]["local_raster_area_ratio"], 0)
        self.assertEqual(receipt["prepared_files"][0]["protocol_node_counts"]["local_raster_island"], 1)

    def test_prepare_full_page_raster_requires_explicit_visual_fallback(self) -> None:
        project = self.make_project()
        self.write_artboard_generator_receipt(project)
        (project / "04-svg" / "page-001.svg").write_text(NATIVE_TEXT_STYLE_SVG, encoding="utf-8")
        self.write_contract_manifest(project)
        self.write_render_metadata(project)

        receipt = svglide_prepare.prepare_project(project, allow_visual_fallback=True)

        prepared = (project / "04-svg" / "prepared" / "page-001.svg").read_text(encoding="utf-8")
        self.assertIn('<image id="page-001-full-page-raster"', prepared)
        self.assertIn('slide:role="image"', prepared)
        self.assertIn('href="@./04-artboard/raw/page-001.visual.png"', prepared)
        self.assertEqual(receipt["submission_compatibility"]["mode"], "full_page_raster_submission")
        self.assertEqual(receipt["submission_compatibility"]["rasterized_page_count"], 1)
        self.assertEqual(receipt["submission_compatibility"]["full_page_raster_count"], 1)
        self.assertEqual(receipt["submission_compatibility"]["files"][0]["raster"], "04-artboard/raw/page-001.visual.png")

    def test_prepare_rejects_stale_contract_manifest_output_hash(self) -> None:
        project = self.make_project()
        self.write_artboard_generator_receipt(project)
        (project / "04-svg" / "page-001.svg").write_text(SIMPLE_SVG, encoding="utf-8")
        self.write_contract_manifest(project)
        (project / "04-svg" / "page-001.svg").write_text(SIMPLE_SVG.replace("#fff", "#000"), encoding="utf-8")

        with self.assertRaisesRegex(svglide_prepare.PrepareError, "output hash is stale"):
            svglide_prepare.prepare_project(project)

    def test_prepare_fails_when_no_source_svg_exists(self) -> None:
        project = self.make_project()

        with self.assertRaisesRegex(svglide_prepare.PrepareError, "no source SVG files"):
            svglide_prepare.prepare_project(project)

    def test_prepare_fails_on_unresolved_local_asset(self) -> None:
        project = self.make_project()
        svg = SIMPLE_SVG.replace(
            "</svg>",
            '<image slide:role="image" href="@./assets/missing.png" x="0" y="0" width="100" height="80" /></svg>',
        )
        (project / "04-svg" / "page-001.svg").write_text(svg, encoding="utf-8")

        with self.assertRaisesRegex(svglide_prepare.PrepareError, "unresolved image placeholder"):
            svglide_prepare.prepare_project(project)

    def test_prepare_accepts_asset_mapping(self) -> None:
        project = self.make_project()
        svg = SIMPLE_SVG.replace(
            "</svg>",
            '<image slide:role="image" href="@./assets/hero.png" x="0" y="0" width="100" height="80" /></svg>',
        )
        (project / "04-svg" / "page-001.svg").write_text(svg, encoding="utf-8")
        (project / "03-assets" / "assets.json").write_text(json.dumps({"@./assets/hero.png": "boxcn_hero"}), encoding="utf-8")

        receipt = svglide_prepare.prepare_project(project)

        self.assertEqual(receipt["asset_refs"][0]["refs"][0]["status"], "mapped")
        self.assertEqual(receipt["asset_refs"][0]["refs"][0]["token"], "boxcn_hero")

    def test_prepare_accepts_existing_local_asset(self) -> None:
        project = self.make_project()
        (project / "assets").mkdir()
        (project / "assets" / "hero.png").write_bytes(b"fake")
        svg = SIMPLE_SVG.replace(
            "</svg>",
            '<image slide:role="image" href="@./assets/hero.png" x="0" y="0" width="100" height="80" /></svg>',
        )
        (project / "04-svg" / "page-001.svg").write_text(svg, encoding="utf-8")

        receipt = svglide_prepare.prepare_project(project)

        self.assertEqual(receipt["asset_refs"][0]["refs"][0]["status"], "local")
        self.assertEqual(receipt["asset_refs"][0]["refs"][0]["path"], "assets/hero.png")

    def test_prepare_accepts_raw_asset_placeholder(self) -> None:
        project = self.make_project()
        (project / "03-assets" / "raw").mkdir(parents=True, exist_ok=True)
        (project / "03-assets" / "raw" / "hero.png").write_bytes(b"fake")
        svg = SIMPLE_SVG.replace(
            "</svg>",
            '<image href="@./03-assets/raw/hero.png" x="0" y="0" width="960" height="540" /></svg>',
        )
        (project / "04-svg" / "page-001.svg").write_text(svg, encoding="utf-8")

        receipt = svglide_prepare.prepare_project(project)

        self.assertEqual(receipt["asset_refs"][0]["refs"][0]["status"], "local")
        self.assertEqual(receipt["asset_refs"][0]["refs"][0]["path"], "03-assets/raw/hero.png")


if __name__ == "__main__":
    unittest.main()
