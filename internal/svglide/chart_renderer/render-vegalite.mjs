import fs from "node:fs";
import path from "node:path";
import * as vega from "vega";
import * as vegaLite from "vega-lite";

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index < 0 || index + 1 >= process.argv.length) {
    throw new Error(`missing required argument ${name}`);
  }
  return process.argv[index + 1];
}

const input = readArg("--input");
const output = readArg("--output");
const raw = fs.readFileSync(input, "utf8");
const vlSpec = JSON.parse(raw);
const vgSpec = vegaLite.compile(vlSpec).spec;
const view = new vega.View(vega.parse(vgSpec), {
  renderer: "svg",
  logLevel: vega.Warn
});

await view.runAsync();
const svg = await view.toSVG();
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, svg);
view.finalize();
