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

bulkUploadMainInventory: async (file: File) => {
  const token = localStorage.getItem("admin_token");

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE_URL}/admin/main-inventory/bulk-upload`,
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
};

export type CommercialSignup = {
  id: string;
  full_name?: string;
  email?: string;
  mobile?: string;
  company_name?: string;
  gst_number?: string;
  business_type?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status: "pending" | "approved" | "rejected";
  admin_remarks?: string | null;
  created_at?: string;
  [key: string]: any;
};
