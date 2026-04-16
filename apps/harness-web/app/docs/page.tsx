import { BundleCard } from "@/components/bundle-card";
import { readBundleIndex } from "@/lib/bundles";

export default function DocsHomePage() {
  const bundles = readBundleIndex();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bundle Catalog</h1>
        <p className="mt-2 text-muted-foreground">
          Each page is synced from README in the bundle registry source.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bundles.map((bundle) => (
          <BundleCard key={`${bundle.category}-${bundle.slug}`} bundle={bundle} />
        ))}
      </div>
    </div>
  );
}
