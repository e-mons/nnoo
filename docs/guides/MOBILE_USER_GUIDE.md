# 📱 NNOO Mobile Application — Complete User & Testing Guide (A to Z)

Document ID: `MOB-USER-GUIDE-01`  
Governance Version: `1.0.0`  
Last Updated: `2026-08-21`  
Status: **Authoritative Mobile User & Step-by-Step Testing Guide**

---

## 🎒 Part 0: Getting Started (What You Need on Your Phone)

Before you begin testing:
1. **Your Smartphone** (Android or iPhone).
2. **The "Expo Go" App** installed on your phone (download free from Google Play Store or Apple App Store).
3. **Start the App on Your Computer**:
   - Open your terminal in the project directory and run:
     ```bash
     pnpm run dev:mobile
     ```
   - A QR code will display in the terminal.
   - Open **Expo Go** on your phone (or Camera on iPhone) and **scan the QR code**.
   - The NNOO mobile app will bundle and open on your device screen.

---

## 🌟 Stage 1: Creating Your Account & Your First Business (Tranche 1)

### 1.1 Welcome & Sign Up
- **Steps:**
  1. Look at your phone screen; you will see the **NNOO Welcome Screen**.
  2. Tap the green **"Create Account"** button.
  3. Enter your **Full Name** (e.g., *David Bako*).
  4. Enter your **Email Address** (use a real email inbox you can open).
  5. Enter a **Password** (minimum 8 characters).
  6. Tap **"Sign Up"**.
- **What you will see:** A screen requesting your **6-digit verification code**.
- **Verification:** Open your email inbox, copy the 6-digit code from NNOO, enter it into the code inputs, and tap **"Verify"**. You will transition directly into Business Onboarding.

---

### 1.2 Business Onboarding: Setting Up Your Shop
- **Steps:**
  1. Enter your **Business Name** (e.g., *Bako Supermarket & Electronics*).
  2. Choose your **Industry** (e.g., *Retail / Supermarket*).
  3. Ensure currency is set to **NGN (₦ - Nigerian Naira)**.
  4. Enter your **City and State** (e.g., *Ikeja, Lagos*).
  5. Tap the green **"Complete Setup"** button.
- **Verification:** You land directly on the **Main Business Dashboard** with your shop name in the top header.

---

## 📦 Stage 2: Adding Goods, Customers & Suppliers (Tranche 1 & 2)

### 2.1 Adding Products & Services (Items to Sell)
- **Steps:**
  1. Look at the bottom navigation bar and tap the **"More"** tab (with the grid icon).
  2. Under the **"Operations & Finance"** section, tap **"Products & Services"**.
  3. You will see a list of your items with filter tabs (**All**, **Products**, **Services**, **Stock Tracked**).
  4. Look at the bottom right corner of your screen and tap the green **"+" (Plus Floating Action Button)**.
  5. Fill in details for your first item:
     - **Item Type**: Keep **Product** selected (or choose Service if you sell services).
     - **Product Name**: `Basmati Rice 5kg`
     - **Description**: `Premium long-grain 5kg bag`
     - **Unit**: Type `bag` (or select item/pcs).
     - **SKU**: `RICE-5KG` (optional).
     - **Selling Price (₦)**: `15,000`
     - **Cost Price (₦)**: `12,000`
     - **Track Inventory Stock**: Make sure the switch is turned **ON** (green).
  6. Tap the green **"Save Item"** button at the bottom.
  7. Repeat the steps to add a second product:
     - **Product Name**: `Smartphone Fast Charger`
     - **Unit**: `pcs`
     - **Selling Price (₦)**: `5,000`
     - **Cost Price (₦)**: `3,000`
     - **Track Inventory Stock**: **ON**
  8. Tap **"Save Item"**.
- **Verification:** Both items appear on your Products list with their selling prices and icons!

---

### 2.2 Adding Suppliers (Vendors Who Supply You Goods)
- **Steps:**
  1. Go back to the **"More"** tab at the bottom.
  2. Under **"Operations & Finance"**, tap **"Suppliers"**.
  3. Look at the bottom right corner and tap the green **"+" (Plus Floating Action Button)**.
  4. Fill in:
     - **Supplier Type**: Select **Business** (or Individual).
     - **Supplier / Company Name**: `Lagos Wholesale Distributors`
     - **Contact Person**: `Alhaji Musa`
     - **Phone Number**: `08012345678`
     - **Email Address**: `wholesaler@lagos.com`
     - **Address**: `Alaba International Market`
     - **City & State**: `Ojo, Lagos`
  5. Tap the green **"Save Supplier"** button.
