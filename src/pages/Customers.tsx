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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const customers = [
  { name: "Riya Sharma", email: "riya@example.com", orders: 12, spend: "₹ 18,420", active: true },
  { name: "Karan Mehta", email: "karan@example.com", orders: 8, spend: "₹ 9,640", active: true },
  { name: "Aisha Khan", email: "aisha@example.com", orders: 23, spend: "₹ 41,200", active: true },
  { name: "Vivaan Rao", email: "vivaan@example.com", orders: 2, spend: "₹ 1,180", active: false },
  { name: "Neha Patel", email: "neha@example.com", orders: 17, spend: "₹ 26,540", active: true },
];

export default function Customers() {
  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage customer accounts and review purchase history."
      />
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Lifetime Spend</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.email}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                          {c.name.split(" ").map((s) => s[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{c.orders}</TableCell>
                  <TableCell>{c.spend}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        c.active
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-muted bg-muted text-muted-foreground"
                      }
                    >
                      {c.active ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch defaultChecked={c.active} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View orders
                    </Button>
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