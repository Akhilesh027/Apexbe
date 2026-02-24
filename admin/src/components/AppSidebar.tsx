import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  Settings,
  Grid3x3,
  MapPin,
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
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Vendors", url: "/vendors", icon: Store },
  { title: "Bussiness", url: "/bussiness", icon: Store },
  { title: "Products", url: "/products", icon: Package },
  { title: "Categories", url: "/categories", icon: Grid3x3 },
  { title: "Users", url: "/users", icon: Users },
  { title: "Orders", url: "/orders", icon: ShoppingCart },
  { title: "Referal amount", url: "/withdrow", icon: ShoppingCart },
  { title: "Pincode", url: "/pincode", icon: MapPin },
  { title: "Forms", url: "/Forms", icon: ShoppingCart },
  { title: "Payouts", url: "/payouts", icon: DollarSign },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className="p-4">
          <h1 className={`font-bold text-xl text-sidebar-foreground ${collapsed ? "hidden" : "block"}`}>
            E-Commerce
          </h1>
          {collapsed && (
            <div className="text-sidebar-foreground text-xl font-bold text-center">EC</div>
          )}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "hidden" : "block"}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
