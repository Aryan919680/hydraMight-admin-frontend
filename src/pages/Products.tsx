import { useEffect, useMemo, useState } from "react";
import { Folder, Image as ImageIcon, Loader2, Pencil, Plus, Search, Upload } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { AdminProduct, api, Category, CreateProductPayload, ServiceLocation } from "@/lib/api";

type LocationInventoryForm = {
  mrp: string;
  selling_price: string;
  available_stock: string;
  reserved_stock: string;
  min_stock_level: string;
};

const DEFAULT_LOCATION_ID = import.meta.env.VITE_DEFAULT_LOCATION_ID || "";

const blankProductForm = {
  name: "",
  sku: "",
  brand: "",
  category_id: "",
  short_description: "",
  description: "",

  portal_type: "household",
  quantity_value: "",
  quantity_unit: "ml",

  unit: "bottle",
  weight: "",

  mrp: "",
  selling_price: "",
  available_stock: "",
  reserved_stock: "0",
  min_stock_level: "0",

  image_url: "",
  storage_bucket: "",
  storage_path: "",
  file_name: "",
  mime_type: "",
  file_size: "",

  location_ids: DEFAULT_LOCATION_ID ? [DEFAULT_LOCATION_ID] : [],
  location_inventory: {} as Record<string, LocationInventoryForm>,

  is_featured: false,
};

