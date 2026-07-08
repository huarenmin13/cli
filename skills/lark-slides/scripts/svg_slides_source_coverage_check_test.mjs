import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = path.resolve("skills/lark-slides/scripts/svg_slides_source_coverage_check.mjs");

function tempRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "svg-slides-coverage-"));
  fs.mkdirSync(path.join(root, "source"), { recursive: true });
  return root;
}

function writeManifest(root, sections) {
  fs.writeFileSync(path.join(root, "source", "split-manifest.json"), JSON.stringify({
    version: "svg-slides.split-manifest.v1",
    source: "source/full.debranded.md",
    sections
  }, null, 2));
}

function run(root) {
  return spawnSync("node", [script, root, "--json"], { encoding: "utf8" });
}

test("passes when each manifest section is covered by its target file", () => {
  const root = tempRoot();
  writeManifest(root, [{ id: "workflow", lines: [1, 10], target: "workflow.md" }]);
  fs.writeFileSync(path.join(root, "workflow.md"), "# Workflow\n\n## Source Coverage\n\n- Covers manifest sections: workflow\n");
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).errors.length, 0);
});

test("fails when a section is missing from Source Coverage", () => {
  const root = tempRoot();
  writeManifest(root, [{ id: "protocol", lines: [1, 10], target: "protocol.md" }]);
  fs.writeFileSync(path.join(root, "protocol.md"), "# Protocol\n\n## Source Coverage\n\n- Covers manifest sections: other\n");
  const result = run(root);
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.ok(report.errors.some((error) => error.includes("unknown manifest section")));
  assert.ok(report.errors.some((error) => error.includes("not covered")));
});

test("fails when a section is declared by the wrong target file", () => {
  const root = tempRoot();
  writeManifest(root, [{ id: "visual", lines: [1, 10], target: "visual-design.md" }]);
  fs.writeFileSync(path.join(root, "workflow.md"), "# Workflow\n\n## Source Coverage\n\n- Covers manifest sections: visual\n");
  const result = run(root);
  assert.equal(result.status, 1);
  assert.ok(JSON.parse(result.stdout).errors.some((error) => error.includes("belongs to visual-design.md")));
});
