import { readBundleIndex } from "@/lib/bundles";
import { categoryLabel, getBundleGroups } from "@/components/bundle-nav";
import { LeftSidebarNav } from "@/components/left-sidebar-nav";

export function LeftSidebar() {
  const bundles = readBundleIndex();
  const groups = getBundleGroups(bundles);

  return (
    <aside className="h-full overflow-y-auto rounded-2xl glass-panel-soft p-4">
      <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Bundle Categories
      </p>
      <div className="space-y-4">
        {Object.entries(groups).map(([category, items]) => (
          <div key={category}>
            <p className="mb-1 px-2 text-sm font-semibold text-foreground/90">
              {categoryLabel[category] ?? category}
            </p>
            <LeftSidebarNav items={items ?? []} />
          </div>
        ))}
      </div>
    </aside>
  );
}
