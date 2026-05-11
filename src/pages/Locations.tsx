import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MapPin, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

type ServiceLocation = {
  id: string;
  name: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  radius_km?: number | null;
  is_active: boolean;
  created_at: string;
};

const blankForm = {
  name: "",
  city: "",
  state: "",
  pincode: "",
  latitude: "",
  longitude: "",
  radius_km: "",
};

export default function Locations() {
  const [locations, setLocations] = useState<ServiceLocation[]>([]);
  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await api.getLocations();
      setLocations(response.data || []);
    } catch (error) {
      toast({
        title: "Failed to load locations",
        description: error instanceof Error ? error.message : "Please check backend connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const setField = (key: keyof typeof blankForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const createLocation = async () => {
    try {
      if (!form.name || !form.city || !form.state || !form.pincode) {
        toast({
          title: "Missing required fields",
          description: "Name, city, state and pincode are required.",
          variant: "destructive",
        });
        return;
      }

      setSaving(true);

      await api.createLocation({
        name: form.name,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        radius_km: form.radius_km ? Number(form.radius_km) : null,
        is_active: true,
      });

      toast({ title: "Location added" });
      setForm(blankForm);
      await loadLocations();
    } catch (error) {
      toast({
        title: "Location creation failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleLocation = async (location: ServiceLocation) => {
    try {
      const nextValue = !location.is_active;

      await api.updateLocation(location.id, {
        is_active: nextValue,
      });

      setLocations((prev) =>
        prev.map((item) =>
          item.id === location.id ? { ...item, is_active: nextValue } : item,
        ),
      );

      toast({
        title: nextValue ? "Location activated" : "Location paused",
      });
    } catch (error) {
      toast({
        title: "Status update failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteLocation = async (id: string) => {
    try {
      await api.deleteLocation(id);
      toast({ title: "Location deleted" });
      await loadLocations();
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
        title="Locations & Service Areas"
        description="Define serviceable areas and map inventory to locations."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Add Service Area</CardTitle>
            <CardDescription>Define a new serviceable location.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Location name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Gurgaon Main Warehouse"
              />
            </div>

            <div className="space-y-2">
              <Label>City *</Label>
              <Input
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
                placeholder="Gurgaon"
              />
            </div>

            <div className="space-y-2">
              <Label>State *</Label>
              <Input
                value={form.state}
                onChange={(e) => setField("state", e.target.value)}
                placeholder="Haryana"
              />
            </div>

            <div className="space-y-2">
              <Label>Pincode *</Label>
              <Input
                value={form.pincode}
                onChange={(e) => setField("pincode", e.target.value)}
                placeholder="122001"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  value={form.latitude}
                  onChange={(e) => setField("latitude", e.target.value)}
                  placeholder="28.4595"
                />
              </div>

              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input
                  type="number"
                  value={form.longitude}
                  onChange={(e) => setField("longitude", e.target.value)}
                  placeholder="77.0266"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Service radius KM</Label>
              <Input
                type="number"
                value={form.radius_km}
                onChange={(e) => setField("radius_km", e.target.value)}
                placeholder="20"
              />
            </div>

            <Button className="w-full" onClick={createLocation} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-1 h-4 w-4" />
              )}
              Add location
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Service Locations</CardTitle>
            <CardDescription>
              These locations are used while adding product price and inventory.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center rounded-lg border py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading locations...
              </div>
            ) : locations.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                No locations found. Add your first service location.
              </div>
            ) : (
              locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <MapPin className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="font-medium">{location.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {location.city}, {location.state} · {location.pincode}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Radius: {location.radius_km || "-"} KM · ID: {location.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        location.is_active
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-muted bg-muted text-muted-foreground"
                      }
                    >
                      {location.is_active ? "Live" : "Paused"}
                    </Badge>

                    <Switch
                      checked={Boolean(location.is_active)}
                      onCheckedChange={() => toggleLocation(location)}
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteLocation(location.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}