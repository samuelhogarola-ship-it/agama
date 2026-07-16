import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const validations = readFileSync(join(root, "src/data/agama-color-validations.ts"), "utf8");
const entries = [...validations.matchAll(/"((?:MB|BP)-[A-Z0-9-]+)"\s*:\s*\{\s*hex:\s*"(#[0-9A-Fa-f]{6})"/g)]
  .map((match) => ({ code: match[1], hex: match[2].toUpperCase() }));

if (entries.length === 0) throw new Error("No color validations found");

const seen = new Set();
for (const entry of entries) {
  if (seen.has(entry.code)) throw new Error(`Duplicate color code: ${entry.code}`);
  seen.add(entry.code);
  if (!/^#[0-9A-F]{6}$/.test(entry.hex)) throw new Error(`Invalid HEX for ${entry.code}: ${entry.hex}`);
}

const requiredSamples = ["MB-101", "MB-103", "MB-106", "MB-110", "BP-116", "BP-1009"];
for (const code of requiredSamples) {
  if (!seen.has(code)) throw new Error(`Missing representative validated color: ${code}`);
}

console.log(JSON.stringify({ validatedColors: entries.length, representativeSamples: requiredSamples }, null, 2));
