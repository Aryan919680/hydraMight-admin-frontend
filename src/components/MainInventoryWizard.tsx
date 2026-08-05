import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Download,
    FileSpreadsheet,
    Loader2,
    PackagePlus,
    Upload,
} from "lucide-react";
import { api, MainInventoryItem } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type Props = {
    open: boolean;
    item?: MainInventoryItem | null;
    onOpenChange: (open: boolean) => void;
    onSaved: () => Promise<void> | void;
    onAllocate: (item: MainInventoryItem) => void;
};

type FormState = {
    sku: string;
    item_name: string;
    category: string;
    remarks: string;
    total_stock: string;
    reserved_stock: string;
    min_stock_level: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
    sku: "",
    item_name: "",
    category: "",
    remarks: "",
    total_stock: "0",
    reserved_stock: "0",
    min_stock_level: "0",
};

const sampleRows = [
    {
        sku: "PRO-001",
        item_name: "RINSL Gold Premium Liquid Detergent",
        category: "Liquid detergent",
        total_stock: "1000",
        reserved_stock: "0",
        min_stock_level: "20",
        remarks: "Opening stock",
    },
    {
        sku: "PRO-002",
        item_name: "RINSL Gold Lemon Phenyl",
        category: "Floor cleaner",
        total_stock: "500",
        reserved_stock: "0",
        min_stock_level: "10",
        remarks: "Opening stock",
    },
];

