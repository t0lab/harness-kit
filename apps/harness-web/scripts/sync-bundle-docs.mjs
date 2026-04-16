import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "../..");
const bundlesRoot = path.join(
  repoRoot,
  "packages",
  "harness-kit",
  "src",
  "registry",
  "bundles",
);
const outRoot = path.join(process.cwd(), "content", "bundles");

function listReadmes(rootDir) {
  const out = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
      } else if (entry.isFile() && entry.name === "README.md") {
        out.push(abs);
      }
    }
  }
  return out;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function firstNonHeadingParagraph(markdown) {
  const lines = markdown.split("\n").map((line) => line.trim());
  const body = lines.filter((line) => line.length > 0 && !line.startsWith("#"));
  return body[0] ?? "";
}

function toTitleFromSlug(slug) {
  return slug
    .split("-")
    .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1))
    .join(" ");
}

function toStringOrEmpty(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseFrontmatter(raw) {
  if (!raw.startsWith("---\n")) {
    return { data: {}, content: raw };
  }

  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) {
    return { data: {}, content: raw };
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

  return { data, content };
}

function sync() {
  ensureDir(outRoot);

  const readmes = listReadmes(bundlesRoot);
  const index = [];

  for (const readmePath of readmes) {
    const rel = path.relative(bundlesRoot, readmePath);
    const parts = rel.split(path.sep);
    if (parts.length < 3) continue;

    const category = parts[0];
    const slug = parts[1];
    const markdown = fs.readFileSync(readmePath, "utf8");
    const parsed = parseFrontmatter(markdown);
    const content = parsed.content.trimStart();

    const titleLine = content.split("\n").find((line) => line.startsWith("# "));
    const fallbackTitle = titleLine ? titleLine.replace(/^#\s+/, "").trim() : toTitleFromSlug(slug);
    const title = toStringOrEmpty(parsed.data.title) || fallbackTitle;
    const description = toStringOrEmpty(parsed.data.description) || firstNonHeadingParagraph(content);

    const outCategory = path.join(outRoot, category);
    ensureDir(outCategory);

    const outPath = path.join(outCategory, `${slug}.mdx`);
    fs.writeFileSync(outPath, content, "utf8");

    index.push({
      category,
      slug,
      title,
      description,
      sourceReadme: path.relative(repoRoot, readmePath),
    });
  }

  index.sort((a, b) => a.category.localeCompare(b.category) || a.slug.localeCompare(b.slug));
  fs.writeFileSync(path.join(outRoot, "index.json"), JSON.stringify(index, null, 2) + "\n", "utf8");

  console.log(`Synced ${index.length} bundle docs.`);
}

sync();
