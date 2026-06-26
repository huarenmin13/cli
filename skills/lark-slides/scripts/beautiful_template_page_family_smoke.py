#!/usr/bin/env python3
# Copyright (c) 2026 Lark Technologies Pte. Ltd.
# SPDX-License-Identifier: MIT
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any


SCRIPT_DIR = Path(__file__).resolve().parent
REFERENCES_DIR = SCRIPT_DIR.parent / "references"
MATRIX_PATH = REFERENCES_DIR / "beautiful-template-executable-matrix.json"
SMOKE_DECK_DIR = REFERENCES_DIR / "page-family-smoke-decks"
PAGE_FAMILY_SMOKE_CHECK_NAME = "page-family-smoke"
PAGE_FAMILY_SMOKE_INPUT_KEY = "page_family_smoke"
PAGE_FAMILY_SMOKE_REL = Path("06-check/page-family-smoke.json")
PAGE_FAMILY_SMOKE_RECEIPT_REL = Path("receipts/page-family-smoke.json")
GENERATOR_VERSION = "svglide-page-family-smoke/v1"
PRODUCTION_MINIMUM_ROLES = [
    "cover",
    "agenda",
    "content",
    "data",
    "comparison",
    "quote",
    "process",
    "detail",
    "closing",
]
ROLE_ALIASES = {
    "cover": {"cover", "hero", "opening", "title"},
    "agenda": {"agenda", "toc", "outline"},
    "content": {"content", "body", "section", "evidence"},
    "data": {"data", "metrics", "metric", "dashboard", "chart", "kpi"},
    "comparison": {"comparison", "split", "compare"},
    "quote": {"quote", "emphasis", "callout"},
    "process": {"process", "timeline", "steps", "flow"},
    "detail": {"detail", "deep_dive", "appendix", "case"},
    "closing": {"closing", "summary", "takeaway", "cta"},
}


def read_json_optional(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return payload if isinstance(payload, dict) else {}


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def optional_file_sha256(project: Path, rel: Path) -> str | None:
    path = project / rel
    return file_sha256(path) if path.is_file() else None


def relpath(path: Path, base: Path) -> str:
    try:
        return path.resolve().relative_to(base.resolve()).as_posix()
    except ValueError:
        return path.as_posix()


def _as_text(value: Any) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def _string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item.strip() for item in value if isinstance(item, str) and item.strip()]


def _collect_selection_values(payload: dict[str, Any]) -> tuple[set[str], set[str], set[str]]:
    family_ids: set[str] = set()
    template_ids: set[str] = set()
    theme_ids: set[str] = set()
    for key in ("selected_family_id", "family_id"):
        if value := _as_text(payload.get(key)):
            family_ids.add(value)
    for key in ("selected_template_id", "template_id", "runtime_template_id"):
        if value := _as_text(payload.get(key)):
            template_ids.add(value)
    for key in ("selected_theme_id", "theme_id"):
        if value := _as_text(payload.get(key)):
            theme_ids.add(value)
    page_family = payload.get("selected_page_family")
    if isinstance(page_family, dict):
        sub_families, sub_templates, sub_themes = _collect_selection_values(page_family)
        family_ids.update(sub_families)
        template_ids.update(sub_templates)
        theme_ids.update(sub_themes)
    family_selection = payload.get("template_family_selection")
    if isinstance(family_selection, dict):
        for key in ("selected_family_id", "family_id", "selected_template_id"):
            if value := _as_text(family_selection.get(key)):
                family_ids.add(value)
        for key in ("runtime_template_id", "template_id"):
            if value := _as_text(family_selection.get(key)):
                template_ids.add(value)
    slides = payload.get("slides")
    if isinstance(slides, list):
        for slide in slides:
            if not isinstance(slide, dict):
                continue
            for source in (slide, slide.get("canvas_spec")):
                if isinstance(source, dict):
                    sub_families, sub_templates, sub_themes = _collect_selection_values(source)
                    family_ids.update(sub_families)
                    template_ids.update(sub_templates)
                    theme_ids.update(sub_themes)
    return family_ids, template_ids, theme_ids


