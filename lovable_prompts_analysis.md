# Lentil Factory ERP Analysis & Refinement

## System Overview
Your system successfully addresses the core functionality of a Lentil Processing & Distribution Factory:
1.  **Public Frontend:** Basic landing page (`/`, `/about`, `/contact`).
2.  **Customer Portal:** Enables factory customers to view profiles, observe outstanding balances, and create **Online Orders** via login.
3.  **ERP Dashboard:** Staff access restricted area covering purchasing, batch-tracking, processing/waste handling, sales mapping, checking finances (book-keeping and banking), and managing ledgers.

## Identified Missing Features & Improvements
Based upon your constraints and restructure requirements, here is an analysis of what needs changing in your existing system, mapped out as prompts to pass into Lovable.

---

### Step 1: Database Realignment (Supabase)
The previous database configuration provided to you by Claude contained circular reference errors (specifically around `inventory_batches` and `processing_records`).
> [!NOTE] 
> I have created a fully corrected SQL file in your project directory at `d:\web_develop_project\QAISFOODS\supabase_corrected_schema.sql`. You can copy that entire file into the Supabase SQL editor and run it safely. It enforces constraints sequentially so it does not error.

---

### Step 2: System UI & Logic Restructure (Lovable Prompts)
To restructure the frontend via Lovable without breaking the visual design, use the following prompts sequentially:

#### **Prompt 1: Removing Legacy Manufacturing Logic & Implementing Batches**
**Target:** Lovable Chat
> "I need to completely restructure the Inventory module to a BATCH system while keeping the current visual design and color theme intact. First, remove the entire 'Processing' and 'Packaging' modules from the codebase. Delete any manufacturing metrics like 'efficiency %', 'waste kg' (except in the standalone waste records), 'high/low quality kg', and remove 'packaged inventory' from the Dashboard. 
> Second, refactor the `Inventory` page. Each item must represent a single Batch. The table columns should strictly be: Item Name, Grade (A+, A, B, C dropdown), Vendor (linked), Purchase Price/kg (PKR), Quantity (kg), Remaining Quantity (kg, auto-calculated), Purchase Date, Batch Ref (auto-generated), and Notes. 
> Most importantly: the same item (e.g. Masoor A+) from different vendors or different prices MUST render as separate rows. Provide filtering by Item Name, Grade, Vendor, Date Range, and add a search bar. Add three summary cards at the top: Total Unique Items, Total Stock Value (sum of remaining * price), and Low Stock Alerts (items < 100kg Remaining). Replace all hardcoded/dummy data with empty states showing 'Add First Record' buttons."

#### **Prompt 2: Restructure Dashboard & Introduce Ledgers**
**Target:** Lovable Chat
> "Next, I need to restructure the Dashboard and implement the Ledgers. Update the Dashboard layout to have 3 rows. Row 1 (4 cards): Today's Cash Balance (opening + in - out), Total Receivables, Total Payables, Pending Cheques (count & amount). Row 2 (3 cards): Total Inventory Value (PKR), Pending Advance Booking Deliveries (count), Low Stock Alerts (count). Row 3: Two side-by-side tables for 'Recent Sales' (last 5) and 'Upcoming Advance Booking Deliveries' (next 5).
> Ensure all financial values display in PKR format (e.g. PKR 1,500,000) and weights in kg.
> Now, create a new `CustomerLedger` page and update the `VendorLedger` page. They should have identical layouts: a selector at the top, a profile summary, and a detailed table with columns: Date, Transaction Type, Description, Debit, Credit, Balance. Provide a running balance calculated row-by-row, and total summaries at the bottom, along with a date filter and Export/Print button. Use React Context/Zustand custom hooks (e.g., `useCustomers`, `useLedger`) for all data flow. Do not touch styling."

#### **Prompt 3: Sales, Cash Flow, and Advance Bookings Revamp**
**Target:** Lovable Chat
> "Finally, update the Sales, Daily Cash Flow, and Advance Bookings modules. 
> For **Sales**: A sale record must allow adding multiple items. The user should select from existing Inventory Batches (showing item name, grade, vendor, available qty). Upon saving a sale, standard logic must fire: deduct quantity from the selected batch, calculate total, track amount paid vs outstanding, update the Customer's Ledger balance, and optionally record standard cash payments into the daily Cash Flow.
> For **Advance Bookings**: Treat these as contracts. Bookings have Expected Delivery Dates, Total Values, Advances Paid, Remaining Balances, and Status (Booked, Partially Paid, Delivered, Completed, Cancelled). Create a detail page for Bookings with a 'Record Payment' and 'Mark as Delivered' button. Clicking 'Mark as Delivered' must automatically inject the booked items as new Batches into the Inventory module.
> For **Daily Cash Flow**: Create a rigid Day Opening/Closing mechanic. The day starts OPEN with an Opening Balance. Users add 'Cash In' or 'Cash Out' entries with categories. Provide a 'Close Day' button that locks the day's entries and rolls the closing balance into tomorrow's opening balance. Closed days must show a lock icon and be un-editable. Use custom hooks (`useSales`, `useBookings`, `useCashFlow`) for logic separation. Make sure all tables are paginated."

---

### Analysis Summary 
By submitting these prompts sequentially to Lovable:
1. You prevent the AI from overwriting too many files at once (which usually causes context breaks).
2. You successfully shift from a generic Item inventory to a **Batch-based** inventory.
3. You map out the exact UI transformations required for Dashboard accounting, strict closing cash flows, and proper ledgers without losing the core design.
