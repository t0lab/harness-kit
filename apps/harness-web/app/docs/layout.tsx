import { LeftSidebar } from "@/components/left-sidebar";
import { SiteHeader } from "@/components/site-header";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-4 px-3 pb-6 pt-4 md:px-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="hidden lg:sticky lg:top-[4.5rem] lg:block lg:h-[calc(100dvh-5rem)]">
          <LeftSidebar />
        </div>
        <main id="main-content" className="min-w-0 flex-1 rounded-2xl glass-panel p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
