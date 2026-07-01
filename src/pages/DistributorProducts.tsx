import { useEffect, useMemo, useState } from "react";
import {
  CirclePlus,
  Loader2,
  PackageCheck,
  Pencil,
  RefreshCw,
  Search,
  Warehouse,
} from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
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
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

import {
  api,
  Category,
  DistributorMoqPricing,
  DistributorProduct,
  UnmappedSku,
} from "@/lib/api";

const emptySlab = (): DistributorMoqPricing => ({
  moq_quantity: 1000,
  cost_price: 0,
  selling_price: 0,
});

const formatNumber = (value: unknown) =>
  Number(value || 0).toLocaleString("en-IN");

const formatCurrency = (value: unknown) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function DistributorProducts() {
  const [products, setProducts] = useState<DistributorProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [unmappedSkus, setUnmappedSkus] = useState<UnmappedSku[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const [pricingProduct, setPricingProduct] =
    useState<DistributorProduct | null>(null);

  const [pricing, setPricing] = useState<DistributorMoqPricing[]>([]);

  const [form, setForm] = useState({
    category_id: "",
    sku: "",
    name: "",
    brand: "",
    short_description: "",
    description: "",
    quantity_value: "1",
    quantity_unit: "unit",
    unit: "units",
    mrp: "0",
    moq_pricing: [emptySlab()] as DistributorMoqPricing[],
  });

  const loadData = async () => {
    setLoading(true);

    try {
      const [productsResponse, categoriesResponse, skuResponse] =
        await Promise.all([
          api.getDistributorProducts({
            limit: 200,
            status: "all",
          }),
          api.getCategories(),
          api.getUnmappedDistributorSkus({
            limit: 500,
          }),
        ]);

      setProducts((productsResponse.data || []) as DistributorProduct[]);
      setCategories((categoriesResponse.data || []) as Category[]);
      setUnmappedSkus((skuResponse.data || []) as UnmappedSku[]);
    } catch (error) {
      toast({
        title: "Unable to load distributor products",
        description:
          error instanceof Error ? error.message : "Check backend API setup.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({
      category_id: "",
      sku: "",
      name: "",
      brand: "",
      short_description: "",
      description: "",
      quantity_value: "1",
      quantity_unit: "unit",
      unit: "units",
      mrp: "0",
      moq_pricing: [emptySlab()],
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const chooseSku = (sku: string) => {
    const selectedSku = unmappedSkus.find((item) => item.sku === sku);

    setForm((old) => ({
      ...old,
      sku,
      name: old.name || selectedSku?.item_name || "",
    }));
  };

  const validateSlabs = (slabs: DistributorMoqPricing[]) => {
    if (!slabs.length) {
      return "At least one MOQ slab is required.";
    }

    const moqSet = new Set<number>();

    for (const slab of slabs) {
      const moq = Number(slab.moq_quantity);
      const costPrice = Number(slab.cost_price);
      const sellingPrice = Number(slab.selling_price);

      if (!Number.isInteger(moq) || moq <= 0) {
        return "MOQ quantity must be a positive whole number.";
      }

      if (costPrice < 0 || sellingPrice < 0) {
        return "CP and SP cannot be negative.";
      }

      if (sellingPrice < costPrice) {
        return "Selling price cannot be lower than cost price.";
      }

      if (moqSet.has(moq)) {
        return `MOQ ${moq} is duplicated.`;
      }

      moqSet.add(moq);
    }

    return null;
  };

  const updateCreateSlab = (
    index: number,
    field: "moq_quantity" | "cost_price" | "selling_price",
    value: number
  ) => {
    const updated = [...form.moq_pricing];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setForm({
      ...form,
      moq_pricing: updated,
    });
  };

  const updatePricingSlab = (
    index: number,
    field: "moq_quantity" | "cost_price" | "selling_price",
    value: number
  ) => {
    const updated = [...pricing];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setPricing(updated);
  };

  const saveProduct = async () => {
    if (!form.category_id || !form.sku.trim() || !form.name.trim()) {
      toast({
        title: "Category, SKU and product name are required.",
        variant: "destructive",
      });
      return;
    }

    const validationError = validateSlabs(form.moq_pricing);

    if (validationError) {
      toast({
        title: validationError,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      await api.createDistributorProduct({
        category_id: form.category_id,
        name: form.name.trim(),
        sku: form.sku.trim(),
        brand: form.brand.trim() || null,
        short_description: form.short_description.trim() || null,
        description: form.description.trim() || null,
        quantity_value: Number(form.quantity_value || 1),
        quantity_unit: form.quantity_unit,
        unit: form.unit,
        mrp: Number(form.mrp || 0),
        currency: "INR",
        moq_pricing: form.moq_pricing.map((slab) => ({
          moq_quantity: Number(slab.moq_quantity),
          cost_price: Number(slab.cost_price),
          selling_price: Number(slab.selling_price),
        })),
      });

      toast({
        title: "Distributor product created",
        description:
          "The product is global and visible to all active stockists and agencies after distributor stock allocation.",
      });

      setCreateDialogOpen(false);
      await loadData();
    } catch (error) {
      toast({
        title: "Failed to create distributor product",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveMoqPricing = async () => {
    if (!pricingProduct) return;

    const validationError = validateSlabs(pricing);

    if (validationError) {
      toast({
        title: validationError,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      await api.updateDistributorProductMoqPricing(
        pricingProduct.product_id,
        {
          moq_pricing: pricing.map((slab) => ({
            moq_quantity: Number(slab.moq_quantity),
            cost_price: Number(slab.cost_price),
            selling_price: Number(slab.selling_price),
          })),
        }
      );

      toast({
        title: "Global MOQ pricing updated",
      });

      setPricingProduct(null);
      await loadData();
    } catch (error) {
      toast({
        title: "Failed to update MOQ pricing",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return products;

    return products.filter((product) =>
      [
        product.product_name,
        product.sku,
        product.brand,
        product.category_name,
      ].some((value) =>
        String(value || "").toLowerCase().includes(keyword)
      )
    );
  }, [products, search]);

  const linkedProducts = products.filter(
    (product) => product.inventory_link_status === "linked"
  ).length;

  return (
    <div>
      <PageHeader
        title="Distributor Products"
        description="Create one global distributor product with MOQ pricing. The same product is visible to all stockists and agencies."
        actions={
          <Button onClick={openCreateDialog}>
            <CirclePlus className="mr-2 h-4 w-4" />
            Create Distributor Product
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Distributor Products
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {products.length}
              </p>
            </div>
            <PackageCheck className="h-8 w-8 text-primary/70" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Inventory Linked
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {linkedProducts}
              </p>
            </div>
            <Warehouse className="h-8 w-8 text-primary/70" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Unmapped Inventory SKUs
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {unmappedSkus.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <CardTitle>Global Distributor Catalog</CardTitle>
              <CardDescription>
                MOQ, CP and SP are global. Stockist mapping is not required.
                Existing inventory allocation controls product availability.
              </CardDescription>
            </div>

            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search product, SKU, category or brand"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex h-56 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product / SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Main Inventory</TableHead>
                    <TableHead>Distributor Stock</TableHead>
                    <TableHead>Global MOQ Pricing</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredProducts.length ? (
                    filteredProducts.map((product) => (
                      <TableRow key={product.product_id}>
                        <TableCell>
                          <p className="font-medium">
                            {product.product_name}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            SKU: {product.sku}
                            {product.brand ? ` · ${product.brand}` : ""}
                          </p>
                        </TableCell>

                        <TableCell>{product.category_name || "—"}</TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              product.inventory_link_status === "linked"
                                ? "border-green-300 bg-green-50 text-green-700"
                                : "border-yellow-300 bg-yellow-50 text-yellow-700"
                            }
                          >
                            {product.inventory_link_status || "pending"}
                          </Badge>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Available:{" "}
                            {formatNumber(product.main_available_stock)}
                          </p>
                        </TableCell>

                        <TableCell>
                          <p className="font-medium">
                            {formatNumber(product.distributor_available_stock)}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Allocated:{" "}
                            {formatNumber(product.distributor_allocated_stock)}
                          </p>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            {(product.moq_pricing || []).map((slab) => (
                              <p
                                key={slab.id || slab.moq_quantity}
                                className="text-xs"
                              >
                                <b>
                                  {formatNumber(slab.moq_quantity)} units
                                </b>
                                {" · "}
                                CP {formatCurrency(slab.cost_price)}
                                {" · "}
                                SP {formatCurrency(slab.selling_price)}
                              </p>
                            ))}
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPricingProduct(product);
                              setPricing(
                                (product.moq_pricing || []).map((slab) => ({
                                  ...slab,
                                }))
                              );
                            }}
                          >
                            <Pencil className="mr-1 h-4 w-4" />
                            Edit MOQ
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="h-28 text-center text-muted-foreground"
                      >
                        No distributor products found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Global Distributor Product</DialogTitle>
            <DialogDescription>
              Select an unmapped inventory SKU. This product will be available
              to all stockists and agencies after distributor inventory is
              allocated.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Inventory SKU *</Label>

              <Select value={form.sku} onValueChange={chooseSku}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose unmapped SKU" />
                </SelectTrigger>

                <SelectContent>
                  {unmappedSkus.map((item) => (
                    <SelectItem
                      key={item.main_inventory_id}
                      value={item.sku}
                    >
                      {item.sku}
                      {item.item_name ? ` · ${item.item_name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>

              <Select
                value={form.category_id}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    category_id: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>

                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Brand</Label>
              <Input
                value={form.brand}
                onChange={(event) =>
                  setForm({
                    ...form,
                    brand: event.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Quantity Value</Label>
              <Input
                type="number"
                value={form.quantity_value}
                onChange={(event) =>
                  setForm({
                    ...form,
                    quantity_value: event.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Unit</Label>
              <Input
                value={form.unit}
                onChange={(event) =>
                  setForm({
                    ...form,
                    unit: event.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Short Description</Label>
              <Input
                value={form.short_description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    short_description: event.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>MRP</Label>
              <Input
                type="number"
                value={form.mrp}
                onChange={(event) =>
                  setForm({
                    ...form,
                    mrp: event.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description: event.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="mt-5 rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-medium">Global MOQ Pricing</p>
                <p className="text-xs text-muted-foreground">
                  Same MOQ, CP and SP will apply to all stockists and agencies.
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setForm({
                    ...form,
                    moq_pricing: [...form.moq_pricing, emptySlab()],
                  })
                }
              >
                Add Slab
              </Button>
            </div>

            <div className="space-y-2">
              {form.moq_pricing.map((slab, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 gap-2 rounded-md bg-muted/40 p-2 md:grid-cols-[1fr_1fr_1fr_auto]"
                >
                  <Input
                    type="number"
                    placeholder="MOQ Units"
                    value={slab.moq_quantity}
                    onChange={(event) =>
                      updateCreateSlab(
                        index,
                        "moq_quantity",
                        Number(event.target.value)
                      )
                    }
                  />

                  <Input
                    type="number"
                    placeholder="Cost Price"
                    value={slab.cost_price}
                    onChange={(event) =>
                      updateCreateSlab(
                        index,
                        "cost_price",
                        Number(event.target.value)
                      )
                    }
                  />

                  <Input
                    type="number"
                    placeholder="Selling Price"
                    value={slab.selling_price}
                    onChange={(event) =>
                      updateCreateSlab(
                        index,
                        "selling_price",
                        Number(event.target.value)
                      )
                    }
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    disabled={form.moq_pricing.length === 1}
                    onClick={() =>
                      setForm({
                        ...form,
                        moq_pricing: form.moq_pricing.filter(
                          (_, currentIndex) => currentIndex !== index
                        ),
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button onClick={saveProduct} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pricingProduct)}
        onOpenChange={(open) => !open && setPricingProduct(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Global MOQ Pricing</DialogTitle>
            <DialogDescription>
              {pricingProduct?.product_name} · {pricingProduct?.sku}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {pricing.map((slab, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_1fr_auto]"
              >
                <Input
                  type="number"
                  value={slab.moq_quantity}
                  onChange={(event) =>
                    updatePricingSlab(
                      index,
                      "moq_quantity",
                      Number(event.target.value)
                    )
                  }
                />

                <Input
                  type="number"
                  value={slab.cost_price}
                  onChange={(event) =>
                    updatePricingSlab(
                      index,
                      "cost_price",
                      Number(event.target.value)
                    )
                  }
                />

                <Input
                  type="number"
                  value={slab.selling_price}
                  onChange={(event) =>
                    updatePricingSlab(
                      index,
                      "selling_price",
                      Number(event.target.value)
                    )
                  }
                />

                <Button
                  variant="ghost"
                  disabled={pricing.length === 1}
                  onClick={() =>
                    setPricing(
                      pricing.filter(
                        (_, currentIndex) => currentIndex !== index
                      )
                    )
                  }
                >
                  Remove
                </Button>
              </div>
            ))}

            <Button
              size="sm"
              variant="outline"
              onClick={() => setPricing([...pricing, emptySlab()])}
            >
              Add MOQ Slab
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPricingProduct(null)}
            >
              Cancel
            </Button>

            <Button onClick={saveMoqPricing} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Pricing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}