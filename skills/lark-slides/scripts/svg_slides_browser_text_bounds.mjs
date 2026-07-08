#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function fail(message, code = 2) {
  console.error(message);
  process.exit(code);
}

const args = process.argv.slice(2);
const targetArg = args.find((arg) => !arg.startsWith("--"));
const outIndex = args.indexOf("--out");
const outPath = outIndex >= 0 ? args[outIndex + 1] : "";

if (!targetArg) {
  fail("Usage: node skills/lark-slides/scripts/svg_slides_browser_text_bounds.mjs <deck-dir-or-slides-dir> [--out <json-path>]");
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  fail("playwright is not installed; install it in a dev environment before browser text-boundary QA", 2);
}

const target = path.resolve(targetArg);
const slidesDir = fs.existsSync(path.join(target, "slides")) ? path.join(target, "slides") : target;
if (!fs.existsSync(slidesDir)) {
  fail(`Slides directory not found: ${slidesDir}`);
}

const slideFiles = fs.readdirSync(slidesDir).filter((file) => file.endsWith(".svg")).sort();
if (!slideFiles.length) {
  fail(`No .svg files found in ${slidesDir}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const results = [];

for (const file of slideFiles) {
  const abs = path.join(slidesDir, file);
  const svg = fs.readFileSync(abs, "utf8");
  await page.setContent(`<!doctype html><html><body style="margin:0">${svg}</body></html>`, { waitUntil: "load" });
  const problems = await page.evaluate(() => {
    return [...document.querySelectorAll("foreignObject")].flatMap((node, index) => {
      if (node.getAttribute("slide:role") !== "shape" || node.getAttribute("slide:shape-type") !== "text") {
        return [];
      }

      const box = node.getBoundingClientRect();
      const children = [...node.children];
      if (!children.length) {
        return [{ index: index + 1, reason: "empty_text_object" }];
      }

      return children.map((child) => {
        const childBox = child.getBoundingClientRect();
        const overflowX = childBox.left < box.left - 0.5 || childBox.right > box.right + 0.5;
        const overflowY = childBox.top < box.top - 0.5 || childBox.bottom > box.bottom + 0.5;
        if (!overflowX && !overflowY) return null;
        return {
          index: index + 1,
          reason: "text_bounds_overflow",
          box: { x: box.x, y: box.y, width: box.width, height: box.height },
          childBox: { x: childBox.x, y: childBox.y, width: childBox.width, height: childBox.height }
        };
      }).filter(Boolean);
    });
  });
  results.push({ file: path.relative(process.cwd(), abs), problemCount: problems.length, problems });
}

await browser.close();

const problemCount = results.reduce((sum, item) => sum + item.problemCount, 0);
const report = { status: problemCount === 0 ? "passed" : "failed", problemCount, results };
const json = `${JSON.stringify(report, null, 2)}\n`;
if (outPath) {
  fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  fs.writeFileSync(outPath, json);
}
process.stdout.write(json);
process.exit(problemCount === 0 ? 0 : 1);
