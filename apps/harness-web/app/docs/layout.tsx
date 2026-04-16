import { LeftSidebar } from "@/components/left-sidebar";
import { SiteHeader } from "@/components/site-header";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <SiteHeader />
      <div className="flex w-full flex-1 min-h-0 gap-3 overflow-hidden md:gap-4">
        <div className="hidden w-72 flex-none min-h-0 lg:block lg:py-3 lg:pl-3">
          <LeftSidebar />
        </div>
        <main
          id="main-content"
          className="min-w-0 flex-1 overflow-y-auto py-3 px-3 md:py-4 md:pr-4"
        >
          <div className="rounded-xl glass-panel flex min-h-full overflow-hidden p-5 md:p-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
