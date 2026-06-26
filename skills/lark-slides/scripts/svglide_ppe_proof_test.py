# Copyright (c) 2026 Lark Technologies Pte. Ltd.
# SPDX-License-Identifier: MIT
from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import svglide_ppe_proof


def write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload), encoding="utf-8")


class SVGlidePPEProofTest(unittest.TestCase):
    def completed(self, command: list[str], payload: dict[str, object] | None = None, returncode: int = 0, stderr: str = "") -> subprocess.CompletedProcess[str]:
        return subprocess.CompletedProcess(command, returncode, stdout=json.dumps(payload or {"ok": True}), stderr=stderr)

    def write_inputs(self, project: Path) -> None:
        write_json(project / "06-check/quality-gate.json", {"status": "passed"})
        write_json(project / "07-create/dry-run.json", {"status": "passed"})

    def write_rule(self, project: Path) -> Path:
        rule = project / "ppe-pure-svg.whistle.js"
        rule.write_text("module.exports = function () {}\n", encoding="utf-8")
        return rule

    def complete_proof_input(self, project: Path) -> dict[str, object]:
        rule = self.write_rule(project)
        return {
            "status": "passed",
            "environment": {"name": "Pre_release", "x-tt-env": "ppe_pure_svg"},
            "auth": {"identity": "user"},
            "proxy": {
                "mode": "whistle",
                "capture": True,
                "http_proxy": "http://127.0.0.1:8899",
                "https_proxy": "http://127.0.0.1:8899",
                "rewrite_host": "open.feishu-pre.cn",
                "rule_file": rule.name,
                "rule_sha256": svglide_ppe_proof.file_sha256(rule),
                "inject_headers": {"Env": "Pre_release", "x-tt-env": "ppe_pure_svg", "x-use-ppe": "1"},
            },
            "headers": {"Env": "Pre_release", "x-tt-env": "ppe_pure_svg", "x-use-ppe": "1"},
            "route": {"name": "slides +create-svg"},
        }

    def test_ppe_proof_requires_input(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            self.write_inputs(project)

            result = svglide_ppe_proof.run_ppe_proof(project, command_runner=lambda command, **_: self.completed(command))

            self.assertEqual(result["status"], "failed")
            self.assertEqual(result["issues"][0]["code"], "ppe_proof_input_missing")

    def test_ppe_proof_passes_complete_input(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            self.write_inputs(project)
            write_json(project / "07-create/ppe-proof.input.json", self.complete_proof_input(project))
            commands: list[list[str]] = []

            def fake(command: list[str], **_: object) -> subprocess.CompletedProcess[str]:
                commands.append(command)
                return self.completed(command)

            result = svglide_ppe_proof.run_ppe_proof(project, command_runner=fake)

            self.assertEqual(result["status"], "passed")
            self.assertTrue((project / "07-create/ppe-proof.json").exists())
            self.assertEqual(result["ppe_create_probe"]["status"], "create_route_passed")
            self.assertIn("--ppe-profile", commands[0])
            self.assertIn("ppe_pure_svg", commands[0])
            self.assertIn("--dry-run", commands[0])
            self.assertNotIn("--request-header", commands[0])

    def test_create_probe_receipt_records_route_evidence_and_structured_error_marker(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            proof = self.complete_proof_input(project)
            write_json(project / "07-create/ppe-proof.input.json", proof)

            def fake(command: list[str], **_: object) -> subprocess.CompletedProcess[str]:
                return self.completed(
                    command,
                    returncode=1,
                    stderr='nodeServer invalid param SVGLIDE_ERROR_JSON:{"type":"unsupported_element","tag_name":"svg"}',
                )

            result = svglide_ppe_proof.run_create_probe(project, proof, command_runner=fake)

            self.assertEqual(result["status"], "create_route_blocked")
            self.assertEqual(result["summary"]["classification"], "svg_parser_protocol_rejected")
            self.assertEqual(result["issues"][0]["code"], "svg_parser_protocol_rejected")
            self.assertEqual(result["headers"], proof["headers"])
            self.assertEqual(result["target_host"], "open.feishu-pre.cn")
            self.assertTrue(result["contains_svglide_error_json"])
            self.assertIn("SVGLIDE_ERROR_JSON", result["raw_server_error"])
            self.assertEqual(result["probe_hash"], result["inputs"]["probe_hash"])
            self.assertRegex(result["probe_hash"], r"^[0-9a-f]{64}$")

    def test_create_probe_injects_proxy_env_from_ppe_proof(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            proof = self.complete_proof_input(project)
            write_json(project / "07-create/ppe-proof.input.json", proof)
            captured_env: dict[str, str] = {}

            def fake(command: list[str], **kwargs: object) -> subprocess.CompletedProcess[str]:
                env = kwargs.get("env")
                self.assertIsInstance(env, dict)
                captured_env.update(env)  # type: ignore[arg-type]
                return self.completed(command)

            result = svglide_ppe_proof.run_create_probe(project, proof, command_runner=fake)

            self.assertEqual(result["status"], "create_route_passed")
            self.assertEqual(captured_env["HTTP_PROXY"], "http://127.0.0.1:8899")
            self.assertEqual(captured_env["HTTPS_PROXY"], "http://127.0.0.1:8899")
            self.assertEqual(result["proxy_runtime"]["target_host"], "open.feishu-pre.cn")
            self.assertEqual(result["inputs"]["proxy_runtime"]["command_env_strategy"], "inject proof proxy env into create-svg subprocess")

    def test_unstructured_nodeserver_invalid_param_classifies_as_ppe_route_unverified(self) -> None:
        completed = subprocess.CompletedProcess(
            ["lark-cli"],
            1,
            stdout="",
            stderr="nodeServer invalid param",
        )

        status, detail = svglide_ppe_proof.classify_create_probe(completed)

        self.assertEqual(status, "create_route_blocked")
        self.assertEqual(detail["classification"], "ppe_route_unverified")

    def test_proxy_connection_failure_classifies_as_proxy_unreachable(self) -> None:
        completed = subprocess.CompletedProcess(
            ["lark-cli"],
            1,
            stdout="",
            stderr="proxyconnect tcp: dial tcp 127.0.0.1:8899: connect: connection refused",
        )

        status, detail = svglide_ppe_proof.classify_create_probe(completed)

        self.assertEqual(status, "create_route_blocked")
        self.assertEqual(detail["classification"], "ppe_proxy_unreachable")

    def test_xml_lowering_success_is_diagnostic_not_create_svg_success(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            proof = self.complete_proof_input(project)
            write_json(project / "07-create/ppe-proof.input.json", proof)

            def fake(command: list[str], **_: object) -> subprocess.CompletedProcess[str]:
                return self.completed(command, {"route": "xml_lowering", "xml_presentation_id": "xml_1"})

            result = svglide_ppe_proof.run_create_probe(project, proof, command_runner=fake)

            self.assertEqual(result["status"], "create_route_blocked")
            self.assertEqual(result["summary"]["classification"], "svg_parser_protocol_rejected")
            self.assertEqual(result["summary"]["diagnostic_only"], "xml_lowering_fallback_detected")
            self.assertEqual(result["issues"][0]["code"], "svg_parser_protocol_rejected")

    def test_ppe_proof_defaults_to_repo_local_create_svg(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            self.write_inputs(project)
            write_json(project / "07-create/ppe-proof.input.json", self.complete_proof_input(project))
            previous = os.environ.get(svglide_ppe_proof.LARK_CLI_COMMAND_ENV)
            os.environ.pop(svglide_ppe_proof.LARK_CLI_COMMAND_ENV, None)
            commands: list[list[str]] = []

            def fake(command: list[str], **_: object) -> subprocess.CompletedProcess[str]:
                commands.append(command)
                return self.completed(command)

            try:
                result = svglide_ppe_proof.run_ppe_proof(project, command_runner=fake)
            finally:
                if previous is None:
                    os.environ.pop(svglide_ppe_proof.LARK_CLI_COMMAND_ENV, None)
                else:
                    os.environ[svglide_ppe_proof.LARK_CLI_COMMAND_ENV] = previous

            self.assertEqual(result["status"], "passed")
            self.assertEqual(
                commands[0][:5],
                [
                    "env",
                    f"GOCACHE={(svglide_ppe_proof.repo_root() / '.gocache').as_posix()}",
                    "go",
                    "run",
                    svglide_ppe_proof.repo_root().as_posix(),
                ],
            )
            self.assertIn("+create-svg", commands[0])

    def test_image_probe_uses_dry_run(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            self.write_inputs(project)
            write_json(project / "07-create/ppe-proof.input.json", self.complete_proof_input(project))
            write_json(project / "03-assets/assets.json", {"@./hero.png": "boxcn_hero"})
            prepared = project / "04-svg/prepared/page-001.svg"
            prepared.parent.mkdir(parents=True, exist_ok=True)
            prepared.write_text('<svg><image href="@./hero.png"/></svg>', encoding="utf-8")
            commands: list[list[str]] = []

            def fake(command: list[str], **_: object) -> subprocess.CompletedProcess[str]:
                commands.append(command)
                return self.completed(command)

            result = svglide_ppe_proof.run_ppe_proof(project, command_runner=fake)

            self.assertEqual(result["status"], "passed")
            self.assertEqual(len(commands), 2)
            self.assertIn("--dry-run", commands[0])
            self.assertIn("--dry-run", commands[1])
            self.assertIn("--assets", commands[1])

    def test_ppe_proof_rejects_missing_proxy_capture(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            self.write_inputs(project)
            proof = self.complete_proof_input(project)
            proxy = proof["proxy"]
            assert isinstance(proxy, dict)
            proxy.pop("capture")
            write_json(project / "07-create/ppe-proof.input.json", proof)

            result = svglide_ppe_proof.run_ppe_proof(project, command_runner=lambda command, **_: self.completed(command))

            self.assertEqual(result["status"], "failed")
            self.assertIn("ppe_proxy_capture_missing", [item["code"] for item in result["issues"]])

    def test_ppe_proof_rejects_incomplete_fixed_header_set(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            self.write_inputs(project)
            proof = self.complete_proof_input(project)
            headers = proof["headers"]
            proxy = proof["proxy"]
            assert isinstance(headers, dict)
            assert isinstance(proxy, dict)
            headers.pop("x-use-ppe")
            inject_headers = proxy["inject_headers"]
            assert isinstance(inject_headers, dict)
            inject_headers.pop("x-use-ppe")
            write_json(project / "07-create/ppe-proof.input.json", proof)

            result = svglide_ppe_proof.run_ppe_proof(project, command_runner=lambda command, **_: self.completed(command))

            codes = [item["code"] for item in result["issues"]]
            self.assertEqual(result["status"], "failed")
            self.assertIn("ppe_header_missing_x_use_ppe", codes)
            self.assertIn("ppe_proxy_x_use_ppe_header_missing", codes)

    def test_ppe_proof_rejects_rule_hash_mismatch(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            project = Path(tmpdir)
            self.write_inputs(project)
            proof = self.complete_proof_input(project)
            proxy = proof["proxy"]
            assert isinstance(proxy, dict)
            proxy["rule_sha256"] = "not-the-real-hash"
            write_json(project / "07-create/ppe-proof.input.json", proof)

            result = svglide_ppe_proof.run_ppe_proof(project, command_runner=lambda command, **_: self.completed(command))

            self.assertEqual(result["status"], "failed")
            self.assertIn("ppe_proxy_rule_sha256_mismatch", [item["code"] for item in result["issues"]])

    def test_image_probe_classifies_5090000_as_readback_blocked(self) -> None:
        completed = subprocess.CompletedProcess(
            ["lark-cli"],
            1,
            stdout="",
            stderr="nodeServer internal error [5090000]",
        )

        status, detail = svglide_ppe_proof.classify_image_probe(completed)

        self.assertEqual(status, "readback_blocked")
        self.assertEqual(detail["classification"], "nodeserver_5090000")
        self.assertNotEqual(detail["classification"], "api_error")


if __name__ == "__main__":
    unittest.main()
