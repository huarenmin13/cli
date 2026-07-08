#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function usage() {
  console.error("Usage: node skills/lark-slides/scripts/validate_svg_deck.mjs <deck-dir-or-slides-dir> [--json]");
}

const args = process.argv.slice(2);
const json = args.includes("--json");
const targetArg = args.find((arg) => !arg.startsWith("--"));

if (!targetArg) {
  usage();
  process.exit(2);
}

const target = path.resolve(targetArg);
const slidesDir = fs.existsSync(path.join(target, "slides")) ? path.join(target, "slides") : target;

if (!fs.existsSync(slidesDir)) {
  console.error(`Slides directory not found: ${slidesDir}`);
  process.exit(2);
}

const slideFiles = fs.readdirSync(slidesDir)
  .filter((file) => file.endsWith(".svg"))
  .sort()
  .map((file) => path.join(slidesDir, file));

if (!slideFiles.length) {
  console.error(`No .svg files found in: ${slidesDir}`);
  process.exit(2);
}

function commandExists(name) {
  const result = spawnSync("sh", ["-lc", `command -v ${name}`], { encoding: "utf8" });
  return result.status === 0;
}

function checkXml(file, errors) {
  if (!commandExists("xmllint")) {
    errors.push({
      rule: "xml.valid",
      severity: "warn",
      message: "xmllint is unavailable; XML parser check skipped",
    });
    return;
  }
  const result = spawnSync("xmllint", ["--noout", file], { encoding: "utf8" });
  if (result.status !== 0) {
    errors.push({
      rule: "xml.valid",
      severity: "error",
      message: (result.stderr || result.stdout || "xmllint failed").trim(),
    });
  }
}

function firstElementAfterDefs(svg) {
  const rootOpen = svg.match(/<svg\b[^>]*>/);
  if (!rootOpen) return null;
  let inner = svg.slice(rootOpen.index + rootOpen[0].length, svg.lastIndexOf("</svg>")).trim();
  if (inner.startsWith("<defs")) {
    const end = inner.indexOf("</defs>");
    if (end === -1) return null;
    inner = inner.slice(end + "</defs>".length).trim();
  }
  return inner.match(/^<([a-zA-Z][\w:-]*)\b([^>]*)>/)?.[0] || null;
}

function stripDefs(svg) {
  return svg.replace(/<defs\b[\s\S]*?<\/defs>/g, "");
}

function attrValue(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return tag.match(new RegExp(`${escaped}="([^"]*)"`))?.[1] || "";
}

