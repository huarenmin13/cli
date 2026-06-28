from __future__ import annotations

import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import svglide_artboard_renderer as artboard
import beautiful_template_runtime


REFERENCES_DIR = Path(__file__).resolve().parent.parent / "references"
MATRIX_PATH = REFERENCES_DIR / "beautiful-template-executable-matrix.json"

P1_TEMPLATE_IDS = [
    "intelligence-brief",
    "executive-dashboard",
    "trend-grid-report",
    "product-ribbon",
    "brutalist-matrix",
    "architectural-spec",
    "annotated-field-board",
    "serif-stat-editorial",
    "ledger-briefing",
    "poster-stat-punch",
]

DEDICATED_SAMPLE_TEMPLATE_IDS = [
    "executive-dashboard",
    "intelligence-brief",
    "poster-stat-punch",
    "coral-magazine-feature",
    "soft-editorial-feature",
    "tritone-editorial-spread",
    "pixel-orbit-console",
    "biennale-programme-poster",
    "block-frame-grid",
    "editorial-quote-chart",
    "architectural-spec",
    "printed-program",
    "ledger-briefing",
    "capsule-card-system",
    "creative-mode-grid",
    "daisy-workshop-playbook",
    "emerald-editorial-cover",
    "trend-grid-report",
    "product-ribbon",
    "brutalist-matrix",
    "type-mass-poster",
    "serif-stat-editorial",
    "grove-organic-brief",
    "mat-midcentury-board",
    "dense-panel-grid",
    "people-platform-manifesto",
    "annotated-field-board",
    "pink-nocturne-feature",
    "playful-indie-launch",
    "retro-ui-dashboard",
    "retro-zine-spread",
    "sticky-workshop-board",
    "stencil-field-manual",
    "vellum-scholar-brief",
]

BEAUTIFUL_DEDICATED_SAMPLE_CONTRACTS = {
    "executive-dashboard": {
        "module": "executive-dashboard.mjs",
        "source_family": "blue-professional",
        "reference_screenshot": "blue-professional-1.png",
    },
    "intelligence-brief": {
        "module": "intelligence-brief.mjs",
        "source_family": "signal",
        "reference_screenshot": "signal-1.png",
    },
    "poster-stat-punch": {
        "module": "poster-stat-punch.mjs",
        "source_family": "bold-poster",
        "reference_screenshot": "bold-poster-1.png",
    },
    "coral-magazine-feature": {
        "module": "coral-magazine-feature.mjs",
        "source_family": "coral",
        "reference_screenshot": "coral-1.png",
    },
    "soft-editorial-feature": {
        "module": "soft-editorial-feature.mjs",
        "source_family": "soft-editorial",
        "reference_screenshot": "soft-editorial-4.png",
    },
    "tritone-editorial-spread": {
        "module": "tritone-editorial-spread.mjs",
        "source_family": "editorial-tri-tone",
        "reference_screenshot": "editorial-tri-tone-1.png",
    },
    "pixel-orbit-console": {
        "module": "pixel-orbit-console.mjs",
        "source_family": "8-bit-orbit",
        "reference_screenshot": "8-bit-orbit-1.png",
    },
    "biennale-programme-poster": {
        "module": "biennale-programme-poster.mjs",
        "source_family": "biennale-yellow",
        "reference_screenshot": "biennale-yellow-1.png",
    },
    "block-frame-grid": {
        "module": "block-frame-grid.mjs",
        "source_family": "block-frame",
        "reference_screenshot": "block-frame-1.png",
    },
    "editorial-quote-chart": {
        "module": "broadside-editorial-quote.mjs",
        "source_family": "broadside",
        "reference_screenshot": "broadside-1.png",
    },
    "architectural-spec": {
        "module": "cartesian-architectural-spec.mjs",
        "source_family": "cartesian",
        "reference_screenshot": "cartesian-1.png",
    },
    "printed-program": {
        "module": "long-table-printed-program.mjs",
        "source_family": "long-table",
        "reference_screenshot": "long-table-1.png",
    },
    "ledger-briefing": {
        "module": "monochrome-ledger-briefing.mjs",
        "source_family": "monochrome",
        "reference_screenshot": "monochrome-1.png",
    },
    "capsule-card-system": {
        "module": "capsule-card-system.mjs",
        "source_family": "capsule",
        "reference_screenshot": "capsule-1.png",
    },
    "creative-mode-grid": {
        "module": "creative-mode-grid.mjs",
        "source_family": "creative-mode",
        "reference_screenshot": "creative-mode-1.png",
    },
    "daisy-workshop-playbook": {
        "module": "daisy-workshop-playbook.mjs",
        "source_family": "daisy-days",
        "reference_screenshot": "daisy-days-1.png",
    },
    "emerald-editorial-cover": {
        "module": "emerald-editorial-cover.mjs",
        "source_family": "emerald-editorial",
        "reference_screenshot": "emerald-editorial-1.png",
    },
    "trend-grid-report": {
        "module": "trend-grid-report.mjs",
        "source_family": "cobalt-grid",
        "reference_screenshot": "cobalt-grid-1.png",
    },
    "product-ribbon": {
        "module": "product-ribbon.mjs",
        "source_family": "sakura-chroma",
        "reference_screenshot": "sakura-chroma-1.png",
    },
    "brutalist-matrix": {
        "module": "brutalist-matrix.mjs",
        "source_family": "raw-grid",
        "reference_screenshot": "raw-grid-1.png",
    },
    "type-mass-poster": {
        "module": "type-mass-poster.mjs",
        "source_family": "studio",
        "reference_screenshot": "studio-1.png",
    },
    "serif-stat-editorial": {
        "module": "serif-stat-editorial.mjs",
        "source_family": "editorial-forest",
        "reference_screenshot": "editorial-forest-1.png",
    },
    "grove-organic-brief": {
        "module": "grove-organic-brief.mjs",
        "source_family": "grove",
        "reference_screenshot": "grove-1.png",
    },
    "mat-midcentury-board": {
        "module": "mat-midcentury-board.mjs",
        "source_family": "mat",
        "reference_screenshot": "mat-1.png",
    },
    "dense-panel-grid": {
        "module": "dense-panel-grid.mjs",
        "source_family": "neo-grid-bold",
        "reference_screenshot": "neo-grid-bold-1.png",
    },
    "people-platform-manifesto": {
        "module": "people-platform-manifesto.mjs",
        "source_family": "peoples-platform",
        "reference_screenshot": "peoples-platform-1.png",
    },
    "annotated-field-board": {
        "module": "annotated-field-board.mjs",
        "source_family": "pin-and-paper",
        "reference_screenshot": "pin-and-paper-1.png",
    },
    "pink-nocturne-feature": {
        "module": "pink-nocturne-feature.mjs",
        "source_family": "pink-script",
        "reference_screenshot": "pink-script-1.png",
    },
    "playful-indie-launch": {
        "module": "playful-indie-launch.mjs",
        "source_family": "playful",
        "reference_screenshot": "playful-1.png",
    },
    "retro-ui-dashboard": {
        "module": "retro-ui-dashboard.mjs",
        "source_family": "retro-windows",
        "reference_screenshot": "retro-windows-1.png",
    },
    "retro-zine-spread": {
        "module": "retro-zine-spread.mjs",
        "source_family": "retro-zine",
        "reference_screenshot": "retro-zine-1.png",
    },
    "sticky-workshop-board": {
        "module": "sticky-workshop-board.mjs",
        "source_family": "scatterbrain",
        "reference_screenshot": "scatterbrain-1.png",
    },
    "stencil-field-manual": {
        "module": "stencil-field-manual.mjs",
        "source_family": "stencil-tablet",
        "reference_screenshot": "stencil-tablet-1.png",
    },
    "vellum-scholar-brief": {
        "module": "vellum-scholar-brief.mjs",
        "source_family": "vellum",
        "reference_screenshot": "vellum-1.png",
    },
}

