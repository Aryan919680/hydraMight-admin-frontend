import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MapPin, Plus, Trash2 } from "lucide-react";

const zones = [
  { name: "Mumbai Central", pincodes: 24, warehouse: "WH-MUM-01", active: true },
  { name: "Bengaluru South", pincodes: 31, warehouse: "WH-BLR-02", active: true },
  { name: "Delhi NCR", pincodes: 58, warehouse: "WH-DEL-01", active: true },
  { name: "Pune West", pincodes: 18, warehouse: "WH-PUN-01", active: false },
];

export default function Locations() {
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
            <CardDescription>Define a new serviceable zone.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Zone name</Label>
              <Input placeholder="e.g. Hyderabad Central" />
            </div>
            <div className="space-y-2">
              <Label>Pincodes (comma separated)</Label>
              <Input placeholder="500001, 500002, ..." />
            </div>
            <div className="space-y-2">
              <Label>Warehouse code</Label>
              <Input placeholder="WH-HYD-01" />
            </div>
            <Button className="w-full">
              <Plus className="mr-1 h-4 w-4" /> Add zone
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Active Zones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {zones.map((z) => (
              <div
                key={z.name}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{z.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {z.pincodes} pincodes · {z.warehouse}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={
                      z.active
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-muted bg-muted text-muted-foreground"
                    }
                  >
                    {z.active ? "Live" : "Paused"}
                  </Badge>
                  <Switch defaultChecked={z.active} />
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}