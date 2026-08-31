import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Check,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";

import {
  api,
  Category,
  ProductImagePayload,
  ServiceLocation,
} from "@/lib/api";

import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => Promise<void> | void;
};

type FormState = {
  name: string;
  sku: string;
  brand: string;
  category_id: string;

  ecom_channel:
    | "household"
    | "commercial";

  quantity_value: string;
  quantity_unit:
    | "ml"
    | "litre"
    | "gallon";

  unit: string;
  weight: string;
  hsn_code: string;

  mrp: string;
  selling_price: string;

  short_description: string;
  description: string;

  service_location_ids: string[];
};

type Errors = Partial<
  Record<keyof FormState, string>
>;

const steps = [
  "Identity",
  "Pricing & specs",
  "Images & content",
  "Review & publish",
];

const emptyForm: FormState = {
  name: "",
  sku: "",
  brand: "HydraMight",
  category_id: "",

  ecom_channel: "household",

  quantity_value: "",
  quantity_unit: "ml",

  unit: "",
  weight: "",
  hsn_code: "",

  mrp: "",
  selling_price: "",

  short_description: "",
  description: "",

  service_location_ids: [],
};

export function EcomProductWizard({
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const [step, setStep] = useState(1);

  const [form, setForm] =
    useState<FormState>(emptyForm);

  const [errors, setErrors] =
    useState<Errors>({});

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [locations, setLocations] =
    useState<ServiceLocation[]>([]);

  const [images, setImages] = useState<
    ProductImagePayload[]
  >([]);

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setStep(1);
    setForm({
      ...emptyForm,
    });
    setErrors({});
    setImages([]);

    const load = async () => {
      try {
        const [
          categoriesResponse,
          locationsResponse,
        ] = await Promise.all([
          api.getCategories(),
          api.getLocations(),
        ]);

        setCategories(
          categoriesResponse.data || []
        );

        setLocations(
          locationsResponse.data || []
        );
      } catch (error) {
        toast({
          title:
            "Unable to load product setup",
          description:
            error instanceof Error
              ? error.message
              : "Please try again.",
          variant: "destructive",
        });
      }
    };

    void load();
  }, [open]);

  const setField = <
    K extends keyof FormState,
  >(
    key: K,
    value: FormState[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [key]: undefined,
    }));
  };

  const selectedCategory =
    categories.find(
      (category) =>
        category.id === form.category_id
    );

  const validateIdentity = () => {
    const next: Errors = {};

    if (!form.name.trim()) {
      next.name =
        "Product name is required.";
    }

    if (!form.sku.trim()) {
      next.sku = "SKU is required.";
    }

    if (!form.category_id) {
      next.category_id =
        "Category is required.";
    }

    setErrors(next);

    return (
      Object.keys(next).length === 0
    );
  };

  const validatePricing = () => {
    const next: Errors = {};

    const quantity = Number(
      form.quantity_value
    );

    const mrp = Number(form.mrp);
    const sellingPrice = Number(
      form.selling_price
    );

    if (
      !form.quantity_value ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      next.quantity_value =
        "Quantity must be greater than 0.";
    }

    if (
      !form.mrp ||
      !Number.isFinite(mrp) ||
      mrp <= 0
    ) {
      next.mrp =
        "MRP must be greater than 0.";
    }

    if (
      !form.selling_price ||
      !Number.isFinite(sellingPrice) ||
      sellingPrice <= 0
    ) {
      next.selling_price =
        "Selling price must be greater than 0.";
    }

    if (
      Number.isFinite(mrp) &&
      Number.isFinite(sellingPrice) &&
      sellingPrice > mrp
    ) {
      next.selling_price =
        "Selling price cannot exceed MRP.";
    }

    setErrors(next);

    return (
      Object.keys(next).length === 0
    );
  };

  const validateContent = () => {
    const next: Errors = {};

    if (!form.short_description.trim()) {
      next.short_description =
        "Short description is required.";
    }

    if (images.length === 0) {
      toast({
        title: "Product image required",
        description:
          "Upload at least one product image.",
        variant: "destructive",
      });

      return false;
    }

    setErrors(next);

    return (
      Object.keys(next).length === 0
    );
  };

  const next = () => {
    if (
      step === 1 &&
      validateIdentity()
    ) {
      setStep(2);
      return;
    }

    if (
      step === 2 &&
      validatePricing()
    ) {
      setStep(3);
      return;
    }

    if (
      step === 3 &&
      validateContent()
    ) {
      setStep(4);
    }
  };

  const changeChannel = (
    value: "household" | "commercial"
  ) => {
    setField("ecom_channel", value);

    /*
     * Existing backend validation:
     * household = ml/litre
     * commercial = gallon.
     */
    setField(
      "quantity_unit",
      value === "commercial"
        ? "gallon"
        : "ml"
    );
  };

  const uploadFiles = async (
    files: FileList | null
  ) => {
    if (!files?.length) {
      return;
    }

    try {
      setUploadingImage(true);

      for (const file of Array.from(files)) {
        if (
          !file.type.startsWith("image/")
        ) {
          continue;
        }

        if (
          file.size >
          5 * 1024 * 1024
        ) {
          toast({
            title: "Image too large",
            description:
              `${file.name} exceeds 5MB.`,
            variant: "destructive",
          });

          continue;
        }

        const uploaded =
          await api.uploadProductImage(
            file
          );

        setImages((previous) => [
          ...previous,
          {
            image_url:
              uploaded.image_url,

            storage_bucket:
              uploaded.storage_bucket,

            storage_path:
              uploaded.storage_path,

            file_name:
              uploaded.file_name,

            mime_type:
              uploaded.mime_type,

            file_size:
              uploaded.file_size,

            is_primary:
              previous.length === 0,

            display_order:
              previous.length,
          },
        ]);
      }
    } catch (error) {
      toast({
        title: "Image upload failed",
        description:
          error instanceof Error
            ? error.message
            : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (
    index: number
  ) => {
    setImages((previous) => {
      const nextImages =
        previous.filter(
          (_, i) => i !== index
        );

      return nextImages.map(
        (image, i) => ({
          ...image,
          is_primary: i === 0,
          display_order: i,
        })
      );
    });
  };

  const toggleLocation = (
    id: string
  ) => {
    setForm((previous) => ({
      ...previous,

      service_location_ids:
        previous.service_location_ids.includes(
          id
        )
          ? previous.service_location_ids.filter(
              (value) =>
                value !== id
            )
          : [
              ...previous.service_location_ids,
              id,
            ],
    }));
  };

  const publish = async (
    draft = false
  ) => {
    if (
      !validateIdentity() ||
      !validatePricing() ||
      !validateContent()
    ) {
      return;
    }

    if (
      form.service_location_ids.length ===
      0
    ) {
      toast({
        title:
          "Service location required",
        description:
          "Select at least one service location.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      await api.createProduct({
        category_id:
          form.category_id,

        name: form.name.trim(),

        sku: form.sku
          .trim()
          .toUpperCase(),

        brand:
          form.brand.trim() ||
          undefined,

        ecom_channel:
          form.ecom_channel,

        quantity_value: Number(
          form.quantity_value
        ),

        quantity_unit:
          form.quantity_unit,

        unit:
          form.unit.trim() ||
          undefined,

        weight:
          form.weight
            ? Number(form.weight)
            : null,

        hsn_code:
          form.hsn_code.trim() ||
          undefined,

        mrp: Number(form.mrp),

        selling_price: Number(
          form.selling_price
        ),

        currency: "INR",

        short_description:
          form.short_description.trim(),

        description:
          form.description.trim() ||
          undefined,

        images,

        service_location_ids:
          form.service_location_ids,

        is_featured: false,

        /*
         * Save as draft simply prevents it
         * from appearing for sale.
         */
        is_available_for_sale:
          !draft,
      });

      toast({
        title: draft
          ? "Product saved as draft"
          : "Product published",

        description:
          "If the SKU exists in main inventory, it has been linked automatically.",
      });

      await onCreated();

      onOpenChange(false);
    } catch (error) {
      toast({
        title:
          draft
            ? "Unable to save draft"
            : "Unable to publish product",

        description:
          error instanceof Error
            ? error.message
            : "Please try again.",

        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderStepOne = () => (
    <div className="space-y-6 p-8">
      <Field
        label="Product name"
        required
        error={errors.name}
      >
        <Input
          value={form.name}
          placeholder="e.g. HydraMight Floor Cleaner 500ml"
          onChange={(event) =>
            setField(
              "name",
              event.target.value
            )
          }
        />
      </Field>

      <div className="grid gap-6 md:grid-cols-2">
        <Field
          label="SKU"
          required
          error={errors.sku}
        >
          <Input
            value={form.sku}
            placeholder="e.g. HYD-FC-500ML"
            onChange={(event) =>
              setField(
                "sku",
                event.target.value.toUpperCase()
              )
            }
          />
        </Field>

        <Field label="Brand">
          <Input
            value={form.brand}
            onChange={(event) =>
              setField(
                "brand",
                event.target.value
              )
            }
          />
        </Field>

        <Field
          label="Category"
          required
          error={
            errors.category_id
          }
        >
          <Select
            value={form.category_id}
            onValueChange={(value) =>
              setField(
                "category_id",
                value
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>

            <SelectContent>
              {categories
                .filter(
                  (category) =>
                    category.is_active
                )
                .map(
                  (category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </SelectItem>
                  )
                )}
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Ecom channel"
          required
        >
          <Select
            value={
              form.ecom_channel
            }
            onValueChange={(
              value:
                | "household"
                | "commercial"
            ) =>
              changeChannel(value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="household">
                Household
              </SelectItem>

              <SelectItem value="commercial">
                Commercial
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );

  const renderStepTwo = () => (
    <div className="space-y-7 p-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Field
          label="Quantity"
          required
          error={
            errors.quantity_value
          }
        >
          <div className="flex">
            <Input
              type="number"
              min="0"
              value={
                form.quantity_value
              }
              onChange={(event) =>
                setField(
                  "quantity_value",
                  event.target.value
                )
              }
              className="rounded-r-none"
            />

            <Select
              value={
                form.quantity_unit
              }
              onValueChange={(
                value:
                  | "ml"
                  | "litre"
                  | "gallon"
              ) =>
                setField(
                  "quantity_unit",
                  value
                )
              }
            >
              <SelectTrigger className="w-36 rounded-l-none">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {form.ecom_channel ===
                "household" ? (
                  <>
                    <SelectItem value="ml">
                      ml
                    </SelectItem>
                    <SelectItem value="litre">
                      litre
                    </SelectItem>
                  </>
                ) : (
                  <SelectItem value="gallon">
                    gallon
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </Field>

        <Field label="Pack / unit type">
          <Input
            value={form.unit}
            placeholder="e.g. bottle, pouch, box"
            onChange={(event) =>
              setField(
                "unit",
                event.target.value
              )
            }
          />
        </Field>

        <Field label="Weight (kg)">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.weight}
            placeholder="0.5"
            onChange={(event) =>
              setField(
                "weight",
                event.target.value
              )
            }
          />
        </Field>

        <Field
          label="HSN code"
          hint="For GST billing"
        >
          <Input
            value={form.hsn_code}
            placeholder="e.g. 3402"
            onChange={(event) =>
              setField(
                "hsn_code",
                event.target.value
              )
            }
          />
        </Field>

        <Field
          label="MRP ₹"
          required
          error={errors.mrp}
        >
          <Input
            type="number"
            min="0"
            value={form.mrp}
            onChange={(event) =>
              setField(
                "mrp",
                event.target.value
              )
            }
          />
        </Field>

        <Field
          label="Selling price ₹"
          required
          error={
            errors.selling_price
          }
        >
          <Input
            type="number"
            min="0"
            value={
              form.selling_price
            }
            onChange={(event) =>
              setField(
                "selling_price",
                event.target.value
              )
            }
          />
        </Field>
      </div>
    </div>
  );

  const renderStepThree = () => (
    <div className="space-y-7 p-8">
      <Field
        label="Product images"
        required
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={(event) =>
            uploadFiles(
              event.target.files
            )
          }
        />

        <button
          type="button"
          onClick={() =>
            fileInputRef.current?.click()
          }
          disabled={uploadingImage}
          className="flex min-h-48 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/70 bg-primary/5 p-8 text-center transition hover:bg-primary/10"
        >
          {uploadingImage ? (
            <Loader2 className="mb-4 h-8 w-8 animate-spin" />
          ) : (
            <ImagePlus className="mb-4 h-8 w-8" />
          )}

          <p className="font-semibold">
            Drop images here or click
            to upload
          </p>

          <p className="text-sm text-muted-foreground">
            PNG, JPG up to 5MB ·
            First image becomes the main
            listing image
          </p>
        </button>

        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
            {images.map(
              (image, index) => (
                <div
                  key={`${image.image_url}-${index}`}
                  className="relative overflow-hidden rounded-lg border"
                >
                  <img
                    src={image.image_url}
                    className="aspect-square w-full object-cover"
                    alt=""
                  />

                  {index === 0 && (
                    <div className="absolute left-2 top-2 rounded bg-background px-2 py-1 text-xs font-medium">
                      Main
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7"
                    onClick={() =>
                      removeImage(index)
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )
            )}
          </div>
        )}
      </Field>

      <Field
        label="Short description"
        required
        error={
          errors.short_description
        }
        hint={`${form.short_description.length}/100 · Shown on product card in the storefront`}
      >
        <Input
          maxLength={100}
          value={
            form.short_description
          }
          placeholder="Shown on listing card — keep under 100 chars"
          onChange={(event) =>
            setField(
              "short_description",
              event.target.value
            )
          }
        />
      </Field>

      <Field label="Full description">
        <Textarea
          rows={6}
          value={form.description}
          placeholder="Detailed product description, ingredients, usage instructions…"
          onChange={(event) =>
            setField(
              "description",
              event.target.value
            )
          }
        />
      </Field>

      <Field
        label="Service locations"
        required
        hint="Choose where this Ecom product can be sold."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {locations
            .filter(
              (location) =>
                location.is_active
            )
            .map(
              (location) => (
                <label
                  key={location.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
                >
                  <Checkbox
                    checked={form.service_location_ids.includes(
                      location.id
                    )}
                    onCheckedChange={() =>
                      toggleLocation(
                        location.id
                      )
                    }
                  />

                  <div>
                    <p className="font-medium">
                      {location.name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {location.city},{" "}
                      {location.state}
                    </p>
                  </div>
                </label>
              )
            )}
        </div>
      </Field>
    </div>
  );

  const renderStepFour = () => (
    <div className="space-y-6 p-8">
      <h3 className="text-lg font-semibold">
        Review before publishing
      </h3>

      <div className="grid gap-x-12 gap-y-7 rounded-xl bg-muted/40 p-6 md:grid-cols-2">
        <Review
          label="Product name"
          value={form.name}
        />

        <Review
          label="SKU"
          value={form.sku}
          mono
        />

        <Review
          label="Category"
          value={
            selectedCategory?.name
          }
        />

        <Review
          label="Channel"
          value={
            form.ecom_channel ===
            "household"
              ? "Household"
              : "Commercial"
          }
        />

        <Review
          label="Quantity"
          value={`${form.quantity_value} ${form.quantity_unit}`}
        />

        <Review
          label="MRP / Selling price"
          value={`₹${form.mrp} / ₹${form.selling_price}`}
        />

        <Review
          label="HSN"
          value={form.hsn_code}
        />

        <Review
          label="Images"
          value={`${images.length} uploaded`}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() =>
            publish(false)
          }
          disabled={saving}
        >
          {saving && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}

          Publish product
        </Button>

        <Button
          variant="outline"
          onClick={() =>
            publish(true)
          }
          disabled={saving}
        >
          Save as draft
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[95vh] max-w-6xl overflow-y-auto p-0">
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2 className="text-xl font-semibold">
              New Ecom product
            </h2>

            <p className="text-sm text-muted-foreground">
              Stock links automatically
              when SKU matches inventory.
            </p>
          </div>

          <p className="font-medium">
            Step {step} of 4
          </p>
        </div>

        <ProductSteps
          step={step}
        />

        {step === 1 &&
          renderStepOne()}

        {step === 2 &&
          renderStepTwo()}

        {step === 3 &&
          renderStepThree()}

        {step === 4 &&
          renderStepFour()}

        <div className="flex justify-between border-t bg-muted/30 p-6">
          <div>
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() =>
                  setStep(
                    (current) =>
                      current - 1
                  )
                }
              >
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() =>
                onOpenChange(false)
              }
            >
              Cancel
            </Button>

            {step < 4 && (
              <Button
                onClick={next}
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProductSteps({
  step,
}: {
  step: number;
}) {
  return (
    <div className="grid grid-cols-4 border-b bg-muted/30">
      {steps.map(
        (label, index) => {
          const number = index + 1;

          const done =
            number < step;

          const active =
            number === step;

          return (
            <div
              key={label}
              className={[
                "flex items-center gap-3 border-b-4 px-6 py-5",
                done
                  ? "border-emerald-500"
                  : active
                    ? "border-primary bg-background"
                    : "border-transparent",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 font-medium",
                  done
                    ? "border-emerald-500 text-emerald-600"
                    : active
                      ? "border-primary text-primary"
                      : "border-muted-foreground/30 text-muted-foreground",
                ].join(" ")}
              >
                {done ? (
                  <Check className="h-5 w-5" />
                ) : (
                  number
                )}
              </span>

              <span
                className={[
                  "hidden font-medium md:block",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground",
                ].join(" ")}
              >
                {label}
              </span>
            </div>
          );
        }
      )}
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
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}

        {required && (
          <span className="text-destructive">
            {" "}*
          </span>
        )}
      </Label>

      {children}

      {error ? (
        <p className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function Review({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p
        className={[
          "mt-1 font-semibold",
          mono ? "font-mono" : "",
        ].join(" ")}
      >
        {value || "—"}
      </p>
    </div>
  );
}