def _matrix_rows() -> list[dict[str, Any]]:
    payload = read_json_optional(MATRIX_PATH)
    rows = payload.get("candidates") if isinstance(payload.get("candidates"), list) else []
    return [row for row in rows if isinstance(row, dict)]


def _match_matrix_row(families: set[str], templates: set[str]) -> dict[str, Any] | None:
    for row in _matrix_rows():
        row_family = _as_text(row.get("family_id"))
        row_template = _as_text(row.get("template_id"))
        row_runtime = _as_text(row.get("runtime_template_id"))
        if (row_family and row_family in families) or (row_template and row_template in templates) or (row_runtime and row_runtime in templates):
            return row
    return None


def _first_sorted(values: set[str]) -> str | None:
    return next(iter(sorted(values)), None)


def _is_production_selectable(row: dict[str, Any] | None) -> bool:
    return bool(row and row.get("promotion_status") == "production" and row.get("default_selectable") is True)


def selected_beautiful_production_family(project: Path) -> dict[str, Any] | None:
    plan = read_json_optional(project / "02-plan/slide_plan.json")
    selection = read_json_optional(project / "02-plan/theme-template-selection.json")
    families, templates, themes = _collect_selection_values(plan)
    selection_families, selection_templates, selection_themes = _collect_selection_values(selection)
    families.update(selection_families)
    templates.update(selection_templates)
    themes.update(selection_themes)
    for row in _matrix_rows():
        row_family = _as_text(row.get("family_id"))
        row_template = _as_text(row.get("template_id"))
        row_runtime = _as_text(row.get("runtime_template_id"))
        is_selected = (row_family in families) or (row_template in templates) or (row_runtime in templates)
        if not is_selected:
            continue
        if row.get("promotion_status") == "production" and row.get("default_selectable") is True:
            selected_theme = next(iter(sorted(themes)), None) or row_family
            return {
                **row,
                "selected_family_id": row_family,
                "selected_template_id": row_template or row_runtime,
                "selected_theme_id": selected_theme,
            }
    return None


def explicit_page_family_smoke_fixture(project: Path) -> Path | None:
    for rel in ("02-plan/page-family-smoke.json", "02-plan/page-family-smoke-fixture.json"):
        path = project / rel
        if path.exists():
            return path
    return None


def selected_beautiful_current_family(
    project: Path,
    *,
    selected_family: str | None = None,
    selected_template: str | None = None,
    selected_theme: str | None = None,
) -> dict[str, Any] | None:
    families: set[str] = set()
    templates: set[str] = set()
    themes: set[str] = set()
    selection_source = "none"
    if selected_family or selected_template or selected_theme:
        if selected_family:
            families.add(selected_family)
        if selected_template:
            templates.add(selected_template)
        if selected_theme:
            themes.add(selected_theme)
        selection_source = "explicit_args"
    else:
        fixture_path = explicit_page_family_smoke_fixture(project)
        fixture = read_json_optional(fixture_path) if fixture_path else {}
        if fixture:
            fixture_families, fixture_templates, fixture_themes = _collect_selection_values(fixture)
            families.update(fixture_families)
            templates.update(fixture_templates)
            themes.update(fixture_themes)
            if families or templates or themes:
                selection_source = "explicit_fixture"
        if not families and not templates:
            plan = read_json_optional(project / "02-plan/slide_plan.json")
            selection = read_json_optional(project / "02-plan/theme-template-selection.json")
            plan_families, plan_templates, plan_themes = _collect_selection_values(plan)
            selection_families, selection_templates, selection_themes = _collect_selection_values(selection)
            families.update(plan_families)
            templates.update(plan_templates)
            themes.update(plan_themes)
            families.update(selection_families)
            templates.update(selection_templates)
            themes.update(selection_themes)
            if families or templates or themes:
                selection_source = "plan_selection"
    row = _match_matrix_row(families, templates)
    if not row:
        return None
    row_family = _as_text(row.get("family_id")) if row else None
    row_template = _as_text(row.get("template_id")) if row else None
    row_runtime = _as_text(row.get("runtime_template_id")) if row else None
    family_id = selected_family or _first_sorted(families) or row_family
    template_id = selected_template or _first_sorted(templates) or row_template or row_runtime
    theme_id = selected_theme or _first_sorted(themes) or family_id
    if not family_id and not template_id:
        return None
    return {
        **(row or {}),
        "selected_family_id": family_id,
        "selected_template_id": template_id,
        "selected_theme_id": theme_id,
        "selection_source": selection_source,
        "production_selectable": _is_production_selectable(row),
    }


