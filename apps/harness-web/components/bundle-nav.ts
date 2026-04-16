import type { BundleDocMeta } from "@/lib/bundles";

export const categoryLabel: Record<string, string> = {
  workflow: "Workflow",
  techstack: "Tech Stack",
  stack: "Language Stack",
};

export function getBundleGroups(bundles: BundleDocMeta[]) {
  return bundles.reduce<Record<string, BundleDocMeta[]>>((acc, bundle) => {
    if (!acc[bundle.category]) acc[bundle.category] = [];
    acc[bundle.category].push(bundle);
    return acc;
  }, {});
}
