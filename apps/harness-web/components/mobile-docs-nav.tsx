"use client";

import { MenuIcon } from "lucide-react";

import { categoryLabel } from "@/components/bundle-nav";
import { DocsStaticNav } from "@/components/docs-static-nav";
import { LeftSidebarNav } from "@/components/left-sidebar-nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { BundleDocMeta } from "@/lib/bundles";

export function MobileDocsNav({ groups }: { groups: Record<string, BundleDocMeta[]> }) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Open documentation navigation"
          />
        }
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent side="left" className="w-[88vw] max-w-sm">
        <SheetHeader>
          <SheetTitle>Docs</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 overflow-y-auto px-4 pb-5">
          <section>
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Getting Started
            </p>
            <DocsStaticNav />
          </section>
          {Object.entries(groups).map(([category, items]) => (
            <section key={category}>
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {categoryLabel[category] ?? category}
              </p>
              <LeftSidebarNav items={items ?? []} />
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