export default function Products() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [search, setSearch] = useState("");
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [form, setForm] = useState(blankProductForm);
  const [locations, setLocations] = useState<ServiceLocation[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productResponse, categoryResponse, locationResponse] = await Promise.all([
        api.getProducts(100, 0),
        api.getCategories(),
        api.getLocations(),
      ]);

      setProducts(productResponse.data || []);
      setCategories(categoryResponse.data || []);
      setLocations(locationResponse.data || []);
    } catch (error) {
      toast({
        title: "Failed to load catalog",
        description: error instanceof Error ? error.message : "Please check backend connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return products;

    return products.filter((p) =>
      [
        p.name,
        p.sku,
        p.category_name,
        p.brand,
        p.portal_type,
        p.quantity_unit,
      ].some((value) => String(value || "").toLowerCase().includes(q)),
    );
  }, [products, search]);

 const setField = (
  key: keyof typeof blankProductForm,
  value: string | boolean | string[] | Record<string, LocationInventoryForm>
) => {
  setForm((prev) => {
    const next = { ...prev, [key]: value };

    if (key === "portal_type") {
      if (value === "commercial") {
        next.quantity_unit = "gallon";
        next.unit = "can";
      } else if (value === "household") {
        next.quantity_unit = "ml";
        next.unit = "bottle";
      }
    }

    return next;
  });
};

const toggleLocation = (locationId: string, checked: boolean) => {
  setForm((prev) => {
    const nextLocationIds = checked
      ? Array.from(new Set([...prev.location_ids, locationId]))
      : prev.location_ids.filter((id) => id !== locationId);

    const nextLocationInventory = { ...prev.location_inventory };

    if (checked && !nextLocationInventory[locationId]) {
      nextLocationInventory[locationId] = {
        mrp: prev.mrp || "",
        selling_price: prev.selling_price || "",
        available_stock: prev.available_stock || "",
        reserved_stock: prev.reserved_stock || "0",
        min_stock_level: prev.min_stock_level || "0",
      };
    }

    if (!checked) {
      delete nextLocationInventory[locationId];
    }

    return {
      ...prev,
      location_ids: nextLocationIds,
      location_inventory: nextLocationInventory,
    };
  });
};

const setLocationInventoryField = (
  locationId: string,
  key: keyof LocationInventoryForm,
  value: string
) => {
  setForm((prev) => ({
    ...prev,
    location_inventory: {
      ...prev.location_inventory,
      [locationId]: {
        mrp: prev.location_inventory[locationId]?.mrp || prev.mrp || "",
        selling_price:
          prev.location_inventory[locationId]?.selling_price || prev.selling_price || "",
        available_stock:
          prev.location_inventory[locationId]?.available_stock || prev.available_stock || "",
        reserved_stock:
          prev.location_inventory[locationId]?.reserved_stock || prev.reserved_stock || "0",
        min_stock_level:
          prev.location_inventory[locationId]?.min_stock_level || prev.min_stock_level || "0",
        [key]: value,
      },
    },
  }));
};

  const uploadProductImage = async (file: File) => {
    try {
      setUploadingImage(true);

      const response = await api.uploadProductImage(file);

      if (!response.success || !response.image_url) {
        throw new Error("Image upload failed");
      }

      setForm((prev) => ({
        ...prev,
        image_url: response.image_url,
        storage_bucket: response.storage_bucket || "product-images",
        storage_path: response.storage_path || "",
        file_name: response.file_name || "",
        mime_type: response.mime_type || "",
        file_size: response.file_size ? String(response.file_size) : "",
      }));

      toast({
        title: "Image uploaded",
        description: "Product image uploaded to Supabase Storage.",
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

  const createProduct = async () => {
    try {
      if (
        !form.name ||
        !form.category_id ||
        form.location_ids.length === 0 ||
        !form.portal_type ||
        !form.quantity_value ||
        !form.quantity_unit
      ) {
        toast({
          title: "Missing required fields",
          description: "Name, category, portal type, quantity, location, MRP and selling price are required.",
          variant: "destructive",
        });
        return;
      }

      if (form.portal_type === "household" && !["ml", "litre"].includes(form.quantity_unit)) {
        toast({
          title: "Invalid quantity unit",
          description: "Household products must use ml or litre.",
          variant: "destructive",
        });
        return;
      }

      if (form.portal_type === "commercial" && form.quantity_unit !== "gallon") {
        toast({
          title: "Invalid quantity unit",
          description: "Commercial products must use gallon.",
          variant: "destructive",
        });
        return;
      }

      for (const locationId of form.location_ids) {
  const loc = form.location_inventory[locationId];

  if (!loc || !loc.mrp || !loc.selling_price) {
    toast({
      title: "Missing location pricing",
      description: "MRP and selling price are required for every selected location.",
      variant: "destructive",
    });
    return;
  }
}

      setSaving(true);

const payload: CreateProductPayload = {
  category_id: form.category_id,
  name: form.name,
  sku: form.sku || undefined,
  short_description: form.short_description || undefined,
  description: form.description || undefined,
  brand: form.brand || undefined,

  portal_type: form.portal_type,
  quantity_value: Number(form.quantity_value),
  quantity_unit: form.quantity_unit,

  unit: form.unit || undefined,
  weight: form.weight ? Number(form.weight) : null,
  is_featured: Boolean(form.is_featured),

  location_inventory: form.location_ids.map((locationId) => {
    const loc = form.location_inventory[locationId];

    return {
      location_id: locationId,
      mrp: Number(loc?.mrp || 0),
      selling_price: Number(loc?.selling_price || 0),
      available_stock: Number(loc?.available_stock || 0),
      reserved_stock: Number(loc?.reserved_stock || 0),
      min_stock_level: Number(loc?.min_stock_level || 0),
    };
  }),

  images: form.image_url
    ? [
        {
          image_url: form.image_url,
          storage_bucket: form.storage_bucket || "product-images",
          storage_path: form.storage_path || undefined,
          file_name: form.file_name || undefined,
          mime_type: form.mime_type || undefined,
          file_size: form.file_size ? Number(form.file_size) : undefined,
          alt_text: form.name,
        },
      ]
    : [],
};

      await api.createProduct(payload);

      toast({
        title: "Product created",
        description: "Product, price, inventory and image details saved successfully.",
      });

      setForm(blankProductForm);
      setProductDialogOpen(false);
      await loadData();
    } catch (error) {
      toast({
        title: "Failed to create product",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (product: AdminProduct) => {
    try {
      const nextValue = !product.is_active;
      await api.updateProduct(product.id, { is_active: nextValue });

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: nextValue } : p)),
      );

      toast({ title: nextValue ? "Product activated" : "Product deactivated" });
    } catch (error) {
      toast({
        title: "Status update failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const createCategory = async () => {
    try {
      if (!categoryName.trim()) return;

      await api.createCategory({ name: categoryName.trim() });
      setCategoryName("");
      toast({ title: "Category added" });

      const response = await api.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      toast({
        title: "Category creation failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <PageHeader
        title="Product CMS"
        description="Manage household and commercial cleaning products."
        actions={
          <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" /> New Product
              </Button>
            </DialogTrigger>

            <ProductDialog
  form={form}
  categories={categories}
  locations={locations}
  saving={saving}
  uploadingImage={uploadingImage}
  onChange={setField}
  onSubmit={createProduct}
  onImageUpload={uploadProductImage}
  onLocationToggle={toggleLocation}
  onLocationInventoryChange={setLocationInventoryField}
/>
          </Dialog>
        }
      />

      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="media">Media Library</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <div>
                <CardTitle>Product Catalog</CardTitle>
                <CardDescription>
                  Products are loaded from Express backend and Supabase DB.
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
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading products...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  No products found. Add your first cleaning product.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((p) => (
                    <Card key={`${p.id}-${p.location_id || "default"}`} className="overflow-hidden border">
                      <div className="flex h-32 items-center justify-center bg-gradient-to-br from-accent to-secondary">
                        {p.primary_image ? (
                          <img src={p.primary_image} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-10 w-10 text-muted-foreground" />
                        )}
                      </div>

                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium leading-tight">{p.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.sku || "No SKU"} · {p.category_name || "No category"}
                            </p>
                          </div>

                          <Badge
                            variant={p.is_active ? "default" : "secondary"}
                            className={p.is_active ? "bg-success/10 text-success hover:bg-success/10" : ""}
                          >
                            {p.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">
                            {p.portal_type || "household"}
                          </Badge>
                          <Badge variant="outline">
                            {p.quantity_value || "-"} {p.quantity_unit || ""}
                          </Badge>
                        </div>

                       <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
  <div>MRP from: ₹{Number(p.mrp || 0).toFixed(2)}</div>
  <div>Stock: {p.total_available_stock ?? p.available_stock ?? 0}</div>
  <div>Locations: {p.location_count ?? 0}</div>
  <div>Total: {p.total_stock ?? 0}</div>
</div>
                        

                        <div className="flex items-center justify-between">
                          <span className="text-base font-semibold">
                            ₹{Number(p.selling_price || 0).toFixed(2)}
                          </span>

                          <div className="flex items-center gap-3">
                            <Switch checked={Boolean(p.is_active)} onCheckedChange={() => toggleActive(p)} />
                            <Button variant="ghost" size="icon" disabled title="Edit form can be added next">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cleaning Product Categories</CardTitle>
              <CardDescription>
                Example: Floor Cleaners, Bathroom Cleaners, Kitchen Cleaners, Commercial Bulk Cleaners.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New category name"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
                <Button onClick={createCategory}>
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {categories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{c.name}</span>
                    </div>
                    <Badge variant={c.is_active ? "default" : "secondary"}>
                      {c.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Media Library</CardTitle>
              <CardDescription>
                Product images are uploaded to Supabase Storage and URL metadata is saved in DB.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <Upload className="mx-auto mb-2 h-6 w-6" />
                Upload images from the product creation form.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

type ProductDialogProps = {
  form: typeof blankProductForm;
  categories: Category[];
  locations: ServiceLocation[];
  saving: boolean;
  uploadingImage: boolean;
  onChange: (
    key: keyof typeof blankProductForm,
    value: string | boolean | string[] | Record<string, LocationInventoryForm>
  ) => void;
  onSubmit: () => void;
  onImageUpload: (file: File) => void;
  onLocationToggle: (locationId: string, checked: boolean) => void;
  onLocationInventoryChange: (
    locationId: string,
    key: keyof LocationInventoryForm,
    value: string
  ) => void;
};

function ProductDialog({
  form,
  categories,
  locations,
  saving,
  uploadingImage,
  onChange,
  onSubmit,
  onImageUpload,
  onLocationToggle,
  onLocationInventoryChange,
}: ProductDialogProps) {
  const quantityUnits =
    form.portal_type === "commercial"
      ? ["gallon"]
      : form.portal_type === "household"
        ? ["ml", "litre"]
        : ["ml", "litre", "gallon"];

  return (
    <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>New Cleaning Product</DialogTitle>
        <DialogDescription>
          Creates product, Supabase image metadata, price and inventory records.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>Product name *</Label>
          <Input
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="e.g. Floor Cleaner 500ml"
          />
        </div>

        <div className="space-y-2">
          <Label>Portal type *</Label>
          <Select value={form.portal_type} onValueChange={(value) => onChange("portal_type", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select portal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="household">Household</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Category *</Label>
          <Select value={form.category_id} onValueChange={(value) => onChange("category_id", value)}>
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
          <Label>Quantity value *</Label>
          <Input
            type="number"
            value={form.quantity_value}
            onChange={(e) => onChange("quantity_value", e.target.value)}
            placeholder={form.portal_type === "commercial" ? "5" : "500"}
          />
        </div>

        <div className="space-y-2">
          <Label>Quantity unit *</Label>
          <Select value={form.quantity_unit} onValueChange={(value) => onChange("quantity_unit", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {quantityUnits.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>SKU</Label>
          <Input
            value={form.sku}
            onChange={(e) => onChange("sku", e.target.value)}
            placeholder="HH-FC-500ML"
          />
        </div>

        <div className="space-y-2">
          <Label>Brand</Label>
          <Input
            value={form.brand}
            onChange={(e) => onChange("brand", e.target.value)}
            placeholder="HydraClean"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Short description</Label>
          <Input
            value={form.short_description}
            onChange={(e) => onChange("short_description", e.target.value)}
            placeholder="Powerful cleaning liquid for daily use"
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

      <div className="space-y-2 md:col-span-2">
  <Label>Locations *</Label>

  <div className="rounded-md border p-3 space-y-2">
    {locations
      .filter((location) => location.is_active)
      .map((location) => {
        const checked = form.location_ids.includes(location.id);

        return (
          <label
            key={location.id}
            className="flex cursor-pointer items-center justify-between rounded-md p-2 hover:bg-muted"
          >
            <div>
              <p className="text-sm font-medium">
                {location.name} - {location.city}
              </p>
              <p className="text-xs text-muted-foreground">
                {location.pincode}
              </p>
            </div>

            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onLocationToggle(location.id, e.target.checked)}
              className="h-4 w-4"
            />
          </label>
        );
      })}
  </div>

{form.location_ids.length > 0 && (
  <div className="space-y-4 md:col-span-2">
    <div>
      <Label>Location-wise Pricing & Inventory *</Label>
      <p className="text-xs text-muted-foreground">
        Product will be created once. Price and inventory will be saved separately for each location.
      </p>
    </div>

    <div className="space-y-3">
      {form.location_ids.map((locationId) => {
        const location = locations.find((l) => l.id === locationId);
        const locForm = form.location_inventory[locationId] || {
          mrp: "",
          selling_price: "",
          available_stock: "",
          reserved_stock: "0",
          min_stock_level: "0",
        };

        return (
          <div key={locationId} className="rounded-lg border p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold">
                {location?.name || "Selected Location"}
              </p>
              <p className="text-xs text-muted-foreground">
                {location?.city} {location?.pincode ? `· ${location.pincode}` : ""}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-5">
              <div className="space-y-1">
                <Label>MRP ₹ *</Label>
                <Input
                  type="number"
                  value={locForm.mrp}
                  onChange={(e) =>
                    onLocationInventoryChange(locationId, "mrp", e.target.value)
                  }
                  placeholder="150"
                />
              </div>

              <div className="space-y-1">
                <Label>Selling ₹ *</Label>
                <Input
                  type="number"
                  value={locForm.selling_price}
                  onChange={(e) =>
                    onLocationInventoryChange(locationId, "selling_price", e.target.value)
                  }
                  placeholder="120"
                />
              </div>

              <div className="space-y-1">
                <Label>Available</Label>
                <Input
                  type="number"
                  value={locForm.available_stock}
                  onChange={(e) =>
                    onLocationInventoryChange(locationId, "available_stock", e.target.value)
                  }
                  placeholder="20"
                />
              </div>

              <div className="space-y-1">
                <Label>Reserved</Label>
                <Input
                  type="number"
                  value={locForm.reserved_stock}
                  onChange={(e) =>
                    onLocationInventoryChange(locationId, "reserved_stock", e.target.value)
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-1">
                <Label>Min Stock</Label>
                <Input
                  type="number"
                  value={locForm.min_stock_level}
                  onChange={(e) =>
                    onLocationInventoryChange(locationId, "min_stock_level", e.target.value)
                  }
                  placeholder="5"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
</div>
        <div className="space-y-2">
          <Label>Unit</Label>
          <Input
            value={form.unit}
            onChange={(e) => onChange("unit", e.target.value)}
            placeholder="bottle, can, pack"
          />
        </div>



        <div className="space-y-2">
          <Label>Weight</Label>
          <Input
            type="number"
            value={form.weight}
            onChange={(e) => onChange("weight", e.target.value)}
            placeholder="1"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Product Image</Label>

          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              disabled={uploadingImage}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImageUpload(file);
              }}
            />

            {uploadingImage && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </div>

          {form.image_url && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border p-3">
              <img
                src={form.image_url}
                alt={form.name || "Product image"}
                className="h-20 w-20 rounded-md object-cover"
              />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Image uploaded to Supabase Storage</p>
                <p className="truncate text-xs text-muted-foreground">{form.image_url}</p>
                {form.storage_path && (
                  <p className="truncate text-xs text-muted-foreground">
                    Path: {form.storage_path}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 md:col-span-2">
          <Switch
            id="featured"
            checked={form.is_featured}
            onCheckedChange={(checked) => onChange("is_featured", checked)}
          />
          <Label htmlFor="featured">Featured product</Label>
        </div>
      </div>

      <DialogFooter>
        <Button onClick={onSubmit} disabled={saving || uploadingImage}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Publish Product
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}