LAYOUT_FAMILIES = [
    "briefing",
    "dashboard",
    "timeline",
    "product",
    "matrix",
    "architecture",
    "annotation",
    "editorial",
    "ledger",
    "closing",
]

BLUE_PROFESSIONAL_PAGE_VARIANTS = [
    "cover",
    "agenda",
    "metrics",
    "dashboard",
    "split",
    "bars",
    "quote",
    "timeline",
    "detail",
    "closing",
]

BOLD_POSTER_PAGE_VARIANTS = [
    "hero",
    "red",
    "summary",
    "financial",
    "stat",
    "services",
    "roadmap",
    "pillars",
    "global",
    "close",
]

EIGHT_BIT_ORBIT_PAGE_VARIANTS = [
    "slide-1",
    "slide-2",
    "slide-3",
    "slide-4",
    "slide-5",
    "slide-6",
    "slide-7",
    "slide-8",
    "slide-9",
    "slide-10",
]

BIENNALE_YELLOW_PAGE_VARIANTS = [
    "cover",
    "manifesto",
    "programme",
    "chapter",
    "data",
    "quote",
    "cal",
    "colophon",
]

BLOCK_FRAME_PAGE_VARIANTS = [
    "cover",
    "agenda",
    "data_dashboard",
    "data_dashboard-4",
    "quote_or_emphasis",
    "process_or_timeline",
    "process_or_timeline-7",
    "data_dashboard-8",
    "process_or_timeline-9",
    "closing",
]

CAPSULE_PAGE_VARIANTS = [
    "cover",
    "agenda",
    "data_dashboard",
    "data_dashboard-4",
    "quote_or_emphasis",
    "process_or_timeline",
    "data_dashboard-7",
    "slide-8",
    "slide-9",
    "closing",
]

BROADSIDE_PAGE_VARIANTS = [
    "cover",
    "chapter",
    "statement",
    "split",
    "stats",
    "fadelist",
    "list",
    "quote",
    "compare",
    "chart",
    "diagram",
    "pie",
    "pyramid",
    "vtimeline",
    "cycle",
    "end",
]

CARTESIAN_PAGE_VARIANTS = [
    "title",
    "agenda",
    "statement",
    "barchart",
    "twocol",
    "cards",
    "linechart",
    "timeline",
    "team",
    "closing",
]

COBALT_GRID_PAGE_VARIANTS = [
    "cover",
    "manifesto",
    "index",
    "chapter",
    "data",
    "quote",
    "table",
    "colophon",
]

CORAL_PAGE_VARIANTS = [
    "cover",
    "agenda",
    "detail",
    "data_dashboard",
    "process_or_timeline",
    "data_dashboard-6",
    "quote_or_emphasis",
    "process_or_timeline-8",
    "detail-9",
    "closing",
]

DAISY_DAYS_PAGE_VARIANTS = [
    "title",
    "welcome",
    "weekly",
    "timeline",
    "chart-bar",
    "cards",
    "quote",
    "team",
    "process",
    "donut",
]

EDITORIAL_FOREST_PAGE_VARIANTS = [
    "cover",
    "agenda",
    "statement",
    "two-col",
    "data",
    "framework",
    "stats",
    "summary",
]

EDITORIAL_TRI_TONE_PAGE_VARIANTS = [
    "cover",
    "manifesto",
    "grid",
    "stat",
    "timeline",
    "chart",
    "quote",
    "closer",
]

EMERALD_EDITORIAL_PAGE_VARIANTS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"]

GROVE_PAGE_VARIANTS = [
    "cover",
    "chapter",
    "statement",
    "split",
    "stats",
    "list",
    "quote",
    "compare",
    "chapter-9",
    "statement-10",
    "chart",
    "end",
]

LONG_TABLE_PAGE_VARIANTS = ["cover", "manifesto", "index", "featured", "menu", "quote", "cal", "closing"]

MAT_PAGE_VARIANTS = ["cover", "statement", "split", "stats", "quote", "list", "compare", "chart", "end"]

PEOPLES_PLATFORM_PAGE_VARIANTS = [
    "cover",
    "toc",
    "manifesto",
    "pillars",
    "stat",
    "platform",
    "quote",
    "timeline",
    "compare",
    "close",
]

PINK_SCRIPT_PAGE_VARIANTS = ["cover", "toc", "stats", "section", "chart", "process", "matrix", "quote", "cta"]
PLAYFUL_PAGE_VARIANTS = ["cover", "toc", "statement", "chart", "team", "services", "timeline", "stats", "gallery", "closing"]
SAKURA_CHROMA_PAGE_VARIANTS = ["cover", "manifesto", "catalogue", "stripe", "data", "quote", "cal", "colophon"]
PIN_AND_PAPER_PAGE_VARIANTS = ["cover", "agenda", "notes", "sec", "notice", "chart", "process", "matrix", "stats", "quote", "cta"]
RETRO_ZINE_PAGE_VARIANTS = ["hero", "split", "statement", "grid", "visual", "editorial", "numbers", "collage", "rsvp", "closing"]
STENCIL_TABLET_PAGE_VARIANTS = ["cover", "agenda", "princ", "sec", "consult", "chart", "process", "matrix", "stats", "quote", "cta"]
STUDIO_PAGE_VARIANTS = [
    "cover",
    "chapter",
    "statement",
    "split",
    "stats",
    "list",
    "quote",
    "compare",
    "chapter-9",
    "statement-10",
    "chart",
    "end",
]
VELLUM_PAGE_VARIANTS = ["cover", "statement", "text", "stats", "list", "quote", "compare", "chart", "end"]
SOFT_EDITORIAL_PAGE_VARIANTS = [
    "cover",
    "foreword",
    "method",
    "insights",
    "closer",
    "numbers",
    "quote",
    "next",
    "consult",
    "chart",
    "process",
    "matrix",
]
SIGNAL_PAGE_VARIANTS = [
    "cover",
    "chapter",
    "statement",
    "split",
    "stats",
    "quote",
    "list",
    "compare",
    "editorial",
    "dense",
    "statement-2",
    "end",
    "chart",
    "diagram",
    "pie",
    "pyramid",
    "vtimeline",
    "cycle",
]
SCATTERBRAIN_PAGE_VARIANTS = ["title", "statement", "two-column", "chart", "features", "timeline", "image-text", "diagram", "comparison", "closing"]
RAW_GRID_PAGE_VARIANTS = ["cover", "split", "bars", "cards", "feature", "process", "donut", "quote", "table", "closing"]
RETRO_WINDOWS_PAGE_VARIANTS = ["slide-1", "slide-2", "slide-3", "slide-4", "slide-5", "slide-6", "slide-7", "slide-8", "slide-9", "slide-10"]

