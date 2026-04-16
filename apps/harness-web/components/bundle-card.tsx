import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BundleDocMeta } from "@/lib/bundles";

export function BundleCard({ bundle }: { bundle: BundleDocMeta }) {
  return (
    <Link href={`/docs/bundles/${bundle.category}/${bundle.slug}`} className="block">
      <Card className="h-full transition hover:bg-accent/30">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base">{bundle.title}</CardTitle>
            <Badge variant="secondary">{bundle.category}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {bundle.description || "No description yet."}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