- **Verification:** Your supplier card appears in the list showing `₦0.00 Outstanding Debt`.

---

### 2.3 Adding Customers (People Who Buy from You)
- **Steps:**
  1. In the **"More"** menu, tap **"Customers"**.
  2. Tap the green **"+" (Plus Floating Action Button)** at the bottom right corner.
  3. Fill in:
     - **Customer Type**: Select **Individual** (or Business).
     - **Customer Name**: `Chief Emeka Okafor`
     - **Phone Number**: `08098765432`
     - **Email Address**: `emeka@example.com`
     - **Address**: `14 Victoria Island Way, Lagos`
  4. Tap the green **"Save Customer"** button.
- **Verification:** Chief Emeka Okafor appears on your customer list with a `₦0.00` balance.

---

### 2.4 Stock Receipts (Receiving Inventory from Suppliers)
- **Steps:**
  1. Tap the **"Inventory"** tab on the bottom navigation bar (the box icon 📦).
  2. Look at the top right corner of the header and tap the **"Receipts"** button (with the truck icon 🚚).
  3. You will see the Stock Receipts screen. Tap the green **"+" (Plus Floating Action Button)** at the bottom right corner.
  4. Tap **"Select Supplier"** $\to$ Choose `Lagos Wholesale Distributors`.
  5. Under "Supplier Invoice / Reference", type `INV-9021`.
  6. Tap **"+ Add Product / Item"** $\to$ Select `Basmati Rice 5kg`.
  7. Set **Quantity Received**: `20`.
  8. Check **Unit Cost**: `₦12,000` (Total automatically equals `₦240,000`).
  9. Under "Payment Mode", choose **Cash** (or Bank Transfer / Unpaid Supplier Credit).
  10. Tap the big green **"Confirm Stock Receipt"** button.
- **Verification:**
  - Return to the main **"Inventory"** tab.
  - Notice `Basmati Rice 5kg` now clearly displays **20 in stock**!

---

## 💰 Stage 3: Point of Sale, Sales, Invoices & Returns (Tranche 1 & 2)

### 3.1 Making a Normal Cash Sale (Point of Sale)
- **Steps:**
  1. Tap the **"Sales"** tab at the bottom.
  2. Tap the green **"+ New Sale"** button.
  3. Tap on `Basmati Rice 5kg` and set Quantity to `2`.
  4. Notice total automatically equals `₦30,000`.
  5. Select Payment Method: **Cash**.
  6. Under "Cash Tendered", enter `40,000`.
  7. Notice automatic calculation of **Change: ₦10,000**.
  8. Tap **"Complete Sale"**.
- **Verification:** Green success screen appears with sale number (e.g., `ORD-2026-0001`). Tap **"Share Receipt"** to open native share sheet with formatted receipt text.

---

### 3.2 Selling on Credit (Accounts Receivable)
- **Steps:**
  1. Tap **"+ New Sale"** again.
  2. Select Customer: `Chief Emeka Okafor`.
  3. Add `Smartphone Fast Charger` (Quantity: `2` = `₦10,000`).
  4. Select Payment Method: **Credit / Pay Later (Unpaid)**.
  5. Tap **"Complete Sale"**.
- **Verification:**
  - Navigate to **More $\to$ Customers $\to$ Chief Emeka Okafor**.
  - Outstanding balance displays **₦10,000 Balance Due**.
  - Sales history displays orange **"Unpaid"** badge.

---

### 3.3 Collecting Payment for a Credit Sale
- **Steps:**
  1. Open the `₦10,000` unpaid sale from the Sales list.
  2. Tap the green **"Record Payment"** button.
  3. Amount: `10,000`.
  4. Method: **Bank Transfer**.
  5. Tap **"Confirm Payment"**.
- **Verification:**
  - Badge switches from orange **Unpaid** to green **Paid**.
  - Chief Emeka’s customer balance clears to `₦0.00`.

---

### 3.4 Processing a Customer Return (Refund & Restock)
- **Steps:**
  1. Open the first `₦30,000` cash sale.
  2. Tap **"Issue Refund"** at the bottom.
  3. Select `1` bag of Basmati Rice.
  4. Check the box **"Restock returned items back into inventory"**.
  5. Tap **"Process Refund (₦15,000)"**.
