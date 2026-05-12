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
  Loader2,
  MapPin,
  Package,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  api,
  InventoryItem,
  MainInventoryItem,
  ServiceLocation,
} from "@/lib/api";

export default function Inventory() {
  const [mainInventory, setMainInventory] = useState<MainInventoryItem[]>([]);
  const [locationInventory, setLocationInventory] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<ServiceLocation[]>([]);

  const [selectedLocationId, setSelectedLocationId] = useState("");

  const [loadingMain, setLoadingMain] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] =
    useState<InventoryItem | null>(null);

  const [form, setForm] = useState({
    available_stock: "",
    reserved_stock: "0",
    min_stock_level: "0",
    remarks: "",
  });

  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkResult, setBulkResult] = useState<any | null>(null);

  const selectedLocation = locations.find((l) => l.id === selectedLocationId);

  const loadMainInventory = async () => {
    try {
      setLoadingMain(true);
      const response = await api.getMainInventory();
      setMainInventory(response.data || []);
    } catch (error) {
      toast({
        title: "Failed to load main inventory",
        description:
          error instanceof Error
            ? error.message
            : "Please check backend connection.",
        variant: "destructive",
      });
    } finally {
      setLoadingMain(false);
    }
  };

  const loadLocations = async () => {
    try {
      setLoadingLocations(true);
      const response = await api.getLocations();
      setLocations(response.data || []);
    } catch (error) {
      toast({
        title: "Failed to load locations",
        description:
          error instanceof Error ? error.message : "Please check location API.",
        variant: "destructive",
      });
    } finally {
      setLoadingLocations(false);
    }
  };

  const loadLocationInventory = async (locationId: string) => {
    try {
      setLoadingLocation(true);
      const response = await api.getLocationInventory(locationId);
      setLocationInventory(response.data || []);
    } catch (error) {
      toast({
        title: "Failed to load location inventory",
        description:
          error instanceof Error
            ? error.message
            : "Please check backend connection.",
        variant: "destructive",
      });
    } finally {
      setLoadingLocation(false);
    }
  };

  const loadInitialData = async () => {
    await Promise.all([loadMainInventory(), loadLocations()]);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const mainLowCount = useMemo(() => {
    return mainInventory.filter((item) => {
      const out = item.is_out_of_stock || Number(item.available_stock) === 0;
      const low =
        !out &&
        Number(item.available_stock) <= Number(item.min_stock_level || 0);

      return out || low;
    }).length;
  }, [mainInventory]);

  const mainTotalUnits = useMemo(() => {
    return mainInventory.reduce(
      (sum, item) => sum + Number(item.available_stock || 0),
      0,
    );
  }, [mainInventory]);

  const locationLowCount = useMemo(() => {
    return locationInventory.filter((item) => {
      const out = item.is_out_of_stock || Number(item.available_stock) === 0;
      const low =
        !out &&
        Number(item.available_stock) <= Number(item.min_stock_level || 0);

      return out || low;
    }).length;
  }, [locationInventory]);

  const locationTotalUnits = useMemo(() => {
    return locationInventory.reduce(
      (sum, item) => sum + Number(item.available_stock || 0),
      0,
    );
  }, [locationInventory]);

  const handleLocationChange = async (locationId: string) => {
    setSelectedLocationId(locationId);
    setLocationInventory([]);
    await loadLocationInventory(locationId);
  };

  const openUpdateDialog = (item: InventoryItem) => {
    setSelectedInventory(item);
    setForm({
      available_stock: String(item.available_stock ?? 0),
      reserved_stock: String(item.reserved_stock ?? 0),
      min_stock_level: String(item.min_stock_level ?? 0),
      remarks: "",
    });
    setDialogOpen(true);
  };

  const saveInventory = async () => {
    try {
      if (!selectedInventory) return;

      setSaving(true);

      await api.updateInventory(selectedInventory.id, {
        available_stock: Number(form.available_stock || 0),
        reserved_stock: Number(form.reserved_stock || 0),
        min_stock_level: Number(form.min_stock_level || 0),
        remarks: form.remarks || "Inventory updated from admin UI",
      });

      toast({
        title: "Inventory updated",
        description: "Location inventory updated and main inventory synced.",
      });

      setDialogOpen(false);
      setSelectedInventory(null);

      await loadMainInventory();

      if (selectedLocationId) {
        await loadLocationInventory(selectedLocationId);
      }
    } catch (error) {
      toast({
        title: "Inventory update failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteInventory = async (item: InventoryItem) => {
    try {
      await api.deleteInventory(item.id);

      toast({
        title: "Inventory deleted",
        description: "Location inventory deactivated and main inventory synced.",
      });

      await loadMainInventory();

      if (selectedLocationId) {
        await loadLocationInventory(selectedLocationId);
      }
    } catch (error) {
      toast({
        title: "Inventory delete failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const uploadBulkInventory = async () => {
    try {
      if (!bulkFile) {
        toast({
          title: "CSV file required",
          description: "Please select a CSV file first.",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);
      setBulkResult(null);

      const response = await api.bulkUploadInventory(bulkFile);
      setBulkResult(response);

      toast({
        title: "Bulk upload completed",
        description: `${response.processed || 0} processed, ${
          response.failed || 0
        } failed.`,
      });

      setBulkFile(null);

      await loadMainInventory();

      if (selectedLocationId) {
        await loadLocationInventory(selectedLocationId);
      }
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

  const downloadSampleCsv = () => {
    const csv = [
      "sku,location_name,available_stock,reserved_stock,min_stock_level,remarks",
      "HH-FC-500ML,Gurgaon Main Warehouse,20,0,5,Initial stock",
      "HH-FC-500ML,Delhi Warehouse,30,0,5,Initial stock",
      "COM-FC-5GAL,Gurgaon Main Warehouse,10,0,2,Commercial stock",
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "inventory-upload-sample.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Main inventory is shown first. Select a location to view and manage location-wise inventory."
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Main Inventory Products</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
              <Package className="h-5 w-5" />
              {mainInventory.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Low / Out of Stock</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-warning">
              <AlertTriangle className="h-5 w-5" />
              {mainLowCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Available Units</p>
            <p className="mt-2 text-2xl font-semibold">{mainTotalUnits}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Main Inventory</CardTitle>
          <CardDescription>
            Product-level stock calculated automatically from all active location inventories.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loadingMain ? (
            <LoadingBox message="Loading main inventory..." />
          ) : mainInventory.length === 0 ? (
            <EmptyBox message="No main inventory found. Add stock location-wise first." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Portal</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total Stock</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {mainInventory.map((item) => {
                  const out =
                    item.is_out_of_stock || Number(item.available_stock) === 0;

                  const low =
                    !out &&
                    Number(item.available_stock) <=
                      Number(item.min_stock_level || 0);

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">
                        {item.sku || "-"}
                      </TableCell>

                      <TableCell className="font-medium">
                        {item.product_name}
                      </TableCell>

                      <TableCell>
                        <PortalBadge value={item.portal_type} />
                      </TableCell>

                      <TableCell>
                        {item.quantity_value || "-"} {item.quantity_unit || ""}
                      </TableCell>

                      <TableCell>{item.total_stock}</TableCell>
                      <TableCell>{item.available_stock}</TableCell>
                      <TableCell>{item.reserved_stock}</TableCell>
                      <TableCell>{item.min_stock_level}</TableCell>

                      <TableCell>
                        <StockBadge out={out} low={low} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Location Inventory</CardTitle>
          <CardDescription>
            Select one location to render and manage its inventory.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="max-w-md space-y-2">
            <Label>Select Location</Label>

            <Select
              value={selectedLocationId}
              onValueChange={handleLocationChange}
              disabled={loadingLocations}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingLocations ? "Loading locations..." : "Select location"
                  }
                />
              </SelectTrigger>

              <SelectContent>
                {locations
                  .filter((location) => location.is_active)
                  .map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name} - {location.city} ({location.pincode})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!selectedLocationId ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Please select a location to view location-wise inventory.
        </div>
      ) : (
        <>
          <div className="mb-4 grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">
                  Location Inventory Records
                </p>
                <p className="mt-2 flex items-center gap-2 text-2xl font-semibold">
                  <MapPin className="h-5 w-5" />
                  {locationInventory.length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">
                  Low / Out of Stock
                </p>
                <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  {locationLowCount}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">
                  Selected Location Units
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {locationTotalUnits}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {selectedLocation?.name || "Selected Location"} Inventory
              </CardTitle>
              <CardDescription>
                {selectedLocation
                  ? `${selectedLocation.city}, ${selectedLocation.state} · ${selectedLocation.pincode}`
                  : "Product stock available for selected location."}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {loadingLocation ? (
                <LoadingBox message="Loading location inventory..." />
              ) : locationInventory.length === 0 ? (
                <EmptyBox message="No inventory found for this location." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Portal</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Reserved</TableHead>
                      <TableHead>Min Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {locationInventory.map((item) => {
                      const out =
                        item.is_out_of_stock ||
                        Number(item.available_stock) === 0;

                      const low =
                        !out &&
                        Number(item.available_stock) <=
                          Number(item.min_stock_level || 0);

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs">
                            {item.sku || "-"}
                          </TableCell>

                          <TableCell className="font-medium">
                            {item.product_name}
                          </TableCell>

                          <TableCell>
                            <PortalBadge value={item.portal_type} />
                          </TableCell>

                          <TableCell>
                            {item.quantity_value || "-"}{" "}
                            {item.quantity_unit || ""}
                          </TableCell>

                          <TableCell>{item.available_stock}</TableCell>
                          <TableCell>{item.reserved_stock}</TableCell>
                          <TableCell>{item.min_stock_level}</TableCell>

                          <TableCell>
                            <StockBadge out={out} low={low} />
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
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bulk Inventory Upload</CardTitle>
          <CardDescription>
            Upload CSV using SKU and location name. This updates location inventory and syncs main inventory.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="mb-2 text-sm font-medium">Required CSV columns</p>
            <code className="text-xs">
              sku, location_name, available_stock, reserved_stock, min_stock_level, remarks
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
                          <TableHead>Location</TableHead>
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
                            <TableCell>{row.location_name || "-"}</TableCell>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Update Location Inventory</DialogTitle>
            <DialogDescription>
              Update stock for {selectedInventory?.product_name} at{" "}
              {selectedInventory?.location_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Product</Label>
              <Input value={selectedInventory?.product_name || ""} disabled />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Location</Label>
              <Input
                value={
                  selectedInventory?.location_name ||
                  selectedInventory?.location_id ||
                  ""
                }
                disabled
              />
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

function PortalBadge({ value }: { value?: string }) {
  return <Badge variant="outline">{value || "-"}</Badge>;
}

function StockBadge({ out, low }: { out: boolean; low: boolean }) {
  if (out) {
    return (
      <Badge
        variant="outline"
        className="border-destructive/30 bg-destructive/10 text-destructive"
      >
        Out of Stock
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