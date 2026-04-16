import Link from "next/link";

import { CommandBlock } from "@/components/command-block";
import { bundleInstallCommand } from "@/lib/commands";
import { CategoryBadge } from "@/components/category-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BundleDocMeta } from "@/lib/bundles";

export function BundleCard({ bundle }: { bundle: BundleDocMeta }) {
  return (
    <Card className="card-frame h-full rounded-2xl transition-transform duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:border-elevated-border">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">
            <Link
              href={`/docs/bundles/${bundle.category}/${bundle.slug}`}
              className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {bundle.title}
            </Link>
          </CardTitle>
          <CategoryBadge category={bundle.category} />
        </div>
      </CardHeader>
      <CardContent>
        <CommandBlock command={bundleInstallCommand(bundle.slug)} label="Install" />
        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{bundle.description || "No description yet."}</p>
        <Link
          href={`/docs/bundles/${bundle.category}/${bundle.slug}`}
          className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
        >
          Read bundle docs
        </Link>
      </CardContent>
    </Card>
  );
}
