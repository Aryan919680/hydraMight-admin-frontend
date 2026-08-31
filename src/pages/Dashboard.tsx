import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Users,
  IndianRupee,
  TrendingUp,
  PackageX,
  PackageSearch,
  Clock,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Truck,
  Building2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  api,
  AdminOrder,
  AdminOrderSummary,
  MainInventoryItem,
} from "@/lib/api";

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const statusVariant: Record<string, string> = {
  placed: "bg-info/10 text-info border-info/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  processing: "bg-info/10 text-info border-info/20",
  dispatched: "bg-warning/10 text-warning border-warning/20",
  shipped: "bg-warning/10 text-warning border-warning/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const PORTAL_COLORS: Record<string, string> = {
  household: "hsl(221 83% 53%)",
  commercial: "hsl(142 71% 45%)",
  distributor: "hsl(38 92% 50%)",
  whitelabel: "hsl(199 89% 48%)",
  other: "hsl(220 9% 46%)",
};

type DashboardData = {
  summary: AdminOrderSummary | null;
  orders: AdminOrder[];
  inventory: MainInventoryItem[];
  pendingSignups: number;
  pendingAgencyRequests: number;
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData>({
    summary: null,
    orders: [],
    inventory: [],
    pendingSignups: 0,
    pendingAgencyRequests: 0,
  });

  const load = async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    const [summaryRes, ordersRes, inventoryRes, signupsRes, agencyRes] =
      await Promise.allSettled([
        api.getAdminOrderSummary(),
        api.getAdminOrders({ limit: 200 }),
        api.getMainInventory(),
        api.getCommercialSignups("pending"),
        api.getAgencyRequests({ status: "pending" }),
      ]);

    const summary =
      summaryRes.status === "fulfilled" ? summaryRes.value?.data ?? null : null;
    const orders =
      ordersRes.status === "fulfilled" && Array.isArray(ordersRes.value?.data)
        ? ordersRes.value.data
        : [];
    const inventory =
      inventoryRes.status === "fulfilled" &&
      Array.isArray(inventoryRes.value?.data)
        ? inventoryRes.value.data
        : [];
    const pendingSignups =
      signupsRes.status === "fulfilled" &&
      Array.isArray(signupsRes.value?.data)
        ? signupsRes.value.data.length
        : 0;
    const pendingAgencyRequests =
      agencyRes.status === "fulfilled" &&
      Array.isArray(agencyRes.value?.data)
        ? agencyRes.value.data.length
        : 0;

    setData({ summary, orders, inventory, pendingSignups, pendingAgencyRequests });
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, []);

  // ---- derived metrics ----
  const revenueChart = useMemo(() => {
    const byDay = new Map<string, { revenue: number; orders: number }>();
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      byDay.set(d.toISOString().slice(0, 10), { revenue: 0, orders: 0 });
    }
    data.orders.forEach((o) => {
      const raw = o.placed_at || o.created_at;
      if (!raw) return;
      const key = new Date(raw).toISOString().slice(0, 10);
      const bucket = byDay.get(key);
      if (bucket) {
        bucket.revenue += num(o.total_amount);
        bucket.orders += 1;
      }
    });
    return Array.from(byDay.entries()).map(([date, v]) => ({
      date: new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      }),
      revenue: Math.round(v.revenue),
      orders: v.orders,
    }));
  }, [data.orders]);

  const portalBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    data.orders.forEach((o) => {
      const key = (o.portal_type || "other").toString();
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [data.orders]);

  const statusBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    data.orders.forEach((o) => {
      const key = (o.order_status || "unknown").toString();
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [data.orders]);

  const recentOrders = useMemo(() => {
    return [...data.orders]
      .sort(
        (a, b) =>
          new Date(b.placed_at || b.created_at || 0).getTime() -
          new Date(a.placed_at || a.created_at || 0).getTime()
      )
      .slice(0, 8);
  }, [data.orders]);

  const lowStock = useMemo(
    () =>
      data.inventory.filter(
        (i) => i.is_low_stock || i.is_out_of_stock
      ),
    [data.inventory]
  );

  const outOfStockCount = data.inventory.filter((i) => i.is_out_of_stock).length;
  const totalRevenue = num(data.summary?.total_revenue);
  const todayRevenue = num(data.summary?.today_revenue);
  const totalOrders =
    data.summary?.total_orders ?? data.orders.length;
  const avgOrderValue =
    data.orders.length > 0
      ? data.orders.reduce((s, o) => s + num(o.total_amount), 0) /
        data.orders.length
      : 0;

  const kpis = [
    {
      label: "Total Revenue",
      value: inr(totalRevenue),
      sub: `${inr(todayRevenue)} today`,
      icon: IndianRupee,
      tone: "text-success bg-success/10",
    },
    {
      label: "Total Orders",
      value: String(totalOrders),
      sub: `${data.summary?.pending_approval ?? 0} pending approval`,
      icon: ShoppingCart,
      tone: "text-primary bg-primary/10",
    },
    {
      label: "Avg. Order Value",
      value: inr(avgOrderValue),
      sub: `${data.summary?.delivered_orders ?? 0} delivered`,
      icon: TrendingUp,
      tone: "text-info bg-info/10",
    },
    {
      label: "Active SKUs",
      value: String(data.inventory.length),
      sub: `${outOfStockCount} out of stock`,
      icon: PackageSearch,
      tone: "text-warning bg-warning/10",
    },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Sales activity, revenue and operations at a glance." />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Sales activity, revenue and operations at a glance."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => load(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      />

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{k.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{k.value}</p>
                </div>
                <div className={`rounded-lg p-2 ${k.tone}`}>
                  <k.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue chart + portal split */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue — Last 14 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart} margin={{ left: 8, right: 8 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(221 83% 53%)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(221 83% 53%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(v) => (v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`)}
                  />
                  <Tooltip
                    formatter={(v: number, name: string) =>
                      name === "revenue" ? [inr(v), "Revenue"] : [v, "Orders"]
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(221 83% 53%)"
                    strokeWidth={2}
                    fill="url(#rev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders by Portal</CardTitle>
          </CardHeader>
          <CardContent>
            {portalBreakdown.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No orders yet
              </p>
            ) : (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={portalBreakdown}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {portalBreakdown.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={PORTAL_COLORS[entry.name] || PORTAL_COLORS.other}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-2">
                  {portalBreakdown.map((p) => (
                    <div key={p.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            PORTAL_COLORS[p.name] || PORTAL_COLORS.other,
                        }}
                      />
                      <span className="capitalize text-muted-foreground">{p.name}</span>
                      <span className="ml-auto font-medium">{p.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order status bar + sales activity */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/orders">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Portal</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((o) => {
                    const status = (o.order_status || "placed").toString();
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">
                          {o.order_number || o.order_id || `#${o.id.slice(0, 8)}`}
                        </TableCell>
                        <TableCell>
                          {o.customer_name || o.business_name || "—"}
                        </TableCell>
                        <TableCell className="capitalize">{o.portal_type}</TableCell>
                        <TableCell>{inr(num(o.total_amount))}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              statusVariant[status.toLowerCase()] ||
                              "bg-muted text-muted-foreground border-border"
                            }
                          >
                            {status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sales Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {[
              {
                l: "Pending Approval",
                v: data.summary?.pending_approval ?? 0,
                icon: Clock,
                c: "text-warning",
                to: "/orders",
              },
              {
                l: "Processing",
                v: data.summary?.processing_orders ?? 0,
                icon: RefreshCw,
                c: "text-info",
                to: "/orders",
              },
              {
                l: "Delivered",
                v: data.summary?.delivered_orders ?? 0,
                icon: CheckCircle2,
                c: "text-success",
                to: "/orders",
              },
              {
                l: "Agency Requests",
                v: data.pendingAgencyRequests,
                icon: Truck,
                c: "text-destructive",
                to: "/distributors/agency-requests",
              },
              {
                l: "Commercial Signups",
                v: data.pendingSignups,
                icon: Building2,
                c: "text-primary",
                to: "/commercial-signups",
              },
            ].map((s) => (
              <Link
                key={s.l}
                to={s.to}
                className="flex items-center justify-between border-b border-border/60 pb-3 last:border-0 last:pb-0 hover:opacity-80"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <s.icon className={`h-4 w-4 ${s.c}`} />
                  {s.l}
                </span>
                <span className={`font-semibold ${s.c}`}>{s.v}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Order status chart + stock alerts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusBreakdown.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No orders yet
              </p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusBreakdown} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      width={90}
                    />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(221 83% 53%)" radius={[0, 6, 6, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <PackageX className="h-4 w-4 text-destructive" />
              Stock Alerts
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/inventory">
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {lowStock.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">
                All SKUs are sufficiently stocked
              </p>
            ) : (
              lowStock.slice(0, 6).map((i) => (
                <div
                  key={i.id}
                  className="flex items-center justify-between gap-2 border-b border-border/60 pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {i.item_name || i.product_name || i.sku}
                    </p>
                    <p className="text-xs text-muted-foreground">{i.sku}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      i.is_out_of_stock
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : "bg-warning/10 text-warning border-warning/20"
                    }
                  >
                    {i.is_out_of_stock ? "Out" : `${i.available_stock} left`}
                  </Badge>
                </div>
              ))
            )}
            {lowStock.length > 6 && (
              <p className="flex items-center gap-1 pt-1 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3" />
                {lowStock.length - 6} more SKUs need attention
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
