import fs from "node:fs";
import path from "node:path";

export interface BundleDocMeta {
  category: string;
  slug: string;
  title: string;
  description: string;
  sourceReadme: string;
}

const CONTENT_ROOT = path.join(process.cwd(), "content", "bundles");
const INDEX_PATH = path.join(CONTENT_ROOT, "index.json");

export function readBundleIndex(): BundleDocMeta[] {
  if (!fs.existsSync(INDEX_PATH)) {
    return [];
  }
  const raw = fs.readFileSync(INDEX_PATH, "utf8");
  return JSON.parse(raw) as BundleDocMeta[];
}

export function readBundleDoc(category: string, slug: string): string {
  const docPath = path.join(CONTENT_ROOT, category, `${slug}.mdx`);
  if (!fs.existsSync(docPath)) {
    throw new Error(`Bundle doc not found: ${category}/${slug}`);
  }
  return fs.readFileSync(docPath, "utf8");
}
