const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  token?: string;
  user?: AdminUser;
  data?: T;
};

export type AdminUser = {
  id: string;
  full_name?: string | null;
  email: string;
  mobile?: string | null;
  user_type: 'admin' | 'operator' | 'customer';
  status?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
  display_order?: number;
};

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  short_description?: string;
  description?: string;
  brand?: string;
  unit?: string;
  weight?: number;

  quantity_value?: number;
  quantity_unit?: string;
  portal_type?: string;

  is_active: boolean;
  is_featured: boolean;

  category_id?: string;
  category_name?: string;

  location_count?: number;

  total_stock?: number;
  total_available_stock?: number;
  total_reserved_stock?: number;
  available_stock?: number;

  is_out_of_stock?: boolean;

  mrp?: number;
  selling_price?: number;
  currency?: string;

  primary_image?: string;

  created_at?: string;
  updated_at?: string;
};

export type ProductImagePayload = {
  image_url: string;
  storage_bucket?: string;
  storage_path?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  alt_text?: string;
  is_primary?: boolean;
  display_order?: number;
};

export type CreateProductPayload = {
  category_id: string;
  name: string;
  sku: string;
  brand?: string;
  short_description?: string;
  description?: string;

  ecom_channel: "household" | "commercial";

  quantity_value?: number | null;
  quantity_unit: "ml" | "litre" | "gallon";

  unit?: string;
  weight?: number | null;

  mrp?: number | null;
  selling_price?: number | null;
  currency?: string;

  is_featured?: boolean;
  is_available_for_sale?: boolean;

  service_location_ids: string[];
  images: ProductImagePayload[];
};




export type MainInventoryItem = {
  id: string;
  product_id: string;
  product_name: string;
  sku?: string;
  portal_type?: string;
  quantity_value?: number;
  quantity_unit?: string;
  total_stock: number;
  available_stock: number;
  reserved_stock: number;
  min_stock_level: number;
  is_out_of_stock: boolean;
  updated_at: string;
  allocated_stock?: number;
  is_low_stock?: boolean;
  item_name?: string | null;
  remarks?: string | null;
  product_link_status?: "pending" | "linked";
};

export type InventoryItem = {
  id: string;
  product_id: string;
  product_name: string;
  sku?: string;

  portal_type?: string;
  quantity_value?: number;
  quantity_unit?: string;

  location_id: string;
  location_name?: string;
  city?: string;
  state?: string;
  pincode?: string;

  available_stock: number;
  reserved_stock: number;
  min_stock_level: number;

  is_out_of_stock: boolean;
  is_active: boolean;

  updated_at: string;
};

export type ServiceLocation = {
  id: string;
  name: string;
  code?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  radius_km?: number | null;
  is_active: boolean;
  created_at: string;
};


export type MainInventoryTransaction = {
  id: string;
  main_inventory_id: string;
  product_id?: string | null;
  sku: string;
  transaction_type:
    | "bulk_upload"
    | "stock_in"
    | "stock_out"
    | "adjustment"
    | "reserve"
    | "release_reserve"
    | "link_product"
    | "deactivate";
  quantity: number;
  old_total_stock: number;
  new_total_stock: number;
  old_reserved_stock: number;
  new_reserved_stock: number;
  old_allocated_stock: number;
  new_allocated_stock: number;
  old_available_stock: number;
  new_available_stock: number;
  remarks?: string | null;
  created_by_name?: string | null;
  created_at: string;
};

export type CreateMainInventoryPayload = {
  sku: string;
  item_name?: string;
  total_stock: number;
  reserved_stock?: number;
  min_stock_level?: number;
  remarks?: string;
};

export type UpdateMainInventoryPayload = {
  item_name?: string;
  total_stock: number;
  reserved_stock?: number;
  min_stock_level?: number;
  remarks?: string;
};


export type InventoryChannel = {
  id: string;
  code: "ecom" | "distribution" | "white_label";
  name: string;
  is_active: boolean;
};