def _normalize_role(raw_values: list[Any]) -> str | None:
    tokens: list[str] = []
    for raw in raw_values:
        if not isinstance(raw, str):
            continue
        lowered = raw.strip().lower().replace("-", "_")
        tokens.append(lowered)
        tokens.extend(part for part in lowered.replace("/", "_").split("_") if part)
    for role, aliases in ROLE_ALIASES.items():
        if aliases.intersection(tokens):
            return role
    return None


def _page_variant_role_map(project: Path) -> dict[str, str]:
    selection = read_json_optional(project / "02-plan/theme-template-selection.json")
    page_family = selection.get("selected_page_family")
    if not isinstance(page_family, dict):
        return {}
    variants = page_family.get("page_variants")
    role_map: dict[str, str] = {}
    if isinstance(variants, dict):
        iterator = variants.items()
    elif isinstance(variants, list):
        iterator = []
        for item in variants:
            if isinstance(item, dict):
                variant_id = _as_text(item.get("page_variant_id")) or _as_text(item.get("variant_id")) or _as_text(item.get("id"))
                if variant_id:
                    iterator.append((variant_id, item))
    else:
        return {}
    for variant_id, payload in iterator:
        if not isinstance(variant_id, str) or not isinstance(payload, dict):
            continue
        role = _normalize_role([payload.get("page_role"), payload.get("role")])
        if role:
            role_map[variant_id] = role
    return role_map


def _page_role(spec: dict[str, Any], item: dict[str, Any], variant: str, variant_roles: dict[str, str]) -> str:
    explicit = _normalize_role([spec.get("page_role")]) or _normalize_role([item.get("page_role")])
    if explicit:
        return explicit
    if variant_roles.get(variant):
        return variant_roles[variant]
    inferred = _normalize_role(
        [
            spec.get("page_variant_id"),
            item.get("page_variant_id"),
            item.get("template_variant"),
            item.get("page_type"),
            item.get("role"),
            variant,
        ]
    )
    return inferred or "unknown"


def _page_records(project: Path, deck: dict[str, Any]) -> list[dict[str, Any]]:
    plan = read_json_optional(project / "02-plan/slide_plan.json")
    variant_roles = _page_variant_role_map(project)
    raw_pages = plan.get("slides") if isinstance(plan.get("slides"), list) else None
    if not raw_pages:
        raw_pages = deck.get("pages") if isinstance(deck.get("pages"), list) else []
    pages: list[dict[str, Any]] = []
    for index, item in enumerate(raw_pages, start=1):
        if not isinstance(item, dict):
            continue
        spec = item.get("canvas_spec") if isinstance(item.get("canvas_spec"), dict) else {}
        variant = (
            _as_text(spec.get("page_variant_id"))
            or _as_text(item.get("page_variant_id"))
            or _as_text(item.get("template_variant"))
            or _as_text(item.get("page_type"))
            or f"page-{index:03d}"
        )
        role = _page_role(spec, item, variant, variant_roles)
        pages.append(
            {
                "page": int(item.get("page") or index),
                "page_role": role,
                "page_variant_id": variant,
                "template_id": _as_text(spec.get("template_id")) or _as_text(item.get("template_id")),
                "family_id": _as_text(spec.get("family_id")) or _as_text(item.get("family_id")),
                "theme_id": _as_text(spec.get("theme_id")) or _as_text(item.get("theme_id")),
            }
        )
    return pages


