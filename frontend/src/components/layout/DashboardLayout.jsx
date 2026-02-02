import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./Sidebar";
import { ThemeProvider } from "../../contexts/theme-provider";

export default function DashboardLayout({ children }) {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <SidebarProvider>
        <AppSidebar />
        <SidebarTrigger />
        <main className="flex-1 h-full overflow-y-auto p-6">{children}</main>
      </SidebarProvider>
    </ThemeProvider>
  );
}
