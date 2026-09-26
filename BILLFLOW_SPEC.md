# BillFlow POS — Web Application Specification & Architecture

## 1. Overview
**BillFlow** is configured for **Pasumai Cafe** ("100% organic food since 2012") — a millet-focused organic restaurant and cafe. It is built to work seamlessly offline, support direct receipt printing (Web Bluetooth ESC/POS + Browser thermal print), provide fast cart & order management, and sync with future backend services. Categories include **Tiffin, Lunch, Snacks, Special, and Sweets**.

---

## 2. Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Framework** | **React 19 + Vite** | High performance, instant HMR, PWA ready |
| **Language** | **TypeScript** | Type-safe financial calculations and models |
| **Styling** | **Tailwind CSS + Custom Tokens** | Stitch `DESIGN.md` tokens (Teal primary `#0F766E`, Amber accent `#F59E0B`) |
| **State Management** | **Zustand** | Lightweight, reactive cart, active order & session stores |
| **Local Storage / Offline** | **IndexedDB via Dexie.js** | High capacity, indexed local queries for bills, items & customers |
| **Icons & Visuals** | **Lucide React** | Clean, modern iconography for POS touchscreen & desktop |
| **Printing** | **Web Bluetooth (ESC/POS)** + **window.print() 58mm/80mm** | Direct thermal printing + cross-platform fallback |
| **Reports & Analytics** | **Recharts / SVG Charts** | Daily sales, category breakdown, payment methods analysis |

---

## 3. High-Level Architecture

```
┌────────────────────────────────────────────────────────┐
│                   BillFlow Web UI                      │
│   (Touch-friendly POS Grid, Cart, Payment, History)    │
└───────────────────────────┬────────────────────────────┘
                            │
               ┌────────────┴────────────┐
               │    Zustand Stores       │  (Cart, Session, Active Order, UI)
               └────────────┬────────────┘
                            │
               ┌────────────┴────────────┐
               │    Local-First Layer    │  (Dexie.js IndexedDB)
               │    - itemsRepo          │  - billsRepo
               │    - customersRepo      │  - syncQueue
               └────────────┬────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
┌───────────────────────┐             ┌─────────────────────────┐
│     Printing Subsys   │             │   Future Cloud Backend  │
│  - Web Bluetooth GATT │             │  - REST / Supabase API  │
│  - ESC/POS Builder    │             │  - Background Sync      │
│  - Browser Thermal CSS│             │  - Multi-device Sync    │
└───────────────────────┘             └─────────────────────────┘
```

---

## 4. Key Entities & Data Models

### Item
- `id`: string (UUID)
- `name`: string
- `code`: string (Barcode / SKU)
- `category`: string
- `price`: number
- `taxPercent`: number
- `isVeg`: boolean (optional, food service)
- `active`: boolean
- `trackStock`: boolean
- `stockQty`: number
- `lowStockAlert`: number
- `photoUrl`: string (optional)

### Bill & BillLine
- `BillLine`:
  - `itemId`: string
  - `name`: string
  - `price`: number
  - `qty`: number
  - `taxPercent`: number
  - `note`?: string
- `Bill`:
  - `id`: string
  - `billNo`: number
  - `timestamp`: number
  - `lines`: BillLine[]
  - `subtotal`: number
  - `discount`: number
  - `tax`: number
  - `total`: number
  - `paymentMode`: 'Cash' | 'UPI' | 'Card' | 'Credit'
  - `status`: 'Paid' | 'Unpaid' | 'Cancelled'
  - `table`?: string
  - `orderType`: 'Dine-in' | 'Takeaway' | 'Delivery'
  - `customerId`?: string
  - `customerName`?: string
  - `cashierId`?: string
  - `cancelReason`?: string
  - `synced`: boolean

### Customer
- `id`: string
- `name`: string
- `phone`: string
- `outstanding`: number
- `loyaltyPoints`: number
- `createdAt`: number