- **Verification:**
  - Sale displays red badge: **"Partial Refund"**.
  - Inventory for Basmati Rice automatically regains 1 bag in stock.

---

### 3.5 Creating & Exporting Official Invoices (PDF)
- **Steps:**
  1. Tap the **"Invoices"** tab at the bottom.
  2. Tap **"+ Create Invoice"**.
  3. Select Customer: `Chief Emeka Okafor`.
  4. Set Due Date: Select a date next week.
  5. Add Item: `Smartphone Fast Charger` (Quantity: `4` = `₦20,000`).
  6. Tap **"Save Draft"**.
  7. Open the draft and tap **"Issue Official Invoice"**.
  8. Once issued, tap the **"View / Export PDF"** button.
- **Verification:** Your device opens the official NNOO Invoice PDF with full business branding, customer details, line items, and totals.

---

## 💸 Stage 4: Recording Expenses & Settling Supplier Bills (Tranche 2)

### 4.1 Recording a Daily Expense (Paid Cash)
- **Steps:**
  1. Tap **"More"** $\to$ **"Expenses"**.
  2. Tap **"+ New Expense"**.
  3. Fill in:
     - **Category**: `Generator Fuel & Diesel`
     - **Amount**: `7,500`
     - **Payment Method**: `Cash`
     - **Description**: `25 Litres diesel for generator`
  4. Tap **"Save Expense"**.
- **Verification:** Expense appears on list, and Operating Expenses on the Dashboard increases by `₦7,500`.

---

### 4.2 Recording an Unpaid Supplier Bill (Accounts Payable)
- **Steps:**
  1. Tap **"+ New Expense"**.
  2. Fill in:
     - **Category**: `Shop Rent & Facility`
     - **Amount**: `50,000`
     - **Supplier**: `Lagos Wholesale Distributors`
     - **Payment Status**: Choose **"Unpaid / Pay Later"**.
  3. Tap **"Save Expense"**.
- **Verification:**
  - Check **More $\to$ Suppliers $\to$ Lagos Wholesale Distributors** $\to$ Displays **₦50,000 Outstanding Debt**.
  - Open the bill and tap **"Settle Bill"** $\to$ Enter `50,000` $\to$ Debt settles to `₦0.00`.

---

## 📊 Stage 5: Live Financial Reports & Accounting (Tranche 2)

- **Steps:**
  1. Tap the **"More"** tab at the bottom right $\to$ Under **"System & Configuration"**, tap **"Reports"**.
  2. Inspect each of the 6 reports:
     - 📈 **Sales & Revenue Report**: Total transactions, cash collected, and credit receivables.
     - 📊 **Profitability (P&L)**: Net Sales minus Cost of Goods Sold = **Gross Profit**, minus Operating Expenses = **Net Operating Result**.
     - 💳 **Operating Expenses Report**: Category breakdown of all operational spending.
     - 📄 **Accounts Receivable Report**: Customer credit balances and debt aging summary.
     - ⏰ **Accounts Payable Report**: Unsettled supplier vouchers and payment liabilities.
     - 📦 **Inventory Valuation Report**: Total current holding asset value in warehouse.
- **Verification:** All financial reports compute real-time double-entry figures derived from entered transactions.

---

## 🤖 Stage 6: AI Superpowers & Smart Intelligence (Tranche 3)

### 6.1 "Ask NNOO" Business AI Assistant
- **Steps:**
  1. Tap the **"More"** tab $\to$ Under **"Intelligence & AI"**, tap **"Ask NNOO"** (or tap the Ask NNOO quick card on the Home dashboard).
  2. In the chat box, type questions such as:
     > *"How much gross profit did I make today?"*  
     > *"Which of my products has the lowest stock right now?"*
  3. Tap Send.
- **Verification:** The AI returns accurate answers matching your real database figures.

---

### 6.2 AI Bookkeeper (Human-in-the-Loop Reviews)
- **Steps:**
  1. Tap **"More"** $\to$ Under **"Intelligence & AI"**, tap **"AI Bookkeeper"**.
  2. Tap on any pending classified transaction item.
  3. Read the AI classification explanation and confidence level.
  4. Tap **"Confirm"** to post to ledger or **"Reject"** to dismiss with zero mutations.
- **Verification:** Confirmed transactions write balancing journal entries to your ledger.

