"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { BundleDocMeta } from "@/lib/bundles";
import { cn } from "@/lib/utils";

export function LeftSidebarNav({ items }: { items: BundleDocMeta[] }) {
  const pathname = usePathname();

  return (
    <ul className="space-y-1.5">
      {items.map((item) => {
        const href = `/docs/bundles/${item.category}/${item.slug}`;
        const isActive = pathname === href;

        return (
          <li key={`${item.category}-${item.slug}`}>
            <Link
              href={href}
              className={cn(
                "block line-clamp-1 rounded-lg border px-2.5 py-2 text-sm transition-colors duration-200 motion-reduce:transition-none",
                isActive
                  ? "border-primary/25 bg-accent-soft font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:bg-surface-soft hover:text-foreground"
              )}
            >
              {item.title}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
