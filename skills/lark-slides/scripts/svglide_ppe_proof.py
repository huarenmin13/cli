#!/usr/bin/env python3
# Copyright (c) 2026 Lark Technologies Pte. Ltd.
# SPDX-License-Identifier: MIT

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shlex
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import svglide_schema


QUALITY_GATE = Path("06-check/quality-gate.json")
DRY_RUN = Path("07-create/dry-run.json")
PROOF_INPUT = Path("07-create/ppe-proof.input.json")
PROOF_OUTPUT = Path("07-create/ppe-proof.json")
CREATE_PROBE_OUTPUT = Path("07-create/ppe-create-probe.json")
IMAGE_PROBE_OUTPUT = Path("07-create/ppe-image-probe.json")
PROBE_DIR = Path("07-create/probes")
LARK_CLI_COMMAND_ENV = "SVGLIDE_LARK_CLI_CMD"
SVGLIDE_ERROR_MARKER = "SVGLIDE_ERROR_JSON"
CREATE_PROBE_FAILURE_CLASSIFICATIONS = {
    "ppe_proxy_unreachable",
    "ppe_route_unverified",
    "svg_parser_disabled",
    "svg_parser_protocol_rejected",
    "server_error_unstructured",
}
PPE_PROXY_ENV_KEYS = ("HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy")


