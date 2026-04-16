import { readBundleIndex } from "@/lib/bundles";
import { categoryLabel, getBundleGroups } from "@/components/bundle-nav";
import { DocsStaticNav } from "@/components/docs-static-nav";
import { LeftSidebarNav } from "@/components/left-sidebar-nav";

export function LeftSidebar() {
  const bundles = readBundleIndex();
  const groups = getBundleGroups(bundles);

  return (
    <aside className="h-full rounded-xl glass-panel-soft p-1">
      <div className="overflow-y-auto h-full p-4 md:p-5">
      <div className="space-y-5">
        <div>
          <p className="mb-1.5 px-2 text-sm font-semibold text-foreground/90">
            Getting Started
          </p>
          <DocsStaticNav />
        </div>
        {Object.entries(groups).map(([category, items]) => (
          <div key={category}>
            <p className="mb-1.5 px-2 text-sm font-semibold text-foreground/90">
              {categoryLabel[category] ?? category}
            </p>
            <LeftSidebarNav items={items ?? []} />
          </div>
        ))}
      </div>
      </div>
    </aside>
  );
}
