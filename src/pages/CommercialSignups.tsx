import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Search, Loader2, Check, X, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api, type CommercialSignup } from "@/lib/api";

type Status = "pending" | "approved" | "rejected";
type Action = "approve" | "reject";

export default function CommercialSignups() {
  const [status, setStatus] = useState<Status>("pending");
  const [items, setItems] = useState<CommercialSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CommercialSignup | null>(null);
  const [actionDialog, setActionDialog] = useState<{ item: CommercialSignup; action: Action } | null>(null);
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getCommercialSignups(status);
      setItems(res.data || []);
    } catch (e: any) {
      toast({ title: "Failed to load signups", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  const openAction = (item: CommercialSignup, action: Action) => {
    setActionDialog({ item, action });
    setRemarks(action === "approve" ? "Verified and approved" : "");
  };

  const submitAction = async () => {
    if (!actionDialog) return;
    setProcessing(true);
    try {
      if (actionDialog.action === "approve") {
        await api.approveCommercialSignup(actionDialog.item.id, remarks);
        toast({ title: "Signup approved" });
      } else {
        await api.rejectCommercialSignup(actionDialog.item.id, remarks);
        toast({ title: "Signup rejected" });
      }
      setActionDialog(null);
      load();
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const filtered = items.filter((s) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return [s.contact_person, s.email, s.phone, s.business_name, s.gst_number, s.city]
      .some((v) => v && String(v).toLowerCase().includes(q));
  });

  const statusBadge = (s: Status) => {
    const variant = s === "approved" ? "default" : s === "rejected" ? "destructive" : "secondary";
    return <Badge variant={variant}>{s}</Badge>;
  };

  return (
    <div>
      <PageHeader
        title="Commercial Signups"
        description="Review and manage commercial user signup requests."
      />

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Tabs value={status} onValueChange={(v) => setStatus(v as Status)}>
              <TabsList>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, company..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      No {status} signups found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.contact_person || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{s.business_name || "—"}</span>
                          {s.gst_number && (
                            <span className="text-xs text-muted-foreground">GST: {s.gst_number}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>{s.email || "—"}</span>
                          <span className="text-muted-foreground">{s.phone || ""}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {[s.city, s.state, s.pincode].filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell>{statusBadge(s.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setSelected(s)}>
                            <Eye className="h-4 w-4" /> View
                          </Button>
                          {s.status === "pending" && (
                            <>
                              <Button variant="default" size="sm" onClick={() => openAction(s, "approve")}>
                                <Check className="h-4 w-4" /> Approve
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => openAction(s, "reject")}>
                                <X className="h-4 w-4" /> Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Signup details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid gap-3 text-sm">
              <Detail label="Contact person" value={selected.contact_person} />
              <Detail label="Business name" value={selected.business_name} />
              <Detail label="Email" value={selected.email} />
              <Detail label="Phone" value={selected.phone} />
              <Detail label="GST number" value={selected.gst_number} />
              <Detail label="Business type" value={selected.business_type} />
              <Detail
                label="Address"
                value={[selected.address_line1, selected.address_line2].filter(Boolean).join(", ")}
              />
              <Detail
                label="City / State / Pincode"
                value={[selected.city, selected.state, selected.pincode].filter(Boolean).join(", ")}
              />
              <Detail label="Status" value={selected.status} />
              <Detail label="Admin remarks" value={selected.admin_remarks || "—"} />
              {selected.created_at && (
                <Detail label="Submitted" value={new Date(selected.created_at).toLocaleString()} />
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve / Reject dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(o) => !o && !processing && setActionDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "approve" ? "Approve signup" : "Reject signup"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <p className="text-sm text-muted-foreground">
              {actionDialog?.item.business_name || actionDialog?.item.contact_person}
            </p>
            <div className="grid gap-2">
              <Label>Admin remarks</Label>
              <Textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add a note for this decision"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)} disabled={processing}>
              Cancel
            </Button>
            <Button
              variant={actionDialog?.action === "reject" ? "destructive" : "default"}
              onClick={submitAction}
              disabled={processing}
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin" />}
              {actionDialog?.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 break-words">{value || "—"}</span>
    </div>
  );
}