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
import { Search, Loader2, Plus, Eye, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

type Tab = "stockists" | "agencyRequests" | "agencies";

type Status = "active" | "inactive" | "blocked" | "pending" | "approved" | "rejected" | string;

type Stockist = {
  id: string;
  user_profile_id?: string | null;
  territory?: string | null;
  referral_code?: string | null;
  gst_number?: string | null;
  business_name?: string | null;
  contact_person?: string | null;
  mobile?: string | null;
  email?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  status?: Status;
  agency_count?: number;
  created_at?: string;
};

type Agency = {
  id: string;
  stockist_id?: string | null;
  user_profile_id?: string | null;
  territory?: string | null;
  referral_code?: string | null;
  gst_number?: string | null;
  business_name?: string | null;
  contact_person?: string | null;
  mobile?: string | null;
  email?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  status?: Status;
  stockist_name?: string | null;
  stockist_business_name?: string | null;
  created_at?: string;
};

type AgencyRequest = {
  id: string;
  referral_code?: string | null;
  gst_number?: string | null;
  business_name?: string | null;
  contact_person?: string | null;
  mobile?: string | null;
  email?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  status?: "pending" | "approved" | "rejected" | string;
  matched_stockist_id?: string | null;
  matched_territory?: string | null;
  assigned_stockist_id?: string | null;
  assigned_territory?: string | null;
  matched_stockist_name?: string | null;
  matched_stockist_referral_code?: string | null;
  matched_stockist_territory?: string | null;
  assigned_stockist_name?: string | null;
  assigned_stockist_territory?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
};

type CreateStockistPayload = {
  territory: string;
  gst_number: string;
  business_name: string;
  contact_person: string;
  mobile: string;
  email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pincode: string;
};

const emptyStockist: CreateStockistPayload = {
  territory: "",
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
  const [agencyRequests, setAgencyRequests] = useState<AgencyRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [stockistFilter, setStockistFilter] = useState<string>("all");
  const [requestStatus, setRequestStatus] = useState<string>("pending");

  const [stockistDialog, setStockistDialog] = useState(false);
  const [stockistForm, setStockistForm] = useState<CreateStockistPayload>(emptyStockist);
  const [saving, setSaving] = useState(false);

  const [selectedStockist, setSelectedStockist] = useState<Stockist | null>(null);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AgencyRequest | null>(null);

  const [approveRequest, setApproveRequest] = useState<AgencyRequest | null>(null);
  const [approveStockistId, setApproveStockistId] = useState("");
  const [rejectRequest, setRejectRequest] = useState<AgencyRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadStockists = async () => {
    try {
      const res = await api.getStockists();
      setStockists((res.data || []) as Stockist[]);
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
      setAgencies((res.data || []) as Agency[]);
    } catch (e: any) {
      toast({ title: "Failed to load agencies", description: e.message, variant: "destructive" });
    }
  };

  const loadAgencyRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await api.getAgencyRequests({ status: requestStatus });
      setAgencyRequests((res.data || []) as AgencyRequest[]);
    } catch (e: any) {
      toast({ title: "Failed to load agency requests", description: e.message, variant: "destructive" });
    } finally {
      setRequestsLoading(false);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadStockists(), loadAgencies(), loadAgencyRequests()]);
    setLoading(false);
  };

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (tab === "agencies") loadAgencies(); /* eslint-disable-next-line */ }, [stockistFilter]);
  useEffect(() => { if (tab === "agencyRequests") loadAgencyRequests(); /* eslint-disable-next-line */ }, [requestStatus]);

  const submitStockist = async () => {
    if (!stockistForm.territory.trim()) {
      toast({ title: "Territory is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await api.createStockist(stockistForm as any);
      const referralCode = res?.data?.referral_code || res?.data?.stockist?.referral_code;

      toast({
        title: "Stockist created",
        description: referralCode ? `Referral code: ${referralCode}` : undefined,
      });

      setStockistDialog(false);
      setStockistForm(emptyStockist);
      await loadStockists();
    } catch (e: any) {
      toast({ title: "Failed to create stockist", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openApprove = (request: AgencyRequest) => {
    setApproveRequest(request);
    setApproveStockistId(request.matched_stockist_id || "");
  };

  const approveAgencyRequest = async () => {
    if (!approveRequest) return;

    const hasMatchedStockist = Boolean(approveRequest.matched_stockist_id);
    const selectedStockistId = approveStockistId || approveRequest.matched_stockist_id || "";

    if (!hasMatchedStockist && !selectedStockistId) {
      toast({ title: "Select stockist before approval", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = selectedStockistId ? { stockist_id: selectedStockistId } : {};
      const res: any = await api.approveAgencyRequest(approveRequest.id, payload);
      const login = res?.data?.login;

      toast({
        title: "Agency request approved",
        description: login?.email && login?.default_password
          ? `Login: ${login.email} / ${login.default_password}`
          : undefined,
      });

      setApproveRequest(null);
      setApproveStockistId("");
      await Promise.all([loadAgencyRequests(), loadAgencies(), loadStockists()]);
    } catch (e: any) {
      toast({ title: "Failed to approve request", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const rejectAgencyRequest = async () => {
    if (!rejectRequest) return;

    setSaving(true);
    try {
      await api.rejectAgencyRequest(rejectRequest.id, {
        rejection_reason: rejectionReason || "Rejected by admin",
      });

      toast({ title: "Agency request rejected" });
      setRejectRequest(null);
      setRejectionReason("");
      await loadAgencyRequests();
    } catch (e: any) {
      toast({ title: "Failed to reject request", description: e.message, variant: "destructive" });
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
    if (!q || tab !== "stockists") return true;
    return matches(q, [
      s.business_name, s.contact_person, s.email, s.mobile, s.gst_number,
      s.city, s.territory, s.referral_code,
    ]);
  });

  const filteredAgencies = agencies.filter((a) => {
    const q = search.toLowerCase().trim();
    if (!q || tab !== "agencies") return true;
    return matches(q, [
      a.business_name, a.contact_person, a.email, a.mobile, a.gst_number,
      a.city, a.territory, a.referral_code,
    ]);
  });

  const filteredRequests = agencyRequests.filter((r) => {
    const q = search.toLowerCase().trim();
    if (!q || tab !== "agencyRequests") return true;
    return matches(q, [
      r.business_name, r.contact_person, r.email, r.mobile, r.gst_number,
      r.referral_code, r.matched_stockist_name, r.assigned_stockist_name,
      r.matched_territory, r.assigned_territory,
    ]);
  });

  return (
    <div>
      <PageHeader
        title="Distributors"
        description="Manage stockists, referral-based agency requests, and approved agencies."
      />

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
              <TabsList>
                <TabsTrigger value="stockists">Stockists</TabsTrigger>
                <TabsTrigger value="agencyRequests">Agency Requests</TabsTrigger>
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

              {tab === "agencyRequests" && (
                <Select value={requestStatus} onValueChange={setRequestStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Request status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
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

              {tab === "stockists" && (
                <Button onClick={() => setStockistDialog(true)}>
                  <Plus className="h-4 w-4" /> New Stockist
                </Button>
              )}
            </div>
          </div>

          {tab === "stockists" && (
            <StockistsTable
              loading={loading}
              stockists={filteredStockists}
              onView={setSelectedStockist}
            />
          )}

          {tab === "agencyRequests" && (
            <AgencyRequestsTable
              loading={loading || requestsLoading}
              requests={filteredRequests}
              onView={setSelectedRequest}
              onApprove={openApprove}
              onReject={(request) => {
                setRejectRequest(request);
                setRejectionReason("");
              }}
            />
          )}

          {tab === "agencies" && (
            <AgenciesTable
              loading={loading}
              agencies={filteredAgencies}
              stockistMap={stockistMap}
              onView={setSelectedAgency}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={stockistDialog} onOpenChange={(o) => !saving && setStockistDialog(o)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>New Stockist</DialogTitle></DialogHeader>
          <StockistForm
            form={stockistForm}
            onChange={setStockistForm}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockistDialog(false)} disabled={saving}>Cancel</Button>
            <Button onClick={submitStockist} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!approveRequest} onOpenChange={(o) => !saving && !o && setApproveRequest(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Approve agency request</DialogTitle></DialogHeader>

          {approveRequest && (
            <div className="grid gap-4">
              <div className="rounded-md border p-3 text-sm">
                <div className="font-medium">{approveRequest.business_name}</div>
                <div className="text-muted-foreground">{approveRequest.contact_person} • {approveRequest.email}</div>
                {approveRequest.referral_code ? (
                  <div className="mt-2">
                    <Badge variant="outline">Referral: {approveRequest.referral_code}</Badge>
                  </div>
                ) : (
                  <div className="mt-2">
                    <Badge variant="secondary">No referral code</Badge>
                  </div>
                )}
              </div>

              {approveRequest.matched_stockist_id ? (
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="text-muted-foreground">Auto matched stockist</div>
                  <div className="font-medium">{approveRequest.matched_stockist_name || stockistMap[approveRequest.matched_stockist_id] || approveRequest.matched_stockist_id}</div>
                  <div className="text-muted-foreground">Territory: {approveRequest.matched_stockist_territory || approveRequest.matched_territory || "—"}</div>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label>Assign stockist</Label>
                  <Select value={approveStockistId} onValueChange={setApproveStockistId}>
                    <SelectTrigger><SelectValue placeholder="Select stockist" /></SelectTrigger>
                    <SelectContent>
                      {stockists.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.business_name || s.contact_person || s.id} {s.territory ? `• ${s.territory}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveRequest(null)} disabled={saving}>Cancel</Button>
            <Button onClick={approveAgencyRequest} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectRequest} onOpenChange={(o) => !saving && !o && setRejectRequest(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Reject agency request</DialogTitle></DialogHeader>
          <div className="grid gap-2">
            <Label>Rejection reason</Label>
            <Input
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Example: Invalid GST details"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectRequest(null)} disabled={saving}>Cancel</Button>
            <Button variant="destructive" onClick={rejectAgencyRequest} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedStockist} onOpenChange={(o) => !o && setSelectedStockist(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Stockist details</DialogTitle></DialogHeader>
          {selectedStockist && <DetailGrid item={selectedStockist} />}
          <DialogFooter><Button variant="outline" onClick={() => setSelectedStockist(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedRequest} onOpenChange={(o) => !o && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Agency request details</DialogTitle></DialogHeader>
          {selectedRequest && <DetailGrid item={selectedRequest} />}
          <DialogFooter><Button variant="outline" onClick={() => setSelectedRequest(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedAgency} onOpenChange={(o) => !o && setSelectedAgency(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Agency details</DialogTitle></DialogHeader>
          {selectedAgency && (
            <DetailGrid
              item={{
                ...selectedAgency,
                stockist:
                  selectedAgency.stockist_name ||
                  selectedAgency.stockist_business_name ||
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

function StockistsTable({
  loading, stockists, onView,
}: {
  loading: boolean;
  stockists: Stockist[];
  onView: (stockist: Stockist) => void;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Business</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Territory</TableHead>
            <TableHead>Referral Code</TableHead>
            <TableHead>GST</TableHead>
            <TableHead>Agencies</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={7} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
          ) : stockists.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No stockists found.</TableCell></TableRow>
          ) : stockists.map((s) => (
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
              <TableCell>{s.territory || "—"}</TableCell>
              <TableCell>
                {s.referral_code ? <Badge>{s.referral_code}</Badge> : "—"}
              </TableCell>
              <TableCell><Badge variant="outline">{s.gst_number || "—"}</Badge></TableCell>
              <TableCell>{s.agency_count ?? 0}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onView(s)}>
                  <Eye className="h-4 w-4" /> View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AgencyRequestsTable({
  loading, requests, onView, onApprove, onReject,
}: {
  loading: boolean;
  requests: AgencyRequest[];
  onView: (request: AgencyRequest) => void;
  onApprove: (request: AgencyRequest) => void;
  onReject: (request: AgencyRequest) => void;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agency</TableHead>
            <TableHead>Referral</TableHead>
            <TableHead>Matched Stockist</TableHead>
            <TableHead>Territory</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
          ) : requests.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No agency requests found.</TableCell></TableRow>
          ) : requests.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{r.business_name || "—"}</span>
                  <span className="text-xs text-muted-foreground">{r.contact_person}</span>
                  <span className="text-xs text-muted-foreground">{r.email}</span>
                </div>
              </TableCell>
              <TableCell>
                {r.referral_code ? <Badge variant="outline">{r.referral_code}</Badge> : <Badge variant="secondary">Manual</Badge>}
              </TableCell>
              <TableCell>{r.matched_stockist_name || r.assigned_stockist_name || "Needs admin assignment"}</TableCell>
              <TableCell>{r.matched_stockist_territory || r.matched_territory || r.assigned_territory || "—"}</TableCell>
              <TableCell><StatusBadge status={r.status || "pending"} /></TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onView(r)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {r.status === "pending" && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => onApprove(r)}>
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onReject(r)}>
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AgenciesTable({
  loading, agencies, stockistMap, onView,
}: {
  loading: boolean;
  agencies: Agency[];
  stockistMap: Record<string, string>;
  onView: (agency: Agency) => void;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agency</TableHead>
            <TableHead>Stockist</TableHead>
            <TableHead>Territory</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>GST</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6} className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></TableCell></TableRow>
          ) : agencies.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No agencies found.</TableCell></TableRow>
          ) : agencies.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{a.business_name || "—"}</span>
                  <span className="text-xs text-muted-foreground">{a.contact_person}</span>
                </div>
              </TableCell>
              <TableCell>{a.stockist_name || a.stockist_business_name || stockistMap[a.stockist_id || ""] || "—"}</TableCell>
              <TableCell>{a.territory || "—"}</TableCell>
              <TableCell>
                <div className="flex flex-col text-sm">
                  <span>{a.email || "—"}</span>
                  <span className="text-muted-foreground">{a.mobile || ""}</span>
                </div>
              </TableCell>
              <TableCell><Badge variant="outline">{a.gst_number || "—"}</Badge></TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onView(a)}>
                  <Eye className="h-4 w-4" /> View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function StockistForm({
  form,
  onChange,
}: {
  form: CreateStockistPayload;
  onChange: (f: CreateStockistPayload) => void;
}) {
  const set = (k: keyof CreateStockistPayload, v: string) => onChange({ ...form, [k]: v });

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Business name" value={form.business_name} onChange={(v) => set("business_name", v)} />
      <Field label="Contact person" value={form.contact_person} onChange={(v) => set("contact_person", v)} />
      <Field label="Territory" value={form.territory} onChange={(v) => set("territory", v)} />
      <Field label="GST number" value={form.gst_number} onChange={(v) => set("gst_number", v)} />
      <Field label="Mobile" value={form.mobile} onChange={(v) => set("mobile", v)} />
      <Field label="Email" value={form.email} onChange={(v) => set("email", v)} />
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
    "business_name", "contact_person", "stockist", "matched_stockist_name", "assigned_stockist_name",
    "territory", "matched_territory", "assigned_territory", "referral_code", "gst_number", "email", "mobile",
    "address_line1", "address_line2", "city", "state", "pincode", "status", "rejection_reason", "created_at",
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

function StatusBadge({ status }: { status: Status }) {
  const variant = status === "approved" || status === "active"
    ? "default"
    : status === "rejected" || status === "blocked"
      ? "destructive"
      : "secondary";

  return <Badge variant={variant as any}>{status}</Badge>;
}
