import {
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const metrics = [
  {
    label: "Total Orders",
    value: "12,486",
    delta: "+8.2%",
    trend: "up" as const,
    icon: ShoppingCart,
  },
  {
    label: "Active Users",
    value: "3,209",
    delta: "+3.4%",
    trend: "up" as const,
    icon: Users,
  },
  {
    label: "Revenue (₹)",
    value: "₹ 48.7L",
    delta: "+12.6%",
    trend: "up" as const,
    icon: DollarSign,
  },
  {
    label: "Avg. Order Value",
    value: "₹ 1,240",
    delta: "-1.2%",
    trend: "down" as const,
    icon: TrendingUp,
  },
];

const recentOrders = [
  { id: "#ORD-10293", customer: "Riya Sharma", total: "₹ 2,499", status: "Placed" },
  { id: "#ORD-10292", customer: "Karan Mehta", total: "₹ 1,180", status: "Dispatched" },
  { id: "#ORD-10291", customer: "Aisha Khan", total: "₹ 3,860", status: "Delivered" },
  { id: "#ORD-10290", customer: "Vivaan Rao", total: "₹ 540", status: "Placed" },
  { id: "#ORD-10289", customer: "Neha Patel", total: "₹ 2,210", status: "Delivered" },
];

const statusVariant: Record<string, string> = {
  Placed: "bg-info/10 text-info border-info/20",
  Dispatched: "bg-warning/10 text-warning border-warning/20",
  Delivered: "bg-success/10 text-success border-success/20",
};

export default function Dashboard() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of orders, users and core metrics."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label} className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{m.value}</p>
                </div>
                <div className="rounded-lg bg-accent p-2 text-accent-foreground">
                  <m.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs">
                {m.trend === "up" ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                )}
                <span
                  className={
                    m.trend === "up" ? "text-success" : "text-destructive"
                  }
                >
                  {m.delta}
                </span>
                <span className="text-muted-foreground">vs last week</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.id}</TableCell>
                    <TableCell>{o.customer}</TableCell>
                    <TableCell>{o.total}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusVariant[o.status]}
                      >
                        {o.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {[
              { l: "Pending Approvals", v: "12", c: "text-warning" },
              { l: "Out of Stock SKUs", v: "8", c: "text-destructive" },
              { l: "Active Operators", v: "24", c: "text-success" },
              { l: "Serviceable Pincodes", v: "146", c: "text-info" },
            ].map((s) => (
              <div
                key={s.l}
                className="flex items-center justify-between border-b border-border/60 pb-3 last:border-0 last:pb-0"
              >
                <span className="text-muted-foreground">{s.l}</span>
                <span className={`font-semibold ${s.c}`}>{s.v}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}