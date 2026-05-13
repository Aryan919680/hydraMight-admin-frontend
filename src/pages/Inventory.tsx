import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Download,
  Eye,
  Link2,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  api,
  MainInventoryItem,
  MainInventoryTransaction,
} from "@/lib/api";

type InventoryForm = {
  sku: string;
  item_name: string;
  total_stock: string;
  reserved_stock: string;
  min_stock_level: string;
  remarks: string;
};

const blankForm: InventoryForm = {
  sku: "",
  item_name: "",
  total_stock: "",
  reserved_stock: "0",
  min_stock_level: "0",
  remarks: "",
};

const ALL = "all";

export default function Inventory() {
  const [inventory, setInventory] = useState<MainInventoryItem[]>([]);
  const [transactions, setTransactions] = useState<MainInventoryTransaction[]>(
    []
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const [search, setSearch] = useState("");
  const [stockStatus, setStockStatus] = useState<string>(ALL);
  const [linkStatus, setLinkStatus] = useState<string>(ALL);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);

  const [selectedInventory, setSelectedInventory] =
    useState<MainInventoryItem | null>(null);

  const [form, setForm] = useState<InventoryForm>(blankForm);

  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkResult, setBulkResult] = useState<any | null>(null);

  const loadInventory = async () => {
    try {
      setLoading(true);

      const response = await api.getMainInventory({
        search: search.trim() || undefined,
        status:
          stockStatus === "low_stock" || stockStatus === "out_of_stock"
            ? stockStatus
            : undefined,
        link_status:
          linkStatus === "pending" || linkStatus === "linked"
            ? linkStatus
            : undefined,
      });

      setInventory(response.data || []);
    } catch (error) {
      toast({
        title: "Failed to load inventory",
        description:
          error instanceof Error
            ? error.message
            : "Please check backend connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const stats = useMemo(() => {
    const totalSkus = inventory.length;
    const totalStock = inventory.reduce(
      (sum, item) => sum + Number(item.total_stock || 0),
      0
    );
    const availableStock = inventory.reduce(
      (sum, item) => sum + Number(item.available_stock || 0),
      0
    );
    const lowOrOut = inventory.filter(
      (item) => item.is_low_stock || item.is_out_of_stock
    ).length;
    const pending = inventory.filter(
      (item) => item.product_link_status === "pending"
    ).length;

    return {
      totalSkus,
      totalStock,
      availableStock,
      lowOrOut,
      pending,
    };
  }, [inventory]);

  const openCreateDialog = () => {
    setSelectedInventory(null);
    setForm(blankForm);
    setDialogOpen(true);
  };

  const openUpdateDialog = (item: MainInventoryItem) => {
    setSelectedInventory(item);
    setForm({
      sku: item.sku || "",
      item_name: item.item_name || item.product_name || "",
      total_stock: String(item.total_stock ?? 0),
      reserved_stock: String(item.reserved_stock ?? 0),
      min_stock_level: String(item.min_stock_level ?? 0),
      remarks: item.remarks || "",
    });
    setDialogOpen(true);
  };

  const saveInventory = async () => {
    try {
      if (!form.sku.trim()) {
        toast({
          title: "SKU required",
          description: "Please enter SKU.",
          variant: "destructive",
        });
        return;
      }

      if (form.total_stock === "") {
        toast({
          title: "Total stock required",
          description: "Please enter total stock.",
          variant: "destructive",
        });
        return;
      }

      const totalStock = Number(form.total_stock || 0);
      const reservedStock = Number(form.reserved_stock || 0);
      const minStock = Number(form.min_stock_level || 0);

      if (totalStock < 0 || reservedStock < 0 || minStock < 0) {
        toast({
          title: "Invalid stock",
          description: "Stock values cannot be negative.",
          variant: "destructive",
        });
        return;
      }

      if (reservedStock > totalStock) {
        toast({
          title: "Invalid reserved stock",
          description: "Reserved stock cannot be greater than total stock.",
          variant: "destructive",
        });
        return;
      }

      setSaving(true);

      if (selectedInventory) {
        await api.updateMainInventory(selectedInventory.id, {
          item_name: form.item_name || undefined,
          total_stock: totalStock,
          reserved_stock: reservedStock,
          min_stock_level: minStock,
          remarks: form.remarks || undefined,
        });

        toast({
          title: "Inventory updated",
          description: "Main inventory updated successfully.",
        });
      } else {
        await api.createMainInventory({
          sku: form.sku.trim(),
          item_name: form.item_name || undefined,
          total_stock: totalStock,
          reserved_stock: reservedStock,
          min_stock_level: minStock,
          remarks: form.remarks || undefined,
        });

        toast({
          title: "Inventory created",
          description: "Main inventory created successfully.",
        });
      }

      setDialogOpen(false);
      setSelectedInventory(null);
      setForm(blankForm);
      await loadInventory();
    } catch (error) {
      toast({
        title: "Save failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteInventory = async (item: MainInventoryItem) => {
    try {
      await api.deleteMainInventory(item.id);

      toast({
        title: "Inventory deleted",
        description: "Main inventory deactivated successfully.",
      });

      await loadInventory();
    } catch (error) {
      toast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadTransactions = async (item: MainInventoryItem) => {
    try {
      setSelectedInventory(item);
      setTransactions([]);
      setTransactionDialogOpen(true);
      setLoadingTransactions(true);

      const response = await api.getMainInventoryTransactions(item.id);
      setTransactions(response.data || []);
    } catch (error) {
      toast({
        title: "Failed to load transactions",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingTransactions(false);
    }
  };

  const uploadBulkInventory = async () => {
    try {
      if (!bulkFile) {
        toast({
          title: "CSV required",
          description: "Please select CSV file.",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);
      setBulkResult(null);

      const response = await api.bulkUploadMainInventory(bulkFile);
      setBulkResult(response);

      toast({
        title: "Bulk upload completed",
        description: `${response.processed || 0} processed, ${
          response.failed || 0
        } failed.`,
      });

      setBulkFile(null);
      await loadInventory();
    } catch (error) {
      toast({
        title: "Bulk upload failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const linkProducts = async () => {
    try {
      setLinking(true);

      const response = await api.linkMainInventoryProducts();

      toast({
        title: "Product linking completed",
        description: `${response.linked_count || 0} inventory record(s) linked.`,
      });

      await loadInventory();
    } catch (error) {
      toast({
        title: "Linking failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLinking(false);
    }
  };

  const downloadSampleCsv = () => {
    const csv = [
      "sku,item_name,total_stock,reserved_stock,min_stock_level,remarks",
      "HH-FC-500ML,Floor Cleaner 500ml,100,10,20,Opening stock",
      "HH-TC-1L,Toilet Cleaner 1L,80,0,10,Opening stock",
      "COM-FC-5GAL,Commercial Floor Cleaner 5 Gallon,40,0,5,Commercial opening stock",
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "main-inventory-upload-sample.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Main Inventory"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={linkProducts} disabled={linking}>
              {linking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              Link Products
            </Button>

            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Inventory
            </Button>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <StatCard title="SKUs" value={stats.totalSkus} icon={<Package />} />
        <StatCard title="Total Stock" value={stats.totalStock} />
        <StatCard title="Available" value={stats.availableStock} />
        <StatCard title="Low / Out" value={stats.lowOrOut} warning />
        <StatCard title="Pending Link" value={stats.pending} warning />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bulk Upload Main Inventory</CardTitle>
       
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="mb-2 text-sm font-medium">CSV columns</p>
            <code className="text-xs">
              sku, item_name, total_stock, reserved_stock, min_stock_level, remarks
            </code>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
            />

            <Button variant="outline" onClick={downloadSampleCsv}>
              <Download className="mr-2 h-4 w-4" />
              Sample CSV
            </Button>

            <Button onClick={uploadBulkInventory} disabled={uploading}>
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload
            </Button>
          </div>

          {bulkResult && (
            <div className="rounded-lg border p-4">
              <div className="mb-3 grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Total Rows</p>
                  <p className="text-lg font-semibold">
                    {bulkResult.total_rows || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Processed</p>
                  <p className="text-lg font-semibold text-success">
                    {bulkResult.processed || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Failed</p>
                  <p className="text-lg font-semibold text-destructive">
                    {bulkResult.failed || 0}
                  </p>
                </div>
              </div>

              {Array.isArray(bulkResult.results) &&
                bulkResult.results.length > 0 && (
                  <div className="max-h-72 overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Row</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Message</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {bulkResult.results.map((row: any) => (
                          <TableRow key={row.row}>
                            <TableCell>{row.row}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {row.sku || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={row.success ? "default" : "destructive"}
                              >
                                {row.success ? "Success" : "Failed"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {row.message || "Processed"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Main Inventory Records</CardTitle>
        
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search SKU or item name"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={stockStatus} onValueChange={setStockStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Stock status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            <Select value={linkStatus} onValueChange={setLinkStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Link status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Links</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="linked">Linked</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={loadInventory} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply
            </Button>
          </div>

          {loading ? (
            <LoadingBox message="Loading main inventory..." />
          ) : inventory.length === 0 ? (
            <EmptyBox message="No main inventory records found." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Allocated</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Product Link</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">
                      {item.sku}
                    </TableCell>

                    <TableCell>
                      <div className="font-medium">
                        {item.item_name || item.product_name || "-"}
                      </div>
                      {item.remarks && (
                        <div className="text-xs text-muted-foreground">
                          {item.remarks}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>{item.total_stock}</TableCell>
                    <TableCell>{item.reserved_stock}</TableCell>
                    <TableCell>{item.allocated_stock}</TableCell>
                    <TableCell className="font-semibold">
                      {item.available_stock}
                    </TableCell>
                    <TableCell>{item.min_stock_level}</TableCell>

                    <TableCell>
                      <StockBadge
                        out={item.is_out_of_stock}
                        low={item.is_low_stock}
                      />
                    </TableCell>

                    <TableCell>
                      <LinkBadge value={item.product_link_status} />
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => loadTransactions(item)}
                          title="View transactions"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openUpdateDialog(item)}
                          title="Edit inventory"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => deleteInventory(item)}
                          title="Delete inventory"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {selectedInventory ? "Update Inventory" : "Add Inventory"}
            </DialogTitle>
            <DialogDescription>
              Inventory is managed by SKU. Product can be linked later when created for selling.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>SKU *</Label>
              <Input
                value={form.sku}
                disabled={Boolean(selectedInventory)}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sku: e.target.value }))
                }
                placeholder="HH-FC-500ML"
              />
            </div>

            <div className="space-y-2">
              <Label>Item name</Label>
              <Input
                value={form.item_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, item_name: e.target.value }))
                }
                placeholder="Floor Cleaner 500ml"
              />
            </div>

            <div className="space-y-2">
              <Label>Total stock *</Label>
              <Input
                type="number"
                value={form.total_stock}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, total_stock: e.target.value }))
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
                  setForm((prev) => ({ ...prev, remarks: e.target.value }))
                }
                placeholder="Opening stock"
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={saveInventory} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedInventory ? "Update Inventory" : "Create Inventory"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
      >
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inventory Transactions</DialogTitle>
            <DialogDescription>
              SKU: {selectedInventory?.sku}
            </DialogDescription>
          </DialogHeader>

          {loadingTransactions ? (
            <LoadingBox message="Loading transactions..." />
          ) : transactions.length === 0 ? (
            <EmptyBox message="No transactions found." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Badge variant="outline">{t.transaction_type}</Badge>
                    </TableCell>
                    <TableCell>{t.quantity}</TableCell>
                    <TableCell>
                      {t.old_total_stock} → {t.new_total_stock}
                    </TableCell>
                    <TableCell>
                      {t.old_reserved_stock} → {t.new_reserved_stock}
                    </TableCell>
                    <TableCell>
                      {t.old_available_stock} → {t.new_available_stock}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {t.remarks || "-"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {t.created_at
                        ? new Date(t.created_at).toLocaleString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  warning,
}: {
  title: string;
  value: number;
  icon?: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p
          className={`mt-2 flex items-center gap-2 text-2xl font-semibold ${
            warning ? "text-warning" : ""
          }`}
        >
          {icon &&
            (typeof icon === "object"
              ? icon
              : null)}
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function LoadingBox({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border py-16 text-muted-foreground">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      {message}
    </div>
  );
}

function EmptyBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
      {message}
    </div>
  );
}

function StockBadge({ out, low }: { out: boolean; low: boolean }) {
  if (out) {
    return (
      <Badge
        variant="outline"
        className="border-destructive/30 bg-destructive/10 text-destructive"
      >
        Out
      </Badge>
    );
  }

  if (low) {
    return (
      <Badge
        variant="outline"
        className="border-warning/30 bg-warning/10 text-warning"
      >
        Low
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-success/30 bg-success/10 text-success"
    >
      Healthy
    </Badge>
  );
}

function LinkBadge({ value }: { value?: string }) {
  if (value === "linked") {
    return (
      <Badge
        variant="outline"
        className="border-success/30 bg-success/10 text-success"
      >
        Linked
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-warning/30 bg-warning/10 text-warning"
    >
      Pending
    </Badge>
  );
}