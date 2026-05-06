import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Search, Eye, CheckCircle2 } from "lucide-react";

const orders = [
  { id: "#ORD-10293", customer: "Riya Sharma", date: "May 5, 2026", total: "₹ 2,499", status: "Placed", items: 3 },
  { id: "#ORD-10292", customer: "Karan Mehta", date: "May 5, 2026", total: "₹ 1,180", status: "Dispatched", items: 2 },
  { id: "#ORD-10291", customer: "Aisha Khan", date: "May 4, 2026", total: "₹ 3,860", status: "Delivered", items: 5 },
  { id: "#ORD-10290", customer: "Vivaan Rao", date: "May 4, 2026", total: "₹ 540", status: "Placed", items: 1 },
  { id: "#ORD-10289", customer: "Neha Patel", date: "May 3, 2026", total: "₹ 2,210", status: "Delivered", items: 4 },
  { id: "#ORD-10288", customer: "Arjun Iyer", date: "May 3, 2026", total: "₹ 980", status: "Cancelled", items: 2 },
];

const statusVariant: Record<string, string> = {
  Placed: "border-info/30 bg-info/10 text-info",
  Dispatched: "border-warning/30 bg-warning/10 text-warning",
  Delivered: "border-success/30 bg-success/10 text-success",
  Cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
};

export default function Orders() {
  return (
    <div>
      <PageHeader
        title="Orders"
        description="Review, approve and track every order through fulfillment."
      />
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between space-y-0">
          <CardTitle>All Orders</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by order or customer" className="w-72 pl-9" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="placed">Placed</SelectItem>
                <SelectItem value="dispatched">Dispatched</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.id}</TableCell>
                  <TableCell>{o.customer}</TableCell>
                  <TableCell>{o.date}</TableCell>
                  <TableCell>{o.items}</TableCell>
                  <TableCell>{o.total}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusVariant[o.status]}>
                      {o.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {o.status === "Placed" && (
                        <Button variant="outline" size="sm">
                          <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                        </Button>
                      )}
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="mr-1 h-4 w-4" /> View
                          </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-lg">
                          <SheetHeader>
                            <SheetTitle>{o.id}</SheetTitle>
                            <SheetDescription>
                              Placed by {o.customer} on {o.date}
                            </SheetDescription>
                          </SheetHeader>
                          <div className="mt-6 space-y-5 text-sm">
                            <div>
                              <p className="mb-2 font-medium">Items</p>
                              <div className="space-y-2 rounded-lg border p-3">
                                {Array.from({ length: o.items }).map((_, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between text-muted-foreground"
                                  >
                                    <span>Item #{i + 1}</span>
                                    <span>₹ {(Math.random() * 800 + 100).toFixed(0)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center justify-between border-t pt-3 font-semibold">
                              <span>Total</span>
                              <span>{o.total}</span>
                            </div>
                            <div className="space-y-2">
                              <p className="font-medium">Update Status</p>
                              <Select defaultValue={o.status.toLowerCase()}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="placed">Placed</SelectItem>
                                  <SelectItem value="dispatched">Dispatched</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button className="w-full">Save</Button>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
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