import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const logs = [
  { time: "May 5, 2026 10:42", actor: "Aarav Desai", action: "Order Approved", target: "#ORD-10293", type: "order" },
  { time: "May 5, 2026 10:21", actor: "Priya Nair", action: "Product Updated", target: "P-002", type: "product" },
  { time: "May 5, 2026 09:58", actor: "Rohit Singh", action: "Stock Added", target: "SKU-1004 (+50)", type: "inventory" },
  { time: "May 4, 2026 18:11", actor: "Aarav Desai", action: "Customer Disabled", target: "vivaan@example.com", type: "customer" },
  { time: "May 4, 2026 16:02", actor: "Priya Nair", action: "Price Changed", target: "P-001 ₹720→₹699", type: "pricing" },
  { time: "May 4, 2026 11:32", actor: "Rohit Singh", action: "Order Dispatched", target: "#ORD-10292", type: "order" },
];

const typeColor: Record<string, string> = {
  order: "border-info/30 bg-info/10 text-info",
  product: "border-primary/30 bg-primary/10 text-primary",
  inventory: "border-warning/30 bg-warning/10 text-warning",
  customer: "border-destructive/30 bg-destructive/10 text-destructive",
  pricing: "border-success/30 bg-success/10 text-success",
};

export default function AuditLogs() {
  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Trace every meaningful action across the admin panel."
      />
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>Activity</CardTitle>
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search logs" className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {l.time}
                  </TableCell>
                  <TableCell className="font-medium">{l.actor}</TableCell>
                  <TableCell>{l.action}</TableCell>
                  <TableCell className="text-muted-foreground">{l.target}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={typeColor[l.type]}>
                      {l.type}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}