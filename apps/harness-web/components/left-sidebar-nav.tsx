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
                "block line-clamp-1 rounded-md px-2 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
