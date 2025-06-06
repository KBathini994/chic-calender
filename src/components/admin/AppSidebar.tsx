
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Calendar,
  CreditCard,
  Home,
  Package,
  Settings,
  Scissors,
  Users,
  FileBarChart,
  Map,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: <Home className="mr-2 h-4 w-4" />,
  },
  {
    title: "Bookings",
    href: "/admin/bookings",
    icon: <Calendar className="mr-2 h-4 w-4" />,
  },
  {
    title: "Services",
    href: "/admin/services",
    icon: <Scissors className="mr-2 h-4 w-4" />,
  },
  {
    title: "Staff",
    href: "/admin/staff",
    icon: <Users className="mr-2 h-4 w-4" />,
  },
  {
    title: "Inventory",
    href: "/admin/inventory",
    icon: <Package className="mr-2 h-4 w-4" />,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: <FileBarChart className="mr-2 h-4 w-4" />,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: <Settings className="mr-2 h-4 w-4" />,
  },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const { setOpen, open, toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();
  const [businessDetails, setBusinessDetails] = useState({
    name: "",
    logo_url: null
  });
  const [isLoading, setIsLoading] = useState(true);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [isMobile, setOpen]);

  // Fetch business details
  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        const { data, error } = await supabase
          .from("business_details")
          .select("name, logo_url")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching business details:", error);
          return;
        }

        if (data) {
          setBusinessDetails({
            name: data.name || "",
            logo_url: data.logo_url
          });
        }
      } catch (error) {
        console.error("Failed to load business details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessDetails();
  }, []);

  return (
    <div 
      className={cn(
        "relative flex h-screen flex-col border-r bg-background transition-all duration-300",
        open ? "w-[240px]" : "w-[60px]"
      )}
    >
      <div className="flex h-14 items-center px-3 border-b justify-between">
        <Link to="/admin" className={cn("flex items-center justify-center flex-1", !open && "justify-center")}>
          {businessDetails.logo_url ? (
            <img 
              src={businessDetails.logo_url} 
              alt="Salon Logo" 
              className="h-8 w-8 rounded" 
            />
          ) : (
            <CreditCard className="h-8 w-8" />
          )}
          {open && businessDetails.name && (
            <span className={cn("ml-2 text-lg font-semibold transition-opacity overflow-hidden text-ellipsis whitespace-nowrap", 
              open ? "opacity-100 max-w-[160px]" : "opacity-0 max-w-0"
            )}>
              {isLoading ? <Skeleton className="h-5 w-24" /> : businessDetails.name}
            </span>
          )}
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          className="flex-shrink-0"
          onClick={toggleSidebar}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <nav className="grid items-start px-2 py-4 gap-1">
          {sidebarNavItems.map((item, index) => (
            <Link to={item.href} key={index}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn("w-full justify-start", {
                  "bg-muted": pathname === item.href,
                })}
                title={!open ? item.title : undefined}
              >
                {React.cloneElement(item.icon, { 
                  className: cn(
                    item.icon.props.className, 
                    !open && "mr-0 mx-auto"
                  ) 
                })}
                {open && <span className="transition-opacity">{item.title}</span>}
              </Button>
            </Link>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}