CREATIVE_MODE_PAGE_VARIANTS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"]

MONOCHROME_PAGE_VARIANTS = [
    "cover",
    "chapter",
    "statement",
    "split",
    "stats",
    "list",
    "compare",
    "quote",
    "dense",
    "chart",
    "diagram",
    "pie",
    "vtimeline",
    "cycle",
    "end",
    "pyramid",
]

NEO_GRID_BOLD_PAGE_VARIANTS = [
    "cover",
    "toc",
    "stats",
    "features",
    "chart",
    "section",
    "quote",
    "cta",
    "consult",
    "chart2",
    "process2",
    "matrix2",
]

REQUIRED_TYPOGRAPHY_ROLES = {"display", "body", "label", "metric"}
REQUIRED_ROLE_TOKEN_FIELDS = {"font_weight", "line_height", "letter_spacing", "text_transform"}
REQUIRED_TEXT_STYLE_ROLE_FIELDS = {"bold", "italic", "underline", "line_through", "emphasis", "text_decoration_policy"}


def write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload), encoding="utf-8")


def write_legacy_fixture_registries(project: Path) -> None:
    write_json(project / "02-plan/theme-registry.json", beautiful_template_runtime.theme_registry(include_legacy=True))
    write_json(project / "02-plan/template-registry.json", beautiful_template_runtime.template_registry(include_legacy=True))


def assert_receipt_consumes_font_and_typography_roles(test_case: unittest.TestCase, receipt: dict[str, object]) -> None:
    font_roles = receipt.get("font_roles")
    test_case.assertIsInstance(font_roles, dict)
    test_case.assertTrue(REQUIRED_TYPOGRAPHY_ROLES.issubset(set(font_roles or {})))
    for role in REQUIRED_TYPOGRAPHY_ROLES:
        resolved = (font_roles or {}).get(role)
        test_case.assertIsInstance(resolved, dict)
        test_case.assertTrue(resolved.get("family"))
        test_case.assertTrue(resolved.get("source"))

    typography_roles = receipt.get("typography_roles")
    test_case.assertIsInstance(typography_roles, dict)
    test_case.assertTrue(REQUIRED_TYPOGRAPHY_ROLES.issubset(set(typography_roles or {})))
    for role in REQUIRED_TYPOGRAPHY_ROLES:
        token = (typography_roles or {}).get(role)
        test_case.assertIsInstance(token, dict)
        test_case.assertTrue(REQUIRED_ROLE_TOKEN_FIELDS.issubset(set(token or {})))
    text_style_roles = receipt.get("text_style_roles")
    test_case.assertIsInstance(text_style_roles, dict)
    test_case.assertTrue(REQUIRED_TEXT_STYLE_ROLE_FIELDS.issubset(set(text_style_roles or {})))
    test_case.assertTrue(receipt.get("typography_strategy_source"))


def assert_renderer_source_consumes_font_role(test_case: unittest.TestCase, module_source: str, role: str) -> None:
    direct_font_role = re.search(rf"fontRole\(\s*['\"]{re.escape(role)}['\"]", module_source)
    direct_role_helper = re.search(rf"\brole\(\s*['\"]{re.escape(role)}['\"]", module_source)
    resolver_map_entry = re.search(
        rf"{re.escape(role)}\s*:\s*\([^)]*\)\s*=>\s*fontRole\(\s*['\"]{re.escape(role)}['\"]",
        module_source,
    )
    test_case.assertTrue(
        direct_font_role or direct_role_helper or resolver_map_entry,
        f"renderer does not consume typography role {role!r}",
    )


def load_candidate_matrix() -> list[dict[str, object]]:
    matrix = json.loads(MATRIX_PATH.read_text(encoding="utf-8"))
    return [row for row in matrix.get("candidates", []) if isinstance(row, dict)]


