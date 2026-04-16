import fs from "node:fs";
import path from "node:path";

const contentRoot = path.join(process.cwd(), "content", "bundles");
const indexPath = path.join(contentRoot, "index.json");

if (!fs.existsSync(indexPath)) {
  console.error("Missing content index. Run `pnpm --filter harness-web sync:bundles` first.");
  process.exit(1);
}

const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
let missing = 0;

for (const item of index) {
  const mdxPath = path.join(contentRoot, item.category, `${item.slug}.mdx`);
  if (!fs.existsSync(mdxPath)) {
    missing += 1;
    console.error(`Missing doc file: ${item.category}/${item.slug}.mdx`);
  }
}

if (missing > 0) {
  console.error(`Integrity check failed. Missing files: ${missing}`);
  process.exit(1);
}

console.log(`Integrity check passed for ${index.length} bundle pages.`);
