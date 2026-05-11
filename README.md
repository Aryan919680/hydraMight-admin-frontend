# Welcome to your Lovable project

TODO: Document your project here

## Backend connection added

This UI is now connected to the Node.js/Express backend.

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Set:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_DEFAULT_LOCATION_ID=PASTE_SERVICE_LOCATION_UUID_OPTIONAL
```

Run:

```bash
npm install
npm run dev
```

Login uses:

```text
POST /api/auth/login
```

Product CMS uses:

```text
GET /api/admin/categories
POST /api/admin/categories
GET /api/admin/products
POST /api/admin/products
PUT /api/admin/products/:id
```

Before adding a product, make sure at least one row exists in `service_locations`, because product price and inventory are location based.
