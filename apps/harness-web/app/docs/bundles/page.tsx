import type { Metadata } from "next";

import { BundleCard } from "@/components/bundle-card";
import { categoryLabel, getBundleGroups } from "@/components/bundle-nav";
import { readBundleIndex } from "@/lib/bundles";

export const metadata: Metadata = {
  title: "Bundles",
  description: "Browse all harness-kit bundles by category.",
};

export default function BundlesPage() {
  const bundles = readBundleIndex();
  const groups = getBundleGroups(bundles);
  const categories = Object.entries(groups);

  return (
    <article className="w-full space-y-4">
      <h1>Bundles</h1>
      <p>Browse all available bundles and open each detail page for setup notes and install commands.</p>

      {categories.length === 0 ? (
        <p>No bundles are available right now.</p>
      ) : (
        categories.map(([category, items]) => (
          <section key={category} className="mt-8">
            <h2>{categoryLabel[category] ?? category}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((bundle) => (
                <BundleCard key={`${bundle.category}-${bundle.slug}`} bundle={bundle} />
              ))}
            </div>
          </section>
        ))
      )}
    </article>
  );
}
