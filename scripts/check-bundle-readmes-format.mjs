import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const BUNDLES_ROOT = path.join(REPO_ROOT, "packages", "harness-kit", "src", "registry", "bundles");
const VALID_CATEGORIES = new Set(["workflow", "techstack", "stack"]);

function listReadmes(rootDir) {
  const out = [];
  const stack = [rootDir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      if (entry.isFile() && entry.name === "README.md") out.push(full);
    }
  }
  return out.sort();
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function parseFrontmatter(raw) {
  if (!raw.startsWith("---\n")) {
    return { data: {}, content: raw, hasFrontmatter: false };
  }

  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) {
    return { data: {}, content: raw, hasFrontmatter: false };
  }

  const fmRaw = raw.slice(4, end).trim();
  const content = raw.slice(end + 5);
  const data = {};

  for (const line of fmRaw.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    data[key] = value;
  }

  return { data, content, hasFrontmatter: true };
}

function checkReadme(readmePath) {
  const rel = path.relative(BUNDLES_ROOT, readmePath);
  const parts = rel.split(path.sep);
  const category = parts[0];
  const slug = parts[1];

  const raw = fs.readFileSync(readmePath, "utf8");
  const parsed = parseFrontmatter(raw);
  if (!parsed.hasFrontmatter) {
    return [`${rel}: missing frontmatter block at top of file.`];
  }
  const errors = [];

  if (!isNonEmptyString(parsed.data.title)) {
    errors.push(`${rel}: missing frontmatter.title`);
  }
  if (!isNonEmptyString(parsed.data.description)) {
    errors.push(`${rel}: missing frontmatter.description`);
  }
  if (parsed.data.category !== category) {
    errors.push(`${rel}: frontmatter.category must be "${category}"`);
  }
  if (parsed.data.slug !== slug) {
    errors.push(`${rel}: frontmatter.slug must be "${slug}"`);
  }
  if (!VALID_CATEGORIES.has(category)) {
    errors.push(`${rel}: invalid category folder "${category}"`);
  }

  const firstHeading = parsed.content.split("\n").find((line) => line.startsWith("# "));
  if (!firstHeading) {
    errors.push(`${rel}: missing H1 heading in content`);
  } else {
    const heading = firstHeading.replace(/^#\s+/, "").trim();
    const title = String(parsed.data.title ?? "").trim();
    if (heading !== title) {
      errors.push(`${rel}: H1 "${heading}" must match frontmatter.title "${title}"`);
    }
  }

  return errors;
}

const readmes = listReadmes(BUNDLES_ROOT);
const allErrors = [];
for (const readmePath of readmes) {
  allErrors.push(...checkReadme(readmePath));
}

if (allErrors.length > 0) {
  console.error("Bundle README format check failed:");
  for (const err of allErrors) console.error(`- ${err}`);
  process.exit(1);
}

console.log(`Bundle README format check passed (${readmes.length} files).`);
