# Copyright (c) 2026 Lark Technologies Pte. Ltd.
# SPDX-License-Identifier: MIT
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import svglide_readback


def write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload), encoding="utf-8")


class SVGlideReadbackTest(unittest.TestCase):
    def make_project(self) -> Path:
        root = Path(tempfile.mkdtemp())
        project = root / ".lark-slides" / "plan" / "demo"
        (project / "07-create").mkdir(parents=True)
        return project

    def completed(self, payload: dict[str, object], returncode: int = 0) -> subprocess.CompletedProcess[str]:
        return subprocess.CompletedProcess(["lark-cli"], returncode, stdout=json.dumps(payload), stderr="")

    def test_readback_passes_when_page_count_and_slide_ids_match(self) -> None:
        project = self.make_project()
        write_json(project / "02-plan/slide_plan.json", {"slides": [{"page": 1}, {"page": 2}]})
        write_json(project / "06-check/quality-gate.json", {"status": "passed"})
        write_json(project / "07-create/dry-run.json", {"status": "passed"})
        write_json(project / "07-create/ppe-proof.json", {"status": "passed"})
        write_json(project / "07-create/live-create.json", {"xml_presentation_id": "xml_1", "revision_id": "rev_1", "slide_ids": ["s1", "s2"]})

        result = svglide_readback.run_readback(
            project,
            command_runner=lambda *args, **kwargs: self.completed({"data": {"slides": [{"id": "s1"}, {"id": "s2"}]}}),
        )

        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["checks"]["page_count"]["status"], "passed")
        self.assertEqual(result["checks"]["asset_tokens"]["status"], "skipped")
        self.assertEqual(result["input_binding"]["revision_id"], "rev_1")
        self.assertEqual(result["input_binding"]["expected_slide_count"], 2)
        self.assertEqual(result["input_binding"]["created_slide_count"], 2)
        self.assertIsNotNone(result["input_binding"]["plan_sha256"])
        self.assertIsNotNone(result["input_binding"]["quality_gate_sha256"])
        self.assertIsNotNone(result["input_binding"]["dry_run_sha256"])
        self.assertIsNotNone(result["input_binding"]["ppe_proof_sha256"])
        self.assertIsNotNone(result["input_binding"]["live_create_sha256"])
        self.assertTrue((project / "08-readback/readback-check.json").exists())

    def test_readback_records_live_create_request_headers_but_does_not_replay_them(self) -> None:
        project = self.make_project()
        write_json(project / "02-plan/slide_plan.json", {"slides": [{"page": 1}]})
        write_json(
            project / "07-create/live-create.json",
            {
                "json": {
                    "data": {
                        "xml_presentation_id": "xml_1",
                        "revision_id": 2,
                        "slide_ids": ["s1"],
                        "request_headers": {
                            "Env": "Pre_release",
                            "x-tt-env": "ppe_pure_svg",
                            "x-use-ppe": "1",
                        },
                    }
                }
            },
        )
        commands: list[list[str]] = []

        def fake_runner(command: list[str], **_: object) -> subprocess.CompletedProcess[str]:
            commands.append(command)
            return self.completed({"data": {"xml_presentation": {"content": '<presentation><slide id="s1"></slide></presentation>'}}})

        result = svglide_readback.run_readback(project, command_runner=fake_runner)

        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["input_binding"]["revision_id"], 2)
        self.assertEqual(commands[0][:4], ["lark-cli", "api", "GET", "/open-apis/slides_ai/v1/xml_presentations/xml_1"])
        self.assertNotIn("--request-header", commands[0])
        raw = json.loads((project / "08-readback/xml-presentations-get.json").read_text(encoding="utf-8"))
        self.assertEqual(
            raw["request_headers"],
            {"Env": "Pre_release", "x-tt-env": "ppe_pure_svg", "x-use-ppe": "1"},
        )

    def test_readback_avoids_ppe_headers_that_trigger_openapi_3350005(self) -> None:
        project = self.make_project()
        write_json(project / "02-plan/slide_plan.json", {"slides": [{"page": 1}]})
        write_json(
            project / "07-create/live-create.json",
            {
                "json": {
                    "data": {
                        "xml_presentation_id": "xml_1",
                        "revision_id": 2,
                        "slide_ids": ["s1"],
                        "request_headers": {
                            "Env": "Pre_release",
                            "x-tt-env": "ppe_pure_svg",
                            "x-use-ppe": "1",
                        },
                    }
                }
            },
        )

        def fake_runner(command: list[str], **_: object) -> subprocess.CompletedProcess[str]:
            if "--request-header" in command:
                return self.completed({"code": 3350005, "msg": "server internal error"}, returncode=1)
            return self.completed({"data": {"xml_presentation": {"content": '<presentation><slide id="s1"></slide></presentation>'}}})

        result = svglide_readback.run_readback(project, command_runner=fake_runner)

        self.assertEqual(result["status"], "passed")
        raw = json.loads((project / "08-readback/xml-presentations-get.json").read_text(encoding="utf-8"))
        self.assertNotIn("--request-header", raw["command"])

    def test_readback_rejects_unsupported_request_header(self) -> None:
        project = self.make_project()
        write_json(project / "02-plan/slide_plan.json", {"slides": [{"page": 1}]})
        write_json(
            project / "07-create/live-create.json",
            {
                "xml_presentation_id": "xml_1",
                "slide_ids": ["s1"],
                "request_headers": {"authorization": "secret"},
            },
        )

        result = svglide_readback.run_readback(project, command_runner=lambda *args, **kwargs: self.completed({}))

        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["checks"]["readback_command"]["status"], "failed")
        self.assertIn("supports only Env=Pre_release", result["checks"]["readback_command"]["reason"])

    def test_readback_counts_xml_content_and_checks_order_and_core_text(self) -> None:
        project = self.make_project()
        write_json(
            project / "02-plan/slide_plan.json",
            {
                "slides": [
                    {"page": 1, "title": "第一页标题", "canvas_spec": {"content": {"title": "第一页标题"}}},
                    {"page": 2, "title": "第二页标题", "canvas_spec": {"content": {"title": "第二页标题", "subtitle": "第二页副标题"}}},
                ]
            },
        )
        write_json(project / "07-create/live-create.json", {"xml_presentation_id": "xml_1", "slide_ids": ["s1", "s2"]})

        result = svglide_readback.run_readback(
            project,
            command_runner=lambda *args, **kwargs: self.completed(
                {
                    "data": {
                        "xml_presentation": {
                            "content": '<presentation><slide id="s1"><shape><content>第一页标题</content></shape></slide><slide id="s2"><shape><content>第二页标题 第二页副标题</content></shape></slide></presentation>'
                        }
                    }
                }
            ),
        )

        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["checks"]["page_count"]["status"], "passed")
        self.assertEqual(result["checks"]["slide_order"]["status"], "passed")
        self.assertEqual(result["checks"]["core_visible_text"]["status"], "passed")

    def test_readback_accepts_text_split_across_service_shapes(self) -> None:
        project = self.make_project()
        write_json(
            project / "02-plan/slide_plan.json",
            {
                "slides": [
                    {"page": 1, "canvas_spec": {"content": {"title": "悉尼大学\n学术地标", "subtitle": "从 1850 年创校"}}}
                ],
                "business_claims": [{"claim": "悉尼大学创立于 1850 年，是澳大利亚第一所大学"}],
            },
        )
        write_json(project / "07-create/live-create.json", {"xml_presentation_id": "xml_1", "slide_ids": ["s1"]})

        result = svglide_readback.run_readback(
            project,
            command_runner=lambda *args, **kwargs: self.completed(
                {
                    "data": {
                        "xml_presentation": {
                            "content": (
                                '<presentation><slide id="s1">'
                                '<shape type="text"><content><p><span>悉</span></p></content></shape>'
                                '<shape type="text"><content><p><span>尼</span></p></content></shape>'
                                '<shape type="text"><content><p><span>大</span></p></content></shape>'
                                '<shape type="text"><content><p><span>学</span></p></content></shape>'
                                '<shape type="text"><content><p><span>学</span></p></content></shape>'
                                '<shape type="text"><content><p><span>术</span></p></content></shape>'
                                '<shape type="text"><content><p><span>地</span></p></content></shape>'
                                '<shape type="text"><content><p><span>标</span></p></content></shape>'
                                '<shape type="text"><content><p><span>从</span><span>1850</span><span>年</span><span>创校</span></p></content></shape>'
                                '<shape type="text"><content><p><span>澳大利亚</span><span>第一所大学</span></p></content></shape>'
                                "</slide></presentation>"
                            )
                        }
                    }
                }
            ),
        )

        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["checks"]["business_claims"]["status"], "passed")
        self.assertEqual(result["checks"]["core_visible_text"]["status"], "passed")
        self.assertEqual(result["readback_text_stats"]["text_shape_count"], 10)
        self.assertEqual(result["readback_text_stats"]["single_char_text_shape_count"], 8)

    def test_readback_records_online_text_fragment_and_role_font_stats(self) -> None:
        project = self.make_project()
        write_json(project / "02-plan/slide_plan.json", {"slides": [{"page": 1}]})
        write_json(project / "07-create/live-create.json", {"xml_presentation_id": "xml_1", "slide_ids": ["s1"]})

        result = svglide_readback.run_readback(
            project,
            command_runner=lambda *args, **kwargs: self.completed(
                {
                    "data": {
                        "xml_presentation": {
                            "content": (
                                '<presentation><slide id="s1">'
                                '<shape type="text"><content fontFamily="svglideboldposterbody">暗</content></shape>'
                                '<shape type="text"><content fontFamily="svglideboldposterbody">黑</content></shape>'
                                '<shape type="text"><content fontFamily="思源黑体">Diablo II</content></shape>'
                                "</slide></presentation>"
                            )
                        }
                    }
                }
            ),
        )

        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["readback_text_stats"]["text_shape_count"], 3)
        self.assertEqual(result["readback_text_stats"]["single_char_text_shape_count"], 2)
        self.assertEqual(result["readback_text_stats"]["role_font_family_count"], 2)

    def test_readback_core_text_uses_submitted_svg_not_unrendered_plan_metadata(self) -> None:
        project = self.make_project()
        write_json(
            project / "02-plan/slide_plan.json",
            {
                "slides": [
                    {
                        "page": 1,
                        "canvas_spec": {
                            "content": {
                                "title": "真正提交的标题",
                                "meta_note": "未渲染的内部备注",
                            }
                        },
                    }
                ]
            },
        )
        (project / "04-svg/prepared").mkdir(parents=True, exist_ok=True)
        (project / "04-svg/prepared/page-001.svg").write_text(
            '<svg><text x="0" y="20">真正提交的标题</text></svg>',
            encoding="utf-8",
        )
        write_json(project / "07-create/live-create.json", {"xml_presentation_id": "xml_1", "slide_ids": ["s1"]})

        result = svglide_readback.run_readback(
            project,
            command_runner=lambda *args, **kwargs: self.completed(
                {"data": {"xml_presentation": {"content": '<presentation><slide id="s1"><shape><content>真正提交的标题</content></shape></slide></presentation>'}}}
            ),
        )

        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["checks"]["core_visible_text"]["status"], "passed")

    def test_readback_fails_on_xml_slide_order_mismatch(self) -> None:
        project = self.make_project()
        write_json(project / "02-plan/slide_plan.json", {"slides": [{"page": 1}, {"page": 2}]})
        write_json(project / "07-create/live-create.json", {"xml_presentation_id": "xml_1", "slide_ids": ["s1", "s2"]})

        result = svglide_readback.run_readback(
            project,
            command_runner=lambda *args, **kwargs: self.completed(
                {"data": {"xml_presentation": {"content": '<presentation><slide id="s2"></slide><slide id="s1"></slide></presentation>'}}}
            ),
        )

        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["checks"]["slide_order"]["status"], "failed")

    def test_readback_fails_without_presentation_id(self) -> None:
        project = self.make_project()
        write_json(project / "07-create/live-create.json", {"slide_ids": ["s1"]})

        result = svglide_readback.run_readback(project)

        self.assertEqual(result["status"], "failed")
        self.assertIn("presentation_id", result["failed_checks"])

    def test_readback_fails_on_page_count_mismatch(self) -> None:
        project = self.make_project()
        write_json(project / "02-plan/slide_plan.json", {"svg_files": [{"page": 1}, {"page": 2}]})
        write_json(project / "07-create/live-create.json", {"xml_presentation_id": "xml_1", "slide_ids": ["s1", "s2"]})

        result = svglide_readback.run_readback(
            project,
            command_runner=lambda *args, **kwargs: self.completed({"data": {"slides": [{"id": "s1"}]}}),
        )

        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["checks"]["page_count"]["status"], "failed")

    def test_readback_checks_expected_asset_tokens(self) -> None:
        project = self.make_project()
        write_json(project / "02-plan/slide_plan.json", {"slides": [{"page": 1}]})
        write_json(project / "03-assets/assets.json", {"@./hero.png": "boxcn_hero"})
        write_json(project / "07-create/live-create.json", {"xml_presentation_id": "xml_1", "slide_ids": ["s1"]})

        result = svglide_readback.run_readback(
            project,
            command_runner=lambda *args, **kwargs: self.completed({"data": {"slides": [{"id": "s1", "image": "boxcn_hero"}]}}),
        )

        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["checks"]["asset_tokens"]["status"], "passed")

    def test_readback_checks_expected_image_assets(self) -> None:
        project = self.make_project()
        write_json(project / "02-plan/slide_plan.json", {"slides": [{"page": 1}]})
        write_json(project / "07-create/live-create.json", {"xml_presentation_id": "xml_1", "slide_ids": ["s1"]})
        (project / "04-svg/prepared").mkdir(parents=True, exist_ok=True)
        (project / "04-svg/prepared/page-001.svg").write_text(
            '<svg><image slide:role="image" href="@./hero.png" /></svg>',
            encoding="utf-8",
        )

        result = svglide_readback.run_readback(
            project,
            command_runner=lambda *args, **kwargs: self.completed(
                {"data": {"xml_presentation": {"content": '<presentation><slide id="s1"><image src="boxcn_hero"/></slide></presentation>'}}}
            ),
        )

        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["checks"]["image_assets"]["status"], "passed")

    def test_readback_fails_when_expected_image_asset_is_missing(self) -> None:
        project = self.make_project()
        write_json(project / "02-plan/slide_plan.json", {"slides": [{"page": 1}]})
        write_json(project / "07-create/live-create.json", {"xml_presentation_id": "xml_1", "slide_ids": ["s1"]})
        (project / "04-svg/prepared").mkdir(parents=True, exist_ok=True)
        (project / "04-svg/prepared/page-001.svg").write_text(
            '<svg><image slide:role="image" href="@./hero.png" /></svg>',
            encoding="utf-8",
        )

        result = svglide_readback.run_readback(
            project,
            command_runner=lambda *args, **kwargs: self.completed({"data": {"slides": [{"id": "s1", "text": "no media"}]}}),
        )

        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["checks"]["image_assets"]["status"], "failed")

    def test_readback_fails_when_business_claim_is_missing(self) -> None:
        project = self.make_project()
        write_json(project / "02-plan/slide_plan.json", {"slides": [{"page": 1}], "business_claims": [{"fragment": "Revenue 130.5B"}]})
        write_json(project / "07-create/live-create.json", {"xml_presentation_id": "xml_1", "slide_ids": ["s1"]})

        result = svglide_readback.run_readback(
            project,
            command_runner=lambda *args, **kwargs: self.completed({"data": {"slides": [{"id": "s1", "text": "Revenue"}]}}),
        )

        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["checks"]["business_claims"]["status"], "failed")

    def test_readback_business_claims_ignore_unsubmitted_plan_metadata_when_prepared_svg_exists(self) -> None:
        project = self.make_project()
        write_json(
            project / "02-plan/slide_plan.json",
            {
                "slides": [{"page": 1}],
                "business_claims": [
                    {"fragment": "Revenue 130.5B"},
                    {"fragment": "Unrendered forecast should stay metadata only"},
                ],
            },
        )
        write_json(project / "07-create/live-create.json", {"xml_presentation_id": "xml_1", "slide_ids": ["s1"]})
        (project / "04-svg/prepared").mkdir(parents=True, exist_ok=True)
        (project / "04-svg/prepared/page-001.svg").write_text(
            '<svg><text slide:role="text">Revenue 130.5B</text></svg>',
            encoding="utf-8",
        )

        result = svglide_readback.run_readback(
            project,
            command_runner=lambda *args, **kwargs: self.completed({"data": {"slides": [{"id": "s1", "text": "Revenue 130.5B"}]}}),
        )

        self.assertEqual(result["status"], "passed")
        self.assertEqual(result["checks"]["business_claims"]["status"], "passed")
        self.assertEqual(result["checks"]["business_claims"]["missing"], [])

    def test_readback_fails_when_text_overflow_marker_is_present(self) -> None:
        project = self.make_project()
        write_json(project / "02-plan/slide_plan.json", {"slides": [{"page": 1}]})
        write_json(project / "07-create/live-create.json", {"xml_presentation_id": "xml_1", "slide_ids": ["s1"]})

        result = svglide_readback.run_readback(
            project,
            command_runner=lambda *args, **kwargs: self.completed({"data": {"slides": [{"id": "s1", "text_overflow": True}]}}),
        )

        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["checks"]["text_fit"]["status"], "failed")

    def test_readback_fails_when_expected_chart_marker_is_missing(self) -> None:
        project = self.make_project()
        write_json(project / "02-plan/slide_plan.json", {"slides": [{"page": 1}]})
        write_json(project / "07-create/live-create.json", {"xml_presentation_id": "xml_1", "slide_ids": ["s1"]})
        (project / "04-svg/prepared").mkdir(parents=True, exist_ok=True)
        (project / "04-svg/prepared/page-001.svg").write_text('<svg><g slide:role="chart"></g></svg>', encoding="utf-8")

        result = svglide_readback.run_readback(
            project,
            command_runner=lambda *args, **kwargs: self.completed({"data": {"slides": [{"id": "s1"}]}}),
        )

        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["checks"]["chart_markers"]["status"], "failed")


if __name__ == "__main__":
    unittest.main()
