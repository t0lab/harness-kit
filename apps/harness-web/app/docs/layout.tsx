import { LeftSidebar } from "@/components/left-sidebar";
import { SiteHeader } from "@/components/site-header";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <LeftSidebar />
        <main className="min-w-0 flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
