import { readBundleIndex } from "@/lib/bundles";
import { LeftSidebarNav } from "@/components/left-sidebar-nav";

const categoryLabel: Record<string, string> = {
  workflow: "Workflow",
  techstack: "Tech Stack",
  stack: "Language Stack",
};

export function LeftSidebar() {
  const bundles = readBundleIndex();
  const groups = bundles.reduce<Record<string, typeof bundles>>((acc, bundle) => {
    if (!acc[bundle.category]) acc[bundle.category] = [];
    acc[bundle.category].push(bundle);
    return acc;
  }, {});

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-72 shrink-0 overflow-y-auto border-r bg-background p-4 lg:block">
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
