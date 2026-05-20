import { useEffect, useMemo, useState } from "react";
import {
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  AdminProduct,
  api,
  Category,
  CreateProductPayload,
  ServiceLocation,
} from "@/lib/api";

const blankProductForm = {
  name: "",
  sku: "",
  brand: "",
  category_id: "",
  short_description: "",
  description: "",

  ecom_channel: "household",

  quantity_value: "",
  quantity_unit: "ml",

  unit: "bottle",
  weight: "",

  mrp: "",
  selling_price: "",
  currency: "INR",

  service_location_ids: [] as string[],
  images: [] as {
    image_url: string;
    storage_bucket?: string;
    storage_path?: string;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
    alt_text?: string;
    is_primary?: boolean;
    display_order?: number;
  }[],

  is_featured: false,
  is_available_for_sale: true,
  image_url_input: "",
};

export default function Products() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<ServiceLocation[]>([]);
const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [form, setForm] = useState(blankProductForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const [productResponse, categoryResponse, locationResponse] =
        await Promise.all([
          api.getProducts(100, 0),
          api.getCategories(),
          api.getLocations(),
        ]);

      setProducts(productResponse.data || []);
      setCategories(categoryResponse.data || []);
      setLocations(locationResponse.data || []);
    } catch (error) {
      toast({
        title: "Failed to load products",
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

  const openCreateDialog = () => {
    setEditingProductId(null);
    setForm(blankProductForm);
    setProductDialogOpen(true);
  };

  const populateFormFromProduct = (p: any) => {
    setForm({
      ...blankProductForm,
      name: p.name || "",
      sku: p.sku || "",
      brand: p.brand || "",
      category_id: p.category_id || "",
      short_description: p.short_description || "",
      description: p.description || "",
      ecom_channel: p.ecom_channel || p.portal_type || "household",
      quantity_value:
        p.quantity_value !== undefined && p.quantity_value !== null
          ? String(p.quantity_value)
          : "",
      quantity_unit: p.quantity_unit || "ml",
      unit: p.unit || "bottle",
      weight:
        p.weight !== undefined && p.weight !== null ? String(p.weight) : "",
      mrp: p.mrp !== undefined && p.mrp !== null ? String(p.mrp) : "",
      selling_price:
        p.selling_price !== undefined && p.selling_price !== null
          ? String(p.selling_price)
          : "",
      currency: p.currency || "INR",
      service_location_ids: Array.isArray(p.service_location_ids)
        ? p.service_location_ids
        : Array.isArray(p.service_locations)
        ? p.service_locations
            .map(
              (l: any) =>
                l?.service_location_id || l?.location_id || l?.id || l,
            )
            .filter((v: any) => typeof v === "string" && v.length > 0)
        : Array.isArray(p.locations)
        ? p.locations
            .map(
              (l: any) =>
                l?.service_location_id || l?.location_id || l?.id || l,
            )
            .filter((v: any) => typeof v === "string" && v.length > 0)
        : [],
      images: Array.isArray(p.images) ? p.images : [],
      is_featured: Boolean(p.is_featured),
      is_available_for_sale:
        p.is_available_for_sale !== undefined
          ? Boolean(p.is_available_for_sale)
          : Boolean(p.is_active),
    });
  };

  const openEditDialog = async (product: AdminProduct) => {
    setEditingProductId(product.id);
    setForm(blankProductForm);
    setProductDialogOpen(true);
    setLoadingProduct(true);
    try {
      const response = await api.getProductById(product.id);
      const detail = (response.data as any) || product;
      populateFormFromProduct(detail);
    } catch (error) {
      toast({
        title: "Failed to load product details",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      populateFormFromProduct(product);
    } finally {
      setLoadingProduct(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();

    const ecomProducts = products.filter((p) => {
      const channel = (p as any).ecom_channel || (p as any).portal_type;
      return channel === "household" || channel === "commercial";
    });

    if (!q) return ecomProducts;

    return ecomProducts.filter((p) =>
      [
        p.name,
        p.sku,
        p.category_name,
        p.brand,
        (p as any).ecom_channel,
        (p as any).quantity_unit,
      ].some((value) => String(value || "").toLowerCase().includes(q)),
    );
  }, [products, search]);

  const setField = (
    key: keyof typeof blankProductForm,
    value:
      | string
      | boolean
      | string[]
      | typeof blankProductForm.images,
  ) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "ecom_channel") {
        if (value === "commercial") {
          next.quantity_unit = "gallon";
          next.unit = "can";
        } else {
          next.quantity_unit = "ml";
          next.unit = "bottle";
        }
      }

      return next;
    });
  };

  const toggleServiceLocation = (locationId: string, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      service_location_ids: checked
        ? Array.from(new Set([...prev.service_location_ids, locationId]))
        : prev.service_location_ids.filter((id) => id !== locationId),
    }));
  };

  const addImageUrl = () => {
    const imageUrl = form.image_url_input.trim();

    if (!imageUrl) {
      toast({
        title: "Image URL required",
        description: "Please enter an image URL.",
        variant: "destructive",
      });
      return;
    }

    setForm((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        {
          image_url: imageUrl,
          alt_text: prev.name || "Product image",
          is_primary: prev.images.length === 0,
          display_order: prev.images.length,
        },
      ],
      image_url_input: "",
    }));
  };

  const removeImage = (index: number) => {
    setForm((prev) => {
      const nextImages = prev.images.filter((_, i) => i !== index);

      return {
        ...prev,
        images: nextImages.map((img, i) => ({
          ...img,
          is_primary: i === 0,
          display_order: i,
        })),
      };
    });
  };

  const submitProduct = async () => {
    try {
      if (
        !form.name ||
        !form.sku ||
        !form.category_id ||
        !form.ecom_channel ||
        !form.quantity_unit ||
        form.service_location_ids.length === 0
      ) {
        toast({
          title: "Missing required fields",
          description:
            "Name, SKU, category, ecom channel, quantity unit and service locations are required.",
          variant: "destructive",
        });
        return;
      }

      if (
        form.ecom_channel === "household" &&
        !["ml", "litre"].includes(form.quantity_unit)
      ) {
        toast({
          title: "Invalid quantity unit",
          description: "Household products must use ml or litre.",
          variant: "destructive",
        });
        return;
      }

      if (
        form.ecom_channel === "commercial" &&
        form.quantity_unit !== "gallon"
      ) {
        toast({
          title: "Invalid quantity unit",
          description: "Commercial products must use gallon.",
          variant: "destructive",
        });
        return;
      }

      setSaving(true);

      const payload: CreateProductPayload = {
        category_id: form.category_id,
        name: form.name,
        sku: form.sku.trim().toUpperCase(),
        brand: form.brand || undefined,
        short_description: form.short_description || undefined,
        description: form.description || undefined,

        ecom_channel: form.ecom_channel as "household" | "commercial",

        quantity_value: form.quantity_value
          ? Number(form.quantity_value)
          : null,
        quantity_unit: form.quantity_unit as "ml" | "litre" | "gallon",

        unit: form.unit || undefined,
        weight: form.weight ? Number(form.weight) : null,

        mrp: form.mrp ? Number(form.mrp) : null,
        selling_price: form.selling_price
          ? Number(form.selling_price)
          : null,
        currency: form.currency || "INR",

        is_featured: Boolean(form.is_featured),
        is_available_for_sale: Boolean(form.is_available_for_sale),

        service_location_ids: form.service_location_ids,
        images: form.images,
      };

      if (editingProductId) {
        await api.updateProduct(editingProductId, payload as any);
        toast({
          title: "Product updated",
          description: "Ecom product updated successfully.",
        });
      } else {
        await api.createProduct(payload);
        toast({
          title: "Product created",
          description:
            "Ecom product created. Inventory is linked automatically by SKU if available.",
        });
      }

      setForm(blankProductForm);
      setEditingProductId(null);
      setProductDialogOpen(false);
      await loadData();
    } catch (error) {
      toast({
        title: editingProductId
          ? "Failed to update product"
          : "Failed to create product",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (product: AdminProduct) => {
    try {
      const nextValue = !product.is_active;

      await api.updateProduct(product.id, {
        is_active: nextValue,
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_active: nextValue } : p,
        ),
      );

      toast({
        title: nextValue ? "Product activated" : "Product deactivated",
      });
    } catch (error) {
      toast({
        title: "Status update failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };
  const uploadProductImage = async (file: File) => {
  try {
    setUploadingImage(true);

    const response = await api.uploadProductImage(file);

    setForm((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        {
          image_url: response.image_url,
          storage_bucket: response.storage_bucket,
          storage_path: response.storage_path,
          file_name: response.file_name,
          mime_type: response.mime_type,
          file_size: response.file_size,
          alt_text: prev.name || response.file_name,
          is_primary: prev.images.length === 0,
          display_order: prev.images.length,
        },
      ],
    }));

    toast({
      title: "Image uploaded",
      description: "Product image added successfully.",
    });
  } catch (error) {
    toast({
      title: "Image upload failed",
      description: error instanceof Error ? error.message : "Please try again.",
      variant: "destructive",
    });
  } finally {
    setUploadingImage(false);
  }
};

  return (
    <div>
      <PageHeader
        title="Product CMS"
        description="Manage selling products by channel. Ecom is active now; White Label and Distribution will be added later."
        actions={
          <Dialog
            open={productDialogOpen}
            onOpenChange={(open) => {
              setProductDialogOpen(open);
              if (!open) {
                setEditingProductId(null);
                setForm(blankProductForm);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-1 h-4 w-4" />
                New Ecom Product
              </Button>
            </DialogTrigger>

           <ProductDialog
  form={form}
  isEditing={Boolean(editingProductId)}
  loadingProduct={loadingProduct}
  categories={categories}
  locations={locations}
  saving={saving}
  uploadingImage={uploadingImage}
  onChange={setField}
  onToggleLocation={toggleServiceLocation}
  onUploadImage={uploadProductImage}
  onRemoveImage={removeImage}
  onSubmit={submitProduct}
/>
          </Dialog>
        }
      />

      <Tabs defaultValue="ecom">
        <TabsList>
          <TabsTrigger value="ecom">Ecom</TabsTrigger>
          <TabsTrigger value="white_label">White Label</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="ecom" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <div>
                <CardTitle>Ecom Product Catalog</CardTitle>
                <CardDescription>
                  Products for household and commercial ecommerce channels.
                </CardDescription>
              </div>

              <div className="relative w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  placeholder="Search products"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center rounded-lg border py-16 text-muted-foreground">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading products...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  No ecom products found.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((p) => {
                    const ecomChannel =
                      (p as any).ecom_channel ||
                      (p as any).portal_type ||
                      "household";

                    const inventoryStatus =
                      (p as any).inventory_link_status ||
                      (p as any).product_link_status ||
                      "pending";

                    return (
                      <Card key={p.id} className="overflow-hidden border">
                        <div className="flex h-32 items-center justify-center bg-gradient-to-br from-accent to-secondary">
                          {(p as any).primary_image ? (
                            <img
                              src={(p as any).primary_image}
                              alt={p.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                          )}
                        </div>

                        <CardContent className="space-y-3 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium leading-tight">
                                {p.name}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {p.sku || "No SKU"} ·{" "}
                                {p.category_name || "No category"}
                              </p>
                            </div>

                            <Badge
                              variant={p.is_active ? "default" : "secondary"}
                            >
                              {p.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{ecomChannel}</Badge>

                            <Badge variant="outline">
                              {(p as any).quantity_value || "-"}{" "}
                              {(p as any).quantity_unit || ""}
                            </Badge>

                            <Badge
                              variant={
                                inventoryStatus === "linked"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {inventoryStatus === "linked"
                                ? "Inventory Linked"
                                : "Inventory Pending"}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <div>
                              MRP: ₹{Number((p as any).mrp || 0).toFixed(2)}
                            </div>

                            <div>
                              Locations:{" "}
                              {(p as any).service_location_count ?? 0}
                            </div>

                            <div>
                              Main Stock:{" "}
                              {(p as any).main_available_stock ?? "-"}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-base font-semibold">
                              ₹
                              {Number(
                                (p as any).selling_price || 0,
                              ).toFixed(2)}
                            </span>

                            <div className="flex items-center gap-3">
                              <Switch
                                checked={Boolean(p.is_active)}
                                onCheckedChange={() => toggleActive(p)}
                              />

                              <Button
                                variant="ghost"
                                size="icon"
                                title="Edit product"
                                onClick={() => openEditDialog(p)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="white_label" className="mt-4">
          <EmptyChannelCard
            title="White Label Products"
            description="White label product management will be implemented later."
          />
        </TabsContent>

        <TabsContent value="distribution" className="mt-4">
          <EmptyChannelCard
            title="Distribution Products"
            description="Distribution product management will be implemented later."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type ProductDialogProps = {
  form: typeof blankProductForm;
  isEditing: boolean;
  loadingProduct?: boolean;
  categories: Category[];
  locations: ServiceLocation[];
  saving: boolean;
  uploadingImage: boolean;
  onChange: (
    key: keyof typeof blankProductForm,
    value:
      | string
      | boolean
      | string[]
      | typeof blankProductForm.images
  ) => void;
  onToggleLocation: (locationId: string, checked: boolean) => void;
  onUploadImage: (file: File) => void;
  onRemoveImage: (index: number) => void;
  onSubmit: () => void;
};
function ProductDialog({
  form,
  isEditing,
  loadingProduct,
  categories,
  locations,
  saving,
  onChange,
  onToggleLocation,
  uploadingImage,
  onUploadImage,
  onRemoveImage,
  onSubmit,
}: ProductDialogProps) {
  const allowedUnits =
    form.ecom_channel === "commercial" ? ["gallon"] : ["ml", "litre"];

  return (
    <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {isEditing ? "Edit Ecom Product" : "New Ecom Product"}
        </DialogTitle>
        <DialogDescription>
          Product is for ecommerce selling only. Stock is linked by SKU and
          service location inventory.
        </DialogDescription>
      </DialogHeader>

      {loadingProduct ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading product details...
        </div>
      ) : (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>Product name *</Label>
          <Input
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Hydra Floor Cleaner 500ml"
          />
        </div>

        <div className="space-y-2">
          <Label>SKU *</Label>
          <Input
            value={form.sku}
            onChange={(e) => onChange("sku", e.target.value.toUpperCase())}
            placeholder="PRO-001"
          />
        </div>

        <div className="space-y-2">
          <Label>Brand</Label>
          <Input
            value={form.brand}
            onChange={(e) => onChange("brand", e.target.value)}
            placeholder="HydraMight"
          />
        </div>

        <div className="space-y-2">
          <Label>Category *</Label>
          <Select
            value={form.category_id}
            onValueChange={(value) => onChange("category_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>

            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Ecom Channel *</Label>
          <Select
            value={form.ecom_channel}
            onValueChange={(value) => onChange("ecom_channel", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select ecom channel" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="household">Household</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Quantity value</Label>
          <Input
            type="number"
            value={form.quantity_value}
            onChange={(e) => onChange("quantity_value", e.target.value)}
            placeholder={form.ecom_channel === "commercial" ? "5" : "500"}
          />
        </div>

        <div className="space-y-2">
          <Label>Quantity unit *</Label>
          <Select
            value={form.quantity_unit}
            onValueChange={(value) => onChange("quantity_unit", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>

            <SelectContent>
              {allowedUnits.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Unit</Label>
          <Input
            value={form.unit}
            onChange={(e) => onChange("unit", e.target.value)}
            placeholder="bottle, can"
          />
        </div>

        <div className="space-y-2">
          <Label>Weight</Label>
          <Input
            type="number"
            value={form.weight}
            onChange={(e) => onChange("weight", e.target.value)}
            placeholder="0.5"
          />
        </div>

        <div className="space-y-2">
          <Label>MRP ₹</Label>
          <Input
            type="number"
            value={form.mrp}
            onChange={(e) => onChange("mrp", e.target.value)}
            placeholder="120"
          />
        </div>

        <div className="space-y-2">
          <Label>Selling price ₹</Label>
          <Input
            type="number"
            value={form.selling_price}
            onChange={(e) => onChange("selling_price", e.target.value)}
            placeholder="99"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Short description</Label>
          <Input
            value={form.short_description}
            onChange={(e) => onChange("short_description", e.target.value)}
            placeholder="Shown on listing card"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Description</Label>
          <Textarea
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Full product description"
            rows={3}
          />
        </div>

        <div className="space-y-3 md:col-span-2">
          <Label>Service Locations *</Label>

          {locations.length === 0 ? (
            <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">
              No active service locations found. Add service locations first.
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {locations
                .filter((location) => location.is_active)
                .map((location) => {
                  const checked = form.service_location_ids.includes(
                    location.id,
                  );

                  return (
                    <div
                      key={location.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {location.name}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {location.city} · {location.pincode}
                        </p>
                      </div>

                      <Switch
                        checked={checked}
                        onCheckedChange={(value) =>
                          onToggleLocation(location.id, value)
                        }
                      />
                    </div>
                  );
                })}
            </div>
          )}
        </div>

<div className="space-y-3 md:col-span-2">
  <Label>Product Images</Label>

  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-muted-foreground hover:bg-muted/40">
    {uploadingImage ? (
      <Loader2 className="mb-2 h-6 w-6 animate-spin" />
    ) : (
      <ImageIcon className="mb-2 h-6 w-6" />
    )}

    <span className="text-sm">
      {uploadingImage ? "Uploading image..." : "Click to select product image"}
    </span>

    <span className="mt-1 text-xs">
      PNG, JPG, WEBP up to 5MB
    </span>

    <Input
      type="file"
      accept="image/*"
      className="hidden"
      disabled={uploadingImage}
      onChange={(e) => {
        const file = e.target.files?.[0];

        if (file) {
          onUploadImage(file);
        }

        e.target.value = "";
      }}
    />
  </label>

  {form.images.length > 0 && (
    <div className="grid gap-3 md:grid-cols-4">
      {form.images.map((img, index) => (
        <div
          key={`${img.image_url}-${index}`}
          className="overflow-hidden rounded-lg border"
        >
          <img
            src={img.image_url}
            alt={img.alt_text || form.name}
            className="h-24 w-full object-contain"
          />

          <div className="flex items-center justify-between p-2">
            <Badge variant={index === 0 ? "default" : "secondary"}>
              {index === 0 ? "Primary" : `Image ${index + 1}`}
            </Badge>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemoveImage(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

        <div className="flex items-center gap-3">
          <Switch
            id="featured"
            checked={form.is_featured}
            onCheckedChange={(checked) => onChange("is_featured", checked)}
          />
          <Label htmlFor="featured">Featured product</Label>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="available"
            checked={form.is_available_for_sale}
            onCheckedChange={(checked) =>
              onChange("is_available_for_sale", checked)
            }
          />
          <Label htmlFor="available">Available for sale</Label>
        </div>
      </div>
      )}

      <DialogFooter>
        <Button onClick={onSubmit} disabled={saving || loadingProduct}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Save Changes" : "Publish Ecom Product"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function EmptyChannelCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          This channel is not active yet.
        </div>
      </CardContent>
    </Card>
  );
}