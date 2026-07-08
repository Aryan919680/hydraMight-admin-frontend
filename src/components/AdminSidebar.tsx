import { NavLink, useLocation } from "react-router-dom";
import {
  Package,
  Boxes,
  Tags,
  ShoppingCart,
  MapPin,
  Sparkles,
  Building2,
  Truck,
  LayoutGrid,
  ChevronDown,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

type BadgeTone = "danger" | "success" | "info" | "muted";

type SubItem = {
  title: string;
  url: string;
  badge?: { label: string; tone: BadgeTone };
  disabled?: boolean;
};

type NavItem = {
  title: string;
  url: string;
  icon: typeof Package;
  badge?: { label: string; tone: BadgeTone };
  children?: SubItem[];
};

type NavSection = { label: string; items: NavItem[] };

const sections: NavSection[] = [
  {
    label: "Operations",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutGrid },
      {
        title: "Orders",
        url: "/orders",
        icon: ShoppingCart,
        badge: { label: "14", tone: "danger" },
      },
    ],
  },
  {
    label: "Catalogue",
    items: [
      {
        title: "Products",
        url: "/products",
        icon: Package,
        children: [
          { title: "Ecom catalogue", url: "/products" },
          { title: "Distributor catalogue", url: "/distributor-products" },
          {
            title: "White label",
            url: "#",
            disabled: true,
            badge: { label: "soon", tone: "muted" },
          },
        ],
      },
      {
        title: "Categories",
        url: "/categories",
        icon: Tags,
        children: [
          { title: "Manage categories", url: "/categories" },
          { title: "Sort & visibility", url: "/categories?view=sort" },
        ],
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        title: "Stock",
        url: "/inventory",
        icon: Boxes,
        children: [
          { title: "Main inventory", url: "/inventory" },
          { title: "Channel allocation", url: "/inventory?view=channel" },
          { title: "Bulk upload", url: "/inventory?view=bulk" },
        ],
      },
      {
        title: "Locations",
        url: "/locations",
        icon: MapPin,
        children: [
          { title: "Service areas", url: "/locations" },
          { title: "Add location", url: "/locations?action=add" },
        ],
      },
    ],
  },
  {
    label: "Network",
    items: [
      {
        title: "Distributors",
        url: "/distributors",
        icon: Truck,
        children: [
          { title: "Stockists", url: "/distributors" },
          { title: "Agencies", url: "/distributors?tab=agencies" },
          {
            title: "Agency requests",
            url: "/distributors?tab=requests",
            badge: { label: "2", tone: "danger" },
          },
        ],
      },
      {
        title: "Commercial signups",
        url: "/commercial-signups",
        icon: Building2,
        badge: { label: "3", tone: "success" },
      },
    ],
  },
];

function NavBadge({
  label,
  tone,
}: {
  label: string;
  tone: BadgeTone;
}) {
  const toneClass =
    tone === "danger"
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : tone === "success"
      ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
      : tone === "info"
      ? "bg-primary/15 text-primary border-primary/30"
      : "bg-muted text-muted-foreground border-border";
  return (
    <Badge
      variant="outline"
      className={`ml-auto h-5 rounded-full border px-2 text-[10px] font-medium ${toneClass}`}
    >
      {label}
    </Badge>
  );
}

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  const isActive = (path: string) => {
    const clean = path.split("?")[0];
    if (clean === "/") return pathname === "/";
    return pathname === clean;
  };

  const isParentActive = (item: NavItem) => {
    if (!item.children) return isActive(item.url);
    return item.children.some((c) => isActive(c.url));
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>

          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                HydraMight Admin
              </span>
              <span className="text-xs text-sidebar-foreground/60">
                Control center
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {section.label}
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = isParentActive(item);

                  if (!item.children || collapsed) {
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={active}>
                          <NavLink
                            to={item.url}
                            className="flex items-center gap-2"
                          >
                            <item.icon className="h-4 w-4" />
                            {!collapsed && (
                              <>
                                <span className="truncate">{item.title}</span>
                                {item.badge && (
                                  <NavBadge
                                    label={item.badge.label}
                                    tone={item.badge.tone}
                                  />
                                )}
                              </>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <Collapsible
                      key={item.title}
                      defaultOpen={active}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton isActive={active}>
                            <item.icon className="h-4 w-4" />
                            <span className="truncate">{item.title}</span>
                            {item.badge && (
                              <NavBadge
                                label={item.badge.label}
                                tone={item.badge.tone}
                              />
                            )}
                            <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children.map((child) => {
                              const childActive = isActive(child.url);
                              return (
                                <SidebarMenuSubItem key={child.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={childActive}
                                  >
                                    {child.disabled ? (
                                      <span className="flex cursor-not-allowed items-center gap-2 opacity-60">
                                        <span className="truncate">
                                          {child.title}
                                        </span>
                                        {child.badge && (
                                          <NavBadge
                                            label={child.badge.label}
                                            tone={child.badge.tone}
                                          />
                                        )}
                                      </span>
                                    ) : (
                                      <NavLink
                                        to={child.url}
                                        className="flex items-center gap-2"
                                      >
                                        <span className="truncate">
                                          {child.title}
                                        </span>
                                        {child.badge && (
                                          <NavBadge
                                            label={child.badge.label}
                                            tone={child.badge.tone}
                                          />
                                        )}
                                      </NavLink>
                                    )}
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}