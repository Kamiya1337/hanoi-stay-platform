# 🚀 HANOI STAY - Simple Property & Cashflow Management Platform

**HANOI STAY** is a simple internal management web app (Micro-SaaS) built to help landlords manage room rentals in Hanoi. It solves real daily problems like tracking monthly income/expenses, managing empty rooms, and keeping tenant contracts organized without using confusing Excel sheets.

I built this project with a practical mindset: **Focus on cashflow, stop financial loss, and save time for landlords.**

## 🛠️ Tech Stack

* **Front-end:** Next.js 14 (App Router) - Fast, clean routing, easy to scale.
* **Language:** TypeScript - Type-safe, helps avoid bugs when calculating money.
* **Back-end & Database:** Supabase (PostgreSQL) - Powerful database with Row Level Security (RLS).
* **Styling:** Tailwind CSS - Simple, modern, minimalist UI design.
* **Charts:** Recharts - Shows income and expense data clearly in real-time.

## 🔥 Key Features & Logic

### 1. 5-Level Location Selector

* It maps real rental locations using a 5-step dropdown system: **District → Ward → Building → Floor → Room**.
* When adding a new tenant, selecting a District automatically unlocks the correct Wards, filtering down to the exact available rooms. No more typing wrong addresses.

### 2. Tenant & Rental Rule Management

* Tracks tenant names, phone numbers, and contract end dates. The search bar is optimized to search by Name, Phone, or Room Number instantly.
* **Smart Business Rules:** The app automatically checks the building's policy before saving a contract:
  * *Pet Policy:* If a building bans pets, the "Has Pet" checkbox is disabled.
  * *Bike Capacity:* Tracks **Motorbikes 🏍️** and **Electric Bikes 🔋** separately. If the parking slots are full, it shows a `FULL` warning to prevent safety risks.

### 3. Real-Time Cashflow Chart

* Uses `Promise.all` to fetch income (`invoices`) and costs (`expenses`) at the same time.
* Calculates `Net Profit = Total Income - Total Expenses` for the last 6 months and renders a clean Area Chart. No hardcoded dummy data.

### 4. Data Protection (No Hard Delete)

* To protect past financial history, users cannot easily delete buildings or rooms that have transactions. Instead, they can **Edit** them.
* **Modal Reuse Logic:** The app reuses the "Add New" form for the "Edit Mode" (`isEditMode`, `editId`). This cuts down Front-end code by 40% and keeps past accounting data 100% accurate.

## 🔒 Database Security (Supabase RLS)

To protect the data from unauthorized access via public API keys:

1. **Row Level Security (RLS)** is turned on for all tables (`buildings`, `rooms`, `tenants`, `expenses`, `invoices`).
2. Users can only read, write, or update data rows that belong to their own logged-in user ID (`auth.uid() = user_id`).

## ⚙️ How to Setup and Run Locally

### 1. Prerequisites

* Node.js (v18 or higher)
* A Supabase account and project

### 2. Install Project

To download and install the project dependencies, run these commands in your terminal:

```bash
git clone [https://github.com/Kamiya1337/hanoi-stay-platform.git](https://github.com/Kamiya1337/hanoi-stay-platform.git)
cd hanoi-stay-platform
npm install
```
3. Environment Variables
Create a .env.local file in the root folder and add your Supabase credentials (see .env.example):
- NEXT_PUBLIC_SUPABASE_URL=[https://your-project-id.supabase.co](https://your-project-id.supabase.co)
- NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
4. Run Development Server
To start the application locally, run:

```
bash
npm run dev
```
Now, open http://localhost:3000 with your browser to see the app running.

🗺️ **Future Roadmap**
- **Phase 1 (Current):** Finish core features, fix UI bugs, and optimize the data input speed.
- **Phase 2 (Automation):** Integrate a Python module to auto-scrape tenant leads from public Facebook rental groups directly into the dashboard.
- **Phase 3 (SaaS):** Standardize onboarding and turn it into a subscription product (SaaS) for local landlords.
