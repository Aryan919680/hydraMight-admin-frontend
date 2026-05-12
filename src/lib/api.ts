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

export type CreateProductPayload = {
  category_id: string;
  name: string;
  sku?: string;
  short_description?: string;
  description?: string;
  brand?: string;

  portal_type?: string;
  quantity_value?: number;
  quantity_unit?: string;

  unit?: string;
  weight?: number | null;
  is_featured?: boolean;

  location_inventory: {
    location_id: string;
    mrp: number;
    selling_price: number;
    available_stock: number;
    reserved_stock?: number;
    min_stock_level?: number;
  }[];

  images?: {
    image_url: string;
    storage_bucket?: string;
    storage_path?: string;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
    alt_text?: string;
  }[];
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
  city: string;
  state: string;
  pincode: string;
  latitude?: number | null;
  longitude?: number | null;
  radius_km?: number | null;
  is_active: boolean;
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
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
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

  getProducts: (limit = 100, offset = 0) =>
    request<AdminProduct[]>(`/admin/products?limit=${limit}&offset=${offset}`),

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

    if (!response.ok) {
      throw new Error(data.message || "Failed to upload image");
    }

    return data as {
      success: boolean;
      image_url: string;
    };
  },

 getMainInventory: () => request("/admin/inventory/main"),

getLocationInventory: (locationId?: string) =>
  request(
    locationId
      ? `/admin/inventory/location?location_id=${locationId}`
      : "/admin/inventory/location"
  ),

getInventory: () => request("/admin/inventory/location"),

updateInventory: (
  id: string,
  payload: {
    available_stock?: number;
    reserved_stock?: number;
    min_stock_level?: number;
    remarks?: string;
  }
) =>
  request(`/admin/inventory/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }),

deleteInventory: (id: string) =>
  request(`/admin/inventory/${id}`, {
    method: "DELETE",
  }),

bulkUploadInventory: async (file: File) => {
  const token = localStorage.getItem("admin_token");

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/admin/inventory/bulk-upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Bulk inventory upload failed");
  }

  return data;
},

  getLocations: () => request("/admin/locations"),

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
};
