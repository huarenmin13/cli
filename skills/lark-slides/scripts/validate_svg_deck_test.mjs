import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = path.resolve("skills/lark-slides/scripts/validate_svg_deck.mjs");

function tempDeck() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "svg-slides-validator-"));
  fs.mkdirSync(path.join(root, "slides"));
  return root;
}

function writeSlide(root, name, body) {
  fs.writeFileSync(path.join(root, "slides", name), body);
}

function runValidator(root) {
  return spawnSync("node", [script, root, "--json"], { encoding: "utf8" });
}

const validSlide = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" id="valid" viewBox="0 0 960 540">
  <rect slide:role="background" x="0" y="0" width="960" height="540" fill="rgba(255,255,255,1)"/>
  <foreignObject slide:role="shape" slide:shape-type="text" x="80" y="80" width="600" height="80" style="font-size:32px;font-family:DM Sans,PingFang SC,Noto Sans SC,Arial,sans-serif;color:rgba(15,23,42,1);line-height:1.2;letter-spacing:0px;padding:0px">
    <p xmlns="http://www.w3.org/1999/xhtml" style="margin:0px;font-size:32px;color:rgba(15,23,42,1)">Valid</p>
  </foreignObject>
</svg>`;

test("valid SVG deck passes", () => {
  const root = tempDeck();
  writeSlide(root, "slide_01.svg", validSlide);

  const result = runValidator(root);
  assert.equal(result.status, 0, result.stderr);

  const report = JSON.parse(result.stdout);
  assert.equal(report.slideCount, 1);
  assert.equal(report.totalErrors, 0);
});

test("invalid SVG deck reports protocol errors", () => {
  const root = tempDeck();
  writeSlide(root, "slide_01.svg", `<svg xmlns="http://www.w3.org/2000/svg" id="bad" viewBox="0 0 960 540">
    <style>.t{fill:red}</style>
    <rect width="960" height="540" fill="#fff"/>
    <foreignObject slide:role="shape" slide:shape-type="text" x="80" y="80" width="300" height="80" style="font-size:32;color:#111">
      <div xmlns="http://www.w3.org/1999/xhtml"><p>Bad</p></div>
    </foreignObject>
  </svg>`);

  const result = runValidator(root);
  assert.equal(result.status, 1);

  const report = JSON.parse(result.stdout);
  const rules = report.results.flatMap((item) => item.errors.map((error) => error.rule));
  assert.ok(rules.includes("svg.root.slide-xmlns"));
  assert.ok(rules.includes("svg.root.slide-role"));
  assert.ok(rules.includes("background.first-child"));
  assert.ok(rules.includes("forbid.style-block"));
  assert.ok(rules.includes("forbid.div-wrapper"));
  assert.ok(rules.includes("color.attr"));
  assert.ok(rules.includes("text.style.font-size"));
  assert.ok(rules.includes("text.style.color"));
});

test("examples directory remains protocol-valid", () => {
  const examples = path.resolve("skills/lark-slides/references/svg-slides/examples");
  const result = spawnSync("node", [script, examples, "--json"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.slideCount, 3);
  assert.equal(report.totalErrors, 0);
});
