import { useState } from "react";
import {
  Plus,
  Pencil,
  Image as ImageIcon,
  Upload,
  Search,
  Folder,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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

const initialProducts = [
  {
    id: "P-001",
    name: "Organic Basmati Rice 5kg",
    category: "Groceries",
    price: "₹ 720",
    active: true,
  },
  {
    id: "P-002",
    name: "Cold Pressed Mustard Oil 1L",
    category: "Groceries",
    price: "₹ 280",
    active: true,
  },
  {
    id: "P-003",
    name: "Himalayan Pink Salt 500g",
    category: "Pantry",
    price: "₹ 120",
    active: false,
  },
  {
    id: "P-004",
    name: "Almonds Premium 250g",
    category: "Dry Fruits",
    price: "₹ 340",
    active: true,
  },
  {
    id: "P-005",
    name: "Whole Wheat Atta 10kg",
    category: "Groceries",
    price: "₹ 460",
    active: true,
  },
  {
    id: "P-006",
    name: "Filter Coffee Powder 500g",
    category: "Beverages",
    price: "₹ 380",
    active: true,
  },
];

const categories = ["Groceries", "Pantry", "Dry Fruits", "Beverages", "Snacks"];

export default function Products() {
  const [products, setProducts] = useState(initialProducts);

  const toggleActive = (id: string) =>
    setProducts((p) =>
      p.map((x) => (x.id === id ? { ...x, active: !x.active } : x)),
    );

  return (
    <div>
      <PageHeader
        title="Product CMS"
        description="Create, manage and publish products like a content management system."
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" /> New Product
              </Button>
            </DialogTrigger>
            <ProductDialog />
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
                  Manage all products, drafts and published listings.
                </CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search products" className="pl-9" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {products.map((p) => (
                  <Card key={p.id} className="overflow-hidden border">
                    <div className="flex h-32 items-center justify-center bg-gradient-to-br from-accent to-secondary">
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium leading-tight">
                            {p.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.id} · {p.category}
                          </p>
                        </div>
                        <Badge
                          variant={p.active ? "default" : "secondary"}
                          className={
                            p.active
                              ? "bg-success/10 text-success hover:bg-success/10"
                              : ""
                          }
                        >
                          {p.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold">
                          {p.price}
                        </span>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={p.active}
                            onCheckedChange={() => toggleActive(p.id)}
                          />
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Organize your catalog.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="New category name" />
                <Button>
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {categories.map((c) => (
                  <div
                    key={c}
                    className="flex items-center justify-between rounded-lg border bg-card p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{c}</span>
                    </div>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
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
                Upload and reuse images across products.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-6">
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-muted/40 text-muted-foreground hover:bg-muted">
                  <Upload className="h-6 w-6" />
                  <span className="text-xs">Upload</span>
                  <input type="file" className="hidden" multiple />
                </label>
                {Array.from({ length: 11 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex aspect-square items-center justify-center rounded-lg bg-gradient-to-br from-accent to-secondary"
                  >
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProductDialog() {
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>New Product</DialogTitle>
        <DialogDescription>
          Create a product entry. Save as draft or publish immediately.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>Product name</Label>
          <Input placeholder="e.g. Organic Basmati Rice 5kg" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Description</Label>
          <Textarea placeholder="Rich product description" rows={3} />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Price (₹)</Label>
          <Input type="number" placeholder="0.00" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Images</Label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 text-muted-foreground hover:bg-muted/50">
            <Upload className="h-6 w-6" />
            <span className="text-sm">Drag & drop or click to upload</span>
            <input type="file" className="hidden" multiple />
          </label>
        </div>
        <div className="flex items-center gap-3 md:col-span-2">
          <Switch id="active" defaultChecked />
          <Label htmlFor="active">Active on storefront</Label>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline">Save as draft</Button>
        <Button>Publish</Button>
      </DialogFooter>
    </DialogContent>
  );
}