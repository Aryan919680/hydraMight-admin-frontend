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
  Loader2,
  Package,
  Search,
  ShoppingCart,
  Tags,
  Truck,
} from "lucide-react";

import {
  api,
  InventoryAllocation,
  InventoryChannel,
  InventoryLocation,
  InventorySkuSearchItem,
  InventorySubChannel,
  MainInventoryItem,
  ServiceLocation,
} from "@/lib/api";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

type Props = {
  open: boolean;
  allocation?: InventoryAllocation | null;
  initialInventory?: MainInventoryItem | null;
  channels: InventoryChannel[];
  subChannels: InventorySubChannel[];
  locations: InventoryLocation[];
  serviceLocations: ServiceLocation[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void> | void;
  onViewAllocations: () => void;
  onViewMainInventory: () => void;
};

type ChannelCode = "ecom" | "distribution" | "white_label";

type WizardForm = {
  channel: ChannelCode | "";
  sub_channel: string;
  service_location_id: string;
  location_id: string;
  allocated_stock: string;
  min_stock_level: string;
  remarks: string;
};

type FieldErrors = Partial<
  Record<
    | "sku"
    | "channel"
    | "sub_channel"
    | "location"
    | "allocated_stock"
    | "min_stock_level",
    string
  >
>;

const steps = [
  "Select SKU",
  "Channel & location",
  "Set quantity",
  "Review",
  "Done",
];

const emptyForm: WizardForm = {
  channel: "",
  sub_channel: "",
  service_location_id: "",
  location_id: "",
  allocated_stock: "",
  min_stock_level: "0",
  remarks: "",
};

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debounced;
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="grid grid-cols-5 gap-2 py-3">
      {steps.map((label, index) => {
        const number = index + 1;
        const complete = number < currentStep;
        const active = number === currentStep;

        return (
          <div key={label} className="flex min-w-0 items-center">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
                  complete
                    ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                    : active
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-muted-foreground/30 text-muted-foreground",
                ].join(" ")}
              >
                {complete ? <Check className="h-4 w-4" /> : number}
              </span>
              <span
                className={[
                  "hidden truncate text-sm lg:block",
                  active
                    ? "font-semibold text-foreground"
                    : complete
                      ? "text-foreground"
                      : "text-muted-foreground",
                ].join(" ")}
              >
                {label}
              </span>
            </div>
            {number < steps.length && (
              <div
                className={[
                  "mx-3 hidden h-px flex-1 sm:block",
                  complete ? "bg-emerald-500" : "bg-border",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function Summary({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div
        className={[
          "mt-1 font-semibold",
          accent ? "text-emerald-600" : "",
        ].join(" ")}
      >
        {value || "—"}
      </div>
    </div>
  );
}

export function StockAllocationWizard({
  open,
  allocation,
  initialInventory,
  channels,
  subChannels,
  locations,
  serviceLocations,
  onOpenChange,
  onSaved,
  onViewAllocations,
  onViewMainInventory,
}: Props) {
  const editing = Boolean(allocation);
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 500);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<InventorySkuSearchItem[]>([]);
  const [selectedSku, setSelectedSku] = useState<InventorySkuSearchItem | null>(
    null
  );
  const [form, setForm] = useState<WizardForm>(emptyForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [savedAllocation, setSavedAllocation] =
    useState<InventoryAllocation | null>(null);

  const initializedKeyRef = useRef<string | null>(null);
  const searchRequestRef = useRef(0);

  useEffect(() => {
    if (!open) {
      initializedKeyRef.current = null;
      return;
    }

    const key = allocation?.id
      ? `edit-${allocation.id}`
      : initialInventory?.id
        ? `create-${initialInventory.id}`
        : "create-empty";

    if (initializedKeyRef.current === key) return;
    initializedKeyRef.current = key;

    setErrors({});
    setSavedAllocation(null);
    setSearchResults([]);

    if (allocation) {
      const editableAvailable =
        Number(allocation.main_available_stock || 0) +
        Number(allocation.allocated_stock || 0);

      setSelectedSku({
        id: allocation.main_inventory_id,
        sku: allocation.sku,
        item_name: allocation.item_name || "",
        total_stock: Number(allocation.main_total_stock || 0),
        reserved_stock: 0,
        allocated_stock:
          Number(allocation.main_total_stock || 0) -
          Number(allocation.main_available_stock || 0),
        available_stock: editableAvailable,
        min_stock_level: 0,
        product_link_status: allocation.product_link_status || "pending",
        allocations: [],
      });
      setQuery(allocation.sku);
      setForm({
        channel: allocation.channel_code as ChannelCode,
        sub_channel: allocation.sub_channel_code || "",
        service_location_id: allocation.service_location_id || "",
        location_id: allocation.location_id,
        allocated_stock: String(allocation.allocated_stock ?? 0),
        min_stock_level: String(allocation.min_stock_level ?? 0),
        remarks: allocation.remarks || "",
      });
      setStep(3);
      return;
    }

    if (initialInventory) {
      setSelectedSku({
        id: initialInventory.id,
        sku: initialInventory.sku || "",
        item_name: initialInventory.item_name || initialInventory.product_name || "",
        total_stock: Number(initialInventory.total_stock || 0),
        reserved_stock: Number(initialInventory.reserved_stock || 0),
        allocated_stock: Number(initialInventory.allocated_stock || 0),
        available_stock: Number(initialInventory.available_stock || 0),
        min_stock_level: Number(initialInventory.min_stock_level || 0),
        product_link_status: initialInventory.product_link_status || "pending",
        allocations: [],
      });
      setQuery(initialInventory.sku || "");
      setForm(emptyForm);
      setStep(2);
      return;
    }

    setQuery("");
    setSelectedSku(null);
    setForm(emptyForm);
    setStep(1);
  }, [allocation, initialInventory, open]);

  useEffect(() => {
    if (!open || editing || step !== 1) return;

    if (debouncedQuery.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const requestId = ++searchRequestRef.current;
    let cancelled = false;

    const search = async () => {
      try {
        setSearching(true);
        const response = await api.searchInventorySkus(debouncedQuery);

        if (cancelled || requestId !== searchRequestRef.current) return;
        setSearchResults(response.data || []);
      } catch {
        if (cancelled || requestId !== searchRequestRef.current) return;
        setSearchResults([]);
      } finally {
        if (!cancelled && requestId === searchRequestRef.current) {
          setSearching(false);
        }
      }
    };

    void search();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, editing, open, step]);

  const selectedChannel = channels.find((item) => item.code === form.channel);

  const availableToAllocate = Number(selectedSku?.available_stock || 0);
  const quantity = Number(form.allocated_stock || 0);
  const remaining = availableToAllocate - quantity;
  const percentage =
    availableToAllocate > 0 ? (quantity / availableToAllocate) * 100 : 0;
  const overAvailable = quantity > availableToAllocate;
  const highAllocation = percentage >= 80 && !overAvailable;

  const currentSubChannels = useMemo(
    () =>
      subChannels.filter(
        (item) => item.channel_code === form.channel && item.is_active
      ),
    [form.channel, subChannels]
  );

  const availableLocations = useMemo(() => {
    if (!form.channel || form.channel === "ecom") return [];

    return locations.filter(
      (item) => item.channel_code === form.channel && item.is_active
    );
  }, [form.channel, locations]);

  const chosenLocation = useMemo(() => {
    if (form.channel === "ecom") {
      return serviceLocations.find(
        (item) => item.id === form.service_location_id
      );
    }

    return locations.find((item) => item.id === form.location_id);
  }, [
    form.channel,
    form.location_id,
    form.service_location_id,
    locations,
    serviceLocations,
  ]);

  const setField = <K extends keyof WizardForm>(
    key: K,
    value: WizardForm[K]
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const selectSku = (item: InventorySkuSearchItem) => {
    setSelectedSku(item);
    setQuery(item.sku);
    setErrors((previous) => ({ ...previous, sku: undefined }));
  };

  const chooseChannel = (channel: ChannelCode) => {
    setForm((previous) => ({
      ...previous,
      channel,
      sub_channel: "",
      service_location_id: "",
      location_id: "",
    }));
    setErrors((previous) => ({
      ...previous,
      channel: undefined,
      sub_channel: undefined,
      location: undefined,
    }));
  };

  const validateStepOne = () => {
    if (!selectedSku) {
      setErrors({ sku: "Select an existing main-inventory SKU to continue." });
      return false;
    }
    return true;
  };

  const validateStepTwo = () => {
    const nextErrors: FieldErrors = {};

    if (!form.channel) nextErrors.channel = "Select a channel.";

    if (form.channel === "ecom") {
      if (!form.sub_channel) {
        nextErrors.sub_channel = "Select household or commercial.";
      }
      if (!form.service_location_id) {
        nextErrors.location = "Select a service location.";
      }
    } else if (form.channel && !form.location_id) {
      nextErrors.location = "Select a channel location.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStepThree = () => {
    const nextErrors: FieldErrors = {};
    const allocated = Number(form.allocated_stock);
    const minimum = Number(form.min_stock_level);

    if (!form.allocated_stock || !Number.isFinite(allocated) || allocated <= 0) {
      nextErrors.allocated_stock = "Enter an allocation greater than 0.";
    } else if (allocated > availableToAllocate) {
      nextErrors.allocated_stock = `Cannot exceed ${availableToAllocate} available units.`;
    }

    if (!Number.isFinite(minimum) || minimum < 0) {
      nextErrors.min_stock_level = "Enter 0 or more.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const continueFromCurrentStep = () => {
    if (step === 1 && validateStepOne()) setStep(2);
    if (step === 2 && validateStepTwo()) setStep(3);
    if (step === 3 && validateStepThree()) setStep(4);
  };

  const saveAllocation = async () => {
    if (!selectedSku || !validateStepTwo() || !validateStepThree()) return;

    try {
      setSaving(true);

      let response;

      if (allocation) {
        response = await api.updateInventoryAllocation(allocation.id, {
          allocated_stock: quantity,
          reserved_stock: Number(allocation.reserved_stock || 0),
          min_stock_level: Number(form.min_stock_level || 0),
          remarks: form.remarks.trim() || undefined,
        });
      } else {
        const inventoryLocation = locations.find(
          (item) => item.id === form.location_id
        );

        response = await api.createInventoryAllocation({
          sku: selectedSku.sku,
          channel: form.channel,
          sub_channel:
            form.channel === "ecom" ? form.sub_channel : undefined,
          service_location_id:
            form.channel === "ecom"
              ? form.service_location_id
              : undefined,
          location_code:
            form.channel !== "ecom" ? inventoryLocation?.code : undefined,
          location_name:
            form.channel !== "ecom" ? inventoryLocation?.name : undefined,
          city:
            form.channel !== "ecom"
              ? inventoryLocation?.city || undefined
              : undefined,
          state:
            form.channel !== "ecom"
              ? inventoryLocation?.state || undefined
              : undefined,
          pincode:
            form.channel !== "ecom"
              ? inventoryLocation?.pincode || undefined
              : undefined,
          location_type:
            form.channel !== "ecom"
              ? inventoryLocation?.location_type
              : "service_area",
          allocated_stock: quantity,
          reserved_stock: 0,
          min_stock_level: Number(form.min_stock_level || 0),
          remarks: form.remarks.trim() || undefined,
        });
      }

      setSavedAllocation(response.data || null);
      setStep(5);
      await onSaved();
    } catch (error) {
      setErrors({
        allocated_stock:
          error instanceof Error ? error.message : "Allocation failed.",
      });
      setStep(3);
    } finally {
      setSaving(false);
    }
  };

  const allocateAnother = () => {
    initializedKeyRef.current = null;
    setStep(1);
    setQuery("");
    setSearchResults([]);
    setSelectedSku(null);
    setForm(emptyForm);
    setErrors({});
    setSavedAllocation(null);
  };

  const renderStepOne = () => (
    <section className="space-y-5 rounded-xl border p-6">
      <div>
        <h3 className="text-lg font-semibold">Which SKU are you allocating?</h3>
        <p className="text-sm text-muted-foreground">
          Search by SKU code or item name. Current stock visibility loads
          automatically.
        </p>
      </div>

      <Field
        label="SKU code or item name"
        required
        error={errors.sku}
        hint="Type at least 2 characters to search existing inventory SKUs."
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            className="pl-9 pr-10"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedSku(null);
              setErrors((previous) => ({ ...previous, sku: undefined }));
            }}
            placeholder="e.g. HYD-FC-500ML or Floor Cleaner"
          />
          {searching && (
            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </Field>

      {selectedSku ? (
        <SkuStockCard item={selectedSku} />
      ) : searchResults.length > 0 ? (
        <div className="max-h-80 overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU / item</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Allocated</TableHead>
                <TableHead>Available</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => selectSku(item)}
                >
                  <TableCell>
                    <div className="font-medium">{item.item_name || "—"}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {item.sku}
                    </div>
                  </TableCell>
                  <TableCell>{item.total_stock}</TableCell>
                  <TableCell>{item.allocated_stock}</TableCell>
                  <TableCell className="font-semibold text-emerald-600">
                    {item.available_stock}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : debouncedQuery.length >= 2 && !searching ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No matching main-inventory SKU found.</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedSku ? `${selectedSku.sku} selected` : "Select a SKU to continue"}
        </p>
        <Button onClick={continueFromCurrentStep} disabled={!selectedSku}>
          Continue
        </Button>
      </div>
    </section>
  );

  const renderStepTwo = () => (
    <section className="space-y-6 rounded-xl border p-6">
      <div>
        <h3 className="text-lg font-semibold">Which channel and location?</h3>
        <p className="text-sm text-muted-foreground">
          Select a channel first. Location and sub-channel options update
          accordingly.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-4">
        <span>
          Available to allocate for{" "}
          <span className="font-mono">{selectedSku?.sku}</span>
        </span>
        <strong className="text-xl text-emerald-600">
          {availableToAllocate} units
        </strong>
      </div>

      <Field label="Channel" required error={errors.channel}>
        <div className="grid gap-4 md:grid-cols-3">
          <ChannelCard
            title="Ecom"
            subtitle="Household · Commercial"
            icon={<ShoppingCart className="h-6 w-6" />}
            active={form.channel === "ecom"}
            disabled={editing}
            onClick={() => chooseChannel("ecom")}
          />
          <ChannelCard
            title="Distribution"
            subtitle="Stockist · Agency"
            icon={<Truck className="h-6 w-6" />}
            active={form.channel === "distribution"}
            disabled={editing}
            onClick={() => chooseChannel("distribution")}
          />
          <ChannelCard
            title="White Label"
            subtitle="Partner locations"
            icon={<Tags className="h-6 w-6" />}
            active={form.channel === "white_label"}
            disabled={editing}
            onClick={() => chooseChannel("white_label")}
          />
        </div>
      </Field>

      {form.channel && (
        <div className="grid gap-5 rounded-lg bg-muted/40 p-5 md:grid-cols-2">
          {form.channel === "ecom" && (
            <Field
              label="Ecom sub-channel"
              required
              error={errors.sub_channel}
            >
              <Select
                value={form.sub_channel}
                disabled={editing}
                onValueChange={(value) => setField("sub_channel", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sub-channel" />
                </SelectTrigger>
                <SelectContent>
                  {currentSubChannels.map((item) => (
                    <SelectItem key={item.id} value={item.code}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          {form.channel === "ecom" ? (
            <Field
              label="Service location"
              required
              error={errors.location}
            >
              <Select
                value={form.service_location_id}
                disabled={editing}
                onValueChange={(value) =>
                  setField("service_location_id", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {serviceLocations
                    .filter((item) => item.is_active)
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} · {item.city}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
          ) : (
            <Field
              label={
                form.channel === "distribution"
                  ? "Stockist / distribution location"
                  : "Partner location"
              }
              required
              error={errors.location}
            >
              <Select
                value={form.location_id}
                disabled={editing}
                onValueChange={(value) => setField("location_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {availableLocations.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} · {item.city || item.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </div>
      )}

      {form.channel && chosenLocation && (
        <p className="text-sm text-muted-foreground">
          Selected: <strong>{chosenLocation.name}</strong>
        </p>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(1)} disabled={editing}>
          Back
        </Button>
        <Button onClick={continueFromCurrentStep}>Continue</Button>
      </div>
    </section>
  );

  const renderStepThree = () => (
    <section className="space-y-6 rounded-xl border p-6">
      <div>
        <h3 className="text-lg font-semibold">Set stock quantities</h3>
        <p className="text-sm text-muted-foreground">
          You cannot exceed available main inventory.
        </p>
      </div>

      <div
        className={[
          "rounded-lg border p-5",
          overAvailable
            ? "border-destructive/40 bg-destructive/5"
            : highAllocation
              ? "border-amber-300 bg-amber-50"
              : "border-emerald-200 bg-emerald-50/60",
        ].join(" ")}
      >
        <div className="flex justify-between">
          <span>Main available</span>
          <strong>{availableToAllocate} units</strong>
        </div>
        <div className="mt-3 flex justify-between">
          <span>You are allocating</span>
          <strong>{Number.isFinite(quantity) ? quantity : 0} units</strong>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={[
              "h-full rounded-full transition-all",
              overAvailable
                ? "bg-destructive"
                : highAllocation
                  ? "bg-amber-500"
                  : "bg-emerald-500",
            ].join(" ")}
            style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
          />
        </div>

        {overAvailable ? (
          <p className="mt-3 text-sm font-medium text-destructive">
            Allocation exceeds available stock by {Math.abs(remaining)} units.
          </p>
        ) : highAllocation ? (
          <p className="mt-3 text-sm font-medium text-amber-700">
            You are allocating more than 80% of available stock (
            {Math.round(percentage)}%).
          </p>
        ) : quantity > 0 ? (
          <p className="mt-3 text-sm font-medium text-emerald-600">
            {remaining} units will remain in main available.
          </p>
        ) : (
          <p className="mt-3 text-sm text-emerald-600">
            Enter allocation quantity below.
          </p>
        )}
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Field
          label="Allocated stock"
          required
          error={errors.allocated_stock}
          hint={`Maximum ${availableToAllocate} units`}
        >
          <Input
            type="number"
            min="1"
            max={availableToAllocate}
            value={form.allocated_stock}
            onChange={(event) =>
              setField("allocated_stock", event.target.value)
            }
          />
        </Field>

        <Field
          label="Min stock level"
          error={errors.min_stock_level}
          hint="Triggers low-stock alert."
        >
          <Input
            type="number"
            min="0"
            value={form.min_stock_level}
            onChange={(event) =>
              setField("min_stock_level", event.target.value)
            }
          />
        </Field>

        <Field label="Remarks">
          <Input
            value={form.remarks}
            onChange={(event) => setField("remarks", event.target.value)}
            placeholder="e.g. Lucknow Q3"
          />
        </Field>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(2)} disabled={editing}>
          Back
        </Button>
        <Button onClick={continueFromCurrentStep} disabled={overAvailable}>
          Review
        </Button>
      </div>
    </section>
  );

  const renderStepFour = () => (
    <section className="space-y-6 rounded-xl border p-6">
      <div>
        <h3 className="text-lg font-semibold">Review allocation</h3>
        <p className="text-sm text-muted-foreground">
          Confirm before saving. Main inventory available will update
          transactionally.
        </p>
      </div>

      <div className="grid gap-5 rounded-lg bg-muted/40 p-5 md:grid-cols-2">
        <Summary
          label="SKU"
          value={<span className="font-mono">{selectedSku?.sku}</span>}
        />
        <Summary label="Item" value={selectedSku?.item_name || "—"} />
        <Summary
          label="Channel"
          value={`${selectedChannel?.name || form.channel}${
            form.sub_channel ? ` · ${form.sub_channel}` : ""
          }`}
        />
        <Summary label="Location" value={chosenLocation?.name || "—"} />
        <Summary label="Allocated" value={`${quantity} units`} accent />
        <Summary
          label="Main available after"
          value={`${remaining} units`}
        />
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Main inventory available will reduce by the allocated amount. The
          backend rechecks stock under a database lock before saving.
        </AlertDescription>
      </Alert>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(3)}>
          Edit
        </Button>
        <Button onClick={saveAllocation} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirm allocation
        </Button>
      </div>
    </section>
  );

  const renderStepFive = () => (
    <div className="space-y-6">
      <section className="rounded-xl border border-emerald-300 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
        <h3 className="mt-4 text-xl font-semibold text-emerald-800">
          Stock allocated — {selectedSku?.sku} → {chosenLocation?.name}
        </h3>
        <p className="mt-2 text-muted-foreground">
          Main inventory was updated and the channel allocation is ready.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <ActionCard
          icon={<Package className="h-6 w-6" />}
          title="Allocate another SKU"
          description="Start a new allocation."
          onClick={allocateAnother}
        />
        <ActionCard
          icon={<CheckCircle2 className="h-6 w-6" />}
          title="View channel allocations"
          description="See all channel and location records."
          onClick={() => {
            onOpenChange(false);
            onViewAllocations();
          }}
        />
        {savedAllocation && (
          <ActionCard
            icon={<Tags className="h-6 w-6" />}
            title="Edit this allocation"
            description="Adjust the quantity from the allocations table."
            onClick={() => {
              onOpenChange(false);
              onViewAllocations();
            }}
          />
        )}
        <ActionCard
          icon={<Package className="h-6 w-6" />}
          title="Main inventory"
          description="Check updated stock levels."
          onClick={() => {
            onOpenChange(false);
            onViewMainInventory();
          }}
        />
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Update stock allocation" : "Allocate stock"}
          </DialogTitle>
          <DialogDescription>
            Move stock from main inventory to a channel and service location.
          </DialogDescription>
        </DialogHeader>

        <StepIndicator currentStep={step} />

        {step === 1 && renderStepOne()}
        {step === 2 && renderStepTwo()}
        {step === 3 && renderStepThree()}
        {step === 4 && renderStepFour()}
        {step === 5 && renderStepFive()}
      </DialogContent>
    </Dialog>
  );
}

function ChannelCard({
  title,
  subtitle,
  icon,
  active,
  disabled,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "rounded-xl border-2 p-6 text-center transition",
        active
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/40 hover:bg-muted/40",
        disabled ? "cursor-not-allowed opacity-70" : "",
      ].join(" ")}
    >
      <div className="mx-auto mb-3 flex w-fit items-center justify-center">
        {icon}
      </div>
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </button>
  );
}

function ActionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="rounded-xl border p-5 text-left transition hover:bg-muted/40"
      onClick={onClick}
    >
      {icon}
      <p className="mt-3 font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </button>
  );
}

function SkuStockCard({ item }: { item: InventorySkuSearchItem }) {
  return (
    <div className="space-y-4 rounded-xl bg-muted/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold">{item.item_name || "Unnamed item"}</h4>
          <p className="font-mono text-sm text-muted-foreground">{item.sku}</p>
        </div>
        <Badge variant="outline">Main inventory</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Total: {item.total_stock}</Badge>
        <Badge variant="secondary">Allocated: {item.allocated_stock}</Badge>
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          Available: {item.available_stock}
        </Badge>
      </div>

      {item.allocations.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Already allocated to
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Sub</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.allocations.map((allocation) => (
                <TableRow key={allocation.id}>
                  <TableCell>
                    <Badge variant="outline">{allocation.channel_code}</Badge>
                  </TableCell>
                  <TableCell>{allocation.sub_channel_code || "—"}</TableCell>
                  <TableCell>{allocation.location_name}</TableCell>
                  <TableCell className="text-right">
                    {allocation.allocated_stock}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}