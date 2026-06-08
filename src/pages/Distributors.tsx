import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2, Plus, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  api,
  type Stockist,
  type Agency,
  type CreateStockistPayload,
  type CreateAgencyPayload,
} from "@/lib/api";

type Tab = "stockists" | "agencies";

const emptyStockist: CreateStockistPayload = {
  gst_number: "",
  business_name: "",
  contact_person: "",
  mobile: "",
  email: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  pincode: "",
};

const emptyAgency: CreateAgencyPayload = {
  stockist_id: "",
  gst_number: "",
  business_name: "",
  contact_person: "",
  mobile: "",
  email: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  pincode: "",
};

export default function Distributors() {
  const [tab, setTab] = useState<Tab>("stockists");
  const [stockists, setStockists] = useState<Stockist[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stockistFilter, setStockistFilter] = useState<string>("all");

  const [stockistDialog, setStockistDialog] = useState(false);
  const [stockistForm, setStockistForm] = useState<CreateStockistPayload>(emptyStockist);
  const [agencyDialog, setAgencyDialog] = useState(false);
  const [agencyForm, setAgencyForm] = useState<CreateAgencyPayload>(emptyAgency);
  const [saving, setSaving] = useState(false);

  const [selectedStockist, setSelectedStockist] = useState<Stockist | null>(null);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);

  const loadStockists = async () => {
    try {
      const res = await api.getStockists();
      setStockists(res.data || []);
    } catch (e: any) {
      toast({ title: "Failed to load stockists", description: e.message, variant: "destructive" });
    }
  };

  const loadAgencies = async () => {
    try {
      const res =
        stockistFilter && stockistFilter !== "all"
          ? await api.getAgenciesByStockist(stockistFilter)
          : await api.getAgencies();
      setAgencies(res.data || []);
    } catch (e: any) {
      toast({ title: "Failed to load agencies", description: e.message, variant: "destructive" });
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadStockists(), loadAgencies()]);
    setLoading(false);
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (tab === "agencies") loadAgencies(); /* eslint-disable-next-line */ }, [stockistFilter]);

  const submitStockist = async () => {
    setSaving(true);
    try {
      await api.createStockist(stockistForm);
      toast({ title: "Stockist created" });
      setStockistDialog(false);
      setStockistForm(emptyStockist);
      loadStockists();
    } catch (e: any) {
      toast({ title: "Failed to create stockist", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const submitAgency = async () => {
    if (!agencyForm.stockist_id) {
      toast({ title: "Select a stockist", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api.createAgency(agencyForm);
      toast({ title: "Agency created" });
      setAgencyDialog(false);
      setAgencyForm(emptyAgency);
      loadAgencies();
    } catch (e: any) {
      toast({ title: "Failed to create agency", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const stockistMap = useMemo(() => {
    const m: Record<string, string> = {};
    stockists.forEach((s) => { m[s.id] = s.business_name || s.contact_person || s.id; });
    return m;
  }, [stockists]);

  const matches = (q: string, vals: (string | undefined | null)[]) =>
    vals.some((v) => v && String(v).toLowerCase().includes(q));

  const filteredStockists = stockists.filter((s) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return matches(q, [s.business_name, s.contact_person, s.email, s.mobile, s.gst_number, s.city]);
  });

  const filteredAgencies = agencies.filter((a) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return matches(q, [a.business_name, a.contact_person, a.email, a.mobile, a.gst_number, a.city]);
  });

  return (
    <div>
      <PageHeader
        title="Distributors"
        description="Manage stockists and the agencies that operate under them."
      />

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
              <TabsList>
                <TabsTrigger value="stockists">Stockists</TabsTrigger>
                <TabsTrigger value="agencies">Agencies</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-wrap items-center gap-2">
              {tab === "agencies" && (
                <Select value={stockistFilter} onValueChange={setStockistFilter}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Filter by stockist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All stockists</SelectItem>
                    {stockists.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.business_name || s.contact_person || s.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="pl-9"
                />
              </div>
              {tab === "stockists" ? (
                <Button onClick={() => setStockistDialog(true)}>
                  <Plus className="h-4 w-4" /> New Stockist
                </Button>
              ) : (
                <Button onClick={() => setAgencyDialog(true)}>
                  <Plus className="h-4 w-4" /> New Agency
                </Button>
              )}
            </div>
          </div>

          {tab === "stockists" ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
                  ) : filteredStockists.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No stockists found.</TableCell></TableRow>
                  ) : filteredStockists.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{s.business_name || "—"}</span>
                          <span className="text-xs text-muted-foreground">{s.contact_person}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>{s.email || "—"}</span>
                          <span className="text-muted-foreground">{s.mobile || ""}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{s.gst_number || "—"}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">
                        {[s.city, s.state, s.pincode].filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedStockist(s)}>
                          <Eye className="h-4 w-4" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agency</TableHead>
                    <TableHead>Stockist</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
                  ) : filteredAgencies.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No agencies found.</TableCell></TableRow>
                  ) : filteredAgencies.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{a.business_name || "—"}</span>
                          <span className="text-xs text-muted-foreground">{a.contact_person}</span>
                        </div>
                      </TableCell>
                      <TableCell>{a.stockist_name || stockistMap[a.stockist_id || ""] || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>{a.email || "—"}</span>
                          <span className="text-muted-foreground">{a.mobile || ""}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{a.gst_number || "—"}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">
                        {[a.city, a.state, a.pincode].filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedAgency(a)}>
                          <Eye className="h-4 w-4" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Stockist */}
      <Dialog open={stockistDialog} onOpenChange={(o) => !saving && setStockistDialog(o)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>New Stockist</DialogTitle></DialogHeader>
          <DistributorForm
            form={stockistForm}
            onChange={(f) => setStockistForm(f as CreateStockistPayload)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockistDialog(false)} disabled={saving}>Cancel</Button>
            <Button onClick={submitStockist} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Agency */}
      <Dialog open={agencyDialog} onOpenChange={(o) => !saving && setAgencyDialog(o)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>New Agency</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>Stockist</Label>
              <Select
                value={agencyForm.stockist_id}
                onValueChange={(v) => setAgencyForm({ ...agencyForm, stockist_id: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select stockist" /></SelectTrigger>
                <SelectContent>
                  {stockists.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.business_name || s.contact_person || s.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DistributorForm
              form={agencyForm}
              onChange={(f) => setAgencyForm({ ...(f as CreateAgencyPayload), stockist_id: agencyForm.stockist_id })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAgencyDialog(false)} disabled={saving}>Cancel</Button>
            <Button onClick={submitAgency} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Stockist */}
      <Dialog open={!!selectedStockist} onOpenChange={(o) => !o && setSelectedStockist(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Stockist details</DialogTitle></DialogHeader>
          {selectedStockist && <DetailGrid item={selectedStockist} />}
          <DialogFooter><Button variant="outline" onClick={() => setSelectedStockist(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Agency */}
      <Dialog open={!!selectedAgency} onOpenChange={(o) => !o && setSelectedAgency(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Agency details</DialogTitle></DialogHeader>
          {selectedAgency && (
            <DetailGrid
              item={{
                ...selectedAgency,
                stockist:
                  selectedAgency.stockist_name ||
                  stockistMap[selectedAgency.stockist_id || ""] ||
                  selectedAgency.stockist_id ||
                  "—",
              }}
            />
          )}
          <DialogFooter><Button variant="outline" onClick={() => setSelectedAgency(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DistributorForm({
  form,
  onChange,
}: {
  form: CreateStockistPayload | CreateAgencyPayload;
  onChange: (f: CreateStockistPayload | CreateAgencyPayload) => void;
}) {
  const set = (k: string, v: string) => onChange({ ...(form as any), [k]: v });
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Business name" value={form.business_name} onChange={(v) => set("business_name", v)} />
      <Field label="Contact person" value={form.contact_person} onChange={(v) => set("contact_person", v)} />
      <Field label="GST number" value={form.gst_number} onChange={(v) => set("gst_number", v)} />
      <Field label="Mobile" value={form.mobile} onChange={(v) => set("mobile", v)} />
      <Field label="Email" value={form.email} onChange={(v) => set("email", v)} className="sm:col-span-2" />
      <Field label="Address line 1" value={form.address_line1} onChange={(v) => set("address_line1", v)} className="sm:col-span-2" />
      <Field label="Address line 2" value={form.address_line2 || ""} onChange={(v) => set("address_line2", v)} className="sm:col-span-2" />
      <Field label="City" value={form.city} onChange={(v) => set("city", v)} />
      <Field label="State" value={form.state} onChange={(v) => set("state", v)} />
      <Field label="Pincode" value={form.pincode} onChange={(v) => set("pincode", v)} />
    </div>
  );
}

function Field({
  label, value, onChange, className,
}: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div className={`grid gap-2 ${className || ""}`}>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function DetailGrid({ item }: { item: Record<string, any> }) {
  const keys = [
    "business_name", "contact_person", "stockist", "gst_number", "email", "mobile",
    "address_line1", "address_line2", "city", "state", "pincode", "status", "created_at",
  ];
  return (
    <div className="grid gap-3 text-sm">
      {keys.filter((k) => item[k] !== undefined && item[k] !== null && item[k] !== "").map((k) => (
        <div key={k} className="grid grid-cols-3 gap-2">
          <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
          <span className="col-span-2 break-words">
            {k === "created_at" ? new Date(item[k]).toLocaleString() : String(item[k])}
          </span>
        </div>
      ))}
    </div>
  );
}