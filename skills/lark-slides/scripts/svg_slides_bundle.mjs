#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function fail(message, code = 2) {
  console.error(message);
  process.exit(code);
}

const args = process.argv.slice(2);
const deckArg = args.find((arg) => !arg.startsWith("--"));
const titleIndex = args.indexOf("--title");
const title = titleIndex >= 0 ? args[titleIndex + 1] : "";

if (!deckArg || !title) {
  fail("Usage: node skills/lark-slides/scripts/svg_slides_bundle.mjs <deck-dir> --title <title>");
}

const root = path.resolve(deckArg);
const slidesDir = fs.existsSync(path.join(root, "slides")) ? path.join(root, "slides") : root;
if (!fs.existsSync(slidesDir)) {
  fail(`Slides directory not found: ${slidesDir}`);
}

const validator = path.resolve("skills/lark-slides/scripts/validate_svg_deck.mjs");
const validate = spawnSync("node", [validator, root, "--json"], { encoding: "utf8" });
if (!validate.stdout.trim()) {
  process.stderr.write(validate.stderr);
  process.exit(validate.status || 1);
}

const receipt = JSON.parse(validate.stdout);
fs.mkdirSync(path.join(root, "receipts"), { recursive: true });
fs.writeFileSync(path.join(root, "receipts", "validate_svg_deck.json"), `${JSON.stringify(receipt, null, 2)}\n`);
if (receipt.totalErrors !== 0) {
  fail(`SVG deck is not publish-ready: ${receipt.totalErrors} validation error(s)`, 1);
}

const slideFiles = fs.readdirSync(slidesDir)
  .filter((file) => file.endsWith(".svg"))
  .sort();

const pages = slideFiles.map((file, index) => {
  const abs = path.join(slidesDir, file);
  const raw = fs.readFileSync(abs);
  return {
    id: path.basename(file, ".svg"),
    index: index + 1,
    file: path.relative(root, abs).split(path.sep).join("/"),
    sha256: crypto.createHash("sha256").update(raw).digest("hex")
  };
});

const manifest = {
  version: "svglide.manifest.v1",
  protocol: "svg-slides.v1",
  title,
  size: { width: 960, height: 540 },
  publish_ready: true,
  published: false,
  pages,
  receipts: {
    validate_svg_deck: "receipts/validate_svg_deck.json"
  }
};

fs.writeFileSync(path.join(root, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, manifest: path.join(root, "manifest.json"), pages: pages.length }, null, 2));