export type InventorySubChannel = {
  id: string;
  channel_id: string;
  code: "household" | "commercial" | string;
  name: string;
  channel_code?: string;
  channel_name?: string;
  is_active: boolean;
};

export type InventoryLocation = {
  id: string;
  channel_id: string;
  sub_channel_id?: string | null;
  name: string;
  code: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  location_type: "service_area" | "warehouse" | "distributor" | "partner";
  channel_code?: string;
  channel_name?: string;
  sub_channel_code?: string | null;
  sub_channel_name?: string | null;
  is_active: boolean;
   service_location_id?: string | null;
};

export type InventoryAllocation = {
  id: string;
  main_inventory_id: string;
  sku: string;

  channel_id: string;
  channel_code: string;
  channel_name: string;

  sub_channel_id?: string | null;
  sub_channel_code?: string | null;
  sub_channel_name?: string | null;

  location_id: string;
  location_name: string;
  location_code: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  location_type?: string | null;

  allocated_stock: number;
  reserved_stock: number;
  available_stock: number;
  min_stock_level: number;

  is_out_of_stock: boolean;
  is_low_stock: boolean;

  remarks?: string | null;

  item_name?: string | null;
  main_total_stock?: number;
  main_available_stock?: number;
  product_link_status?: "pending" | "linked";

  created_at?: string;
   service_location_id?: string | null;
  service_location_name?: string | null;
  service_location_city?: string | null;
  service_location_state?: string | null;
  service_location_pincode?: string | null;
  updated_at?: string;
};

export type InventoryAllocationTransaction = {
  id: string;
  allocation_id: string;
  main_inventory_id: string;
  sku: string;
  transaction_type: string;
  quantity: number;
  old_allocated_stock: number;
  new_allocated_stock: number;
  old_reserved_stock: number;
  new_reserved_stock: number;
  old_available_stock: number;
  new_available_stock: number;
  remarks?: string | null;
  created_by_name?: string | null;
  created_at: string;
};

export function getToken() {
  return localStorage.getItem('admin_token');
}

export function saveSession(token: string, user: AdminUser) {
  localStorage.setItem('admin_token', token);
  localStorage.setItem('admin_user', JSON.stringify(user));
}

