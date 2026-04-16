import { cn } from "@/lib/utils";

const CATEGORY_CLASSES: Record<string, string> = {
  workflow: "border-cyan-500/35 bg-cyan-500/12 text-cyan-700 dark:text-cyan-300",
  techstack: "border-violet-500/35 bg-violet-500/12 text-violet-700 dark:text-violet-300",
  stack: "border-emerald-500/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
};

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium",
        CATEGORY_CLASSES[category] ?? "border-elevated-border bg-surface-glass text-muted-foreground"
      )}
    >
      {category}
    </span>
  );
}
