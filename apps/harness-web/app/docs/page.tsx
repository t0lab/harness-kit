import { BundleCard } from "@/components/bundle-card";
import { CategoryBadge } from "@/components/category-badge";
import { readBundleIndex } from "@/lib/bundles";

export default function DocsHomePage() {
  const bundles = readBundleIndex();
  const categories = Array.from(new Set(bundles.map((bundle) => bundle.category)));

  return (
    <div className="space-y-6">
      <header className="card-frame rounded-2xl p-5 md:p-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Bundle Catalog</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Each page is synced from README in the bundle registry source.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((category) => (
            <CategoryBadge key={category} category={category} />
          ))}
          <span className="rounded-full bg-primary/12 px-2.5 py-1 text-xs font-medium text-primary">
            {bundles.length} bundles
          </span>
        </div>
      </header>
      <div className="grid gap-4 xl:grid-cols-2">
        {bundles.map((bundle) => (
          <BundleCard key={`${bundle.category}-${bundle.slug}`} bundle={bundle} />
        ))}
      </div>
    </div>
  );
}