---

### 6.3 Business Health Score & AI Diagnostics
- **Steps:**
  1. Tap **"More"** $\to$ Under **"Intelligence & AI"**, tap **"Business Health"** (or tap the Health card on Home).
  2. View the circular score gauge (e.g., `85 / 100 - GOOD`).
  3. View dimension breakdown bars (Liquidity, Profitability, Inventory).
  4. Tap **"Generate AI Explanation"** for Gemini executive diagnostics.
  5. Tap **"Recalculate Score"** to refresh.
- **Verification:** Deterministic scores and Gemini diagnostics render without errors.

---

### 6.4 Verified Credit Passport & Tamper-Proof PDF
- **Steps:**
  1. Tap **"More"** $\to$ Under **"Intelligence & AI"**, tap **"Credit Passport"** (or tap Credit Passport on Home).
  2. Tap **"Generate Passport"** (if first time).
  3. Tap **"Download Official PDF"** $\to$ Opens official certificate with SHA-256 integrity seal.
  4. Tap **"Share Verification Link"** $\to$ Native share sheet opens with public verification URL.
- **Verification:** Certificate renders cleanly with valid integrity hash.

---

## 👥 Stage 7: Team, Billing, Notifications & Settings (Tranche 3 & 4)

### 7.1 Inviting Staff Members
- **Steps:**
  1. Tap **"More"** $\to$ Under **"System & Configuration"**, tap **"Team & Roles"**.
  2. Tap **"+ Invite Staff"**.
  3. Enter Email: `cashier@mybusiness.com`.
  4. Select Role: **Cashier** (or Manager / Auditor / Bookkeeper).
  5. Tap **"Generate Invitation"**.
- **Verification:** Native share sheet opens with cryptographic invitation deep-link.

---

### 7.2 Upgrading Subscription via Paystack
- **Steps:**
  1. Tap **"More"** $\to$ Under **"System & Configuration"**, tap **"Billing"**.
  2. Select the **"Growth Pro"** plan.
  3. Tap **"Subscribe with Paystack"** $\to$ Secure Paystack checkout opens.
  4. Complete payment and tap **"Confirm Payment"**.
- **Verification:** Plan status updates to active **Growth Pro**.

---

### 7.3 Notifications & Multi-Business Switching
- **Steps:**
  1. Tap the **Bell Icon 🔔** in the top header (or go to **More $\to$ Notifications**) $\to$ View alerts $\to$ Tap **"Mark All as Read"**.
  2. On the home dashboard, tap your **Business Name** at the very top $\to$ Tap **"+ Create Another Business"**.
  3. Switch between businesses.
- **Verification:** Data for each business remains 100% isolated with PostgreSQL Row-Level Security.

---

## 🎯 Verification Checklist

| # | Feature / Workflow | Expected Result | Status |
|---|---|---|:---:|
| 1 | Sign Up & OTP Verification | Verified account created | ✅ |
| 2 | Business Setup / Onboarding | Profile stored & Dashboard loaded | ✅ |
| 3 | Products & Categories | Items listed with live stock | ✅ |
| 4 | Suppliers & Customers | Directory created with ₦0 debt | ✅ |
| 5 | Stock Receipt | Stock count increased & cost logged | ✅ |
| 6 | Normal Cash POS Sale | Change computed & receipt shared | ✅ |
| 7 | Credit Sale | Customer balance & unpaid badge updated | ✅ |
| 8 | Settle Credit Sale | Payment applied & balance cleared | ✅ |
| 9 | Refund & Restock | Money refunded & item restocked | ✅ |
| 10 | Official Invoice PDF | PDF generated and opened | ✅ |
| 11 | Expenses & Unpaid Bills | Operating expenses and AP logged | ✅ |
| 12 | 6 Financial Reports | Real-time P&L, aging, and valuation | ✅ |
| 13 | Ask NNOO AI Assistant | Real database answers returned | ✅ |
| 14 | AI Bookkeeper | Suggestion review and ledger posting | ✅ |
| 15 | Business Health Score | Circular gauge & AI explanation | ✅ |
| 16 | Credit Passport & PDF | Certified PDF downloaded | ✅ |
| 17 | Staff Invitation | Cryptographic share sheet generated | ✅ |
| 18 | Paystack Plan Upgrade | Subscription activated | ✅ |
| 19 | Multi-Business Switching | Isolated tenant switching | ✅ |
