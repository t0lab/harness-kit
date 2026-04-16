"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export const STATIC_DOC_ITEMS = [
  { href: "/docs/introduction", label: "Introduction" },
  { href: "/docs/installation", label: "Installation" },
  { href: "/docs/bundles", label: "Bundles" },
  { href: "/docs/cli", label: "CLI" },
  { href: "/docs/changelog", label: "Change log" },
] as const;

export function DocsStaticNav() {
  const pathname = usePathname();

  return (
    <ul className="space-y-1.5">
      {STATIC_DOC_ITEMS.map((item) => {
        const isActive = pathname === item.href;

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "block rounded-lg border px-2.5 py-2 text-sm transition-colors duration-200 motion-reduce:transition-none",
                isActive
                  ? "border-primary/25 bg-accent-soft font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:bg-surface-soft hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