export function getStoredUser(): AdminUser | null {
  const raw = localStorage.getItem('admin_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export type DistributorMoqPricing = {
  id?: string;
  moq_quantity: number;
  cost_price: number;
  selling_price: number;
  status?: "active" | "inactive" | string;
};

export type UnmappedSku = {
  main_inventory_id: string;
  sku: string;
  item_name?: string | null;
  total_stock?: number | string;
  reserved_stock?: number | string;
  available_stock?: number | string;
  product_id?: string | null;
  product_link_status?: string | null;
};

export type DistributorProduct = {
  product_id: string;
  product_name: string;
  sku: string;
  slug?: string | null;

  category_id?: string | null;
  category_name?: string | null;
  brand?: string | null;
  short_description?: string | null;
  description?: string | null;

  quantity_value?: number | string | null;
  quantity_unit?: string | null;
  unit?: string | null;
  mrp?: number | string | null;
  currency?: string | null;

  product_active?: boolean;
  inventory_link_status?: string | null;

  main_inventory_id?: string | null;
  inventory_item_name?: string | null;
  main_total_stock?: number | string | null;
  main_reserved_stock?: number | string | null;
  main_available_stock?: number | string | null;

  distributor_allocated_stock?: number | string | null;
  distributor_reserved_stock?: number | string | null;
  distributor_available_stock?: number | string | null;

  moq_pricing: DistributorMoqPricing[];
};

export type CreateDistributorProductPayload = {
  category_id: string;
  name: string;
  sku: string;
  short_description?: string | null;
  description?: string | null;
  brand?: string | null;
  quantity_value?: number;
  quantity_unit?: string;
  unit?: string;
  mrp?: number;
  currency?: string;
  moq_pricing: DistributorMoqPricing[];
};

export type AdminOrder = {
  id: string;
  order_id?: string;
  order_number?: string | null;

  portal_type:
    | "household"
    | "commercial"
    | "distributor"
    | "whitelabel"
    | string;

  source_type?: string | null;

  customer_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;

  business_name?: string | null;
  contact_person?: string | null;
  gst_number?: string | null;

  location_name?: string | null;
  service_location_id?: string | null;

  order_status?: string | null;
  payment_status?: string | null;
  delivery_status?: string | null;

  subtotal?: number | string | null;
  discount_amount?: number | string | null;
  tax_amount?: number | string | null;
  delivery_charge?: number | string | null;
  total_amount?: number | string | null;

  item_count?: number | null;
  delivery_address?: unknown;
  remarks?: string | null;

  placed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;

  [key: string]: unknown;
};

export type AdminOrderSummary = {
  total_orders?: number;
  household_orders?: number;
  commercial_orders?: number;
  distributor_orders?: number;
  whitelabel_orders?: number;
  pending_approval?: number;
  processing_orders?: number;
  delivered_orders?: number;
  closed_problem_orders?: number;
  today_revenue?: number;
  total_revenue?: number;
};

export type AdminOrderEvent = {
  id?: string;
  event_type: string;
  previous_value?: string | null;
  new_value?: string | null;
  note?: string | null;
  created_at?: string | null;
  created_by_name?: string | null;
  created_by_email?: string | null;
  system_event?: boolean;
};

export type AdminOrderDetail = AdminOrder & {
  items?: Array<{
    id?: string;
    product_name?: string;
    sku?: string;
    quantity?: number;
    qty?: number;
    unit_price?: number;
    selling_price?: number;
    price?: number;
    total_amount?: number;
    line_total?: number;
    [key: string]: unknown;
  }>;
};
export const api = {
  login: (email: string, password: string) =>
    request<never>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getCategories: () => request<Category[]>('/admin/categories'),

  createCategory: (payload: { name: string; slug?: string; description?: string; image_url?: string }) =>
    request<Category>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCategory: (id: string, payload: Partial<Category>) =>
    request<Category>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getProducts: (limit = 200, offset = 0) =>
    request<AdminProduct[]>(`/admin/products?limit=${limit}&offset=${offset}`),

  getProductById: (id: string) =>
    request<AdminProduct>(`/admin/products/${id}`),

  createProduct: (payload: CreateProductPayload) =>
    request<AdminProduct>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProduct: (id: string, payload: Partial<AdminProduct>) =>
    request<AdminProduct>(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  updateProductPrice: (id: string, payload: { location_id: string; mrp: number; selling_price: number; currency?: string }) =>
    request(`/admin/products/${id}/price`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  updateProductInventory: (id: string, payload: { location_id: string; available_stock: number; min_stock_level?: number }) =>
    request(`/admin/products/${id}/inventory`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deactivateProduct: (id: string) =>
    request<AdminProduct>(`/admin/products/${id}`, {
      method: 'DELETE',
    }),

uploadProductImage: async (file: File) => {
  const token = localStorage.getItem("admin_token");

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE_URL}/admin/products/upload-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Image upload failed");
  }

  return data as {
    success: boolean;
    message: string;
    image_url: string;
    storage_bucket: string;
    storage_path: string;
    file_name: string;
    mime_type: string;
    file_size: number;
  };
},

 getMainInventory: (params?: {
  search?: string;
  status?: "low_stock" | "out_of_stock";
  link_status?: "pending" | "linked";
}) => {
  const query = new URLSearchParams();

  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.link_status) query.set("link_status", params.link_status);

  const qs = query.toString();

  return request<MainInventoryItem[]>(
    `/admin/main-inventory${qs ? `?${qs}` : ""}`
  );
},


checkMainInventorySku: (sku: string) =>
  request<{ success: boolean; exists: boolean; data: MainInventoryItem | null }>(
    `/admin/main-inventory/check-sku/${encodeURIComponent(sku)}`
  ),

getMainInventoryById: (id: string) =>
  request<{ success: boolean; data: MainInventoryItem }>(
    `/admin/main-inventory/${id}`
  ),

createMainInventory: (payload: CreateMainInventoryPayload) =>
  request<{ success: boolean; data: MainInventoryItem; message: string }>(
    "/admin/main-inventory",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  ),

updateMainInventory: (id: string, payload: UpdateMainInventoryPayload) =>
  request<{ success: boolean; data: MainInventoryItem; message: string }>(
    `/admin/main-inventory/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  ),

deleteMainInventory: (id: string) =>
  request<{ success: boolean; data: MainInventoryItem; message: string }>(
    `/admin/main-inventory/${id}`,
    {
      method: "DELETE",
    }
  ),

getMainInventoryTransactions: (id: string) =>
  request<{ success: boolean; data: MainInventoryTransaction[] }>(
    `/admin/main-inventory/${id}/transactions`
  ),

linkMainInventoryProducts: () =>
  request<{ success: boolean; linked_count: number; data: MainInventoryItem[] }>(
    "/admin/main-inventory/link-products",
    {
      method: "POST",
    }
  ),

bulkUploadMainInventory: async (file: File, validateOnly = false) => {
  const token = localStorage.getItem("admin_token");

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/admin/main-inventory/bulk-upload?validate_only=${validateOnly}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Bulk upload failed");
  }

  return data as {
    success: boolean;
    message: string;
    total_rows: number;
    processed: number;
    failed: number;
    results: any[];
  };
},
getInventoryChannels: () =>
  request<InventoryChannel[]>(
    "/admin/inventory-allocations/channels"
  ),

getInventorySubChannels: (channel?: string) =>
  request<InventorySubChannel[]>(
    `/admin/inventory-allocations/sub-channels${
      channel ? `?channel=${channel}` : ""
    }`
  ),

getInventoryAllocationLocations: (params?: {
  channel?: string;
  sub_channel?: string;
}) => {
  const query = new URLSearchParams();
  if (params?.channel) query.set("channel", params.channel);
  if (params?.sub_channel) query.set("sub_channel", params.sub_channel);

  return request<InventoryLocation[]>(
    `/admin/inventory-allocations/locations${
      query.toString() ? `?${query.toString()}` : ""
    }`
  );
},

createInventoryAllocationLocation: (payload: {
  channel: string;
  sub_channel?: string;
  location_code: string;
  location_name: string;
  city?: string;
  state?: string;
  pincode?: string;
  location_type?: string;
}) =>
  request<{ success: boolean; data: InventoryLocation; message: string }>(
    "/admin/inventory-allocations/locations",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  ),

getInventoryAllocations: (params?: {
  sku?: string;
  channel?: string;
  sub_channel?: string;
  location_id?: string;
}) => {
  const query = new URLSearchParams();
  if (params?.sku) query.set("sku", params.sku);
  if (params?.channel) query.set("channel", params.channel);
  if (params?.sub_channel) query.set("sub_channel", params.sub_channel);
  if (params?.location_id) query.set("location_id", params.location_id);

  return request<InventoryAllocation[]>(
    `/admin/inventory-allocations${
      query.toString() ? `?${query.toString()}` : ""
    }`
  );
},

createInventoryAllocation: (payload: {
  sku: string;
  channel: string;
  sub_channel?: string;
  location_code: string;
  location_name: string;
  city?: string;
  state?: string;
  pincode?: string;
  location_type?: string;
  allocated_stock: number;
  reserved_stock?: number;
  min_stock_level?: number;
  remarks?: string;
   service_location_id?: string;
}) =>
  request<{ success: boolean; data: InventoryAllocation; message: string }>(
    "/admin/inventory-allocations",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  ),

updateInventoryAllocation: (
  id: string,
  payload: {
    allocated_stock: number;
    reserved_stock?: number;
    min_stock_level?: number;
    remarks?: string;
  }
) =>
  request<{ success: boolean; data: InventoryAllocation; message: string }>(
    `/admin/inventory-allocations/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  ),

deleteInventoryAllocation: (id: string) =>
  request<{ success: boolean; data: InventoryAllocation; message: string }>(
    `/admin/inventory-allocations/${id}`,
    {
      method: "DELETE",
    }
  ),

getInventoryAllocationTransactions: (id: string) =>
  request<InventoryAllocationTransaction[]>(
    `/admin/inventory-allocations/${id}/transactions`
  ),

bulkUploadInventoryAllocations: async (file: File) => {
  const token = localStorage.getItem("admin_token");

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/admin/inventory-allocations/bulk-upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Sub inventory bulk upload failed");
  }

  return data as {
    success: boolean;
    message: string;
    total_rows: number;
    processed: number;
    failed: number;
    results: any[];
  };
},
  getLocations: () => request<ServiceLocation[]>("/admin/locations"),

  createLocation: (payload: {
    name: string;
    city: string;
    state: string;
    pincode: string;
    latitude?: number | null;
    longitude?: number | null;
    radius_km?: number | null;
    is_active?: boolean;
  }) =>
    request("/admin/locations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateLocation: (
    id: string,
    payload: Partial<{
      name: string;
      city: string;
      state: string;
      pincode: string;
      latitude: number | null;
      longitude: number | null;
      radius_km: number | null;
      is_active: boolean;
    }>
  ) =>
    request(`/admin/locations/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteLocation: (id: string) =>
    request(`/admin/locations/${id}`, {
      method: "DELETE",
    }),

  getCommercialSignups: (status: "pending" | "approved" | "rejected" = "pending") =>
    request<CommercialSignup[]>(`/admin/commercial-signups?status=${status}`),

  approveCommercialSignup: (id: string, admin_remarks?: string) =>
    request<CommercialSignup>(`/admin/commercial-signups/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ admin_remarks: admin_remarks || "" }),
    }),

  rejectCommercialSignup: (id: string, admin_remarks?: string) =>
    request<CommercialSignup>(`/admin/commercial-signups/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ admin_remarks: admin_remarks || "" }),
    }),

  getStockists: () => request<Stockist[]>(`/admin/distributors/stockists`),

  createStockist: (payload: CreateStockistPayload) =>
    request<Stockist>(`/admin/distributors/stockists`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getAgencies: () => request<Agency[]>(`/admin/distributors/agencies`),

  getAgenciesByStockist: (stockistId: string) =>
    request<Agency[]>(`/admin/distributors/stockists/${stockistId}/agencies`),

  createAgency: (payload: CreateAgencyPayload) =>
    request<Agency>(`/admin/distributors/agencies`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

    getAgencyRequests: (params?: { status?: string }) =>
  request(`/admin/distributors/agency-requests?status=${params?.status || "pending"}`),

approveAgencyRequest: (requestId: string, payload: { stockist_id?: string }) =>
  request(`/admin/distributors/agency-requests/${requestId}/approve`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  }),

rejectAgencyRequest: (requestId: string, payload: { rejection_reason?: string }) =>
  request(`/admin/distributors/agency-requests/${requestId}/reject`, {
    method: "POST",
    body: JSON.stringify(payload || {}),
  }),
getUnmappedDistributorSkus: (params?: {
  search?: string;
  limit?: number;
  offset?: number;
}) => {
  const query = new URLSearchParams();

  if (params?.search) query.set("search", params.search);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));

  const queryString = query.toString();

  return request<UnmappedSku[]>(
    `/admin/distributor-products/unmapped-skus${
      queryString ? `?${queryString}` : ""
    }`
  );
},

getDistributorProducts: (params?: {
  search?: string;
  status?: "active" | "inactive" | "all";
  limit?: number;
  offset?: number;
}) => {
  const query = new URLSearchParams();

  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.offset) query.set("offset", String(params.offset));

  const queryString = query.toString();

  return request<DistributorProduct[]>(
    `/admin/distributor-products${queryString ? `?${queryString}` : ""}`
  );
},

createDistributorProduct: (payload: CreateDistributorProductPayload) =>
  request<DistributorProduct>("/admin/distributor-products", {
    method: "POST",
    body: JSON.stringify(payload),
  }),

getDistributorProductById: (productId: string) =>
  request<DistributorProduct>(`/admin/distributor-products/${productId}`),

updateDistributorProductMoqPricing: (
  productId: string,
  payload: {
    moq_pricing: DistributorMoqPricing[];
  }
) =>
  request<{
    product: DistributorProduct;
    moq_pricing: DistributorMoqPricing[];
  }>(`/admin/distributor-products/${productId}/moq-pricing`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),

getAdminOrders: (params?: {
  portal_type?: string;
  status?: string;
  payment_status?: string;
  delivery_status?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}) => {
  const query = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();

  return request<AdminOrder[]>(
    `/admin/orders${queryString ? `?${queryString}` : ""}`
  );
},

getAdminOrderSummary: () => {
  return request<AdminOrderSummary>("/admin/orders/summary");
},

getAdminOrderDetail: (portalType: string, orderId: string) => {
  return request<AdminOrderDetail>(
    `/admin/orders/${portalType}/${orderId}`
  );
},

updateAdminOrderStatus: (
  portalType: string,
  orderId: string,
  status: string,
  note?: string
) => {
  return request<AdminOrder>(
    `/admin/orders/${portalType}/${orderId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status,
        note,
      }),
    }
  );
},

