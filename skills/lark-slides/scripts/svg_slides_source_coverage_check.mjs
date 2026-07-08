#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const rootArg = process.argv.find((arg) => !arg.startsWith("--") && arg !== process.argv[1] && arg !== process.argv[0]);
const root = path.resolve(rootArg || "skills/lark-slides/references/svg-slides");
const json = process.argv.includes("--json");
const manifestPath = path.join(root, "source", "split-manifest.json");

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function coverageBlock(markdown) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === "## Source Coverage");
  if (start === -1) return "";
  const block = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^#{1,2}\s+/.test(lines[i])) break;
    block.push(lines[i]);
  }
  return block.join("\n");
}

function coverageIds(block) {
  const match = block.match(/^- Covers manifest sections:\s*(.+)$/m);
  if (!match) return [];
  return match[1].split(",").map((value) => value.trim()).filter(Boolean);
}

const errors = [];
if (!fs.existsSync(manifestPath)) {
  errors.push(`missing manifest: ${manifestPath}`);
}

const manifest = errors.length === 0 ? JSON.parse(readText(manifestPath)) : { sections: [] };
const sectionsById = new Map(manifest.sections.map((section) => [section.id, section]));
const seen = new Map();

if (fs.existsSync(root)) {
  for (const entry of fs.readdirSync(root)) {
    if (!entry.endsWith(".md")) continue;
    const filePath = path.join(root, entry);
    const block = coverageBlock(readText(filePath));
    if (!block) {
      errors.push(`${entry}: missing ## Source Coverage`);
      continue;
    }
    const ids = coverageIds(block);
    if (ids.length === 0) {
      errors.push(`${entry}: missing "- Covers manifest sections:" line`);
      continue;
    }
    for (const id of ids) {
      const section = sectionsById.get(id);
      if (!section) {
        errors.push(`${entry}: unknown manifest section "${id}"`);
        continue;
      }
      if (section.target !== entry) {
        errors.push(`${entry}: section "${id}" belongs to ${section.target}`);
      }
      const files = seen.get(id) || [];
      files.push(entry);
      seen.set(id, files);
    }
  }
}

for (const section of manifest.sections) {
  const files = seen.get(section.id) || [];
  if (files.length === 0) {
    errors.push(`${section.id}: not covered by ${section.target}`);
  }
  if (files.length > 1) {
    errors.push(`${section.id}: covered multiple times by ${files.join(", ")}`);
  }
}

const report = {
  root,
  manifest: manifestPath,
  sectionCount: manifest.sections.length,
  coveredCount: seen.size,
  errors
};

if (json) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else if (errors.length === 0) {
  console.log(`Source coverage OK: ${report.coveredCount}/${report.sectionCount} sections`);
} else {
  console.error(`Source coverage failed: ${errors.length} errors`);
  for (const error of errors) console.error(`- ${error}`);
}

process.exit(errors.length === 0 ? 0 : 1);