def _load_smoke_deck(family_id: str | None) -> dict[str, Any]:
    if not family_id:
        return {}
    return read_json_optional(SMOKE_DECK_DIR / f"{family_id}.json")


def _check_summary(path: Path) -> dict[str, Any]:
    payload = read_json_optional(path)
    summary = payload.get("summary") if isinstance(payload.get("summary"), dict) else {}
    return {
        "status": payload.get("status"),
        "error_count": summary.get("error_count", 0),
        "warning_count": summary.get("warning_count", 0),
    }


def check_project_page_family_smoke(
    project: Path,
    *,
    selected_family: str | None = None,
    selected_template: str | None = None,
    selected_theme: str | None = None,
    command: list[str] | None = None,
) -> dict[str, Any]:
    project = project.resolve()
    selected = selected_beautiful_current_family(
        project,
        selected_family=selected_family,
        selected_template=selected_template,
        selected_theme=selected_theme,
    ) or {}
    family_id = _as_text(selected.get("selected_family_id"))
    template_id = _as_text(selected.get("selected_template_id"))
    theme_id = _as_text(selected.get("selected_theme_id")) or family_id
    deck = _load_smoke_deck(family_id)
    pages = _page_records(project, deck)
    role_pages: dict[str, list[int]] = {role: [] for role in PRODUCTION_MINIMUM_ROLES}
    role_variants: dict[str, set[str]] = {role: set() for role in PRODUCTION_MINIMUM_ROLES}
    for page in pages:
        role = page.get("page_role")
        if role in role_pages:
            role_pages[role].append(int(page["page"]))
            if variant := _as_text(page.get("page_variant_id")):
                role_variants[role].add(variant)
    page_variant_coverage = {
        role: {
            "covered": bool(role_pages[role]),
            "pages": role_pages[role],
            "variants": sorted(role_variants[role]),
        }
        for role in PRODUCTION_MINIMUM_ROLES
    }
    missing_required_roles = [role for role in PRODUCTION_MINIMUM_ROLES if not role_pages[role]]
    variants = [page.get("page_variant_id") for page in pages if page.get("page_variant_id")]
    variant_counts = Counter(str(variant) for variant in variants)
    implemented_page_variants = _string_list(selected.get("implemented_page_variants"))
    implemented_variant_set = set(implemented_page_variants)
    covered_implemented_page_variants = [
        variant_id for variant_id in implemented_page_variants if variant_counts.get(variant_id, 0) > 0
    ]
    missing_implemented_page_variants = [
        variant_id for variant_id in implemented_page_variants if variant_counts.get(variant_id, 0) == 0
    ]
    unimplemented_page_variants = sorted(
        {
            str(variant)
            for variant in variants
            if implemented_variant_set and str(variant) not in implemented_variant_set
        }
    )
    reuse_count = sum(count - 1 for count in variant_counts.values() if count > 1)
    variant_reuse_reasons = [
        {"page_variant_id": variant, "reuse_count": count, "reason": "duplicate_variant_in_smoke_deck"}
        for variant, count in sorted(variant_counts.items())
        if count > 1
    ]
    artifact_issues = []
    if not family_id:
        artifact_issues.append({"code": "selected_family_missing", "message": "selected family id is required"})
    if not template_id:
        artifact_issues.append({"code": "selected_template_missing", "message": "selected template id is required"})
    artifact_issues.extend(
        {"code": "required_role_missing", "message": f"missing required page-family role: {role}"}
        for role in missing_required_roles
    )
    artifact_issues.extend(
        {
            "code": "implemented_variant_missing",
            "message": f"missing implemented page-family variant: {variant_id}",
        }
        for variant_id in missing_implemented_page_variants
    )
    artifact_issues.extend(
        {
            "code": "unimplemented_variant_used",
            "message": f"smoke deck uses unimplemented page-family variant: {variant_id}",
        }
        for variant_id in unimplemented_page_variants
    )
    input_paths = {
        "slide_plan": Path("02-plan/slide_plan.json"),
        "generator_receipt": Path("receipts/generate_svg.json"),
        "template_registry": Path("02-plan/template-registry.json"),
        "theme_registry": Path("02-plan/theme-registry.json"),
    }
    if (project / "02-plan/theme-template-selection.json").is_file():
        input_paths["theme_template_selection"] = Path("02-plan/theme-template-selection.json")
    if fixture_path := explicit_page_family_smoke_fixture(project):
        input_paths["smoke_fixture"] = fixture_path.relative_to(project)
    if family_id:
        input_paths["smoke_deck"] = Path(relpath(SMOKE_DECK_DIR / f"{family_id}.json", project))
    golden_specs = selected.get("page_variant_golden_specs") if isinstance(selected.get("page_variant_golden_specs"), dict) else {}
    for variant_id, raw_path in sorted(golden_specs.items()):
        if isinstance(variant_id, str) and isinstance(raw_path, str) and raw_path:
            input_paths[f"golden_spec.{variant_id}"] = Path(raw_path)
    input_hashes = {
        key: (file_sha256(project / rel) if (project / rel).is_file() else file_sha256(Path(rel)) if Path(rel).is_file() else None)
        for key, rel in input_paths.items()
    }
    degraded = bool(artifact_issues)
    return {
        "schema_version": GENERATOR_VERSION,
        "stage": "template_fidelity",
        "scope": "page_family",
        "status": "failed" if artifact_issues else "passed",
        "selected_family_id": family_id,
        "selected_template_id": template_id,
        "selected_theme_id": theme_id,
        "selection_source": selected.get("selection_source") or "none",
        "production_selectable": bool(selected.get("production_selectable")),
        "promotion_status": selected.get("promotion_status"),
        "rendered_pages": len(pages),
        "pages": pages,
        "production_minimum_roles": PRODUCTION_MINIMUM_ROLES,
        "page_variant_coverage": page_variant_coverage,
        "missing_required_roles": missing_required_roles,
        "implemented_page_variants": implemented_page_variants,
        "covered_implemented_page_variants": covered_implemented_page_variants,
        "missing_implemented_page_variants": missing_implemented_page_variants,
        "unimplemented_page_variants": unimplemented_page_variants,
        "reuse_count": reuse_count,
        "variant_reuse_reasons": variant_reuse_reasons,
        "degraded": degraded,
        "visual_distinctness_summary": _check_summary(project / "06-check/visual-distinctness.json"),
        "theme_consistency_summary": _check_summary(project / "06-check/theme-adherence.json"),
        "artifact_issues": artifact_issues,
        "inputs": {key: rel.as_posix() for key, rel in input_paths.items()},
        "input_hashes": input_hashes,
        "generated_by": "beautiful_template_page_family_smoke.py",
        "generator_version": GENERATOR_VERSION,
        "command": command or [],
        "provenance": {
            "matrix": relpath(MATRIX_PATH, project),
            "smoke_deck": relpath(SMOKE_DECK_DIR / f"{family_id}.json", project) if family_id else None,
            "smoke_fixture": relpath(explicit_page_family_smoke_fixture(project), project) if explicit_page_family_smoke_fixture(project) else None,
            "project": str(project),
        },
        "summary": {
            "error_count": len(artifact_issues),
            "warning_count": reuse_count,
            "page_count": len(pages),
            "covered_role_count": len(PRODUCTION_MINIMUM_ROLES) - len(missing_required_roles),
            "implemented_variant_count": len(implemented_page_variants),
            "covered_implemented_variant_count": len(covered_implemented_page_variants),
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("project")
    parser.add_argument("--pretty", action="store_true")
    args = parser.parse_args()
    result = check_project_page_family_smoke(Path(args.project), command=[Path(sys.argv[0]).name, *sys.argv[1:]])
    print(json.dumps(result, ensure_ascii=False, indent=2 if args.pretty else None))
    return 0 if result["status"] == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
