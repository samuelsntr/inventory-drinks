import {
  Home,
  Users,
  LogOut,
  Package,
  ArrowRightLeft,
  ShoppingCart,
  FileText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navigation = [
    {
      title: "Dashboard",
      icon: Home,
      url: "/dashboard",
    },
    {
      title: "Inventory",
      icon: Package,
      url: "/inventory",
    },
    {
      title: "Stock Transfer",
      icon: ArrowRightLeft,
      url: "/transfer",
    },
    {
      title: "Checkout",
      icon: ShoppingCart,
      url: "/checkout",
    },
  ];

  const adminNavigation = [];
  if (user?.role === "admin" || user?.role === "super admin") {
    adminNavigation.push({
      title: "Audit Logs",
      icon: FileText,
      url: "/logs",
    });
  }
  if (user?.role === "super admin") {
    adminNavigation.unshift({
      title: "User Management",
      icon: Users,
      url: "/users",
    });
  }

  return (
    <Sidebar className="h-screen flex flex-col">
      <SidebarContent className="flex-grow">
        <SidebarGroup>
          <SidebarGroupLabel>User</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-2 rounded-md border bg-muted/40">
              <div className="text-sm font-medium">{user?.username || "-"}</div>
              <div className="text-xs text-muted-foreground">
                {user?.role || "-"}
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Application Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {adminNavigation.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavigation.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.url}
                    >
                      <NavLink to={item.url}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Logout Button */}
      <div className="p-4 border-t border-border mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="w-full flex items-center gap-3 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg px-3 py-2 transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </div>
    </Sidebar>
  );
}