const steps = ["SKU details", "Stock quantities", "Review & save", "Done"];
function useDebouncedValue<T>(
  value: T,
  delay: number
): T {
  const [debouncedValue, setDebouncedValue] =
    useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function MainInventoryWizard({
    open,
    item,
    onOpenChange,
    onSaved,
    onAllocate,
}: Props) {
    const editing = Boolean(item);
    const [mode, setMode] = useState<"single" | "bulk">("single");
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [errors, setErrors] = useState<Errors>({});
    const [checkingSku, setCheckingSku] = useState(false);
    const [duplicate, setDuplicate] = useState<MainInventoryItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [created, setCreated] = useState<MainInventoryItem | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [validating, setValidating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [bulkResult, setBulkResult] = useState<any | null>(null);

    const normalizedSku = useMemo(
  () => form.sku.trim().toUpperCase(),
  [form.sku]
);

const debouncedSku = useDebouncedValue(
  normalizedSku,
  700
);

const initializedDialogRef =
  useRef<string | null>(null);

const skuRequestIdRef = useRef(0);

    useEffect(() => {
  if (!open) {
    initializedDialogRef.current = null;
    return;
  }

  const dialogKey = item?.id
    ? `edit-${item.id}`
    : "create";

  /*
   * Initialise only once for each dialog opening.
   * Do not reset the form when the parent re-renders
   * and passes a new item object reference.
   */
  if (
    initializedDialogRef.current === dialogKey
  ) {
    return;
  }

  initializedDialogRef.current = dialogKey;

  setMode("single");
  setStep(1);
  setErrors({});
  setDuplicate(null);
  setCreated(null);
  setFile(null);
  setBulkResult(null);
  setCheckingSku(false);

  if (item) {
    setForm({
      sku: item.sku || "",
      item_name:
        item.item_name ||
        item.product_name ||
        "",
      category: "",
      remarks: item.remarks || "",
      total_stock: String(
        item.total_stock ?? 0
      ),
      reserved_stock: String(
        item.reserved_stock ?? 0
      ),
      min_stock_level: String(
        item.min_stock_level ?? 0
      ),
    });
  } else {
    setForm({
      ...emptyForm,
    });
  }
}, [open, item?.id]);

    useEffect(() => {
  if (
    editing ||
    mode !== "single" ||
    !open
  ) {
    setCheckingSku(false);
    setDuplicate(null);
    return;
  }

  /*
   * Do not call the API for very short SKUs.
   */
  if (debouncedSku.length < 3) {
    setCheckingSku(false);
    setDuplicate(null);
    return;
  }

  /*
   * Ignore stale responses when the user types
   * another character before the previous request
   * finishes.
   */
  const requestId =
    ++skuRequestIdRef.current;

  let cancelled = false;

  const checkSku = async () => {
    try {
      setCheckingSku(true);

      const response =
        await api.checkMainInventorySku(
          debouncedSku
        );

      if (
        cancelled ||
        requestId !==
          skuRequestIdRef.current
      ) {
        return;
      }

      setDuplicate(
        response.exists
          ? response.data
          : null
      );
    } catch (error) {
      if (
        cancelled ||
        requestId !==
          skuRequestIdRef.current
      ) {
        return;
      }

      console.error(
        "Unable to check SKU:",
        error
      );

      setDuplicate(null);
    } finally {
      if (
        !cancelled &&
        requestId ===
          skuRequestIdRef.current
      ) {
        setCheckingSku(false);
      }
    }
  };

  void checkSku();

  return () => {
    cancelled = true;
  };
}, [
  debouncedSku,
  editing,
  mode,
  open,
]);

    const available = useMemo(() => {
        const total = Number(form.total_stock || 0);
        const reserved = Number(form.reserved_stock || 0);
        const allocated = Number(item?.allocated_stock || 0);
        return total - reserved - allocated;
    }, [form.total_stock, form.reserved_stock, item?.allocated_stock]);

    const setField = (
  key: keyof FormState,
  value: string
) => {
  setForm((previous) => ({
    ...previous,
    [key]: value,
  }));

  setErrors((previous) => ({
    ...previous,
    [key]: undefined,
  }));

  if (key === "sku") {
    /*
     * Remove the result for the previous SKU.
     * The debounced effect will check the new value.
     */
    setDuplicate(null);
  }
};

    const validateDetails = () => {
        const validationErrors: Errors = {};
        const sku = normalizedSku;

        if (!sku) {
            validationErrors.sku = "SKU code is required.";
        } else if (!/^[A-Z0-9][A-Z0-9._-]*$/.test(sku)) {
            validationErrors.sku =
                "Use letters, numbers, hyphens, dots or underscores only.";
        } else if (!editing && sku.length < 3) {
            validationErrors.sku = "SKU must contain at least 3 characters.";
        } else if (!editing && duplicate) {
            validationErrors.sku =
                "This SKU already exists. Edit the existing inventory instead.";
        }

        if (!form.item_name.trim()) {
            validationErrors.item_name = "Item name is required.";
        }

        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    };

    const validateStock = () => {
        const next: Errors = {};
        const total = Number(form.total_stock);
        const reserved = Number(form.reserved_stock);
        const minimum = Number(form.min_stock_level);
        if (!Number.isFinite(total) || total < 0) next.total_stock = "Enter a valid value of 0 or more.";
        if (!Number.isFinite(reserved) || reserved < 0) next.reserved_stock = "Enter a valid value of 0 or more.";
        if (!Number.isFinite(minimum) || minimum < 0) next.min_stock_level = "Enter a valid value of 0 or more.";
        if (reserved > total) next.reserved_stock = "Reserved stock cannot exceed total stock.";
        if (available < 0) next.total_stock = "Total stock must cover reserved and already allocated stock.";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const goNext = () => {
        if (step === 1 && validateDetails()) setStep(2);
        if (step === 2 && validateStock()) setStep(3);
    };

    const save = async () => {
        if (!validateDetails() || !validateStock()) return;
        try {
            setSaving(true);
            const payload = {
                item_name: form.item_name.trim(),
                category: form.category.trim() || undefined,
                total_stock: Number(form.total_stock),
                reserved_stock: Number(form.reserved_stock),
                min_stock_level: Number(form.min_stock_level),
                remarks: form.remarks.trim() || undefined,
            };
            const response = editing
                ? await api.updateMainInventory(item!.id, payload)
                : await api.createMainInventory({ sku: form.sku.trim().toUpperCase(), ...payload });
            setCreated(response.data);
            setStep(4);
            await onSaved();
        } catch (error) {
            setErrors({ sku: error instanceof Error ? error.message : "Unable to save inventory." });
            setStep(1);
        } finally {
            setSaving(false);
        }
    };

    const downloadSample = () => {
        const headers = [
            "sku",
            "item_name",
            "category",
            "total_stock",
            "reserved_stock",
            "min_stock_level",
            "remarks",
        ] as const;

        const escapeCsv = (value: unknown) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`;

        const csv = [
            headers.join(","),
            ...sampleRows.map((row) =>
                headers.map((header) => escapeCsv(row[header])).join(",")
            ),
        ].join("\n");

        const url = URL.createObjectURL(
            new Blob([csv], { type: "text/csv;charset=utf-8" })
        );
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "main-inventory-upload-sample.csv";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    };

    const processBulk = async (validateOnly: boolean) => {
        if (!file) return;

        try {
            if (validateOnly) setValidating(true);
            else setUploading(true);

            const response = await api.bulkUploadMainInventory(file, validateOnly);
            setBulkResult(response);

            if (!validateOnly) {
                await onSaved();
            }
        } catch (error) {
            setBulkResult({
                validate_only: validateOnly,
                total_rows: 0,
                processed: 0,
                failed: 1,
                results: [
                    {
                        row: 0,
                        success: false,
                        sku: "",
                        message:
                            error instanceof Error
                                ? error.message
                                : "Unable to process the CSV file.",
                    },
                ],
            });
        } finally {
            setValidating(false);
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editing ? "Update inventory" : "Add inventory"}</DialogTitle>
                    <DialogDescription>
                        {editing
                            ? "Update stock values for this SKU. Allocated stock remains managed by channel allocation."
                            : "Add new SKU stock to main inventory, then link it to a product and allocate it to channels."}
                    </DialogDescription>
                </DialogHeader>

                {!editing && step !== 4 && (
                    <Tabs value={mode} onValueChange={(value) => setMode(value as "single" | "bulk")}>
                        <TabsList className="grid w-full max-w-md grid-cols-2">
                            <TabsTrigger value="single"><PackagePlus className="mr-2 h-4 w-4" />Single SKU</TabsTrigger>
                            <TabsTrigger value="bulk"><FileSpreadsheet className="mr-2 h-4 w-4" />Bulk CSV upload</TabsTrigger>
                        </TabsList>

                        <TabsContent value="single" className="mt-6">
                            {renderSingleFlow()}
                        </TabsContent>
                        <TabsContent value="bulk" className="mt-6">
                            {renderBulkFlow()}
                        </TabsContent>
                    </Tabs>
                )}

                {(editing || step === 4) && renderSingleFlow()}
            </DialogContent>
        </Dialog>
    );

    function renderSingleFlow() {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-4 gap-2">
                    {steps.map((label, index) => {
                        const number = index + 1;
                        const complete = number < step;
                        const active = number === step;
                        return (
                            <div key={label} className="flex items-center gap-2">
                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${complete ? "border-emerald-500 bg-emerald-50 text-emerald-600" : active ? "border-primary text-primary" : "text-muted-foreground"}`}>
                                    {complete ? <Check className="h-4 w-4" /> : number}
                                </span>
                                <span className={`hidden text-sm md:block ${active ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
                            </div>
                        );
                    })}
                </div>

                {step === 1 && (
                    <section className="rounded-xl border p-6">
                        <h3 className="text-lg font-semibold">SKU identification</h3>
                        <p className="mb-5 text-sm text-muted-foreground">The SKU is permanent and links inventory to products and orders.</p>
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field label="SKU code" required error={errors.sku}>
                                <div className="relative">
                                    <Input
                                        value={form.sku}
                                        disabled={editing}
                                        onChange={(e) =>
                                            setField("sku", e.target.value.toUpperCase())
                                        }
                                        placeholder="e.g. HYD-FC-500ML"
                                        className={errors.sku ? "border-destructive" : ""}
                                        autoComplete="off"
                                        spellCheck={false}
                                    />
                                    {checkingSku && (
                                        <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                                    )}
                                </div>

                                {!editing &&
                                    normalizedSku.length >= 3 &&
                                    normalizedSku !== debouncedSku && (
                                        <p className="text-xs text-muted-foreground">
                                            Waiting for you to finish typing…
                                        </p>
                                    )}

                                {!editing &&
                                    normalizedSku.length >= 3 &&
                                    normalizedSku === debouncedSku &&
                                    !checkingSku &&
                                    !duplicate &&
                                    !errors.sku && (
                                        <p className="flex items-center gap-1 text-xs text-emerald-600">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            SKU is available
                                        </p>
                                    )}
                            </Field>
                            <Field label="Item name" required error={errors.item_name}>
                                <Input value={form.item_name} onChange={(e) => setField("item_name", e.target.value)} placeholder="e.g. Floor Cleaner 500ml" />
                            </Field>
                            <Field label="Category / type">
                                <Input value={form.category} onChange={(e) => setField("category", e.target.value)} placeholder="e.g. Floor Cleaners" />
                            </Field>
                            <Field label="Remarks">
                                <Input value={form.remarks} onChange={(e) => setField("remarks", e.target.value)} placeholder="e.g. Opening stock, New batch" />
                            </Field>
                        </div>
                        {duplicate && (
                            <Alert variant="destructive" className="mt-5">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Duplicate SKU</AlertTitle>
                                <AlertDescription>{duplicate.sku} already exists with {duplicate.available_stock} available units. Close this flow and edit that record.</AlertDescription>
                            </Alert>
                        )}
                        <DialogFooter className="mt-6"><Button
  type="button"
  onClick={goNext}
  disabled={
    checkingSku ||
    Boolean(duplicate) ||
    normalizedSku.length < 3 ||
    normalizedSku !== debouncedSku
  }
>
  {checkingSku && (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  )}

  Continue
</Button></DialogFooter>
                    </section>
                )}

                {step === 2 && (
                    <section className="rounded-xl border p-6">
                        <h3 className="text-lg font-semibold">Stock quantities</h3>
                        <p className="mb-5 text-sm text-muted-foreground">Set opening stock. Reserved stock is auto-managed by orders after creation.</p>
                        <div className="grid gap-4 md:grid-cols-3">
                            <Field label="Total stock" required error={errors.total_stock}><Input type="number" min="0" value={form.total_stock} onChange={(e) => setField("total_stock", e.target.value)} /></Field>
                            <Field label="Reserved stock" error={errors.reserved_stock}><Input type="number" min="0" value={form.reserved_stock} onChange={(e) => setField("reserved_stock", e.target.value)} /></Field>
                            <Field label="Min stock level" error={errors.min_stock_level}><Input type="number" min="0" value={form.min_stock_level} onChange={(e) => setField("min_stock_level", e.target.value)} /></Field>
                        </div>
                        <div className="mt-5 flex items-center justify-between rounded-lg bg-muted/50 p-4">
                            <div><p className="text-sm text-muted-foreground">Available after save</p><p className={`text-2xl font-semibold ${available < 0 ? "text-destructive" : ""}`}>{available}</p></div>
                            <p className="text-sm text-muted-foreground">Total − Reserved − Allocated</p>
                        </div>
                        <DialogFooter className="mt-6 justify-between sm:justify-between"><Button variant="outline" onClick={() => setStep(1)}>Back</Button><Button onClick={goNext}>Review</Button></DialogFooter>
                    </section>
                )}

                {step === 3 && (
                    <section className="rounded-xl border p-6">
                        <h3 className="text-lg font-semibold">Review before saving</h3>
                        <p className="mb-5 text-sm text-muted-foreground">Confirm details. SKU cannot be changed after creation.</p>
                        <div className="grid gap-5 rounded-lg bg-muted/40 p-5 md:grid-cols-2">
                            <Summary label="SKU" value={form.sku} /><Summary label="Item name" value={form.item_name} />
                            <Summary label="Total stock" value={form.total_stock} /><Summary label="Available" value={String(available)} positive />
                            <Summary label="Reserved" value={form.reserved_stock} /><Summary label="Min stock level" value={form.min_stock_level} />
                        </div>
                        <Alert className="mt-5"><AlertCircle className="h-4 w-4" /><AlertDescription>SKU cannot be edited after creation. Double-check it before saving.</AlertDescription></Alert>
                        <DialogFooter className="mt-6 justify-between sm:justify-between"><Button variant="outline" onClick={() => setStep(1)}>Edit</Button><Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editing ? "Update inventory" : "Create inventory"}</Button></DialogFooter>
                    </section>
                )}

                {step === 4 && created && (
                    <section className="rounded-xl border p-8 text-center">
                        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
                        <h3 className="mt-4 text-2xl font-semibold">Inventory {editing ? "updated" : "created"}</h3>
                        <p className="mt-2 text-muted-foreground">{created.sku} now has {created.available_stock} units available.</p>
                        <div className="mx-auto mt-6 grid max-w-xl gap-3 rounded-lg bg-muted/40 p-4 text-left md:grid-cols-2"><Summary label="SKU" value={created.sku} /><Summary label="Item" value={created.item_name || "-"} /><Summary label="Total" value={String(created.total_stock)} /><Summary label="Available" value={String(created.available_stock)} positive /></div>
                        <div className="mt-7 flex flex-wrap justify-center gap-3">
                            <Button variant="outline" onClick={() => { onOpenChange(false); window.location.href = `/products?inventorySku=${encodeURIComponent(created.sku)}`; }}>Link to product</Button>
                            <Button onClick={() => { onOpenChange(false); onAllocate(created); }}>Allocate stock</Button>
                            <Button variant="ghost" onClick={() => onOpenChange(false)}>Done</Button>
                        </div>
                    </section>
                )}
            </div>
        );
    }

    function renderBulkFlow() {
        const rows = bulkResult?.results || [];
        const hasErrors = Number(bulkResult?.failed || bulkResult?.invalid || 0) > 0;
        const validRows = Number(bulkResult?.processed || bulkResult?.valid || 0);
        return (
            <div className="space-y-5">
                <section className="rounded-xl border p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div><h3 className="text-lg font-semibold">Prepare your CSV</h3><p className="text-sm text-muted-foreground">Validate every row before importing. Existing SKUs are reported as duplicates and are not overwritten.</p></div>
                        <Button variant="outline" onClick={downloadSample}><Download className="mr-2 h-4 w-4" />Download sample</Button>
                    </div>
                    <div className="mt-5 overflow-x-auto rounded-lg border">
                        <Table><TableHeader><TableRow>{["Column", "Required", "Description", "Example"].map((x) => <TableHead key={x}>{x}</TableHead>)}</TableRow></TableHeader>
                            <TableBody>
                                {[
                                    ["sku", "Yes", "Permanent unique stock identifier", "HYD-FC-500ML"],
                                    ["item_name", "Yes", "Human-readable item name", "Floor Cleaner 500ml"],
                                    ["category", "No", "Internal category or type", "Floor Cleaners"],
                                    ["total_stock", "Yes", "Opening physical stock, 0 or more", "1000"],
                                    ["reserved_stock", "No", "Reserved units; cannot exceed total", "0"],
                                    ["min_stock_level", "No", "Low-stock alert threshold", "20"],
                                    ["remarks", "No", "Internal note", "Opening stock"],
                                ].map((row) => <TableRow key={row[0]}>{row.map((cell, i) => <TableCell key={i} className={i === 0 ? "font-mono text-xs" : "text-sm"}>{cell}</TableCell>)}</TableRow>)}
                            </TableBody></Table>
                    </div>
                    <div className="mt-5"><p className="mb-2 text-sm font-medium">Sample preview</p><div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow>{Object.keys(sampleRows[0]).map((key) => <TableHead key={key}>{key}</TableHead>)}</TableRow></TableHeader><TableBody>{sampleRows.map((row) => <TableRow key={row.sku}>{Object.values(row).map((value, i) => <TableCell key={i} className="whitespace-nowrap text-xs">{value}</TableCell>)}</TableRow>)}</TableBody></Table></div></div>
                </section>

                <section className="rounded-xl border border-dashed p-6">
                    <Label htmlFor="main-inventory-csv">Choose CSV file</Label>
                    <Input id="main-inventory-csv" className="mt-2" type="file" accept=".csv,text/csv" onChange={(e) => { setFile(e.target.files?.[0] || null); setBulkResult(null); }} />
                    {file && <p className="mt-2 text-sm text-muted-foreground">Selected: {file.name}</p>}
                    <div className="mt-4 flex gap-3"><Button variant="outline" disabled={!file || validating || uploading} onClick={() => processBulk(true)}>{validating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Validate CSV</Button><Button disabled={!file || uploading || validating || !bulkResult || validRows === 0 || bulkResult.validate_only === false} onClick={() => processBulk(false)}>{uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Import valid rows</Button></div>
                </section>

                {bulkResult && (
                    <section className="rounded-xl border p-5">
                        {hasErrors && validRows > 0 && bulkResult.validate_only && (
                            <Alert className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Invalid rows will be skipped. Only the valid rows will be imported.
                                </AlertDescription>
                            </Alert>
                        )}
                        <div className="grid gap-3 md:grid-cols-3"><Summary label="Total rows" value={String(bulkResult.total_rows || 0)} /><Summary label="Valid" value={String(bulkResult.processed || 0)} positive /><Summary label="Invalid" value={String(bulkResult.failed || 0)} /></div>
                        {rows.length > 0 && <div className="mt-5 max-h-80 overflow-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Row</TableHead><TableHead>SKU</TableHead><TableHead>Status</TableHead><TableHead>Feedback</TableHead></TableRow></TableHeader><TableBody>{rows.map((row: any) => <TableRow key={`${row.row}-${row.sku}`}><TableCell>{row.row}</TableCell><TableCell className="font-mono text-xs">{row.sku || "-"}</TableCell><TableCell><Badge variant={row.success ? "default" : "destructive"}>{row.success ? (bulkResult.validate_only ? "Valid" : "Imported") : "Invalid"}</Badge></TableCell><TableCell className="text-sm">{row.message || "Ready to import"}</TableCell></TableRow>)}</TableBody></Table></div>}
                    </section>
                )}
            </div>
        );
    }
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
    return <div className="space-y-2"><Label>{label}{required && <span className="text-destructive"> *</span>}</Label>{children}{error && <p className="text-xs text-destructive">{error}</p>}</div>;
}
function Summary({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
    return <div><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 font-semibold ${positive ? "text-emerald-600" : ""}`}>{value || "-"}</p></div>;
}