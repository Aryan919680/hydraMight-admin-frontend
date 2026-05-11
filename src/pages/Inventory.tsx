import { useEffect, useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api, InventoryItem } from "@/lib/api";

const DEFAULT_LOCATION_ID = import.meta.env.VITE_DEFAULT_LOCATION_ID || "";

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<InventoryItem | null>(null);

  const [form, setForm] = useState({
    product_id: "",
    location_id: DEFAULT_LOCATION_ID,
    available_stock: "",
    reserved_stock: "0",
    min_stock_level: "0",
    remarks: "",
  });

  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await api.getInventory();
      setInventory(response.data || []);
    } catch (error) {
      toast({
        title: "Failed to load inventory",
        description: error instanceof Error ? error.message : "Please check backend connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const lowCount = useMemo(
    () =>
      inventory.filter(
        (i) => Number(i.available_stock) <= Number(i.min_stock_level) || i.is_out_of_stock,
      ).length,
    [inventory],
  );

  const totalUnits = useMemo(
    () => inventory.reduce((sum, i) => sum + Number(i.available_stock || 0), 0),
    [inventory],
  );

  const openUpdateDialog = (item: InventoryItem) => {
    setSelected(item);
    setForm({
      product_id: item.product_id,
      location_id: item.location_id,
      available_stock: String(item.available_stock ?? 0),
      reserved_stock: String(item.reserved_stock ?? 0),
      min_stock_level: String(item.min_stock_level ?? 0),
      remarks: "",
    });
    setDialogOpen(true);
  };

  const saveInventory = async () => {
    try {
      if (!selected) return;

      setSaving(true);

      await api.updateInventory(selected.id, {
        available_stock: Number(form.available_stock || 0),
        reserved_stock: Number(form.reserved_stock || 0),
        min_stock_level: Number(form.min_stock_level || 0),
        remarks: form.remarks || "Inventory updated from admin UI",
      });

      toast({ title: "Inventory updated" });
      setDialogOpen(false);
      setSelected(null);
      await loadInventory();
    } catch (error) {
      toast({
        title: "Inventory update failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteInventory = async (item: InventoryItem) => {
    try {
      await api.deleteInventory(item.id);
      toast({ title: "Inventory deleted" });
      await loadInventory();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Track stock levels, update stock and delete inventory for products added in CMS."
      />

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Inventory Records</p>
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
            <p className="mt-2 text-2xl font-semibold">{totalUnits}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Levels</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center rounded-lg border py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading inventory...
            </div>
          ) : inventory.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No inventory found. Inventory is created when product is added from CMS.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Portal</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {inventory.map((item) => {
                  const out = item.is_out_of_stock || Number(item.available_stock) === 0;
                  const low =
                    !out &&
                    Number(item.available_stock) <= Number(item.min_stock_level || 0);

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">
                        {item.sku || "-"}
                      </TableCell>

                      <TableCell className="font-medium">
                        {item.product_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.portal_type || "-"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {item.quantity_value || "-"} {item.quantity_unit || ""}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">
                        {item.location_name || item.location_id}
                      </TableCell>

                      <TableCell>{item.available_stock}</TableCell>

                      <TableCell>{item.reserved_stock}</TableCell>

                      <TableCell>{item.min_stock_level}</TableCell>

                      <TableCell>
                        {out ? (
                          <Badge
                            variant="outline"
                            className="border-destructive/30 bg-destructive/10 text-destructive"
                          >
                            Out of stock
                          </Badge>
                        ) : low ? (
                          <Badge
                            variant="outline"
                            className="border-warning/30 bg-warning/10 text-warning"
                          >
                            Low
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-success/30 bg-success/10 text-success"
                          >
                            Healthy
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openUpdateDialog(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => deleteInventory(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Update Inventory</DialogTitle>
            <DialogDescription>
              Update stock for {selected?.product_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Product</Label>
              <Input value={selected?.product_name || ""} disabled />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Location ID</Label>
              <Input value={form.location_id} disabled />
            </div>

            <div className="space-y-2">
              <Label>Available stock</Label>
              <Input
                type="number"
                value={form.available_stock}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    available_stock: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Reserved stock</Label>
              <Input
                type="number"
                value={form.reserved_stock}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    reserved_stock: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Minimum stock</Label>
              <Input
                type="number"
                value={form.min_stock_level}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    min_stock_level: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Remarks</Label>
              <Input
                value={form.remarks}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    remarks: e.target.value,
                  }))
                }
                placeholder="Stock adjusted"
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={saveInventory} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Inventory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}