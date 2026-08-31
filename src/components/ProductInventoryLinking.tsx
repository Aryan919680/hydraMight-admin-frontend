import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Link2,
  Loader2,
  PackagePlus,
  Search,
  Unlink,
} from "lucide-react";

import {
  api,
  InventoryProductLinkItem,
  InventoryProductLinkStats,
  ProductLinkCandidate,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ALL = "all";

const emptyStats: InventoryProductLinkStats = {
  total_skus: 0,
  auto_linked: 0,
  manually_linked: 0,
  unlinked: 0,
  no_product_exists: 0,
  sku_mismatch: 0,
  linked_today: 0,
};

export function ProductInventoryLinking() {
  const [tab, setTab] = useState<"unlinked" | "linked" | "help">("unlinked");
  const [stats, setStats] = useState<InventoryProductLinkStats>(emptyStats);
  const [items, setItems] = useState<InventoryProductLinkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningAutoLink, setRunningAutoLink] = useState(false);

  const [search, setSearch] = useState("");
  const [reason, setReason] = useState(ALL);
  const [catalogue, setCatalogue] = useState(ALL);
  const [linkType, setLinkType] = useState(ALL);

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] =
    useState<InventoryProductLinkItem | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<ProductLinkCandidate[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsResponse, listResponse] = await Promise.all([
        api.getInventoryProductLinkStats(),
        api.getInventoryProductLinks({
          status: tab === "linked" ? "linked" : "unlinked",
          search: search.trim() || undefined,
          reason: tab === "unlinked" && reason !== ALL ? (reason as "no_product" | "sku_mismatch") : undefined,
          catalogue: tab === "linked" && catalogue !== ALL ? catalogue : undefined,
          link_type: tab === "linked" && linkType !== ALL ? (linkType as "auto" | "manual") : undefined,
        }),
      ]);
      setStats(statsResponse.data || emptyStats);
      setItems(listResponse.data || []);
    } catch (error) {
      toast({
        title: "Failed to load product links",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab !== "help") {
      void loadData();
    }
  }, [tab]);

  const visibleStats = useMemo(
    () => [
      { label: "Total SKUs", value: stats.total_skus },
      { label: "Auto-linked", value: stats.auto_linked, tone: "text-emerald-600" },
      { label: "Manually linked", value: stats.manually_linked, tone: "text-violet-600" },
      { label: "Unlinked", value: stats.unlinked, tone: "text-destructive" },
    ],
    [stats]
  );

  const openLinkDialog = async (item: InventoryProductLinkItem) => {
    setSelectedInventory(item);
    setSelectedProductId("");
    setProductSearch("");
    setProducts([]);
    setLinkDialogOpen(true);
    await searchProducts("", item.id);
  };

  const searchProducts = async (value = productSearch, inventoryId = selectedInventory?.id) => {
    if (!inventoryId) return;
    try {
      setLoadingProducts(true);
      const response = await api.getInventoryProductCandidates(inventoryId, {
        search: value.trim() || undefined,
        limit: 50,
      });
      setProducts(response.data || []);
    } catch (error) {
      toast({
        title: "Failed to load products",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const manualLink = async () => {
    if (!selectedInventory || !selectedProductId) return;
    try {
      setSavingLink(true);
      await api.linkInventoryToProduct(selectedInventory.id, selectedProductId);
      toast({
        title: "Product linked",
        description: `${selectedInventory.sku} is now linked to the selected product.`,
      });
      setLinkDialogOpen(false);
      await loadData();
    } catch (error) {
      toast({
        title: "Link failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingLink(false);
    }
  };

  const unlinkProduct = async (item: InventoryProductLinkItem) => {
    try {
      await api.unlinkInventoryProduct(item.id);
      toast({
        title: "Product unlinked",
        description: `${item.sku} is no longer linked to a product.`,
      });
      await loadData();
    } catch (error) {
      toast({
        title: "Unlink failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const runAutoLink = async () => {
    try {
      setRunningAutoLink(true);
      const response = await api.autoLinkInventoryProducts();
      toast({
        title: "Auto-link complete",
        description: `${response.linked_count || 0} inventory SKU(s) linked.`,
      });
      await loadData();
    } catch (error) {
      toast({
        title: "Auto-link failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setRunningAutoLink(false);
    }
  };

  const createProduct = (item: InventoryProductLinkItem) => {
    const params = new URLSearchParams({
      create: "1",
      inventorySku: item.sku,
      inventoryName: item.item_name || "",
      inventoryId: item.id,
    });
    window.location.href = `/products?${params.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">SKU ↔ Product linking</h2>
          <p className="text-muted-foreground">
            Matching SKU codes auto-link. Review unlinked SKUs and manual overrides here.
          </p>
        </div>
        <Button variant="outline" onClick={runAutoLink} disabled={runningAutoLink}>
          {runningAutoLink ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Link2 className="mr-2 h-4 w-4" />
          )}
          Run auto-link
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {visibleStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`mt-2 text-3xl font-semibold ${stat.tone || ""}`}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
        <TabsList>
          <TabsTrigger value="unlinked">
            Unlinked SKUs <Badge variant="destructive" className="ml-2">{stats.unlinked}</Badge>
          </TabsTrigger>
          <TabsTrigger value="linked">
            All linked <Badge className="ml-2 bg-emerald-100 text-emerald-700">{stats.auto_linked + stats.manually_linked}</Badge>
          </TabsTrigger>
          <TabsTrigger value="help">How auto-link works</TabsTrigger>
        </TabsList>

        <TabsContent value="unlinked" className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search unlinked SKU or item..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && void loadData()}
              />
            </div>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder="Reason" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All reasons</SelectItem>
                <SelectItem value="no_product">No product exists</SelectItem>
                <SelectItem value="sku_mismatch">SKU mismatch</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadData}>Apply</Button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <MiniStat label="Total unlinked" value={stats.unlinked} tone="text-destructive" />
            <MiniStat label="No product exists" value={stats.no_product_exists} tone="text-amber-600" />
            <MiniStat label="Product exists, SKU mismatch" value={stats.sku_mismatch} tone="text-violet-600" />
            <MiniStat label="Linked today" value={stats.linked_today} tone="text-emerald-600" />
          </div>

          {loading ? (
            <Loading />
          ) : items.length === 0 ? (
            <Empty message="No unlinked inventory SKUs found." />
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="grid gap-4 p-5 md:grid-cols-[220px_1fr_auto_auto] md:items-center">
                    <div className="font-mono font-semibold">{item.sku}</div>
                    <div>
                      <p className="font-semibold">{item.item_name || "Unnamed inventory item"}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>Stock: {item.total_stock}</span>
                        <ReasonBadge reason={item.unlinked_reason} />
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => openLinkDialog(item)}>
                      <Link2 className="mr-2 h-4 w-4" />Link to product
                    </Button>
                    <Button variant="outline" onClick={() => createProduct(item)}>
                      <PackagePlus className="mr-2 h-4 w-4" />Create product
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="linked" className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_210px_210px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search linked SKU or product..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && void loadData()}
              />
            </div>
            <Select value={catalogue} onValueChange={setCatalogue}>
              <SelectTrigger><SelectValue placeholder="Catalogue" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All catalogues</SelectItem>
                <SelectItem value="ecom">Ecom</SelectItem>
                <SelectItem value="distribution">Distribution</SelectItem>
                <SelectItem value="white_label">White label</SelectItem>
              </SelectContent>
            </Select>
            <Select value={linkType} onValueChange={setLinkType}>
              <SelectTrigger><SelectValue placeholder="Link type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All link types</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadData}>Apply</Button>
          </div>

          {loading ? (
            <Loading />
          ) : items.length === 0 ? (
            <Empty message="No linked inventory SKUs found." />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Linked product</TableHead>
                      <TableHead>Catalogue</TableHead>
                      <TableHead>Link type</TableHead>
                      <TableHead>SKU role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                        <TableCell>{item.item_name || "—"}</TableCell>
                        <TableCell className="font-semibold">{item.product_name || "—"}</TableCell>
                        <TableCell><CatalogueBadge value={item.catalogue} /></TableCell>
                        <TableCell><LinkTypeBadge value={item.link_type} /></TableCell>
                        <TableCell>{item.sku_role || "Primary"}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" onClick={() => unlinkProduct(item)}>
                            <Unlink className="mr-2 h-4 w-4" />Unlink
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="help" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>How auto-link works</CardTitle>
              <CardDescription>Inventory and product records remain separate until they are linked.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <HelpRow number="1" title="Exact SKU match" text="When an active product and active main-inventory record have the same SKU, the system links them automatically." />
              <HelpRow number="2" title="Manual override" text="An administrator can link an inventory SKU to a different product. This is recorded as a manual link." />
              <HelpRow number="3" title="Unlink safely" text="Unlinking removes the product association only. Stock quantities and channel allocations are not changed." />
              <HelpRow number="4" title="New product creation" text="Creating a product with the same SKU automatically links it to the existing inventory record." />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Link inventory SKU to product</DialogTitle>
            <DialogDescription>
              {selectedInventory?.sku} · {selectedInventory?.item_name || "Inventory item"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <Input
                placeholder="Search product name or SKU"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && void searchProducts()}
              />
              <Button variant="outline" onClick={() => searchProducts()} disabled={loadingProducts}>
                {loadingProducts && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Search
              </Button>
            </div>

            <div className="max-h-80 overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Catalogue</TableHead>
                    <TableHead>Match</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow
                      key={product.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedProductId(product.id)}
                    >
                      <TableCell>
                        <input
                          type="radio"
                          checked={selectedProductId === product.id}
                          onChange={() => setSelectedProductId(product.id)}
                        />
                      </TableCell>
                      <TableCell className="font-semibold">{product.name}</TableCell>
                      <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                      <TableCell><CatalogueBadge value={product.catalogue} /></TableCell>
                      <TableCell>
                        {product.sku_match ? (
                          <Badge className="bg-emerald-100 text-emerald-700">Exact SKU</Badge>
                        ) : (
                          <Badge variant="outline">Manual override</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
            <Button onClick={manualLink} disabled={!selectedProductId || savingLink}>
              {savingLink && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Link product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl bg-muted/40 p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${tone || ""}`}>{value}</p>
    </div>
  );
}

function ReasonBadge({ reason }: { reason?: string }) {
  return reason === "sku_mismatch" ? (
    <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">SKU mismatch</Badge>
  ) : (
    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">No product exists</Badge>
  );
}

function CatalogueBadge({ value }: { value?: string | null }) {
  if (value === "distribution") return <Badge variant="secondary">Distribution</Badge>;
  if (value === "white_label") return <Badge className="bg-violet-100 text-violet-700">White label</Badge>;
  return <Badge>Ecom</Badge>;
}

function LinkTypeBadge({ value }: { value?: string | null }) {
  return value === "manual" ? (
    <Badge className="bg-violet-100 text-violet-700">Manual</Badge>
  ) : (
    <Badge variant="secondary">Auto</Badge>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center rounded-lg border py-16 text-muted-foreground">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading product links...
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">{message}</div>;
}

function HelpRow({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="flex gap-4 rounded-lg border p-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{number}</div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}