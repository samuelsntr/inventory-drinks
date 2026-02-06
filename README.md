# Inventory Drinks

A full-stack inventory management application tailored for beverage stock tracking across multiple warehouses. It provides role-based access, batch operations for checkouts and stock transfers, professional dashboards, printable PDF reports, and robust filtering/search for daily operations.

## Summary

- Track items (code, name, category, condition, price, warehouse) with images and notes.
- Manage stock across warehouses (JAAN, DW) with batch stock transfers.
- Perform batch checkout operations and keep a single-row record per checkout with item details.
- Use date range filtering and search on transfer/checkout history.
- Sort inventory by quantity from the table header.
- View a professional dashboard with key metrics (total quantity, total value, low stock) and recent activity with charts.
- Generate professional PDF reports for checkout and stock transfer batches.
- Role-based permissions: staff, admin, super admin.

## Tech Stack

### Frontend

- React 19, Vite 6
- Tailwind CSS 4
- shadcn/ui + Radix primitives (Dialog, Dropdown, Select, Tabs, Table, Popover, Calendar)
- Axios for API calls
- Recharts for charts (dashboard)
- react-hook-form for forms
- jsPDF + jspdf-autotable for PDF generation

### Backend

- Node.js (Express)
- Sequelize ORM with MySQL (mysql2)
- express-session with connect-session-sequelize for session storage
- Multer + Sharp for image upload/processing
- CORS for local development integration

### Database

- MySQL (default DB name: `inventory_drinks`)
- Sequelize models/tables:
  - `inventory_items` for products
  - `users` for authentication/roles
  - `checkout_batches` for aggregated checkouts
  - `stock_transfer_batches` for aggregated transfers

## Project Structure

- Frontend: `frontend/`
  - Pages: Inventory, Checkout, Stock Transfer, Dashboard
  - UI components and utilities
- Backend: `server/`
  - `server.js` entry, routes, controllers, models, middleware
  - Static folders `/uploads`, optional `/pdfs`

Key files:

