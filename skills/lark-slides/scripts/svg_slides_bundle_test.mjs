import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = path.resolve("skills/lark-slides/scripts/svg_slides_bundle.mjs");

function tempDeck() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "svg-slides-bundle-"));
  fs.mkdirSync(path.join(root, "slides"));
  return root;
}

const validSlide = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:slide="https://slides.bytedance.com/ns" slide:role="slide" id="bundle_slide" viewBox="0 0 1280 720">
  <rect slide:role="background" x="0" y="0" width="1280" height="720" fill="rgba(255,255,255,1)"/>
  <foreignObject slide:role="shape" slide:shape-type="text" x="80" y="80" width="600" height="80" style="font-size:32px;font-family:DM Sans,PingFang SC,Noto Sans SC,Arial,sans-serif;color:rgba(15,23,42,1);line-height:1.2;letter-spacing:0px;padding:0px">
    <p xmlns="http://www.w3.org/1999/xhtml" style="margin:0px;font-size:32px;color:rgba(15,23,42,1)">Bundle</p>
  </foreignObject>
</svg>`;

test("bundle builder writes manifest and validation receipt", () => {
  const root = tempDeck();
  fs.writeFileSync(path.join(root, "slides", "slide_01.svg"), validSlide);
  const result = spawnSync("node", [script, root, "--title", "Bundle Test"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
  assert.equal(manifest.version, "svglide.manifest.v1");
  assert.equal(manifest.protocol, "svg-slides.v1");
  assert.equal(manifest.title, "Bundle Test");
  assert.deepEqual(manifest.size, { width: 1280, height: 720 });
  assert.equal(manifest.publish_ready, true);
  assert.equal(manifest.published, false);
  assert.equal(manifest.pages.length, 1);
  assert.match(manifest.pages[0].sha256, /^[a-f0-9]{64}$/);
  const receipt = JSON.parse(fs.readFileSync(path.join(root, "receipts", "validate_svg_deck.json"), "utf8"));
  assert.equal(receipt.totalErrors, 0);
});

test("bundle builder rejects invalid SVG deck", () => {
  const root = tempDeck();
  fs.writeFileSync(path.join(root, "slides", "slide_01.svg"), validSlide.replace("rgba(255,255,255,1)", "#fff"));
  const result = spawnSync("node", [script, root, "--title", "Invalid"], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /not publish-ready/);
  assert.equal(fs.existsSync(path.join(root, "receipts", "validate_svg_deck.json")), true);
  assert.equal(fs.existsSync(path.join(root, "manifest.json")), false);
});