class PPEProofError(Exception):
    pass


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def read_json_object(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise PPEProofError(f"invalid JSON in {path}: {exc}") from exc
    if not isinstance(payload, dict):
        raise PPEProofError(f"invalid JSON in {path}: expected object")
    return payload


def issue(code: str, message: str) -> dict[str, str]:
    return {"code": code, "message": message}


def parse_json_or_none(text: str) -> Any:
    if not text.strip():
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


def repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def repo_local_lark_cli_prefix() -> list[str] | None:
    root = repo_root()
    if not (root / "go.mod").exists():
        return None
    if not (root / "shortcuts" / "slides" / "slides_create_svg.go").exists():
        return None
    return ["env", f"GOCACHE={(root / '.gocache').as_posix()}", "go", "run", root.as_posix()]


def resolve_declared_path(project: Path, raw_path: str) -> Path:
    path = Path(raw_path)
    candidates = [path] if path.is_absolute() else [project / path, repo_root() / path]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[-1]


def proof_issues(proof: dict[str, Any], project: Path) -> list[dict[str, str]]:
    issues: list[dict[str, str]] = []
    if proof.get("status") != "passed":
        issues.append(issue("ppe_status_not_passed", "ppe proof input status must be passed"))
    for key in ["environment", "auth", "proxy", "headers", "route"]:
        value = proof.get(key)
        if not isinstance(value, dict) or not value:
            issues.append(issue(f"ppe_{key}_missing", f"ppe proof input requires non-empty {key} object"))
    environment = proof.get("environment")
    if isinstance(environment, dict) and environment.get("name") != "Pre_release":
        issues.append(issue("ppe_environment_not_pre_release", "ppe proof environment.name must be Pre_release"))
    expected_headers = {"Env": "Pre_release", "x-tt-env": "ppe_pure_svg", "x-use-ppe": "1"}
    headers = proof.get("headers")
    if isinstance(headers, dict):
        for header_key, header_value in expected_headers.items():
            if headers.get(header_key) != header_value:
                issues.append(
                    issue(
                        f"ppe_header_missing_{header_key.lower().replace('-', '_')}",
                        f"ppe proof headers.{header_key} must be {header_value}",
                    ),
                )
    proxy = proof.get("proxy")
    if isinstance(proxy, dict) and proxy:
        if proxy.get("mode") != "whistle":
            issues.append(issue("ppe_proxy_mode_not_whistle", "ppe proof proxy.mode must be whistle"))
        if proxy.get("capture") is not True:
            issues.append(issue("ppe_proxy_capture_missing", "ppe proof proxy.capture must be true"))
        for key in ["http_proxy", "https_proxy"]:
            value = proxy.get(key)
            if not isinstance(value, str) or "127.0.0.1:8899" not in value:
                issues.append(issue(f"ppe_proxy_{key}_missing", f"ppe proof proxy.{key} must point to local Whistle"))
        if proxy.get("rewrite_host") != "open.feishu-pre.cn":
            issues.append(issue("ppe_proxy_rewrite_host_invalid", "ppe proof proxy.rewrite_host must be open.feishu-pre.cn"))
        inject_headers = proxy.get("inject_headers")
        if not isinstance(inject_headers, dict):
            issues.append(issue("ppe_proxy_inject_headers_missing", "ppe proof proxy.inject_headers is required"))
        else:
            for header_key, header_value in expected_headers.items():
                if inject_headers.get(header_key) != header_value:
                    issues.append(
                        issue(
                            f"ppe_proxy_{header_key.lower().replace('-', '_')}_header_missing",
                            f"ppe proof proxy.inject_headers.{header_key} must be {header_value}",
                        ),
                    )
        rule_file = proxy.get("rule_file")
        rule_sha256 = proxy.get("rule_sha256")
        if not isinstance(rule_file, str) or not rule_file.strip():
            issues.append(issue("ppe_proxy_rule_file_missing", "ppe proof proxy.rule_file is required"))
        elif not isinstance(rule_sha256, str) or not rule_sha256.strip():
            issues.append(issue("ppe_proxy_rule_sha256_missing", "ppe proof proxy.rule_sha256 is required"))
        else:
            resolved = resolve_declared_path(project, rule_file)
            if not resolved.exists():
                issues.append(issue("ppe_proxy_rule_file_not_found", "ppe proof proxy.rule_file must exist"))
            elif file_sha256(resolved) != rule_sha256:
                issues.append(issue("ppe_proxy_rule_sha256_mismatch", "ppe proof proxy.rule_sha256 does not match rule_file"))
    return issues


def lark_cli_command_prefix(proof: dict[str, Any]) -> list[str]:
    raw = proof.get("probe_command")
    if isinstance(raw, list) and all(isinstance(item, str) and item for item in raw):
        return list(raw)
    if isinstance(raw, str) and raw.strip():
        parsed = shlex.split(raw)
        if parsed:
            return parsed
    env_raw = os.environ.get(LARK_CLI_COMMAND_ENV, "").strip()
    if env_raw:
        parsed = shlex.split(env_raw)
        if parsed:
            return parsed
    return repo_local_lark_cli_prefix() or ["lark-cli"]


def ppe_profile_args() -> list[str]:
    return ["--ppe-profile", "ppe_pure_svg"]


def probe_svg(role: str, *, image_href: str | None = None) -> str:
    image_layer = ""
    if image_href:
        image_layer = (
            f'\n  <image slide:role="image" id="ppe-image" href="{image_href}" '
            'x="120" y="96" width="320" height="220" preserveAspectRatio="xMidYMid slice"/>'
            '\n  <rect slide:role="shape" x="120" y="96" width="320" height="220" fill="#111827" opacity="0.18"/>'
        )
    return f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" slide:contract-version="svglide-authoring-contract/v1" width="960" height="540" viewBox="0 0 960 540">
  <rect slide:role="shape" x="0" y="0" width="960" height="540" fill="#F8FAFC"/>
  <rect slide:role="shape" x="72" y="72" width="816" height="396" fill="#E0F2FE"/>
  <foreignObject slide:role="shape" slide:shape-type="text" x="104" y="112" width="560" height="80"><div xmlns="http://www.w3.org/1999/xhtml" style="font-size:28px;font-weight:700;color:#0F172A;line-height:1.2">SVGlide PPE {role}</div></foreignObject>{image_layer}
</svg>'''


def minimal_rect_probe_svg() -> str:
    return '''<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" slide:contract-version="svglide-authoring-contract/v1" width="960" height="540" viewBox="0 0 960 540">
  <metadata id="svglide-text-style-manifest" type="application/json">{"version":"svglide-satori-text-style/v1","items":{"probe-title":{"font_family":"Inter","font_size":28,"font_weight":700,"color":"#0F172A"}}}</metadata>
  <rect slide:role="shape" x="72" y="72" width="240" height="160" fill="#38BDF8"/>
  <line slide:role="line" x1="72" y1="264" x2="420" y2="264" stroke="#2563EB" stroke-width="4"/>
  <text slide:role="text" data-svglide-text-style-id="probe-title" x="72" y="320" font-family="Inter" font-size="28" font-weight="700" fill="#0F172A">SVGlide create-svg probe</text>
</svg>'''


def write_probe_svg(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def command_output_text(completed: subprocess.CompletedProcess[str]) -> str:
    return "\n".join(str(value or "") for value in [completed.stdout, completed.stderr])


def proof_headers(proof: dict[str, Any]) -> dict[str, str]:
    headers = proof.get("headers")
    if not isinstance(headers, dict):
        return {}
    return {str(key): str(value) for key, value in headers.items() if isinstance(key, str) and isinstance(value, (str, int, float, bool))}


def proof_target_host(proof: dict[str, Any]) -> str | None:
    route = proof.get("route")
    if isinstance(route, dict):
        for key in ["target_host", "host"]:
            value = route.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    proxy = proof.get("proxy")
    if isinstance(proxy, dict):
        value = proxy.get("rewrite_host")
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def proof_proxy_urls(proof: dict[str, Any]) -> dict[str, str]:
    proxy = proof.get("proxy")
    if not isinstance(proxy, dict):
        return {}
    values: dict[str, str] = {}
    http_proxy = proxy.get("http_proxy")
    https_proxy = proxy.get("https_proxy")
    if isinstance(http_proxy, str) and http_proxy.strip():
        values["HTTP_PROXY"] = http_proxy.strip()
        values["http_proxy"] = http_proxy.strip()
    if isinstance(https_proxy, str) and https_proxy.strip():
        values["HTTPS_PROXY"] = https_proxy.strip()
        values["https_proxy"] = https_proxy.strip()
    return values


def subprocess_env_for_proof(proof: dict[str, Any], base: dict[str, str] | None = None) -> dict[str, str]:
    env = dict(os.environ if base is None else base)
    env.update(proof_proxy_urls(proof))
    return env


def proxy_runtime_evidence(proof: dict[str, Any], env: dict[str, str] | None = None) -> dict[str, Any]:
    actual_env = os.environ if env is None else env
    proxy_env = proof_proxy_urls(proof)
    return {
        "source": "ppe-proof.proxy",
        "target_host": proof_target_host(proof),
        "command_env_strategy": "inject proof proxy env into create-svg subprocess",
        "proxy_env_overrides": {key: proxy_env[key] for key in PPE_PROXY_ENV_KEYS if key in proxy_env},
        "ambient_proxy_env": {key: actual_env[key] for key in PPE_PROXY_ENV_KEYS if actual_env.get(key)},
    }


def contains_xml_lowering_marker(value: Any) -> bool:
    if isinstance(value, dict):
        for key, child in value.items():
            lowered_key = str(key).lower()
            if lowered_key in {"xml_lowering", "xml_fallback", "diagnostic_xml_lowering"} and child:
                return True
            if lowered_key in {"route", "mode", "lowering_mode", "fallback_route", "diagnostic_route"}:
                if isinstance(child, str) and re.search(r"\b(xml_lowering|xml_fallback|sxsd_xml|xml_diagnostic)\b", child.lower()):
                    return True
            if contains_xml_lowering_marker(child):
                return True
    if isinstance(value, list):
        return any(contains_xml_lowering_marker(item) for item in value)
    if isinstance(value, str):
        return bool(re.search(r"\b(xml_lowering|xml_fallback|sxsd_xml|xml diagnostic)\b", value.lower()))
    return False


def classify_create_probe_failure_text(text: str) -> str:
    lower = text.lower()
    if any(token in lower for token in ["connection refused", "proxyconnect", "failed to connect", "could not connect", "econnrefused"]):
        return "ppe_proxy_unreachable"
    if SVGLIDE_ERROR_MARKER.lower() in lower or "contract-version" in lower or "slide:role" in lower:
        return "svg_parser_protocol_rejected"
    if (
        "svg parser disabled" in lower
        or "svglide parser disabled" in lower
        or "parser disabled" in lower
        or "svg parser is disabled" in lower
        or "unknown subcommand \"+create-svg\"" in lower
        or "unknown command \"+create-svg\"" in lower
    ):
        return "svg_parser_disabled"
    if (
        "ppe route" in lower
        or "ppe_profile" in lower
        or "ppe profile" in lower
        or "x-tt-env" in lower
        or "x-use-ppe" in lower
        or "pre_release" in lower
        or "pre-release" in lower
        or "whistle" in lower
        or "nodeserver invalid param" in lower
        or "invalid param" in lower
    ):
        return "ppe_route_unverified"
    return "server_error_unstructured"


def classify_create_probe(completed: subprocess.CompletedProcess[str]) -> tuple[str, dict[str, Any]]:
    text = command_output_text(completed)
    parsed = parse_json_or_none(completed.stdout)
    if completed.returncode == 0 and not contains_xml_lowering_marker(parsed) and not contains_xml_lowering_marker(text):
        return "create_route_passed", {"classification": "route_ok"}
    detail: dict[str, Any] = {
        "classification": "svg_parser_protocol_rejected" if completed.returncode == 0 else classify_create_probe_failure_text(text),
    }
    if completed.returncode == 0:
        detail["diagnostic_only"] = "xml_lowering_fallback_detected"
    return "create_route_blocked", detail


def classify_image_probe(completed: subprocess.CompletedProcess[str]) -> tuple[str, dict[str, Any]]:
    text = command_output_text(completed)
    lower = text.lower()
    if completed.returncode == 0:
        return "image_meta_passed", {"classification": "image_route_ok"}
    detail: dict[str, Any] = {"classification": "image_route_blocked"}
    if "5090000" in text or "nodeserver internal error" in lower or "readback" in lower:
        detail["classification"] = "nodeserver_5090000" if "5090000" in text else "readback_error"
        return "readback_blocked", detail
    if any(token in lower for token in ["upload", "file token", "file_token", "media", "permission", "forbidden"]):
        detail["classification"] = "upload_error"
        return "upload_blocked", detail
    detail["classification"] = "image_meta_error"
    return "image_meta_blocked", detail


def read_assets(project: Path) -> dict[str, Any]:
    path = project / "03-assets/assets.json"
    if not path.exists():
        return {}
    payload = read_json_object(path)
    return payload if isinstance(payload, dict) else {}


def extract_first_image_href(project: Path) -> str | None:
    assets = read_assets(project)
    for value in assets.values():
        if isinstance(value, str) and value.strip():
            return value.strip()
    for svg in sorted((project / "04-svg/prepared").glob("*.svg")):
        text = svg.read_text(encoding="utf-8")
        match = re.search(r"""<image\b[^>]*(?:href|xlink:href)\s*=\s*["']([^"']+)["']""", text, re.IGNORECASE)
        if match:
            return match.group(1)
    return None


def project_has_image_assets(project: Path) -> bool:
    assets = read_assets(project)
    if any(isinstance(key, str) and key for key in assets) or any(isinstance(value, str) and value for value in assets.values()):
        return True
    manifest_path = project / "03-assets/asset-manifest.json"
    if manifest_path.exists():
        manifest = read_json_object(manifest_path)
        summary = manifest.get("summary")
        if isinstance(summary, dict):
            for key in ["mapped_token_count", "acquired_count", "asset_acquired_count", "local_file_count", "image_job_count"]:
                value = summary.get(key)
                if isinstance(value, int) and value > 0:
                    return True
        for key in ["acquired_assets", "contracts"]:
            items = manifest.get(key)
            if isinstance(items, list):
                for item in items:
                    if isinstance(item, dict) and any(token in str(item.get(field, "")).lower() for field in ["asset_kind", "kind", "type"] for token in ["image", "photo", "picture"]):
                        return True
    prepared_dir = project / "04-svg/prepared"
    return any("<image" in path.read_text(encoding="utf-8").lower() for path in prepared_dir.glob("*.svg"))


def run_create_probe(
    project: Path,
    proof: dict[str, Any],
    *,
    command_runner=subprocess.run,
    dry_run: bool = True,
    output: Path = CREATE_PROBE_OUTPUT,
    title: str = "SVGlide PPE create probe",
) -> dict[str, Any]:
    started_at = now_iso()
    page = project / PROBE_DIR / "create-svg-capability-min-rect.svg"
    write_probe_svg(page, minimal_rect_probe_svg())
    probe_hash = file_sha256(page)
    command = (
        lark_cli_command_prefix(proof)
        + ["slides", "+create-svg", "--as", "user", "--title", title]
        + ppe_profile_args()
        + ["--file", page.relative_to(project).as_posix()]
    )
    if dry_run:
        command.append("--dry-run")
    command_env = subprocess_env_for_proof(proof)
    proxy_runtime = proxy_runtime_evidence(proof, command_env)
    completed = command_runner(command, cwd=project, check=False, capture_output=True, text=True, env=command_env)
    status, detail = classify_create_probe(completed)
    raw_server_error = command_output_text(completed)
    classification = detail["classification"]
    result: dict[str, Any] = {
        "schema_version": "svglide-ppe-create-probe/v1",
        "status": status,
        "started_at": started_at,
        "ended_at": now_iso(),
        "probe_kind": "minimal_rect",
        "probe_hash": probe_hash,
        "headers": proof_headers(proof),
        "target_host": proof_target_host(proof),
        "proxy_runtime": proxy_runtime,
        "raw_server_error": raw_server_error,
        "contains_svglide_error_json": SVGLIDE_ERROR_MARKER in raw_server_error,
        "command": command,
        "returncode": completed.returncode,
        "stdout": completed.stdout,
        "stderr": completed.stderr,
        "json": parse_json_or_none(completed.stdout),
        "inputs": {
            "proof_input": PROOF_INPUT.as_posix(),
            "proof_input_sha256": file_sha256(project / PROOF_INPUT) if (project / PROOF_INPUT).exists() else None,
            "headers": proof_headers(proof),
            "target_host": proof_target_host(proof),
            "proxy_runtime": proxy_runtime,
            "probe_file": page.relative_to(project).as_posix(),
            "probe_hash": probe_hash,
            "dry_run": dry_run,
            "probe_files": [page.relative_to(project).as_posix()],
            "probe_file_sha256": [probe_hash],
        },
        "summary": detail,
        "issues": [] if status == "create_route_passed" else [issue(classification, "create-svg minimal rect capability probe did not pass")],
    }
    output_path = project / output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return result


def run_image_probe(project: Path, proof: dict[str, Any], *, command_runner=subprocess.run) -> dict[str, Any]:
    started_at = now_iso()
    image_href = extract_first_image_href(project)
    page = project / PROBE_DIR / "ppe-image-page-001.svg"
    write_probe_svg(page, probe_svg("image route", image_href=image_href or ""))
    command = lark_cli_command_prefix(proof) + ["slides", "+create-svg", "--as", "user", "--title", "SVGlide PPE image probe"]
    assets_path = project / "03-assets/assets.json"
    if assets_path.exists():
        command.extend(["--assets", assets_path.relative_to(project).as_posix()])
    command.extend(ppe_profile_args())
    command.extend(["--file", page.relative_to(project).as_posix()])
    command.append("--dry-run")
    if not image_href:
        result: dict[str, Any] = {
            "schema_version": "svglide-ppe-image-probe/v1",
            "status": "image_meta_blocked",
            "started_at": started_at,
            "ended_at": now_iso(),
            "command": command,
            "returncode": None,
            "stdout": "",
            "stderr": "",
            "json": None,
            "inputs": {
                "assets_json": "03-assets/assets.json" if assets_path.exists() else None,
                "assets_json_sha256": file_sha256(assets_path) if assets_path.exists() else None,
                "image_href": None,
                "probe_file": page.relative_to(project).as_posix(),
                "probe_file_sha256": file_sha256(page),
            },
            "summary": {"classification": "missing_image_href"},
            "issues": [issue("image_meta_blocked", "image assets are present but no image href/token could be isolated")],
        }
    else:
        command_env = subprocess_env_for_proof(proof)
        proxy_runtime = proxy_runtime_evidence(proof, command_env)
        completed = command_runner(command, cwd=project, check=False, capture_output=True, text=True, env=command_env)
        status, detail = classify_image_probe(completed)
        result = {
            "schema_version": "svglide-ppe-image-probe/v1",
            "status": status,
            "started_at": started_at,
            "ended_at": now_iso(),
            "command": command,
            "returncode": completed.returncode,
            "stdout": completed.stdout,
            "stderr": completed.stderr,
            "json": parse_json_or_none(completed.stdout),
            "proxy_runtime": proxy_runtime,
            "inputs": {
                "assets_json": "03-assets/assets.json" if assets_path.exists() else None,
                "assets_json_sha256": file_sha256(assets_path) if assets_path.exists() else None,
                "image_href": image_href,
                "probe_file": page.relative_to(project).as_posix(),
                "probe_file_sha256": file_sha256(page),
            },
            "summary": detail,
            "issues": [] if status == "image_meta_passed" else [issue(status, detail["classification"])],
        }
    output = project / IMAGE_PROBE_OUTPUT
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return result


def run_ppe_proof(
    project: Path,
    *,
    command_runner=subprocess.run,
    run_create_probe_check: bool = True,
    run_image_probe_check: bool = True,
) -> dict[str, Any]:
    project = project.resolve()
    started_at = now_iso()
    issues: list[dict[str, str]] = []
    quality_gate = project / QUALITY_GATE
    dry_run = project / DRY_RUN
    proof_file = project / PROOF_INPUT
    if not quality_gate.exists():
        issues.append(issue("quality_gate_missing", "quality gate must exist before PPE proof"))
    if not dry_run.exists():
        issues.append(issue("dry_run_missing", "dry-run receipt must exist before PPE proof"))
    proof: dict[str, Any] = {}
    if proof_file.exists():
        proof = read_json_object(proof_file)
        issues.extend(proof_issues(proof, project))
    else:
        issues.append(issue("ppe_proof_input_missing", "07-create/ppe-proof.input.json is required before live create"))
    create_probe: dict[str, Any] | None = None
    image_probe: dict[str, Any] | None = None
    image_probe_required = False
    proxy_runtime = proxy_runtime_evidence(proof, subprocess_env_for_proof(proof)) if proof else {}
    if not issues and run_create_probe_check:
        create_probe = run_create_probe(project, proof, command_runner=command_runner)
        if create_probe.get("status") != "create_route_passed":
            summary = create_probe.get("summary")
            classification = summary.get("classification") if isinstance(summary, dict) else None
            code = classification if classification in CREATE_PROBE_FAILURE_CLASSIFICATIONS else "server_error_unstructured"
            issues.append(issue(code, "create-svg capability probe did not pass"))
    if not issues and run_image_probe_check:
        image_probe_required = project_has_image_assets(project)
        if image_probe_required:
            image_probe = run_image_probe(project, proof, command_runner=command_runner)
            if image_probe.get("status") != "image_meta_passed":
                issues.append(issue("ppe_image_probe_blocked", "ppe image probe did not pass"))
    status = "failed" if issues else "passed"
    result: dict[str, Any] = {
        "schema_version": "svglide-ppe-proof/v1",
        "status": status,
        "started_at": started_at,
        "ended_at": now_iso(),
        "inputs": {
            "quality_gate": QUALITY_GATE.as_posix() if quality_gate.exists() else None,
            "quality_gate_sha256": file_sha256(quality_gate) if quality_gate.exists() else None,
            "dry_run": DRY_RUN.as_posix() if dry_run.exists() else None,
            "dry_run_sha256": file_sha256(dry_run) if dry_run.exists() else None,
            "proof_input": PROOF_INPUT.as_posix() if proof_file.exists() else None,
            "proof_input_sha256": file_sha256(proof_file) if proof_file.exists() else None,
            "create_probe": CREATE_PROBE_OUTPUT.as_posix() if (project / CREATE_PROBE_OUTPUT).exists() else None,
            "create_probe_sha256": file_sha256(project / CREATE_PROBE_OUTPUT) if (project / CREATE_PROBE_OUTPUT).exists() else None,
            "image_probe_required": image_probe_required,
            "image_probe": IMAGE_PROBE_OUTPUT.as_posix() if (project / IMAGE_PROBE_OUTPUT).exists() else None,
            "image_probe_sha256": file_sha256(project / IMAGE_PROBE_OUTPUT) if (project / IMAGE_PROBE_OUTPUT).exists() else None,
        },
        "proof": proof,
        "proxy_runtime": proxy_runtime,
        "ppe_create_probe": create_probe,
        "ppe_image_probe": image_probe,
        "summary": {"error_count": len(issues)},
        "issues": issues,
    }
    schema = svglide_schema.read_json(svglide_schema.schema_path("svglide-ppe-proof.schema.json"))
    schema_issues = svglide_schema.validate_json_schema(result, schema)
    if schema_issues:
        result["status"] = "failed"
        result["issues"].extend(issue(item["code"], f"{item['path']}: {item['message']}") for item in schema_issues)
        result["summary"]["error_count"] = len(result["issues"])
    output = project / PROOF_OUTPUT
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return result


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Validate PPE/auth/proxy/header proof before SVGlide live create.")
    parser.add_argument("project")
    parser.add_argument("--pretty", action="store_true")
    parser.add_argument("--proof-only", action="store_true", help="validate PPE proof inputs without running live-route probes")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        result = run_ppe_proof(
            Path(args.project),
            run_create_probe_check=not args.proof_only,
            run_image_probe_check=not args.proof_only,
        )
    except (OSError, PPEProofError) as error:
        print(f"svglide_ppe_proof: error: {error}", file=sys.stderr)
        return 2
    print(json.dumps(result, ensure_ascii=False, indent=2 if args.pretty else None))
    return 0 if result["status"] == "passed" else 1


if __name__ == "__main__":
    raise SystemExit(main())
