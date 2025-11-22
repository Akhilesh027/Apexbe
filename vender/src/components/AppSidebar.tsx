import {
  LayoutDashboard,
  FolderTree,
  Layers,
  Package,
  ShoppingCart,
  User,
  Settings,
  BarChart3,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Bussiness", url: "/business", icon: LayoutDashboard },
  { title: "Vendor", url: "/vendor", icon: LayoutDashboard },
  { title: "Products", url: "/products", icon: Package },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Reports", url: "/reports", icon: BarChart3 },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + "/");

  return (
    <Sidebar className={open ? "w-64" : "w-16"} collapsible="icon">
      <SidebarContent className="bg-primary">
        <div className="p-4 flex items-center justify-between border-b border-primary-foreground/10">
          {open && (
            <div className="text-primary-foreground">
              <div className="text-lg font-bold">Vendor Panel</div>
              <div className="text-xs opacity-80">E-commerce</div>
            </div>
          )}
          <SidebarTrigger className="text-primary-foreground hover:bg-primary-foreground/10" />
        </div>

        <SidebarGroup className="mt-4">
          {open && (
            <SidebarGroupLabel className="text-primary-foreground/70 px-4">
              Main Menu
            </SidebarGroupLabel>
          )}

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isItemActive = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={
                        isItemActive
                          ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
                          : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                      }
                    >
                      <NavLink to={item.url} end>
                        <item.icon className={open ? "mr-3 h-5 w-5" : "h-5 w-5"} />
                        {open && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
