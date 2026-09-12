# Complete Beginner’s Step-by-Step Guide: Running & Testing NNOO Web Locally

Document ID: `LOCAL-TEST-GUIDE-01`  
Project: **NNOO — Africa’s AI Business Operating System**  
Target Audience: **Beginners & First-Time Operators (Zero Technical Experience Required)**

---

## 🧭 The Big Picture (What We Are Doing)

Think of NNOO like a high-tech digital store:
1. **Your Computer Screen (Frontend):** The website you see and click on in your browser.
2. **The Filing Cabinet (Supabase Database):** Where your users, products, sales, and money numbers are stored securely.
3. **The Smart Helper (Google Gemini AI):** The AI brain that reads receipts, suggests bookkeeping categories, and answers business questions.
4. **The Card Machine (Paystack):** The system that handles monthly subscription payments in Test Mode (using fake play money).

All we need to do is plug in a few **Secret Keys** (like passwords for services) into one configuration file, press **Start**, and open the browser.

---

## 📋 Step 1: Make Sure Your Computer Has the Required Tools

Before we start, your computer needs two free software tools installed:

### 1. Node.js (The Engine)
* **What it is:** The engine that runs modern websites on your computer.
* **Where to get it:** Go to [https://nodejs.org](https://nodejs.org)
* **What to do:** Download the **LTS (Recommended for Most Users)** version and install it (just click *Next, Next, Finish*).
* **How to check:** Open your terminal (PowerShell or Command Prompt) and type:
  ```bash
  node -v
  ```
  *(You should see a version number like `v24.x.x` or `v22.x.x`).*

### 2. pnpm (The Package Manager)
* **What it is:** The tool that downloads and organizes all the project files and building blocks.
* **How to install it:** Open your terminal and run this command:
  ```bash
  npm install -g pnpm
  ```
* **How to check:** Run:
  ```bash
  pnpm -v
  ```
  *(You should see a version number like `11.x.x` or `9.x.x`).*

---

## 🔑 Step 2: Get Your Free API Keys & Passwords (With Direct Links)

We need keys from **3 services** (all 100% free for testing).

---

### Service 1: Supabase (Your Database & Login Engine)
* **Website:** [https://supabase.com](https://supabase.com)
* **Cost:** 100% Free tier available.

#### Step-by-step instructions to get your Supabase keys:
1. Go to [https://supabase.com](https://supabase.com) and click **"Start your project"** / **"Sign In"**.
2. If you already have the NNOO project (`hoorlxgtnamwdxszsbwt`), click on it. Otherwise, click **"New Project"**, give it a name (e.g., `nnoo-dev`), pick a password, and select your nearest region.
3. On the left-hand sidebar, scroll to the bottom and click the **Settings Gear Icon ⚙️**.
4. In the settings menu, click **"API"**.
5. You will see three important things:
   - **Project URL:** Looks like `https://abcdefghijklm.supabase.co` $\to$ *Copy this*.
   - **Project API Keys $\to$ `anon` / `public`:** A long text string $\to$ *Copy this*.
   - **Project API Keys $\to$ `service_role` (secret):** Click "Reveal" and copy this long text string $\to$ *Copy this*.
6. **Set Login Redirects:**
   - In the left sidebar, click **Authentication** (person icon) $\to$ **URL Configuration**.
   - Set **Site URL** to: `http://localhost:3000`
   - In **Redirect URLs**, click **"Add URL"** and add: `http://localhost:3000/**`
   - Click **Save**.

---

### Service 2: Google Gemini AI (The Smart Brain for Bookkeeping)
* **Website:** [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
* **Cost:** 100% Free.

#### Step-by-step instructions to get your Gemini key:
1. Open [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) in your browser.
2. Sign in with any personal or work Google/Gmail account.
3. Click the blue button that says **"Create API key"** (or **"Get API key"**).
4. Choose **"Create API key in new project"** (or select an existing project).
5. A popup will show a key that starts with `AIzaSy...`. Click **"Copy"**.
6. Keep this key handy!

---

### Service 3: Paystack (Test Payment Gateway for Subscriptions)
* **Website:** [https://dashboard.paystack.com/signup](https://dashboard.paystack.com/signup)
* **Cost:** 100% Free Sandbox / Test Mode.

#### Step-by-step instructions to get your Paystack Test keys:
1. Go to [https://dashboard.paystack.com/signup](https://dashboard.paystack.com/signup) and create a free account (select Nigeria / NGN).
2. Once inside your dashboard, look at the top-left toggle and make sure it says **"Test Mode"** (NOT Live Mode).
3. On the left-hand sidebar, click **Settings ⚙️** $\to$ click the **"API Keys & Webhooks"** tab.
4. You will see:
   - **Test Secret Key:** Starts with `sk_test_...` $\to$ Click to copy.
   - **Test Public Key:** Starts with `pk_test_...` $\to$ Click to copy.

---

## 📝 Step 3: Put Your Keys into the Configuration File

NNOO reads your keys from a file called `.env.local` inside the `apps/web` folder.

1. Open your project in VS Code: [apps/web/.env.local](file:///c:/Users/H-P/Desktop/nnoo/apps/web/.env.local)
2. Replace the entire content of `apps/web/.env.local` with the template below, pasting in your real keys:

```env
# ==============================================================================
# NNOO LOCAL WEB TESTING CONFIGURATION (.env.local)
# ==============================================================================

# 1. Environment Mode
NNOO_ENV=development
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 2. Supabase Backend (From Step 2, Service 1)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# 3. Paystack Test Billing (From Step 2, Service 3)
PAYSTACK_SECRET_KEY=sk_test_your_paystack_test_secret_key_here
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_test_public_key_here
PAYSTACK_ENVIRONMENT=test

# 4. Google Gemini AI Engine (From Step 2, Service 2)
GEMINI_API_KEY=AIzaSy_your_gemini_api_key_here
GEMINI_MODEL_DEFAULT=gemini-3.6-flash
AI_ENABLED=true
AI_TIMEOUT_MS=15000
AI_MAX_RETRIES=2

# 5. Background Channels (Keep false for local web testing)
WHATSAPP_ENABLED=false
```

3. **Save the file** (`Ctrl + S`).

---

## 🚀 Step 4: Start the Application!

Now you are ready to launch!

### 1. Open Terminal in the Project Root:
Open PowerShell or your terminal and ensure you are in the project folder:
```powershell
cd c:\Users\H-P\Desktop\nnoo
```

### 2. Install Dependencies (First time only):
```powershell
pnpm install
```
*(This will ensure all packages and libraries are downloaded to your computer).*

### 3. Start the Web Server:
```powershell
pnpm run dev:web
```

You will see output that looks like:
```text
  ▲ Next.js 16.3.0 (Turbopack)
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 1200ms
```

### 4. Open Your Web Browser:
Open Chrome, Edge, or Firefox and go to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Step 5: How to Test Every Feature in the App

Here is a quick tour to test all the features like a pro:

### 1. Create Your Business Account
1. On `http://localhost:3000`, click **"Get Started"** or **"Sign In"**.
2. Click **"Sign Up"** and enter your email and a password.
3. Follow the onboarding screen: Give your business a name (e.g., *“Apex Supermarket”*) and select your industry.

### 2. Add Products & Track Inventory (How they link together!)
> **How Products & Inventory work together:**
> * **Products** (`/products`): Where you create your catalog items, set selling prices, cost prices, and toggle **"Track Inventory"**.
> * **Inventory** (`/inventory`): Where you monitor live stock on hand, low-stock warnings, adjust physical counts, and record supplier restock receipts.

1. Click **Products** in the sidebar → Click **"New Item"** (top right).
2. Enter:
   * **Name:** *Bag of Rice 50kg*
   * **SKU:** *RICE-50KG* (optional)
   * **Cost Price:** `₦35,000`
   * **Selling Price:** `₦45,000`
   * **Track Inventory:** Toggle **ON**
3. Click **Save Item**.
4. Now click **Inventory** in the sidebar:
   * Notice your *Bag of Rice 50kg* is immediately listed!
   * Click **"Adjust Count"** on the item and set your stock to `10` units (or click **"New Receipt"** to record an incoming supplier shipment).

### 3. Record a Sale & Print / Download a PDF Receipt
1. Click **Sales** in the sidebar → Click **"New Sale"** (top right).
2. Click on your *Bag of Rice 50kg* in the catalog picker (set quantity to `2`).
3. Under **Add Payment**:
   * Click **"Pay Full Balance (Cash)"** (or enter the amount and select Cash/Transfer/POS).
4. Click **"Complete Sale"** (this records the transaction and automatically creates your official customer receipt).
5. **How to View & Download Your PDF Receipt:**
   * Click **Receipts** in the sidebar → Click on your new receipt (e.g. `REC-2026-0001`).
   * Click **"View PDF"** at the top right to view, download, or print the receipt!
6. **Check Your Stock:**
   * Click **Inventory** in the sidebar → Notice how your stock automatically dropped from `10` to `8` units with zero manual math!

### 4. Test the AI Bookkeeper (Gemini AI in action!)
1. Click **AI Bookkeeper** in the sidebar.
2. Under the **"Record with AI"** box, in the **"What happened?"** text box, type:
   > *"Paid ₦25,000 for electricity bill and fuel for generator at Total station"*
3. Click the green **"Review with AI"** button.
4. Watch Google Gemini AI automatically analyze your text and take you to the **Review Detail** screen showing:
   * **Operation:** *Operating Expense*
   * **Suggested Category:** *Utilities* (or *Fuel & Generator*)
   * **Amount:** *₦25,000.00*
   * **AI Explanation:** A natural-language explanation of why this was classified.
5. Review the details, then click **"Record Expense"** at the bottom right to post it directly into your general ledger with zero manual calculations!

### 5. Ask Questions to "Ask NNOO" (AI Business Assistant)
1. Click **Ask NNOO** in the sidebar.
2. You will see suggested questions based on your live business data (e.g. *"What were my total sales today?"*, *"How much profit did I make this week?"*).
3. Click any suggested question OR type your own custom question in the chat box at the bottom:
   > *"What were my total sales today and what are my total expenses?"*
4. Press **Enter** or click the send button $\to$ Ask NNOO reads your real database records and answers instantly with verified, accurate financial numbers!

### 6. View Your Business Health Score & Credit Passport

#### Part A: Test the Business Health Score
1. Click **Health** in the sidebar.
2. View your real-time **Business Health Score** circular gauge (0–100) calculated deterministically across Profitability, Liquidity, and Inventory efficiency.
3. Review the **"What is Helping"** (positive operational signals) and **"Needs Attention"** cards.
4. Click the gradient button **"Explain My Score with AI"** $\to$ Google Gemini analyzes your score and presents a clear, natural-language executive summary.
5. Click **"History"** at the top right to view historical score snapshots.

#### Part B: Generate & Download Your NNOO Credit Passport
1. Click **Credit Passport** in the sidebar.
2. In the top header card, click the bright lime button **"Generate Passport"** (or **"Generate New Version"**).
3. Watch your official passport code (e.g. `PASS-XXXX`) and **"Version 1"** badge appear with verified 90-day financial summaries and data coverage status.
4. Click **"Download PDF"** $\to$ Your official, verified business credit passport opens in a new tab ready to view, download, or print with a cryptographic verification seal!
5. *(Optional)* Click **"Share Securely"** $\to$ Select an expiry window (e.g. `7 days`) $\to$ Copy the private verification link to see how external lenders or partners can verify your business without needing an account.

### 7. Test Platform Administration
1. Go to `http://localhost:3000/admin` to view global platform health, business tenants, and audit logs.

---

## 🛠️ Step 6: Quick Troubleshooting for Beginners

| Symptom / Problem | What is happening? | How to fix it in 5 seconds |
|---|---|---|
| **Port 3000 is in use** | Another app or previous terminal is using port 3000. | Next.js will automatically use `http://localhost:3001`. Just open that URL in your browser! |
| **"Invalid API Key" or Supabase Error** | A typo in your `.env.local` URL or Anon key. | Open `apps/web/.env.local`, make sure there are no extra spaces or quotes missing, and re-paste the keys from your Supabase dashboard. |
| **AI Bookkeeper says "AI is offline"** | `GEMINI_API_KEY` is empty or incorrect. | Get your free key from [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) and paste it into `GEMINI_API_KEY` in `.env.local`. |
| **Changes to `.env.local` not showing up** | The server was already running when you edited the file. | In your terminal, press `Ctrl + C` to stop the server, then run `pnpm run dev:web` again. |

---

## 🎯 Summary Checklist

- [x] Node.js installed ([nodejs.org](https://nodejs.org))
- [x] pnpm installed (`npm install -g pnpm`)
- [x] Supabase project created & keys copied ([supabase.com](https://supabase.com))
- [x] Gemini API key generated ([aistudio.google.com](https://aistudio.google.com/app/apikey))
- [x] Paystack Test keys copied ([paystack.com](https://dashboard.paystack.com/signup))
- [x] *(Optional)* Resend Email configured for instant OTP delivery ([Resend Setup Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/guides/RESEND_EMAIL_SETUP_GUIDE.md))
- [x] [apps/web/.env.local](file:///c:/Users/H-P/Desktop/nnoo/apps/web/.env.local) file saved with your keys
- [x] Run `pnpm run dev:web`
- [x] Open `http://localhost:3000` and start testing!