updateAdminOrderPaymentStatus: (
  portalType: string,
  orderId: string,
  payment_status: string,
  note?: string
) => {
  return request<AdminOrder>(
    `/admin/orders/${portalType}/${orderId}/payment-status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        payment_status,
        note,
      }),
    }
  );
},

updateAdminOrderDeliveryStatus: (
  portalType: string,
  orderId: string,
  delivery_status: string,
  note?: string
) => {
  return request<AdminOrder>(
    `/admin/orders/${portalType}/${orderId}/delivery-status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        delivery_status,
        note,
      }),
    }
  );
},

addAdminOrderNote: (
  portalType: string,
  orderId: string,
  note: string
) => {
  return request<{ success: boolean }>(
    `/admin/orders/${portalType}/${orderId}/notes`,
    {
      method: "POST",
      body: JSON.stringify({ note }),
    }
  );
},

getAdminOrderTimeline: (portalType: string, orderId: string) => {
  return request<AdminOrderEvent[]>(
    `/admin/orders/${portalType}/${orderId}/timeline`
  );
},
};

export type CommercialSignup = {
  id: string;
  business_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  gst_number?: string;
  business_type?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status: "pending" | "approved" | "rejected";
  admin_remarks?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  rejected_by?: string | null;
  rejected_at?: string | null;
  created_user_id?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
};

export type Stockist = {
  id: string;
  gst_number?: string;
  business_name?: string;
  contact_person?: string;
  mobile?: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
};

export type CreateStockistPayload = {
  gst_number: string;
  business_name: string;
  contact_person: string;
  mobile: string;
  email: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  territory: string;
};

export type Agency = {
  id: string;
  stockist_id?: string;
  stockist_name?: string;
  gst_number?: string;
  business_name?: string;
  contact_person?: string;
  mobile?: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
};

export type CreateAgencyPayload = {
  stockist_id: string;
  gst_number: string;
  business_name: string;
  contact_person: string;
  mobile: string;
  email: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
};