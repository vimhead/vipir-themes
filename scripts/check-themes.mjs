import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const required = [
  "accent", "border", "borderAccent", "borderMuted", "success", "error", "warning",
  "muted", "dim", "text", "thinkingText", "selectedBg", "userMessageBg",
  "userMessageText", "customMessageBg", "customMessageText", "customMessageLabel",
  "toolPendingBg", "toolSuccessBg", "toolErrorBg", "toolTitle", "toolOutput",
  "mdHeading", "mdLink", "mdLinkUrl", "mdCode", "mdCodeBlock", "mdCodeBlockBorder",
  "mdQuote", "mdQuoteBorder", "mdHr", "mdListBullet", "toolDiffAdded",
  "toolDiffRemoved", "toolDiffContext", "syntaxComment", "syntaxKeyword",
  "syntaxFunction", "syntaxVariable", "syntaxString", "syntaxNumber", "syntaxType",
  "syntaxOperator", "syntaxPunctuation", "thinkingOff", "thinkingMinimal",
  "thinkingLow", "thinkingMedium", "thinkingHigh", "thinkingXhigh", "bashMode",
];
const optional = new Set(["thinkingMax", "scrollbarTrack", "scrollbarThumb", "searchMatchBg", "searchMatchText"]);
const allowed = new Set([...required, ...optional]);
const colorValue = /^#(?:[0-9a-fA-F]{6})$|^$|^[A-Za-z][A-Za-z0-9_-]*$/;
let failed = false;

function report(message) {
  console.error(message);
  failed = true;
}

const files = (await readdir("themes")).filter((file) => file.endsWith(".json")).sort();
const seenNames = new Set();

if (files.length === 0) report("No theme files found.");

for (const file of files) {
  const theme = JSON.parse(await readFile(join("themes", file), "utf8"));
  const vars = theme.vars ?? {};
  const colors = theme.colors ?? {};

  if (!theme.name || theme.name.includes("/")) report(`${file}: invalid theme name.`);
  if (seenNames.has(theme.name)) report(`${file}: duplicate theme name ${theme.name}.`);
  seenNames.add(theme.name);

  for (const token of required) {
    if (!(token in colors)) report(`${file}: missing color token ${token}.`);
  }
  for (const token of Object.keys(colors)) {
    if (!allowed.has(token)) report(`${file}: unknown color token ${token}.`);
  }
  for (const [key, value] of Object.entries({ ...vars, ...colors, ...(theme.export ?? {}) })) {
    if (typeof value === "number") {
      if (!Number.isInteger(value) || value < 0 || value > 255) report(`${file}: ${key} has invalid 256-color value ${value}.`);
      continue;
    }
    if (typeof value !== "string" || !colorValue.test(value)) {
      report(`${file}: ${key} has invalid color value ${JSON.stringify(value)}.`);
      continue;
    }
    if (value && !value.startsWith("#") && !(value in vars)) report(`${file}: ${key} references unknown variable ${value}.`);
  }
}

if (failed) process.exit(1);
console.log(`Checked ${files.length} Pi themes.`);