function isColorValueAllowed(value) {
  return /^(rgba?\([^)]*\)|url\(#[-\w]+\))$/.test(value.trim());
}

function checkSlide(file) {
  const rel = path.relative(process.cwd(), file);
  const svg = fs.readFileSync(file, "utf8");
  const errors = [];

  checkXml(file, errors);

  const root = svg.match(/<svg\b[^>]*>/)?.[0] || "";
  if (!root) {
    errors.push({ rule: "svg.root", severity: "error", message: "missing <svg> root" });
  } else {
    if (!/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(root)) {
      errors.push({ rule: "svg.root.xmlns", severity: "error", message: "missing SVG namespace" });
    }
    if (!/xmlns:slide="https:\/\/slides\.bytedance\.com\/ns"/.test(root)) {
      errors.push({ rule: "svg.root.slide-xmlns", severity: "error", message: "missing slide namespace" });
    }
    if (!/slide:role="slide"/.test(root)) {
      errors.push({ rule: "svg.root.slide-role", severity: "error", message: "root must have slide:role=\"slide\"" });
    }
    if (!/id="[^"]+"/.test(root)) {
      errors.push({ rule: "svg.root.id", severity: "error", message: "root must have id" });
    }
    if (!/viewBox="0 0 1280 720"/.test(root)) {
      errors.push({ rule: "svg.root.viewBox", severity: "error", message: "expected viewBox=\"0 0 1280 720\"" });
    }
  }

  if (/<presentation\b/.test(svg)) {
    errors.push({ rule: "svg.no-presentation-wrapper", severity: "error", message: "single slide file must not wrap with <presentation>" });
  }

  const first = firstElementAfterDefs(svg);
  const backgroundCount = (svg.match(/slide:role="background"/g) || []).length;
  if (backgroundCount !== 1) {
    errors.push({ rule: "background.count", severity: "error", message: `expected exactly one background, found ${backgroundCount}` });
  }
  if (!first || !/^(<rect\b|<image\b)/.test(first) || !/slide:role="background"/.test(first)) {
    errors.push({ rule: "background.first-child", severity: "error", message: "first rendered child after optional <defs> must be the background" });
  }

  const bodyNoDefs = stripDefs(svg);
  const forbidden = [
    { rule: "forbid.style-block", re: /<style\b/, message: "slide SVG must not rely on <style> blocks" },
    { rule: "forbid.css-class", re: /\bclass="/, message: "slide SVG must not rely on CSS classes" },
    { rule: "forbid.div-wrapper", re: /<div\b/, message: "text foreignObject must not contain <div>" },
    { rule: "forbid.section-wrapper", re: /<section\b/, message: "text foreignObject must not contain <section>" },
    { rule: "forbid.svg-text", re: /<text\b/, message: "use foreignObject rich text, not SVG <text>" },
    { rule: "forbid.svg-marker", re: /\bmarker-(start|end|mid)=|<marker\b/, message: "line arrowheads must use slide:* arrow attributes, not SVG marker" },
    { rule: "forbid.legacy-fontSize", re: /\bfontSize="/, message: "text visual properties must be in style, not legacy fontSize attribute" },
    { rule: "forbid.legacy-bold", re: /\bbold="/, message: "text visual properties must be in style, not legacy bold attribute" },
  ];
  for (const item of forbidden) {
    if (item.re.test(bodyNoDefs)) {
      errors.push({ rule: item.rule, severity: "error", message: item.message });
    }
  }

  for (const match of bodyNoDefs.matchAll(/\b(fill|stroke|stop-color)="([^"]+)"/g)) {
    const [, attr, value] = match;
    if (!isColorValueAllowed(value)) {
      errors.push({
        rule: "color.attr",
        severity: "error",
        message: `${attr} must be rgb(...), rgba(...), or url(#...); got ${JSON.stringify(value)}`,
      });
    }
  }
  for (const match of bodyNoDefs.matchAll(/(?:^|;)\s*color\s*:\s*([^;"]+)/g)) {
    const value = match[1].trim();
    if (!/^rgba?\([^)]*\)$/.test(value)) {
      errors.push({
        rule: "color.css",
        severity: "error",
        message: `CSS color must be rgb(...) or rgba(...); got ${JSON.stringify(value)}`,
      });
    }
  }

  const foreignObjects = [...svg.matchAll(/<foreignObject\b([^>]*)>([\s\S]*?)<\/foreignObject>/g)];
  for (const [index, match] of foreignObjects.entries()) {
    const attrText = match[1];
    const inner = match[2].trim();
    const label = `foreignObject #${index + 1}`;
    const isTextObject = /slide:role="shape"/.test(attrText) && /slide:shape-type="text"/.test(attrText);
    if (!isTextObject) continue;

    for (const attr of ["x", "y", "width", "height"]) {
      if (!new RegExp(`\\b${attr}="[-0-9.]+`).test(attrText)) {
        errors.push({ rule: "text.geometry", severity: "error", message: `${label} missing numeric ${attr}` });
      }
    }

    const styleText = attrValue(match[0], "style");
    if (!/font-size:\s*\d+(?:\.\d+)?px/.test(styleText)) {
      errors.push({ rule: "text.style.font-size", severity: "error", message: `${label} missing font-size with px suffix in style` });
    }
    if (!/color:\s*rgba?\(/.test(styleText)) {
      errors.push({ rule: "text.style.color", severity: "error", message: `${label} missing rgb/rgba color in style` });
    }

    if (!/^<(p|ul|ol|h1|h2|h3|small)\b/.test(inner)) {
      errors.push({
        rule: "text.direct-child",
        severity: "error",
        message: `${label} first direct child must be p/ul/ol/h1/h2/h3/small, got ${inner.slice(0, 40) || "empty"}`,
      });
    }
    if (/<(div|section)\b/.test(inner)) {
      errors.push({ rule: "text.no-wrapper", severity: "error", message: `${label} contains an invalid wrapper element` });
    }
    if (/^([^<]|\s)+$/.test(inner)) {
      errors.push({ rule: "text.no-bare-text", severity: "error", message: `${label} contains bare text instead of xhtml children` });
    }
  }

  for (const match of bodyNoDefs.matchAll(/<line\b([^>]*)>/g)) {
    const attrs = match[1];
    if (!/slide:role="shape"/.test(attrs) || !/slide:shape-type="line"/.test(attrs)) {
      errors.push({ rule: "line.role", severity: "error", message: "line must carry slide:role=\"shape\" and slide:shape-type=\"line\"" });
    }
    if (!/\bstroke="rgba?\(/.test(attrs)) {
      errors.push({ rule: "line.stroke", severity: "error", message: "line must have rgb/rgba stroke" });
    }
  }

  return { file: rel, errorCount: errors.filter((item) => item.severity === "error").length, errors };
}

const results = slideFiles.map(checkSlide);
const totalErrors = results.reduce((sum, result) => sum + result.errorCount, 0);
const report = {
  target: path.relative(process.cwd(), target),
  slidesDir: path.relative(process.cwd(), slidesDir),
  slideCount: slideFiles.length,
  totalErrors,
  results,
};

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`SVG deck validation: ${report.target}`);
  console.log(`Slides: ${report.slideCount}`);
  console.log(`Errors: ${report.totalErrors}`);
  for (const result of results) {
    const status = result.errorCount ? "FAIL" : "PASS";
    console.log(`\n[${status}] ${result.file}`);
    for (const error of result.errors) {
      if (error.severity === "warn") {
        console.log(`  WARN ${error.rule}: ${error.message}`);
      } else {
        console.log(`  ${error.rule}: ${error.message}`);
      }
    }
  }
}

process.exit(totalErrors ? 1 : 0);
