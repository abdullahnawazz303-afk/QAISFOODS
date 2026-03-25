import {
  LayoutDashboard, Package, ShoppingCart, Users, BookOpen,
  Wallet, Landmark, FileText, BarChart3, Store, CreditCard,
  Globe, Trash2, UserCheck,
} from "lucide-react";
import qfLogo from "@/assets/qf-logo.png";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const operationsNav = [
  { title: "Dashboard",        url: "/dashboard",          icon: LayoutDashboard },
  { title: "Inventory",        url: "/inventory",          icon: Package },
  { title: "Sales",            url: "/sales",              icon: ShoppingCart },
  { title: "Customers",        url: "/customers",          icon: Users },
  { title: "Customer Ledger",  url: "/customer-ledger",    icon: BookOpen },
  { title: "Customer Requests",url: "/customer-requests",  icon: UserCheck },
  { title: "Vendors",          url: "/vendors",            icon: Store },
  { title: "Vendor Ledger",    url: "/vendor-ledger",      icon: BookOpen },
  { title: "Vendor Payables",  url: "/vendor-payables",    icon: Landmark },
  { title: "Advance Bookings", url: "/advance-bookings",   icon: FileText },
  { title: "Waste Management", url: "/waste",              icon: Trash2 },
  { title: "Online Orders",    url: "/online-orders",      icon: Globe },
];

const financeNav = [
  { title: "Bank & Cheques",   url: "/bank-cheques",       icon: CreditCard },
  { title: "Daily Cash Flow",  url: "/cash-flow",          icon: Wallet },
  { title: "Reports",          url: "/reports",            icon: BarChart3 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location  = useLocation();

  // ── Live pending counts for badges
  const [badges, setBadges] = useState<{ requests: number, bookings: number, orders: number, cheques: number }>({
    requests: 0, bookings: 0, orders: 0, cheques: 0
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [
          { count: requests },
          { count: bookings },
          { count: orders },
          { count: cheques }
        ] = await Promise.all([
          supabase.from("customer_requests").select("*", { count: "exact", head: true }).eq("status", "Pending"),
          supabase.from("advance_bookings").select("*", { count: "exact", head: true }).neq("status", "Fully Paid"),
          supabase.from("online_orders").select("*", { count: "exact", head: true }).eq("status", "Pending"),
          supabase.from("cheques").select("*", { count: "exact", head: true }).eq("status", "Pending")
        ]);

        setBadges({
          requests: requests ?? 0,
          bookings: bookings ?? 0,
          orders: orders ?? 0,
          cheques: cheques ?? 0
        });
      } catch (err) {
        console.error("Failed to fetch sidebar counts:", err);
      }
    };
    
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000); // 1 minute refresh
    return () => clearInterval(interval);
  }, []);

  const isActive = (url: string) =>
    url === "/dashboard"
      ? location.pathname === url
      : location.pathname.startsWith(url);

  // Helper to get count for a specific sidebar url
  const getBadgeCount = (url: string) => {
    switch (url) {
      case "/customer-requests": return badges.requests;
      case "/advance-bookings": return badges.bookings;
      case "/online-orders": return badges.orders;
      case "/bank-cheques": return badges.cheques;
      default: return 0;
    }
  };

  const renderBadge = (url: string) => {
    const count = getBadgeCount(url);
    if (collapsed || count <= 0) return null;
    return (
      <span className="ml-auto text-[11px] font-semibold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 min-w-[20px] text-center shadow-sm">
        {count}
      </span>
    );
  };

  return (
    <Sidebar collapsible="icon" className="overflow-hidden">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
           <img src={qfLogo} alt="QF Logo" className="w-10 h-10 object-contain shrink-0" />
           {!collapsed && (
             <div className="flex flex-col">
               <span className="font-semibold text-base text-sidebar-primary tracking-tight">Qais Food</span>
               <span className="text-[11px] font-medium text-sidebar-foreground/60">Pulses &amp; Rice</span>
             </div>
           )}
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-none">

        {/* Operations */}
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      className={cn(isActive(item.url) && "bg-sidebar-accent text-sidebar-primary font-medium")}
                    >
                      <item.icon className="h-4 w-4 mr-2 shrink-0" />
                      {!collapsed && (
                        <span className="flex items-center justify-between w-full">
                          {item.title}
                          {renderBadge(item.url)}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Finance */}
        <SidebarGroup>
          <SidebarGroupLabel>Finance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      to={item.url}
                      className={cn(isActive(item.url) && "bg-sidebar-accent text-sidebar-primary font-medium")}
                    >
                      <item.icon className="h-4 w-4 mr-2 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
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