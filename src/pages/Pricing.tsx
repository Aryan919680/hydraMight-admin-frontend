import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const rows = [
  { id: "P-001", name: "Organic Basmati Rice 5kg", current: 720, mrp: 850 },
  { id: "P-002", name: "Cold Pressed Mustard Oil 1L", current: 280, mrp: 320 },
  { id: "P-003", name: "Himalayan Pink Salt 500g", current: 120, mrp: 150 },
  { id: "P-004", name: "Almonds Premium 250g", current: 340, mrp: 400 },
];

export default function Pricing() {
  return (
    <div>
      <PageHeader
        title="Pricing"
        description="Set, update and apply pricing globally across the catalog."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Global Pricing Rule</CardTitle>
            <CardDescription>Apply changes to all selected products.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select defaultValue="percent">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage</SelectItem>
                  <SelectItem value="flat">Flat amount</SelectItem>
                  <SelectItem value="set">Set price</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input type="number" placeholder="e.g. 10" />
            </div>
            <div className="space-y-2">
              <Label>Scope</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  <SelectItem value="cat">By category</SelectItem>
                  <SelectItem value="sel">Selected SKUs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full">Apply globally</Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Product Pricing</CardTitle>
            <CardDescription>Set or update individual prices.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground line-through">
                      ₹ {r.mrp}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        defaultValue={r.current}
                        className="h-8 w-28"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        Save
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}