class ArtboardTemplateGoldenTest(unittest.TestCase):
    def test_beautiful_renderer_contract_uses_closed_loop_sample_not_generic_fallback(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        renderer_dir = scripts_dir / "artboard_renderer"
        p0_source = (renderer_dir / "templates/p0-templates.mjs").read_text(encoding="utf-8")
        index_source = (renderer_dir / "templates/beautiful/index.mjs").read_text(encoding="utf-8")
        self.assertNotIn("return beautifulTemplate(spec, BEAUTIFUL_TEMPLATE_CONFIGS[spec.template_id])", p0_source)
        self.assertTrue((renderer_dir / "templates/beautiful/index.mjs").exists())
        for sample_template_id, contract in BEAUTIFUL_DEDICATED_SAMPLE_CONTRACTS.items():
            self.assertNotIn(f"'{sample_template_id}':", p0_source)
            module_path = renderer_dir / f"templates/beautiful/{contract['module']}"
            self.assertTrue(module_path.exists())
            module_source = module_path.read_text(encoding="utf-8")
            self.assertNotIn("beautifulTemplate(", module_source)
            self.assertIn("templateId", module_source)
            self.assertIn(f"source_family: '{contract['source_family']}'", module_source)
            self.assertIn(contract["reference_screenshot"], module_source)
            self.assertIn(contract["module"], index_source)
            for role in ["display", "body", "label", "metric"]:
                assert_renderer_source_consumes_font_role(self, module_source, role)
        evaluation_stub = renderer_dir / "templates/beautiful/evaluation-stub.mjs"
        self.assertTrue(evaluation_stub.exists())

    def test_font_role_helper_consumes_typography_strategy_tokens(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        typography_source = (scripts_dir / "artboard_renderer/components/typography.mjs").read_text(encoding="utf-8")

        for source_token, satori_style in [
            ("font_weight", "fontWeight"),
            ("line_height", "lineHeight"),
            ("letter_spacing", "letterSpacing"),
            ("text_transform", "textTransform"),
            ("text_decoration_policy", "textDecorationLine"),
            ("underline", "textDecorationStyle"),
            ("line_through", "textDecorationThickness"),
        ]:
            self.assertIn(source_token, typography_source)
            self.assertIn(satori_style, typography_source)
        self.assertIn("tokenStyle(role, spec)", typography_source)
        self.assertIn("textDecorationStyle(spec, decorationRequestFromFallback(fallback))", typography_source)
        self.assertIn("typographyRolesFromTheme", typography_source)

    def test_existing_dedicated_golden_specs_match_matrix_typography_strategy(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        renderer_rows = [row for row in load_candidate_matrix() if row.get("renderer_module")]
        self.assertGreaterEqual(len(renderer_rows), len(DEDICATED_SAMPLE_TEMPLATE_IDS))

        for row in renderer_rows:
            with self.subTest(family_id=row.get("family_id"), template_id=row.get("runtime_template_id")):
                spec_path = repo_root / str(row["golden_spec"])
                spec = json.loads(spec_path.read_text(encoding="utf-8"))
                typography = spec.get("theme", {}).get("typography", {})
                font_roles = typography.get("font_roles")
                role_tokens = typography.get("role_tokens")
                text_style_roles = typography.get("text_style_roles")
                self.assertIsInstance(font_roles, dict)
                self.assertIsInstance(role_tokens, dict)
                self.assertIsInstance(text_style_roles, dict)
                self.assertTrue(REQUIRED_TYPOGRAPHY_ROLES.issubset(set(font_roles or {})))
                self.assertTrue(REQUIRED_TYPOGRAPHY_ROLES.issubset(set(role_tokens or {})))
                self.assertTrue(REQUIRED_TEXT_STYLE_ROLE_FIELDS.issubset(set(text_style_roles or {})))
                self.assertEqual(typography.get("strategy_source"), row.get("visual_contract_path"))

                font_strategy = row.get("font_strategy", {})
                for role in REQUIRED_TYPOGRAPHY_ROLES:
                    expected_alias = font_strategy.get("role_mapping", {}).get(role, {}).get("runtime_alias")
                    self.assertEqual(font_roles.get(role), expected_alias)

                expected_tokens = row.get("typography_strategy", {}).get("role_mapping")
                self.assertEqual(role_tokens, expected_tokens)

    def test_p1_templates_render_without_baseline_or_debug_artifacts(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, template_id in enumerate(P1_TEMPLATE_IDS, start=1):
            spec = json.loads((golden_dir / f"{template_id}.canvas-spec.json").read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], template_id)
            self.assertNotIn(spec.get("theme_id"), {"baseline", "safe-native-v1", "default"})
            page_type = "closing" if page == len(P1_TEMPLATE_IDS) else ("cover" if page == 1 else "content")
            slides.append(
                {
                    "page": page,
                    "title": spec["content"]["title"],
                    "page_type": page_type,
                    "renderer_id": f"artboard_satori.{template_id}",
                    "layout_family": LAYOUT_FAMILIES[page - 1],
                    "visual_recipe": "closing summary" if page_type == "closing" else f"{LAYOUT_FAMILIES[page - 1]} canvas",
                    "content_density_contract": "dashboard >= 4 metrics" if page == 2 else "matrix >= 6 cells",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(P1_TEMPLATE_IDS))
            preview_parts = ["<html><body>"]
            for page in range(1, len(P1_TEMPLATE_IDS) + 1):
                raw = project / f"04-svg/artboard/raw/page-{page:03d}.satori.svg"
                prepared = project / f"04-svg/page-{page:03d}.svg"
                receipt_path = project / f"04-svg/artboard/page-{page:03d}.receipt.json"
                self.assertTrue(raw.exists())
                self.assertTrue(prepared.exists())
                receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
                self.assertEqual(receipt["compiler_input"], f"04-svg/artboard/raw/page-{page:03d}.satori.svg")
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                raw_text = raw.read_text(encoding="utf-8")
                prepared_text = prepared.read_text(encoding="utf-8")
                lowered = (raw_text + prepared_text).lower()
                self.assertNotIn("baseline", raw_text.lower())
                self.assertNotIn("debug guide", lowered)
                self.assertNotIn("reference line", lowered)
                self.assertNotIn("stroke-dasharray=\"2 2\"", lowered)
                self.assertNotIn("opacity=\"0.12\" data-debug", lowered)
                preview_parts.append(prepared_text)
            preview_parts.append("</body></html>")
            preview = project / "05-preview/preview.html"
            preview.parent.mkdir(parents=True, exist_ok=True)
            preview.write_text("\n".join(preview_parts), encoding="utf-8")
            preflight_command = [
                sys.executable,
                (scripts_dir / "svg_preflight.py").as_posix(),
                "--plan",
                (project / "02-plan/slide_plan.json").as_posix(),
            ]
            for page in range(1, len(P1_TEMPLATE_IDS) + 1):
                preflight_command.extend(["--input", (project / f"04-svg/page-{page:03d}.svg").as_posix()])
            preflight = subprocess.run(preflight_command, check=False, capture_output=True, text=True)
            self.assertEqual(preflight.returncode, 0, preflight.stdout + preflight.stderr)
            preview_lint = subprocess.run(
                [sys.executable, (scripts_dir / "svg_preview_lint.py").as_posix(), preview.as_posix(), "--pretty"],
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(preview_lint.returncode, 0, preview_lint.stdout + preview_lint.stderr)

    def test_dedicated_sample_template_renders_without_baseline_or_debug_artifacts(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, template_id in enumerate(DEDICATED_SAMPLE_TEMPLATE_IDS, start=1):
            spec = json.loads((golden_dir / f"{template_id}.canvas-spec.json").read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], template_id)
            self.assertNotIn(spec.get("theme_id"), {"baseline", "safe-native-v1", "default"})
            page_type = "summary" if page == len(DEDICATED_SAMPLE_TEMPLATE_IDS) else ("cover" if page == 1 else "content")
            slides.append(
                {
                    "page": page,
                    "title": spec["content"]["title"],
                    "page_type": page_type,
                    "renderer_id": f"artboard_satori.{template_id}",
                    "layout_family": template_id.replace("-", "_"),
                    "visual_recipe": f"{template_id} family-owned canvas",
                    "content_density_contract": "family template golden fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(DEDICATED_SAMPLE_TEMPLATE_IDS))
            preview_parts = ["<html><body>"]
            for page in range(1, len(DEDICATED_SAMPLE_TEMPLATE_IDS) + 1):
                raw = project / f"04-svg/artboard/raw/page-{page:03d}.satori.svg"
                prepared = project / f"04-svg/page-{page:03d}.svg"
                receipt_path = project / f"04-svg/artboard/page-{page:03d}.receipt.json"
                self.assertTrue(raw.exists())
                self.assertTrue(prepared.exists())
                receipt = json.loads(receipt_path.read_text(encoding="utf-8"))
                self.assertEqual(receipt["compiler_input"], f"04-svg/artboard/raw/page-{page:03d}.satori.svg")
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                raw_text = raw.read_text(encoding="utf-8")
                text = raw_text + prepared.read_text(encoding="utf-8")
                lowered = text.lower()
                self.assertNotIn("baseline", raw_text.lower())
                self.assertNotIn("debug guide", lowered)
                self.assertNotIn("reference line", lowered)
                self.assertNotIn("stroke-dasharray=\"2 2\"", lowered)
                self.assertNotIn("opacity=\"0.12\" data-debug", lowered)
                preview_parts.append(prepared.read_text(encoding="utf-8"))
            preview_parts.append("</body></html>")
            preview = project / "05-preview/preview.html"
            preview.parent.mkdir(parents=True, exist_ok=True)
            preview.write_text("\n".join(preview_parts), encoding="utf-8")
            preflight_command = [
                sys.executable,
                (scripts_dir / "svg_preflight.py").as_posix(),
                "--plan",
                (project / "02-plan/slide_plan.json").as_posix(),
            ]
            for page in range(1, len(DEDICATED_SAMPLE_TEMPLATE_IDS) + 1):
                preflight_command.extend(["--input", (project / f"04-svg/page-{page:03d}.svg").as_posix()])
            preflight = subprocess.run(preflight_command, check=False, capture_output=True, text=True)
            self.assertEqual(preflight.returncode, 0, preflight.stdout + preflight.stderr)
            preview_lint = subprocess.run(
                [sys.executable, (scripts_dir / "svg_preview_lint.py").as_posix(), preview.as_posix(), "--pretty"],
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(preview_lint.returncode, 0, preview_lint.stdout + preview_lint.stderr)

    def test_blue_professional_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(BLUE_PROFESSIONAL_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"blue-professional.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "executive-dashboard")
            self.assertEqual(spec["family_id"], "blue-professional")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"]["title"],
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.executive-dashboard",
                    "layout_family": "executive_dashboard",
                    "visual_recipe": f"blue-professional {variant_id} canvas",
                    "content_density_contract": "page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(BLUE_PROFESSIONAL_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(BLUE_PROFESSIONAL_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "executive-dashboard")
                self.assertEqual(receipt["family_id"], "blue-professional")
                self.assertEqual(receipt["page_role"], slides[page - 1]["page_type"])
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "blue-professional")
                self.assertEqual(metadata["page_role"], slides[page - 1]["page_type"])
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                boxes = [
                    (
                        node.get("kind"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                ]
                layout_signatures.add(json.dumps(boxes[:8], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 6)

    def test_bold_poster_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(BOLD_POSTER_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"bold-poster.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "poster-stat-punch")
            self.assertEqual(spec["family_id"], "bold-poster")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"]["title"],
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.poster-stat-punch",
                    "layout_family": "poster_stat_punch",
                    "visual_recipe": f"bold-poster {variant_id} canvas",
                    "content_density_contract": "bold-poster page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(BOLD_POSTER_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(BOLD_POSTER_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "poster-stat-punch")
                self.assertEqual(receipt["family_id"], "bold-poster")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "bold-poster")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                self.assertTrue(metadata["font_roles"]["display"]["path"].endswith("Georgia Bold.ttf"))
                self.assertTrue(metadata["font_roles"]["body"]["path"].endswith("Georgia.ttf"))
                self.assertTrue(metadata["font_roles"]["label"]["path"].endswith("Trebuchet MS Bold.ttf"))
                self.assertEqual(metadata["font_roles"]["metric"]["family"], "SVGlideBoldPosterDisplay")
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                boxes = [
                    (
                        node.get("kind"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                ]
                layout_signatures.add(json.dumps(boxes[:8], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 6)

    def test_eight_bit_orbit_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(EIGHT_BIT_ORBIT_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"8-bit-orbit.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "pixel-orbit-console")
            self.assertEqual(spec["family_id"], "8-bit-orbit")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"]["title"] if "title" in spec["content"] else spec["content"].get("quote", "8-bit page"),
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.pixel-orbit-console",
                    "layout_family": "pixel_orbit_console",
                    "visual_recipe": f"8-bit-orbit {variant_id} canvas",
                    "content_density_contract": "8-bit-orbit page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(EIGHT_BIT_ORBIT_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(EIGHT_BIT_ORBIT_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "pixel-orbit-console")
                self.assertEqual(receipt["family_id"], "8-bit-orbit")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "8-bit-orbit")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                    and node.get("text") not in {"←", "/", "→", "·", "SPACE"}
                    and not re.match(r"^\\d{2} / 08$", str(node.get("text")))
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 7)

    def test_biennale_yellow_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(BIENNALE_YELLOW_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"biennale-yellow.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "biennale-programme-poster")
            self.assertEqual(spec["family_id"], "biennale-yellow")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title") or spec["content"].get("quote") or "Biennale page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.biennale-programme-poster",
                    "layout_family": "biennale_programme_poster",
                    "visual_recipe": f"biennale-yellow {variant_id} canvas",
                    "content_density_contract": "biennale-yellow page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(BIENNALE_YELLOW_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(BIENNALE_YELLOW_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "biennale-programme-poster")
                self.assertEqual(receipt["family_id"], "biennale-yellow")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "biennale-yellow")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                boxes = [
                    (
                        node.get("kind"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                ]
                layout_signatures.add(json.dumps(boxes[:8], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 6)

    def test_block_frame_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(BLOCK_FRAME_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"block-frame.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "block-frame-grid")
            self.assertEqual(spec["family_id"], "block-frame")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title") or spec["content"].get("quote") or "Block frame page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.block-frame-grid",
                    "layout_family": "block_frame_grid",
                    "visual_recipe": f"block-frame {variant_id} canvas",
                    "content_density_contract": "block-frame page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(BLOCK_FRAME_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(BLOCK_FRAME_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "block-frame-grid")
                self.assertEqual(receipt["family_id"], "block-frame")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "block-frame")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                    and node.get("text") not in {"←", "/", "→", "·", "SPACE"}
                    and not re.match(r"^\\d{2} / 08$", str(node.get("text")))
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 7)

    def test_capsule_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(CAPSULE_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"capsule.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "capsule-card-system")
            self.assertEqual(spec["family_id"], "capsule")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title") or spec["content"].get("quote") or "Capsule page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.capsule-card-system",
                    "layout_family": "capsule_card_system",
                    "visual_recipe": f"capsule {variant_id} canvas",
                    "content_density_contract": "capsule page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(CAPSULE_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(CAPSULE_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "capsule-card-system")
                self.assertEqual(receipt["family_id"], "capsule")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "capsule")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                boxes = [
                    (
                        node.get("kind"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                ]
                layout_signatures.add(json.dumps(boxes[:8], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 7)

    def test_broadside_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(BROADSIDE_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"broadside.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "editorial-quote-chart")
            self.assertEqual(spec["family_id"], "broadside")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title") or spec["content"].get("quote") or "Broadside page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.editorial-quote-chart",
                    "layout_family": "broadside_editorial",
                    "visual_recipe": f"broadside {variant_id} canvas",
                    "content_density_contract": "broadside page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(BROADSIDE_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(BROADSIDE_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "editorial-quote-chart")
                self.assertEqual(receipt["family_id"], "broadside")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "broadside")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                boxes = [
                    (
                        node.get("kind"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                ]
                layout_signatures.add(json.dumps(boxes[:8], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 10)

    def test_cartesian_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(CARTESIAN_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"cartesian.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "architectural-spec")
            self.assertEqual(spec["family_id"], "cartesian")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title") or spec["content"].get("quote") or "Cartesian page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.architectural-spec",
                    "layout_family": "cartesian_editorial",
                    "visual_recipe": f"cartesian {variant_id} canvas",
                    "content_density_contract": "cartesian page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(CARTESIAN_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(CARTESIAN_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "architectural-spec")
                self.assertEqual(receipt["family_id"], "cartesian")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "cartesian")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                boxes = [
                    (
                        node.get("kind"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                ]
                layout_signatures.add(json.dumps(boxes[:8], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 8)

    def test_cobalt_grid_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(COBALT_GRID_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"cobalt-grid.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "trend-grid-report")
            self.assertEqual(spec["family_id"], "cobalt-grid")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title") or spec["content"].get("quote") or "Cobalt Grid page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.trend-grid-report",
                    "layout_family": "cobalt_grid_report",
                    "visual_recipe": f"cobalt-grid {variant_id} canvas",
                    "content_density_contract": "cobalt-grid page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(COBALT_GRID_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(COBALT_GRID_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "trend-grid-report")
                self.assertEqual(receipt["family_id"], "cobalt-grid")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "cobalt-grid")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                    and node.get("text") not in {"←", "/", "→", "·", "SPACE"}
                    and not re.match(r"^\d{2} / 08$", str(node.get("text")))
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 7)

    def test_coral_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(CORAL_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"coral.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "coral-magazine-feature")
            self.assertEqual(spec["family_id"], "coral")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title") or spec["content"].get("quote") or "Coral page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.coral-magazine-feature",
                    "layout_family": "coral_magazine_feature",
                    "visual_recipe": f"coral {variant_id} canvas",
                    "content_density_contract": "coral page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(CORAL_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(CORAL_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "coral-magazine-feature")
                self.assertEqual(receipt["family_id"], "coral")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "coral")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                    and not re.match(r"^\d{2} / 10$", str(node.get("text")))
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 9)

    def test_daisy_days_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(DAISY_DAYS_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"daisy-days.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "daisy-workshop-playbook")
            self.assertEqual(spec["family_id"], "daisy-days")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title") or spec["content"].get("quote") or "Daisy page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.daisy-workshop-playbook",
                    "layout_family": "daisy_workshop_playbook",
                    "visual_recipe": f"daisy-days {variant_id} canvas",
                    "content_density_contract": "daisy-days page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(DAISY_DAYS_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(DAISY_DAYS_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "daisy-workshop-playbook")
                self.assertEqual(receipt["family_id"], "daisy-days")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "daisy-days")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                    and not re.match(r"^\d+ / 10$", str(node.get("text")))
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 9)

    def test_editorial_forest_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(EDITORIAL_FOREST_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"editorial-forest.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "serif-stat-editorial")
            self.assertEqual(spec["family_id"], "editorial-forest")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title") or spec["content"].get("quote") or "Editorial Forest page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.serif-stat-editorial",
                    "layout_family": "editorial_forest",
                    "visual_recipe": f"editorial-forest {variant_id} canvas",
                    "content_density_contract": "editorial-forest page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(EDITORIAL_FOREST_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(EDITORIAL_FOREST_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "serif-stat-editorial")
                self.assertEqual(receipt["family_id"], "editorial-forest")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "editorial-forest")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                    and not re.match(r"^0[1-8]$", str(node.get("text")))
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 7)

    def test_editorial_tri_tone_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(EDITORIAL_TRI_TONE_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"editorial-tri-tone.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "tritone-editorial-spread")
            self.assertEqual(spec["family_id"], "editorial-tri-tone")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title") or spec["content"].get("quote") or "Editorial Tri-Tone page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.tritone-editorial-spread",
                    "layout_family": "editorial_tri_tone",
                    "visual_recipe": f"editorial-tri-tone {variant_id} canvas",
                    "content_density_contract": "editorial-tri-tone page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(EDITORIAL_TRI_TONE_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(EDITORIAL_TRI_TONE_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "tritone-editorial-spread")
                self.assertEqual(receipt["family_id"], "editorial-tri-tone")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "editorial-tri-tone")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 7)

    def test_emerald_editorial_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(EMERALD_EDITORIAL_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"emerald-editorial.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "emerald-editorial-cover")
            self.assertEqual(spec["family_id"], "emerald-editorial")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title") or spec["content"].get("title_top") or "Emerald Editorial page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.emerald-editorial-cover",
                    "layout_family": "emerald_editorial",
                    "visual_recipe": f"emerald-editorial {variant_id} canvas",
                    "content_density_contract": "emerald-editorial page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(EMERALD_EDITORIAL_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(EMERALD_EDITORIAL_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "emerald-editorial-cover")
                self.assertEqual(receipt["family_id"], "emerald-editorial")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "emerald-editorial")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 7)

    def test_grove_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(GROVE_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"grove.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "grove-organic-brief")
            self.assertEqual(spec["family_id"], "grove")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title") or spec["content"].get("quote") or "Grove page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.grove-organic-brief",
                    "layout_family": "grove",
                    "visual_recipe": f"grove {variant_id} canvas",
                    "content_density_contract": "grove page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(GROVE_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(GROVE_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "grove-organic-brief")
                self.assertEqual(receipt["family_id"], "grove")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "grove")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 9)

    def test_long_table_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(LONG_TABLE_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"long-table.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "printed-program")
            self.assertEqual(spec["family_id"], "long-table")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title") or spec["content"].get("quote") or "Long Table page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.printed-program",
                    "layout_family": "long-table",
                    "visual_recipe": f"long-table {variant_id} canvas",
                    "content_density_contract": "long-table page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(LONG_TABLE_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(LONG_TABLE_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "printed-program")
                self.assertEqual(receipt["family_id"], "long-table")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "long-table")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 7)

    def test_mat_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(MAT_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"mat.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "mat-midcentury-board")
            self.assertEqual(spec["family_id"], "mat")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title") or spec["content"].get("quote") or "Mat page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.mat-midcentury-board",
                    "layout_family": "mat",
                    "visual_recipe": f"mat {variant_id} canvas",
                    "content_density_contract": "mat page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(MAT_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(MAT_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "mat-midcentury-board")
                self.assertEqual(receipt["family_id"], "mat")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "mat")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 8)

    def test_peoples_platform_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(PEOPLES_PLATFORM_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"peoples-platform.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "people-platform-manifesto")
            self.assertEqual(spec["family_id"], "peoples-platform")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title") or spec["content"].get("quote") or "People platform page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.people-platform-manifesto",
                    "layout_family": "people_platform_manifesto",
                    "visual_recipe": f"peoples-platform {variant_id} canvas",
                    "content_density_contract": "peoples-platform page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(PEOPLES_PLATFORM_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(PEOPLES_PLATFORM_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "people-platform-manifesto")
                self.assertEqual(receipt["family_id"], "peoples-platform")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "peoples-platform")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 9)

    def test_pink_script_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(PINK_SCRIPT_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"pink-script.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "pink-nocturne-feature")
            self.assertEqual(spec["family_id"], "pink-script")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title")
                    or spec["content"].get("title_top")
                    or spec["content"].get("quote")
                    or "Pink script page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.pink-nocturne-feature",
                    "layout_family": "pink_nocturne_feature",
                    "visual_recipe": f"pink-script {variant_id} canvas",
                    "content_density_contract": "pink-script page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(PINK_SCRIPT_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(PINK_SCRIPT_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "pink-nocturne-feature")
                self.assertEqual(receipt["family_id"], "pink-script")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "pink-script")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 8)

    def test_playful_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(PLAYFUL_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"playful.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "playful-indie-launch")
            self.assertEqual(spec["family_id"], "playful")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title")
                    or spec["content"].get("date")
                    or spec["content"].get("subtitle")
                    or "Playful page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.playful-indie-launch",
                    "layout_family": "playful_indie_launch",
                    "visual_recipe": f"playful {variant_id} canvas",
                    "content_density_contract": "playful page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(PLAYFUL_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(PLAYFUL_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "playful-indie-launch")
                self.assertEqual(receipt["family_id"], "playful")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "playful")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 9)

    def test_sakura_chroma_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(SAKURA_CHROMA_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"sakura-chroma.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "product-ribbon")
            self.assertEqual(spec["family_id"], "sakura-chroma")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title")
                    or spec["content"].get("brand")
                    or spec["content"].get("subtitle")
                    or "Sakura Chroma page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.product-ribbon",
                    "layout_family": "sakura_chroma_product_ribbon",
                    "visual_recipe": f"sakura-chroma {variant_id} canvas",
                    "content_density_contract": "sakura-chroma page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(SAKURA_CHROMA_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(SAKURA_CHROMA_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "product-ribbon")
                self.assertEqual(receipt["family_id"], "sakura-chroma")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "sakura-chroma")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 7)

    def test_pin_and_paper_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(PIN_AND_PAPER_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"pin-and-paper.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "annotated-field-board")
            self.assertEqual(spec["family_id"], "pin-and-paper")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title") or spec["content"].get("quote") or "Pin & Paper page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.annotated-field-board",
                    "layout_family": "pin_and_paper_annotated_field_board",
                    "visual_recipe": f"pin-and-paper {variant_id} canvas",
                    "content_density_contract": "pin-and-paper page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(PIN_AND_PAPER_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(PIN_AND_PAPER_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "annotated-field-board")
                self.assertEqual(receipt["family_id"], "pin-and-paper")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "pin-and-paper")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 9)

    def test_retro_zine_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(RETRO_ZINE_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"retro-zine.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "retro-zine-spread")
            self.assertEqual(spec["family_id"], "retro-zine")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title")
                    or spec["content"].get("quote")
                    or spec["content"].get("stamp")
                    or "Retro Zine page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.retro-zine-spread",
                    "layout_family": "retro_zine_spread",
                    "visual_recipe": f"retro-zine {variant_id} canvas",
                    "content_density_contract": "retro-zine page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(RETRO_ZINE_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(RETRO_ZINE_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "retro-zine-spread")
                self.assertEqual(receipt["family_id"], "retro-zine")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "retro-zine")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 8)

    def test_scatterbrain_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(SCATTERBRAIN_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"scatterbrain.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "sticky-workshop-board")
            self.assertEqual(spec["family_id"], "scatterbrain")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title")
                    or spec["content"].get("quote")
                    or spec["content"].get("left_title")
                    or "Scatterbrain page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.sticky-workshop-board",
                    "layout_family": "sticky_workshop_board",
                    "visual_recipe": f"scatterbrain {variant_id} canvas",
                    "content_density_contract": "scatterbrain page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(SCATTERBRAIN_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(SCATTERBRAIN_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "sticky-workshop-board")
                self.assertEqual(receipt["family_id"], "scatterbrain")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "scatterbrain")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 8)

    def test_signal_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(SIGNAL_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"signal.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "intelligence-brief")
            self.assertEqual(spec["family_id"], "signal")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title")
                    or spec["content"].get("quote")
                    or "Signal page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.intelligence-brief",
                    "layout_family": "signal_intelligence_brief",
                    "visual_recipe": f"signal {variant_id} canvas",
                    "content_density_contract": "signal page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(SIGNAL_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(SIGNAL_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "intelligence-brief")
                self.assertEqual(receipt["family_id"], "signal")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "signal")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 14)

    def test_soft_editorial_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(SOFT_EDITORIAL_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"soft-editorial.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "soft-editorial-feature")
            self.assertEqual(spec["family_id"], "soft-editorial")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title")
                    or spec["content"].get("quote")
                    or spec["content"].get("eyebrow")
                    or "Soft Editorial page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.soft-editorial-feature",
                    "layout_family": "soft_editorial_feature",
                    "visual_recipe": f"soft-editorial {variant_id} canvas",
                    "content_density_contract": "soft-editorial page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(SOFT_EDITORIAL_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(SOFT_EDITORIAL_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "soft-editorial-feature")
                self.assertEqual(receipt["family_id"], "soft-editorial")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "soft-editorial")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 10)

    def test_stencil_tablet_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(STENCIL_TABLET_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"stencil-tablet.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "stencil-field-manual")
            self.assertEqual(spec["family_id"], "stencil-tablet")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title")
                    or spec["content"].get("headline")
                    or spec["content"].get("quote")
                    or "Stencil Tablet page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.stencil-field-manual",
                    "layout_family": "stencil_field_manual",
                    "visual_recipe": f"stencil-tablet {variant_id} canvas",
                    "content_density_contract": "stencil-tablet page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(STENCIL_TABLET_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(STENCIL_TABLET_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "stencil-field-manual")
                self.assertEqual(receipt["family_id"], "stencil-tablet")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "stencil-tablet")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 9)

    def test_studio_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(STUDIO_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"studio.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "type-mass-poster")
            self.assertEqual(spec["family_id"], "studio")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title")
                    or spec["content"].get("quote")
                    or spec["content"].get("eyebrow")
                    or "Studio page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.type-mass-poster",
                    "layout_family": "studio_type_mass_poster",
                    "visual_recipe": f"studio {variant_id} canvas",
                    "content_density_contract": "studio page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(STUDIO_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(STUDIO_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "type-mass-poster")
                self.assertEqual(receipt["family_id"], "studio")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "studio")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 9)

    def test_vellum_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(VELLUM_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"vellum.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "vellum-scholar-brief")
            self.assertEqual(spec["family_id"], "vellum")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title")
                    or spec["content"].get("quote")
                    or spec["content"].get("kicker")
                    or "Vellum page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.vellum-scholar-brief",
                    "layout_family": "vellum_scholar_brief",
                    "visual_recipe": f"vellum {variant_id} canvas",
                    "content_density_contract": "vellum page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(VELLUM_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(VELLUM_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "vellum-scholar-brief")
                self.assertEqual(receipt["family_id"], "vellum")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "vellum")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 8)

    def test_raw_grid_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(RAW_GRID_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"raw-grid.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "brutalist-matrix")
            self.assertEqual(spec["family_id"], "raw-grid")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title")
                    or spec["content"].get("brand")
                    or spec["content"].get("subtitle")
                    or "Raw Grid page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.brutalist-matrix",
                    "layout_family": "raw_grid_brutalist_matrix",
                    "visual_recipe": f"raw-grid {variant_id} canvas",
                    "content_density_contract": "raw-grid page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(RAW_GRID_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(RAW_GRID_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "brutalist-matrix")
                self.assertEqual(receipt["family_id"], "raw-grid")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "raw-grid")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 9)

    def test_retro_windows_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(RETRO_WINDOWS_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"retro-windows.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "retro-ui-dashboard")
            self.assertEqual(spec["family_id"], "retro-windows")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"].get("title")
                    or spec["content"].get("window_title")
                    or "Retro Windows page",
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.retro-ui-dashboard",
                    "layout_family": "retro_ui_dashboard",
                    "visual_recipe": f"retro-windows {variant_id} canvas",
                    "content_density_contract": "retro-windows page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(RETRO_WINDOWS_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(RETRO_WINDOWS_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "retro-ui-dashboard")
                self.assertEqual(receipt["family_id"], "retro-windows")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "retro-windows")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                text_nodes = [
                    (
                        node.get("text"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                    and node.get("kind") == "text"
                    and node.get("text")
                ]
                layout_signatures.add(json.dumps(text_nodes[:10], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 9)

    def test_creative_mode_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(CREATIVE_MODE_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"creative-mode.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "creative-mode-grid")
            self.assertEqual(spec["family_id"], "creative-mode")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"]["title"],
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.creative-mode-grid",
                    "layout_family": "creative_mode_grid",
                    "visual_recipe": f"creative-mode {variant_id} canvas",
                    "content_density_contract": "creative-mode page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(CREATIVE_MODE_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(CREATIVE_MODE_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "creative-mode-grid")
                self.assertEqual(receipt["family_id"], "creative-mode")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "creative-mode")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                boxes = [
                    (
                        node.get("kind"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                ]
                layout_signatures.add(json.dumps(boxes[:8], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 6)

    def test_monochrome_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(MONOCHROME_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"monochrome.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "ledger-briefing")
            self.assertEqual(spec["family_id"], "monochrome")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"]["title"],
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.ledger-briefing",
                    "layout_family": "monochrome_ledger",
                    "visual_recipe": f"monochrome {variant_id} canvas",
                    "content_density_contract": "monochrome page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(MONOCHROME_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(MONOCHROME_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "ledger-briefing")
                self.assertEqual(receipt["family_id"], "monochrome")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "monochrome")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                boxes = [
                    (
                        node.get("kind"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                ]
                layout_signatures.add(json.dumps(boxes[:8], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 8)

    def test_neo_grid_bold_page_family_variants_render_and_record_variant_metadata(self) -> None:
        scripts_dir = Path(__file__).resolve().parent
        golden_dir = scripts_dir / "fixtures/svglide_artboard/golden"
        slides = []
        for page, variant_id in enumerate(NEO_GRID_BOLD_PAGE_VARIANTS, start=1):
            spec_path = golden_dir / f"neo-grid-bold.{variant_id}.canvas-spec.json"
            self.assertTrue(spec_path.exists(), f"missing page-family fixture: {spec_path}")
            spec = json.loads(spec_path.read_text(encoding="utf-8"))
            self.assertEqual(spec["template_id"], "dense-panel-grid")
            self.assertEqual(spec["family_id"], "neo-grid-bold")
            self.assertEqual(spec["page_variant_id"], variant_id)
            self.assertTrue(spec.get("page_role"))
            slides.append(
                {
                    "page": page,
                    "title": spec["content"]["title"],
                    "page_type": spec["page_role"],
                    "renderer_id": "artboard_satori.dense-panel-grid",
                    "layout_family": "neo_grid_bold",
                    "visual_recipe": f"neo-grid-bold {variant_id} canvas",
                    "content_density_contract": "neo-grid-bold page-family variant fixture",
                    "canvas_spec": spec,
                }
            )

        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            write_legacy_fixture_registries(project)
            write_json(project / "02-plan/slide_plan.json", {"generation_mode": "artboard_satori", "slides": slides})
            result = artboard.render_project(project)
            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(result["artboard_receipts"]), len(NEO_GRID_BOLD_PAGE_VARIANTS))
            layout_signatures = set()
            for page, variant_id in enumerate(NEO_GRID_BOLD_PAGE_VARIANTS, start=1):
                receipt = json.loads((project / f"04-svg/artboard/page-{page:03d}.receipt.json").read_text(encoding="utf-8"))
                metadata = json.loads((project / receipt["render_metadata"]).read_text(encoding="utf-8"))
                self.assertEqual(receipt["template_id"], "dense-panel-grid")
                self.assertEqual(receipt["family_id"], "neo-grid-bold")
                self.assertEqual(receipt["page_variant_id"], variant_id)
                self.assertEqual(metadata["family_id"], "neo-grid-bold")
                self.assertEqual(metadata["page_variant_id"], variant_id)
                assert_receipt_consumes_font_and_typography_roles(self, receipt)
                layout_map = json.loads((project / receipt["node_layout_map"]).read_text(encoding="utf-8"))
                boxes = [
                    (
                        node.get("kind"),
                        node.get("x"),
                        node.get("y"),
                        node.get("width"),
                        node.get("height"),
                    )
                    for node in layout_map.get("nodes", [])
                    if isinstance(node, dict)
                ]
                layout_signatures.add(json.dumps(boxes[:8], sort_keys=True))
            self.assertGreaterEqual(len(layout_signatures), 8)


if __name__ == "__main__":
    unittest.main()