- Frontend pages:
  - [Inventory.jsx](file:///d:/My%20Documents/Desktop/inventory-drinks/frontend/src/pages/Inventory.jsx)
  - [Checkout.jsx](file:///d:/My%20Documents/Desktop/inventory-drinks/frontend/src/pages/Checkout.jsx)
  - [StockTransfer.jsx](file:///d:/My%20Documents/Desktop/inventory-drinks/frontend/src/pages/StockTransfer.jsx)
  - [DashboardSummary.jsx](file:///d:/My%20Documents/Desktop/inventory-drinks/frontend/src/components/dashboard/DashboardSummary.jsx)
- PDF utilities:
  - [pdfExport.js](file:///d:/My%20Documents/Desktop/inventory-drinks/frontend/src/lib/pdfExport.js)
- Backend controllers:
  - [inventoryController.js](file:///d:/My%20Documents/Desktop/inventory-drinks/server/controllers/inventoryController.js)
  - [checkoutController.js](file:///d:/My%20Documents/Desktop/inventory-drinks/server/controllers/checkoutController.js)
  - [transferController.js](file:///d:/My%20Documents/Desktop/inventory-drinks/server/controllers/transferController.js)
  - [dashboardController.js](file:///d:/My%20Documents/Desktop/inventory-drinks/server/controllers/dashboardController.js)
- Backend routes:
  - [inventory.js](file:///d:/My%20Documents/Desktop/inventory-drinks/server/routes/inventory.js)
  - [checkout.js](file:///d:/My%20Documents/Desktop/inventory-drinks/server/routes/checkout.js)
  - [transfer.js](file:///d:/My%20Documents/Desktop/inventory-drinks/server/routes/transfer.js)
  - [dashboard.js](file:///d:/My%20Documents/Desktop/inventory-drinks/server/routes/dashboard.js)
  - [auth.js](file:///d:/My%20Documents/Desktop/inventory-drinks/server/routes/auth.js)

## Setup and Running

### Prerequisites

- Node.js 18+ (recommended 20+)
- MySQL 8+ running locally

### Backend Setup

1. Create a MySQL database:
   - Name: `inventory_drinks` (or set your own via env)
2. Create `.env` in `server/`:
   ```
   DB_DEV_USERNAME=root
   DB_DEV_PASSWORD=your_password
   DB_DEV_NAME=inventory_drinks
   DB_DEV_HOST=127.0.0.1
   DB_DEV_PORT=3306
   ```
3. Install dependencies:
   ```
   cd server
   npm install
   ```
4. Start backend:

   ```
   npm run dev
   ```

   - Server runs on `http://localhost:5000`
   - CORS is preconfigured to allow `http://localhost:5173`
   - Note: `express-session` secret is currently set in [server.js](file:///d:/My%20Documents/Desktop/inventory-drinks/server/server.js). For production, set a strong secret and HTTPS cookies.

5. Sequelize sync will auto-create tables based on models.

### Frontend Setup

1. Install dependencies:
   ```
   cd frontend
   npm install
   ```
2. Start frontend:
   ```
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

### Authentication

- Register a user via `POST /api/auth/register` or a frontend register form (if enabled).
- Roles: `staff`, `admin`, `super admin`
  - `admin` and `super admin` can edit items.
  - `super admin` can delete transfer/checkout records (with stock revert logic).

## Features and How to Use

### Inventory

- Browse all items with pagination and search by code/name/category.
- Filter by warehouse using tabs.
- Sort by quantity by clicking the “Quantity” column header.
- Create/Edit/Delete items (depending on role).
- Upload images; files served via `/uploads`.

### Stock Transfer

- Perform batch transfers from one warehouse to another.
- Destination items are created if not present; quantities adjusted atomically.
- History shows one row per batch with total items and quantities.
- Date range filter and search available.
- Detail dialog lists item codes/names/quantities and batch meta.
- Print batch to PDF from the detail dialog.

### Checkout

- Perform batch checkout from JAAN warehouse.
- History aggregates items into a single row per batch with totals.
- Date range filter and search available.
- Detail dialog shows items and totals.
- Print batch to PDF from the detail dialog.
- Deleting a batch (super admin) reverts stock back to warehouse.

### Dashboard

- View total items, total quantity, total value (price × quantity), low-stock count.
- Recent activity merged from transfers and checkouts.
- Charts for recent checkouts.
- Warehouse distribution stats.

## API Overview

- Base: `http://localhost:5000/api`
- Auth: `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `POST /auth/logout`
- Inventory: `GET /inventory` with query params `warehouse`, `search`, `page`, `limit`, `sortBy`, `sortOrder`
- Transfers:
  - `POST /transfer` (batch)
  - `GET /transfer/history` with `search`, `page`, `limit`, `startDate`, `endDate`
  - `DELETE /transfer/:id` (super admin, with revert safety checks)
- Checkouts:
  - `POST /checkout` (batch)
  - `GET /checkout/history` with `search`, `page`, `limit`, `startDate`, `endDate`
  - `DELETE /checkout/:id` (super admin, reverts stock)
- Dashboard: `GET /dashboard/stats`

## Step-by-Step Testing Guide

### 1. Authentication

- Register a user with role `super admin`.
- Login and verify `GET /api/auth/me` returns session info.

### 2. Inventory Management

- Add a new item in JAAN and DW.
- Verify listing appears with correct data and image.
- Use search to filter by code/name/category.
- Click “Quantity” header to sort ascending/descending.
- Edit an item: change price and quantity; verify changes appear.
- Delete an item (admin/super admin).

### 3. Stock Transfer (DW → JAAN or vice versa)

- Open New Transfer, select source/destination.
- Add multiple items by code and quantities.
- Submit and ensure success toast.
- Verify destination stock increased or created; source decreased.
- Check transfer history: single-row batch with totals.
- Open detail dialog; verify items and totals.
- Click “Print PDF”; verify a professional PDF downloads.
- Delete a transfer record (super admin) and ensure stock reverses safely.
- Apply date range filter and verify history updates.

### 4. Checkout (from JAAN)

- Open New Checkout and add multiple items with quantities.
- Submit and ensure success toast.
- Verify inventory in JAAN decreased accordingly.
- Check checkout history: single-row batch with totals.
- Open detail dialog; verify items and totals.
- Click “Print PDF”; verify a professional PDF downloads.
- Delete a checkout record (super admin) and ensure stock reverts to JAAN.
- Apply date range filter and verify history updates.

### 5. Dashboard

- Navigate to Dashboard and verify:
  - Total items, total quantity, total value, low stock are accurate.
  - Recent activity shows latest checkouts/transfers.
  - Charts display last 7 days of checkouts.
  - Warehouse distribution reflects item quantities.

## Troubleshooting

- 500 on `/dashboard/stats`: Ensure table names match (`inventory_items`), and DB has data.
- CORS/session issues: Start backend first, keep origin at `http://localhost:5173`, enable credentials.
- MySQL connection: Check `.env` credentials and that DB `jaan_rest` exists.
- PDF export not downloading: Confirm jsPDF and jspdf-autotable are installed in `frontend/package.json`.
- Image upload fails: Verify write permissions to `server/uploads` and ensure Multer setup is active.

## Security Notes

- Replace the session secret in `server/server.js` with a strong secret.
- Use HTTPS and secure cookies in production (`cookie.secure: true`).
- Restrict deletion routes to `super admin` (already enforced).

## Future Enhancements

- Role-based UI gating and audit logs.
- Inventory valuation by warehouse and time.
- Export features for inventory list and dashboard snapshots.
- Comprehensive unit/integration tests and CI pipeline.
