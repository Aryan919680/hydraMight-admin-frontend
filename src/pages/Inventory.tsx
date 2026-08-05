import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { MainInventoryWizard } from "@/components/MainInventoryWizard";
import { StockAllocationWizard } from "@/components/StockAllocationWizard";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Download,
  Eye,
  Loader2,
  MapPin,
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
  InventoryAllocation,
  InventoryAllocationTransaction,
  InventoryChannel,
  InventoryLocation,
  InventorySubChannel,
  MainInventoryItem,
  ServiceLocation,
} from "@/lib/api";

const ALL = "all";
type MainInventoryForm = {
  sku: string;
  item_name: string;
  total_stock: string;
  reserved_stock: string;
  min_stock_level: string;
  remarks: string;
};

const blankMainInventoryForm: MainInventoryForm = {
  sku: "",
  item_name: "",
  total_stock: "",
  reserved_stock: "0",
  min_stock_level: "0",
  remarks: "",
};

export default function Inventory() {
  const [mainInventory, setMainInventory] = useState<MainInventoryItem[]>([]);
  const [allocations, setAllocations] = useState<InventoryAllocation[]>([]);
  const [channels, setChannels] = useState<InventoryChannel[]>([]);
  const [subChannels, setSubChannels] = useState<InventorySubChannel[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [serviceLocations, setServiceLocations] = useState<ServiceLocation[]>([]);
  const [transactions, setTransactions] = useState<
    InventoryAllocationTransaction[]
  >([]);

  const [loadingMain, setLoadingMain] = useState(false);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [uploadingAllocation, setUploadingAllocation] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const [mainSearch, setMainSearch] = useState("");
  const [allocationSkuSearch, setAllocationSkuSearch] = useState("");
  const [filterChannel, setFilterChannel] = useState(ALL);
  const [filterSubChannel, setFilterSubChannel] = useState(ALL);
  const [filterLocationId, setFilterLocationId] = useState(ALL);

  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("main");
  const [allocationSeed, setAllocationSeed] =
    useState<MainInventoryItem | null>(null);

  const [selectedAllocation, setSelectedAllocation] =
    useState<InventoryAllocation | null>(null);

  const [bulkAllocationFile, setBulkAllocationFile] = useState<File | null>(
    null
  );
  const [bulkAllocationResult, setBulkAllocationResult] = useState<any | null>(
    null
  );
  const [mainInventoryDialogOpen, setMainInventoryDialogOpen] = useState(false);
const [savingMainInventory, setSavingMainInventory] = useState(false);
const [selectedMainInventory, setSelectedMainInventory] =
  useState<MainInventoryItem | null>(null);

const [mainInventoryForm, setMainInventoryForm] =
  useState<MainInventoryForm>(blankMainInventoryForm);
const [bulkMainInventoryFile, setBulkMainInventoryFile] =
  useState<File | null>(null);

const [bulkMainInventoryResult, setBulkMainInventoryResult] =
  useState<any | null>(null);

const [uploadingMainInventory, setUploadingMainInventory] = useState(false);

  const loadMainInventory = async () => {
    try {
      setLoadingMain(true);
      const response = await api.getMainInventory({
        search: mainSearch.trim() || undefined,
      });
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

const loadMasterData = async () => {
  try {
    const [
      channelResponse,
      subChannelResponse,
      locationResponse,
      serviceLocationResponse,
    ] = await Promise.all([
      api.getInventoryChannels(),
      api.getInventorySubChannels(),
      api.getInventoryAllocationLocations(),
      api.getLocations(),
    ]);

    setChannels(channelResponse.data || []);
    setSubChannels(subChannelResponse.data || []);
    setLocations(locationResponse.data || []);
    setServiceLocations(serviceLocationResponse.data || []);
  } catch (error) {
    toast({
      title: "Failed to load inventory master data",
      description: error instanceof Error ? error.message : "Please check APIs.",
      variant: "destructive",
    });
  }
};

  const loadAllocations = async () => {
    try {
      setLoadingAllocations(true);

      const response = await api.getInventoryAllocations({
        sku: allocationSkuSearch.trim() || undefined,
        channel: filterChannel !== ALL ? filterChannel : undefined,
        sub_channel: filterSubChannel !== ALL ? filterSubChannel : undefined,
        location_id: filterLocationId !== ALL ? filterLocationId : undefined,
      });

      setAllocations(response.data || []);
    } catch (error) {
      toast({
        title: "Failed to load sub inventory",
        description:
          error instanceof Error
            ? error.message
            : "Please check backend connection.",
        variant: "destructive",
      });
    } finally {
      setLoadingAllocations(false);
    }
  };

  useEffect(() => {
    loadMainInventory();
    loadMasterData();
    loadAllocations();
  }, []);

  const mainStats = useMemo(() => {
    return {
      skus: mainInventory.length,
      total: mainInventory.reduce(
        (sum, item) => sum + Number(item.total_stock || 0),
        0
      ),
      allocated: mainInventory.reduce(
        (sum, item) => sum + Number(item.allocated_stock || 0),
        0
      ),
      available: mainInventory.reduce(
        (sum, item) => sum + Number(item.available_stock || 0),
        0
      ),
      low: mainInventory.filter((item) => item.is_low_stock).length,
    };
  }, [mainInventory]);

  const allocationStats = useMemo(() => {
    return {
      records: allocations.length,
      allocated: allocations.reduce(
        (sum, item) => sum + Number(item.allocated_stock || 0),
        0
      ),
      reserved: allocations.reduce(
        (sum, item) => sum + Number(item.reserved_stock || 0),
        0
      ),
      available: allocations.reduce(
        (sum, item) => sum + Number(item.available_stock || 0),
        0
      ),
      low: allocations.filter((item) => item.is_low_stock || item.is_out_of_stock)
        .length,
    };
  }, [allocations]);

  const openCreateAllocation = (inventory?: MainInventoryItem | null) => {
    setSelectedAllocation(null);
    setAllocationSeed(inventory || null);
    setAllocationDialogOpen(true);
  };

  const openEditAllocation = (item: InventoryAllocation) => {
    setSelectedAllocation(item);
    setAllocationSeed(null);
    setAllocationDialogOpen(true);
  };

  const deleteAllocation = async (item: InventoryAllocation) => {
    try {
      await api.deleteInventoryAllocation(item.id);

      toast({
        title: "Sub inventory deactivated",
        description: "Allocation removed and main inventory synced.",
      });

      await Promise.all([loadMainInventory(), loadAllocations()]);
    } catch (error) {
      toast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadAllocationTransactions = async (item: InventoryAllocation) => {
    try {
      setSelectedAllocation(item);
      setTransactions([]);
      setTransactionDialogOpen(true);
      setLoadingTransactions(true);

      const response = await api.getInventoryAllocationTransactions(item.id);
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

  const uploadSubInventory = async () => {
    try {
      if (!bulkAllocationFile) {
        toast({
          title: "CSV required",
          description: "Please select CSV file.",
          variant: "destructive",
        });
        return;
      }

      setUploadingAllocation(true);
      setBulkAllocationResult(null);

      const response =
        await api.bulkUploadInventoryAllocations(bulkAllocationFile);

      setBulkAllocationResult(response);

      toast({
        title: "Sub inventory upload completed",
        description: `${response.processed || 0} processed, ${
          response.failed || 0
        } failed.`,
      });

      setBulkAllocationFile(null);

      await Promise.all([loadMainInventory(), loadAllocations(), loadMasterData()]);
    } catch (error) {
      toast({
        title: "Bulk upload failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingAllocation(false);
    }
  };

const downloadSubInventorySample = () => {
  const csv = [
    "sku,channel,sub_channel,service_location_id,location_code,location_name,city,state,pincode,location_type,allocated_stock,reserved_stock,min_stock_level,remarks",
    "HH-FC-500ML,ecom,household,SERVICE_LOCATION_UUID,,,,,,service_area,500,0,50,Ecom household service location stock",
    "COM-FC-5GAL,ecom,commercial,SERVICE_LOCATION_UUID,,,,,,service_area,100,0,10,Ecom commercial service location stock",
    "HH-FC-500ML,distribution,, ,DIST-NORTH-01,North Distributor,Delhi,Delhi,,distributor,1000,100,100,North distributor stock",
    "HH-FC-500ML,white_label,, ,WL-PARTNER-A,White Label Partner A,Mumbai,Maharashtra,,partner,800,0,80,Partner A stock",
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "sub-inventory-upload-sample.csv";
  link.click();

  URL.revokeObjectURL(url);
};

const uploadMainInventory = async () => {
  try {
    if (!bulkMainInventoryFile) {
      toast({
        title: "CSV required",
        description: "Please select a main inventory CSV file.",
        variant: "destructive",
      });
      return;
    }

    setUploadingMainInventory(true);
    setBulkMainInventoryResult(null);

    const response = await api.bulkUploadMainInventory(bulkMainInventoryFile);

    setBulkMainInventoryResult(response);

    toast({
      title: "Main inventory upload completed",
      description: `${response.processed || 0} processed, ${
        response.failed || 0
      } failed.`,
    });

    setBulkMainInventoryFile(null);

    await loadMainInventory();
  } catch (error) {
    toast({
      title: "Main inventory bulk upload failed",
      description:
        error instanceof Error ? error.message : "Please try again.",
      variant: "destructive",
    });
  } finally {
    setUploadingMainInventory(false);
  }
};

const downloadMainInventorySample = () => {
  const csv = [
    "sku,item_name,total_stock,reserved_stock,min_stock_level,remarks",
    "PRO-001,RINSL Gold Premium Liquid Detergent,1000,0,20,Opening stock",
    "PRO-002,RINSL Gold Lemon Phenyl,500,0,10,Opening stock",
    "PRO-003,RINSL Gold Lavender Phenyl,500,0,10,Opening stock",
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "main-inventory-upload-sample.csv";
  link.click();

  URL.revokeObjectURL(url);
};

  const filteredLocationsForFilter = locations.filter((location) => {
    if (filterChannel !== ALL && location.channel_code !== filterChannel) {
      return false;
    }
    if (
      filterSubChannel !== ALL &&
      location.sub_channel_code !== filterSubChannel
    ) {
      return false;
    }
    return true;
  });

  const openCreateMainInventory = () => {
  setSelectedMainInventory(null);
  setMainInventoryForm(blankMainInventoryForm);
  setMainInventoryDialogOpen(true);
};

const openEditMainInventory = (item: MainInventoryItem) => {
  setSelectedMainInventory(item);

  setMainInventoryForm({
    sku: item.sku || "",
    item_name: item.item_name || item.product_name || "",
    total_stock: String(item.total_stock ?? 0),
    reserved_stock: String(item.reserved_stock ?? 0),
    min_stock_level: String(item.min_stock_level ?? 0),
    remarks: item.remarks || "",
  });

  setMainInventoryDialogOpen(true);
};

const saveMainInventory = async () => {
  try {
    if (!mainInventoryForm.sku.trim()) {
      toast({
        title: "SKU required",
        description: "Please enter SKU.",
        variant: "destructive",
      });
      return;
    }

    if (mainInventoryForm.total_stock === "") {
      toast({
        title: "Total stock required",
        description: "Please enter total stock.",
        variant: "destructive",
      });
      return;
    }

    const totalStock = Number(mainInventoryForm.total_stock || 0);
    const reservedStock = Number(mainInventoryForm.reserved_stock || 0);
    const minStock = Number(mainInventoryForm.min_stock_level || 0);

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

    setSavingMainInventory(true);

    if (selectedMainInventory) {
      await api.updateMainInventory(selectedMainInventory.id, {
        item_name: mainInventoryForm.item_name || undefined,
        total_stock: totalStock,
        reserved_stock: reservedStock,
        min_stock_level: minStock,
        remarks: mainInventoryForm.remarks || undefined,
      });

      toast({
        title: "Main inventory updated",
        description: "SKU stock updated successfully.",
      });
    } else {
      await api.createMainInventory({
        sku: mainInventoryForm.sku.trim().toUpperCase(),
        item_name: mainInventoryForm.item_name || undefined,
        total_stock: totalStock,
        reserved_stock: reservedStock,
        min_stock_level: minStock,
        remarks: mainInventoryForm.remarks || undefined,
      });

      toast({
        title: "Main inventory created",
        description: "SKU stock created successfully.",
      });
    }

    setMainInventoryDialogOpen(false);
    setSelectedMainInventory(null);
    setMainInventoryForm(blankMainInventoryForm);

    await loadMainInventory();
  } catch (error) {
    toast({
      title: "Save failed",
      description: error instanceof Error ? error.message : "Please try again.",
      variant: "destructive",
    });
  } finally {
    setSavingMainInventory(false);
  }
};

 const deleteInventory = async (item: MainInventoryItem) => {
    try {
      await api.deleteMainInventory(item.id);

      toast({
        title: "Inventory deleted",
        description: "Main inventory deactivated successfully.",
      });

      await loadMainInventory();
    } catch (error) {
      toast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  // const loadTransactions = async (item: MainInventoryItem) => {
  //   try {
  //     setTransactionDialogOpen(item);
  //     setTransactions([]);
  //     setTransactionDialogOpen(true);
  //     setLoadingTransactions(true);

  //     const response = await api.getMainInventoryTransactions(item.id);
  //     setTransactions(response.data || []);
  //   } catch (error) {
  //     toast({
  //       title: "Failed to load transactions",
  //       description:
  //         error instanceof Error ? error.message : "Please try again.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setLoadingTransactions(false);
  //   }
  // };

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Manage main stock and allocate sub inventory by channel, sub-channel and location."
        actions={
  <div className="flex gap-2">
    <Button variant="outline" onClick={openCreateMainInventory}>
      <Plus className="mr-2 h-4 w-4" />
      Add Main Inventory
    </Button>

    <Button onClick={openCreateAllocation}>
      <Plus className="mr-2 h-4 w-4" />
      Allocate Stock
    </Button>
  </div>
}
      />

      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <StatCard title="SKUs" value={mainStats.skus} icon={<Package />} />
        <StatCard title="Main Total" value={mainStats.total} />
        <StatCard title="Allocated" value={mainStats.allocated} />
        <StatCard title="Main Available" value={mainStats.available} />
        <StatCard title="Main Low" value={mainStats.low} warning />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="main">Main Inventory</TabsTrigger>
          <TabsTrigger value="allocation">Channel Allocation</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Sub Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Main Inventory</CardTitle>
              <CardDescription>
                Source stock by SKU. Allocated stock is synced from channel/location allocations.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search SKU or item name"
                    className="pl-9"
                    value={mainSearch}
                    onChange={(e) => setMainSearch(e.target.value)}
                  />
                </div>

                <Button onClick={loadMainInventory} disabled={loadingMain}>
                  {loadingMain && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Apply
                </Button>
              </div>

              {loadingMain ? (
                <LoadingBox message="Loading main inventory..." />
              ) : mainInventory.length === 0 ? (
                <EmptyBox message="No main inventory found." />
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
                    {mainInventory.map((item) => (
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
                        {/* <Button
                          variant="outline"
                          size="icon"
                          onClick={() => loadTransactions(item)}
                          title="View transactions"
                        >
                          <Eye className="h-4 w-4" />
                        </Button> */}

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditMainInventory(item)}
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
        </TabsContent>

        <TabsContent value="allocation" className="mt-4">
          <div className="mb-4 grid gap-4 md:grid-cols-5">
            <StatCard title="Records" value={allocationStats.records} icon={<MapPin />} />
            <StatCard title="Allocated" value={allocationStats.allocated} />
            <StatCard title="Reserved" value={allocationStats.reserved} />
            <StatCard title="Available" value={allocationStats.available} />
            <StatCard title="Low / Out" value={allocationStats.low} warning />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Channel / Location Sub Inventory</CardTitle>
              <CardDescription>
                Allocate stock from main inventory to ecom, distribution or white label locations.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_170px_170px_220px_auto]">
                <Input
                  placeholder="Search SKU"
                  value={allocationSkuSearch}
                  onChange={(e) => setAllocationSkuSearch(e.target.value)}
                />

                <Select value={filterChannel} onValueChange={(value) => {
                  setFilterChannel(value);
                  setFilterSubChannel(ALL);
                  setFilterLocationId(ALL);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All Channels</SelectItem>
                    {channels.map((channel) => (
                      <SelectItem key={channel.id} value={channel.code}>
                        {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterSubChannel} onValueChange={(value) => {
                  setFilterSubChannel(value);
                  setFilterLocationId(ALL);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sub-channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All Sub</SelectItem>
                    {subChannels
                      .filter((sub) =>
                        filterChannel === ALL
                          ? true
                          : sub.channel_code === filterChannel
                      )
                      .map((sub) => (
                        <SelectItem key={sub.id} value={sub.code}>
                          {sub.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <Select value={filterLocationId} onValueChange={setFilterLocationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All Locations</SelectItem>
                    {filteredLocationsForFilter.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} ({location.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button onClick={loadAllocations} disabled={loadingAllocations}>
                  {loadingAllocations && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Apply
                </Button>
              </div>

              {loadingAllocations ? (
                <LoadingBox message="Loading sub inventory..." />
              ) : allocations.length === 0 ? (
                <EmptyBox message="No sub inventory allocation found." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Sub</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Allocated</TableHead>
                      <TableHead>Reserved</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Main Available</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {allocations.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">
                          <div>{item.sku}</div>
                          <div className="text-muted-foreground">
                            {item.item_name || "-"}
                          </div>
                        </TableCell>

                        <TableCell>
                          <ChannelBadge value={item.channel_code} />
                        </TableCell>

                        <TableCell>
                          {item.sub_channel_code ? (
                            <Badge variant="outline">
                              {item.sub_channel_code}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>

                     <TableCell>
  <div className="font-medium">
    {item.service_location_name || item.location_name}
  </div>

  <div className="text-xs text-muted-foreground">
    {item.location_code}
    {(item.service_location_city || item.city) &&
      ` · ${item.service_location_city || item.city}`}
  </div>

  {(item.service_location_pincode || item.pincode) && (
    <div className="text-xs text-muted-foreground">
      Pincode: {item.service_location_pincode || item.pincode}
    </div>
  )}

  {item.service_location_id && (
    <div className="mt-1 text-[10px] font-medium text-success">
      Linked to service location
    </div>
  )}
</TableCell>

                        <TableCell>{item.allocated_stock}</TableCell>
                        <TableCell>{item.reserved_stock}</TableCell>
                        <TableCell className="font-semibold">
                          {item.available_stock}
                        </TableCell>
                        <TableCell>{item.main_available_stock ?? "-"}</TableCell>

                        <TableCell>
                          <StockBadge
                            out={item.is_out_of_stock}
                            low={item.is_low_stock}
                          />
                        </TableCell>

                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => loadAllocationTransactions(item)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openEditAllocation(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => deleteAllocation(item)}
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
        </TabsContent>

        <TabsContent value="bulk" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Upload Sub Inventory</CardTitle>
              <CardDescription>
                Upload channel/location allocations from CSV. System validates main inventory availability.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="mb-2 text-sm font-medium">Required CSV columns</p>
                <code className="text-xs">
                  sku, channel, sub_channel, location_code, location_name, city,
                  state, pincode, location_type, allocated_stock, reserved_stock,
                  min_stock_level, remarks
                </code>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <Input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) =>
                    setBulkAllocationFile(e.target.files?.[0] || null)
                  }
                />

                <Button variant="outline" onClick={downloadSubInventorySample}>
                  <Download className="mr-2 h-4 w-4" />
                  Sample CSV
                </Button>

                <Button
                  onClick={uploadSubInventory}
                  disabled={uploadingAllocation}
                >
                  {uploadingAllocation ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Upload
                </Button>
              </div>

              {bulkAllocationResult && (
                <div className="rounded-lg border p-4">
                  <div className="mb-3 grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Rows</p>
                      <p className="text-lg font-semibold">
                        {bulkAllocationResult.total_rows || 0}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Processed</p>
                      <p className="text-lg font-semibold text-success">
                        {bulkAllocationResult.processed || 0}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Failed</p>
                      <p className="text-lg font-semibold text-destructive">
                        {bulkAllocationResult.failed || 0}
                      </p>
                    </div>
                  </div>

                  {Array.isArray(bulkAllocationResult.results) &&
                    bulkAllocationResult.results.length > 0 && (
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
                            {bulkAllocationResult.results.map((row: any) => (
                              <TableRow key={row.row}>
                                <TableCell>{row.row}</TableCell>
                                <TableCell className="font-mono text-xs">
                                  {row.sku || "-"}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      row.success ? "default" : "destructive"
                                    }
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
        </TabsContent>
      </Tabs>

      <StockAllocationWizard
        open={allocationDialogOpen}
        allocation={selectedAllocation}
        initialInventory={allocationSeed}
        channels={channels}
        subChannels={subChannels}
        locations={locations}
        serviceLocations={serviceLocations}
        onOpenChange={(open) => {
          setAllocationDialogOpen(open);
          if (!open) {
            setSelectedAllocation(null);
            setAllocationSeed(null);
          }
        }}
        onSaved={async () => {
          await Promise.all([
            loadMainInventory(),
            loadAllocations(),
            loadMasterData(),
          ]);
        }}
        onViewAllocations={() => setActiveTab("allocation")}
        onViewMainInventory={() => setActiveTab("main")}
      />

      <Dialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
      >
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sub Inventory Transactions</DialogTitle>
            <DialogDescription>
              SKU: {selectedAllocation?.sku} · {selectedAllocation?.location_name}
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
                  <TableHead>Allocated</TableHead>
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
                      {t.old_allocated_stock} → {t.new_allocated_stock}
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
      <MainInventoryWizard
        open={mainInventoryDialogOpen}
        item={selectedMainInventory}
        onOpenChange={setMainInventoryDialogOpen}
        onSaved={loadMainInventory}
        onAllocate={(inventory) => {
          openCreateAllocation(inventory);
        }}
      />
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
          {icon}
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

function ChannelBadge({ value }: { value?: string }) {
  if (value === "ecom") {
    return <Badge>ECOM</Badge>;
  }

  if (value === "distribution") {
    return <Badge variant="secondary">Distribution</Badge>;
  }

  if (value === "white_label") {
    return <Badge variant="outline">White Label</Badge>;
  }

  return <Badge variant="outline">{value || "-"}</Badge>;
}