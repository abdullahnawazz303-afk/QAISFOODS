import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNavbar } from "@/components/TopNavbar";
import { AutoTranslationContainer } from "@/components/AutoTranslationContainer";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AutoTranslationContainer>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <TopNavbar />
            <main className="flex-1 p-3 sm:p-4 md:p-6 pt-16 sm:pt-20 overflow-x-hidden overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </AutoTranslationContainer>
    </SidebarProvider>
  );
}
