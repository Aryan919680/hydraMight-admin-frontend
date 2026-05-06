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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Minus, AlertTriangle } from "lucide-react";

const inventory = [
  { sku: "SKU-1001", name: "Organic Basmati Rice 5kg", stock: 124, threshold: 20, blocked: false },
  { sku: "SKU-1002", name: "Cold Pressed Mustard Oil 1L", stock: 8, threshold: 15, blocked: true },
  { sku: "SKU-1003", name: "Himalayan Pink Salt 500g", stock: 0, threshold: 10, blocked: true },
  { sku: "SKU-1004", name: "Almonds Premium 250g", stock: 56, threshold: 25, blocked: false },
  { sku: "SKU-1005", name: "Whole Wheat Atta 10kg", stock: 230, threshold: 30, blocked: false },
  { sku: "SKU-1006", name: "Filter Coffee Powder 500g", stock: 12, threshold: 15, blocked: false },
];

export default function Inventory() {
  const lowCount = inventory.filter((i) => i.stock <= i.threshold).length;
  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Track stock levels, restock and block out-of-stock products."
      />
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total SKUs</p>
            <p className="mt-2 text-2xl font-semibold">{inventory.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Low / Out of stock</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-warning">
              <AlertTriangle className="h-5 w-5" /> {lowCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Units</p>
            <p className="mt-2 text-2xl font-semibold">
              {inventory.reduce((s, i) => s + i.stock, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Adjust</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Block</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((i) => {
                const out = i.stock === 0;
                const low = i.stock <= i.threshold && !out;
                return (
                  <TableRow key={i.sku}>
                    <TableCell className="font-mono text-xs">{i.sku}</TableCell>
                    <TableCell className="font-medium">{i.name}</TableCell>
                    <TableCell>{i.stock}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7">
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          defaultValue={1}
                          className="h-7 w-16"
                        />
                        <Button variant="outline" size="icon" className="h-7 w-7">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {out ? (
                        <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
                          Out of stock
                        </Badge>
                      ) : low ? (
                        <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning">
                          Low
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
                          Healthy
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch defaultChecked={i.blocked} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}