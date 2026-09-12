# Complete Beginner’s Step-by-Step Guide: Deploying & Testing NNOO on Production (Vercel)

Document ID: `GUIDE-VERCEL-PROD-01`  
Project: **NNOO — Africa’s AI Business Operating System**  
Target Audience: **Complete Novices & Beginners (Zero Technical Background Required)**  
Canonical Supabase Reference: **`hoorlxgtnamwdxszsbwt` (NNOO Bus Project)**  
Canonical Organization: **`ggxbxqtzlevaceudwnri`**  
Last Updated: **2026-09-04**

---

## 🧭 The Big Picture (What We Are Doing and Why)

Right now, when you test NNOO on your laptop using `http://localhost:3000`:
* Only **you** can see it.
* The moment you close your laptop, the website turns off.

**Vercel** is like a giant, super-fast cloud computer in the sky that never sleeps:
1. **GitHub** holds your code like a secure digital safe.
2. **Vercel** connects to your GitHub, builds your website, and gives you a real live internet link (like `https://nnoo-app.vercel.app` or your custom domain `https://nnoo.app`).
3. Anyone in the world with a smartphone or computer can open that link and use NNOO 24 hours a day, 7 days a week!

---

## 🛑 The 2 Golden Rules to Avoid 100% of Vercel Errors

Before you touch anything in Vercel, learn these two rules. They prevent 99% of mistakes made by beginners!

### Golden Rule #1: The Root Directory MUST stay `./`
* NNOO is a **Monorepo** (it houses both the Web app and the Mobile app together).
* The repository already contains a file called `vercel.json` at the root that tells Vercel: *"Build the web app inside `apps/web`, but use all the shared building blocks from the root."*
* ⚠️ **NEVER change the Root Directory to `apps/web` in the Vercel dashboard!** Keep it as `./`. If you change it, Vercel won't be able to find your shared packages (`@nnoo/config`, `@nnoo/contracts`) and the build will fail.

### Golden Rule #2: Paystack Mode Safety Guard
NNOO has built-in bank-grade security to protect you from accidentally charging real money or using fake money in live mode:
* **Mode A: Testing/Staging on Vercel with Test Keys (Fake Money):**  
  Set `NNOO_ENV=preview` and use your Paystack Test Keys (`sk_test_...` and `pk_test_...`).
* **Mode B: Real Live Production Launch (Charging Real Money):**  
  Set `NNOO_ENV=production`, `PAYSTACK_ENVIRONMENT=live`, and use your real Paystack Live Keys (`sk_live_...` and `pk_live_...`).

---

## 📋 Table of Contents

1. [Step 1: Get Your Free Accounts Ready](#step-1-get-your-free-accounts-ready)
2. [Step 2: Push Your Code to GitHub](#step-2-push-your-code-to-github)
3. [Step 3: Import Your Project into Vercel](#step-3-import-your-project-into-vercel)
4. [Step 4: Copy-Paste Environment Variables in Vercel](#step-4-copy-paste-environment-variables-in-vercel)
5. [Step 5: Click "Deploy" & Watch the Live Build](#step-5-click-deploy--watch-the-live-build)
6. [Step 6: Connect Supabase to Your Live Vercel URL (Crucial!)](#step-6-connect-supabase-to-your-live-vercel-url-crucial)
7. [Step 7: Connect Paystack Webhooks to Vercel (For Billing)](#step-7-connect-paystack-webhooks-to-vercel-for-billing)
8. [Step 8: Perform the Live 5-Minute Proof Test](#step-8-perform-the-live-5-minute-proof-test)
9. [Step 9: (Optional) Add Your Own Custom Domain](#step-9-optional-add-your-own-custom-domain)
10. [Step 10: Beginner Troubleshooting & Error Guide](#step-10-beginner-troubleshooting--error-guide)

---

## 🔑 Step 1: Get Your Free Accounts Ready

Make sure you have accounts on these services (all free to start):

1. **GitHub:** [https://github.com/signup](https://github.com/signup) — Where your code is saved.
2. **Vercel:** [https://vercel.com/signup](https://vercel.com/signup) — Click **"Continue with GitHub"** to automatically connect your GitHub account.
3. **Supabase:** [https://supabase.com](https://supabase.com) — Canonical project: `hoorlxgtnamwdxszsbwt` (**NNOO Bus Project**).
4. **Google Gemini AI Studio:** [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) — For your free AI key.
5. **Paystack:** [https://dashboard.paystack.com](https://dashboard.paystack.com) — For subscription checkout.
6. **Resend:** [https://resend.com](https://resend.com) — For instant verification emails.

---

## 📦 Step 2: Push Your Code to GitHub

If your code is already pushed to your GitHub repository (e.g. `github.com/your-username/nnoo`), you can skip to **Step 3**.

If you need to push your local code to GitHub:
1. Open your terminal in VS Code (`Ctrl + ~`).
2. Run these 3 simple commands:
   ```bash
   git add .
   git commit -m "feat: prepare production Vercel deployment"
   git push origin main
   ```
3. Check your GitHub repository in your browser to verify that your latest files are visible.

---

## 🚀 Step 3: Import Your Project into Vercel

* **Direct Link:** [https://vercel.com/new](https://vercel.com/new)

### Click-by-click instructions:
1. Open [https://vercel.com/new](https://vercel.com/new) in your browser.
2. Under **"Import Git Repository"**, you will see a list of your GitHub projects.
3. Find your `nnoo` repository and click the blue **"Import"** button next to it.
4. Now you will see the **"Configure Project"** screen:
   * **Project Name:** Leave it as `nnoo` (or type `nnoo-web`).
   * **Framework Preset:** Vercel will automatically detect **Next.js**.
   * **Root Directory:** ⚠️ **LEAVE IT EMPTY / AS `./`**. Do NOT click edit, and do NOT change it to `apps/web`.
   * **Build and Output Settings:** Leave all toggles alone (Vercel will automatically read `vercel.json` from your project!).

---

## 🔐 Step 4: Copy-Paste Environment Variables in Vercel

On that same Vercel screen, look for the dropdown section called **"Environment Variables"** and click to expand it.

This is where we enter the secret passwords and keys so Vercel can talk to your database, AI, and billing.

### Choose Your Deployment Mode:

#### 🟢 Option A: Testing on Vercel with Test Keys (RECOMMENDED FIRST STEP)
Use this option if you want to test the live website on Vercel safely using free test money on Paystack without charging real credit cards.

Add each variable below by typing the **Key** on the left and pasting the **Value** on the right, then clicking **"Add"**:

| Environment Variable (Key) | Value to Enter | Where It Comes From |
|---|---|---|
| `NNOO_ENV` | `preview` | Tells NNOO to allow Paystack test keys on Vercel. |
| `NODE_ENV` | `production` | Enables ultra-fast optimized Next.js performance. |
| `NEXT_PUBLIC_SITE_URL` | `https://your-project-name.vercel.app` | Your Vercel domain (you can update this after deploy). |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hoorlxgtnamwdxszsbwt.supabase.co` | [Supabase API Settings](https://supabase.com/dashboard/project/hoorlxgtnamwdxszsbwt/settings/api) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(Your long anon public key)* | [Supabase API Settings](https://supabase.com/dashboard/project/hoorlxgtnamwdxszsbwt/settings/api) |
| `SUPABASE_SERVICE_ROLE_KEY` | *(Your long secret service_role key)* | [Supabase API Settings](https://supabase.com/dashboard/project/hoorlxgtnamwdxszsbwt/settings/api) |
| `GEMINI_API_KEY` | `AIzaSy...` *(Your Gemini Key)* | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `GEMINI_MODEL_DEFAULT` | `gemini-3.6-flash` | Standard high-speed Gemini AI model. |
| `AI_ENABLED` | `true` | Enables AI Bookkeeper and Ask NNOO. |
| `PAYSTACK_SECRET_KEY` | `sk_test_...` *(Your Paystack Test Secret Key)* | [Paystack Settings $\to$ API Keys](https://dashboard.paystack.com/#/settings/developer) |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | `pk_test_...` *(Your Paystack Test Public Key)* | [Paystack Settings $\to$ API Keys](https://dashboard.paystack.com/#/settings/developer) |
| `PAYSTACK_ENVIRONMENT` | `test` | Sets Paystack to test mode. |
| `RESEND_API_KEY` | `re_...` *(Your Resend API Key)* | [Resend API Keys](https://resend.com/api-keys) |
| `WHATSAPP_ENABLED` | `false` | Keep disabled unless Meta Cloud API credentials are ready. |

---

#### 🔵 Option B: 100% Real Live Production (Charging Real Customers)
When you are ready to launch publicly to real Nigerian businesses and charge real money:
* Set `NNOO_ENV` to `production`.
* Set `PAYSTACK_ENVIRONMENT` to `live`.
* Replace `PAYSTACK_SECRET_KEY` with your real `sk_live_...` key.
* Replace `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` with your real `pk_live_...` key.
* Set `NEXT_PUBLIC_SITE_URL` to your custom domain (e.g. `https://nnoo.app`).

---

## ⚡ Step 5: Click "Deploy" & Watch the Live Build

1. Click the black **"Deploy"** button at the bottom of the Vercel page.
2. Vercel will start building your application. You will see real-time log messages:
   * `Running "pnpm install"...`
   * `Running "pnpm --filter web build"...`
   * `✓ Compiled /app ...`
   * `✓ 84 pages compiled cleanly.`
3. Within 60 to 90 seconds, confetti will burst across the screen with the message:  
   🎉 **"Congratulations! Your project has been deployed."**
4. Vercel will show you your live link! It will look like:  
   👉 `https://nnoo-xxxxxx.vercel.app`
5. Click on the preview thumbnail or the link to open your live web application!

---

## 🔗 Step 6: Connect Supabase to Your Live Vercel URL (Crucial!)

> [!CAUTION]
> **If you skip this step, users won't be able to log in or verify emails on Vercel!**  
> Supabase must be explicitly told that your new Vercel web address is authorized.

* **Direct Link:** [https://supabase.com/dashboard/project/hoorlxgtnamwdxszsbwt/auth/url-configuration](https://supabase.com/dashboard/project/hoorlxgtnamwdxszsbwt/auth/url-configuration)

### Click-by-click instructions:
1. Open the direct link above to your Supabase project.
2. In the **Site URL** box, paste your new live Vercel URL:  
   `https://your-project-name.vercel.app` (or your custom domain `https://nnoo.app`).
3. In the **Redirect URLs** box, click **"Add URL"**:
   * Add: `https://your-project-name.vercel.app/**`
   * *(Make sure `http://localhost:3000/**` is still there so your local computer still works too!)*
4. Scroll down and click the green **"Save"** button.

---

## 💳 Step 7: Connect Paystack Webhooks to Vercel (For Billing)

When a customer subscribes to a plan (Starter, Growth, or Enterprise), Paystack needs to notify your live Vercel server so NNOO can activate their account automatically.

* **Direct Link:** [https://dashboard.paystack.com/#/settings/developer](https://dashboard.paystack.com/#/settings/developer)

### Click-by-click instructions:
1. Open Paystack Settings above.
2. Look for the field labeled **"Test Webhook URL"** (or **"Live Webhook URL"** if in live mode).
3. Type your Vercel address followed by `/api/v1/billing/webhook`. For example:
   ```text
   https://your-project-name.vercel.app/api/v1/billing/webhook
   ```
4. Click **"Save Changes"**.

---

## 🧪 Step 8: Perform the Live 5-Minute Proof Test

Let's verify that your live Vercel deployment is 100% healthy:

### 1. The Instant Health Check
Open a new browser tab and visit:
```text
https://your-project-name.vercel.app/api/v1/health
```
You should see this clean JSON message:
```json
{"status":"ok","timestamp":"2026-...","service":"nnoo-web-api"}
```
*(If you see this, your server is 100% online and responding!).*

### 2. Test User Registration
1. Go to `https://your-project-name.vercel.app/sign-up`.
2. Fill in your details and click **"Create Account"**.
3. If using Resend: Enter your 6-digit OTP code received in your inbox.
4. You will seamlessly advance to `https://your-project-name.vercel.app/onboarding`!

### 3. Test Business Setup & POS
1. Enter your business name (e.g. `Lagos Super Store`) and select an industry.
2. Click **"Get Started"** to enter the live dashboard.
3. Go to **Products** $\to$ add a product with a price and stock quantity.
4. Go to **Point of Sale (POS)** $\to$ tap the product $\to$ click **Charge** $\to$ choose Cash.
5. Your receipt is generated and your inventory stock decrements automatically in Supabase!

### 4. Test Google Gemini AI Bookkeeper
1. Go to **AI Bookkeeper** in the sidebar.
2. Type a business note: *"Bought 2 bags of rice for 50000 cash from Mile 12 market"*.
3. Click **"Process with AI"**.
4. Gemini will classify the expense, suggest the double-entry accounting category, and present the review card with zero math errors!

---

## 🌐 Step 9: (Optional) Add Your Own Custom Domain

Want your website to look completely professional (like `https://nnoo.app` or `https://mybusiness.com`) instead of `.vercel.app`?

### Click-by-click instructions:
1. Go to your Vercel Project Dashboard:  
   `https://vercel.com/dashboard` $\to$ click on your `nnoo` project.
2. Click **Settings ⚙️** at the top $\to$ click **"Domains"** on the left menu.
3. In the box, type your domain name (e.g. `nnoo.app` or `app.yourcompany.com`) and click **"Add"**.
4. Vercel will give you two DNS records to add at your domain provider (Namecheap, GoDaddy, Cloudflare, etc.):
   * **Type:** `A` | **Name:** `@` | **Value:** `76.76.21.21`
   * **Type:** `CNAME` | **Name:** `www` | **Value:** `cname.vercel-dns.com`
5. Vercel will automatically generate a free SSL certificate (HTTPS padlock 🔒) within 2 minutes!
6. Remember to update `NEXT_PUBLIC_SITE_URL` in Vercel and **Site URL** in Supabase to match your new custom domain!

---

## 🛠️ Step 10: Beginner Troubleshooting & Error Guide

| What Went Wrong? | Why It Happened | How to Fix It in 10 Seconds |
|---|---|---|
| **Error: "No Next.js version detected"** | Root directory was missing Next.js devDependency. | **Fix:** Resolved in codebase. Ensure Vercel **Root Directory** is `./` (not `apps/web`), push latest commit, and click **Redeploy**. |
| **Build Error: "Cannot find package @nnoo/contracts"** | You set the Root Directory in Vercel to `apps/web`. | **Fix:** In Vercel Project Settings $\to$ **General** $\to$ **Root Directory**, reset it to `./` (or leave it blank), then redeploy. |
| **Error: "Production environment cannot use a Paystack test key"** | You have `NNOO_ENV=production` but pasted a `sk_test_...` key. | **Fix:** In Vercel $\to$ **Settings** $\to$ **Environment Variables**, change `NNOO_ENV` from `production` to `preview`. |
| **Login Redirects to `localhost:3000`** | Supabase Auth still has localhost as its default redirect. | **Fix:** Go to [Supabase URL Configuration](https://supabase.com/dashboard/project/hoorlxgtnamwdxszsbwt/auth/url-configuration) and set **Site URL** and **Redirect URLs** to your Vercel address. |
| **AI Bookkeeper says "AI is offline"** | `GEMINI_API_KEY` was mistyped or omitted in Vercel. | **Fix:** Get a free key from [aistudio.google.com](https://aistudio.google.com/app/apikey), paste it into `GEMINI_API_KEY` in Vercel Environment Variables, and click **Redeploy**. |
| **Resend error: "You can only send to your own email"** | You are testing on Vercel using `onboarding@resend.dev` without a custom domain. | **Fix:** For test signups, use your own Resend account email address, OR complete domain verification in Resend as explained in the [Resend Setup Guide](file:///c:/Users/H-P/Desktop/nnoo/docs/guides/RESEND_EMAIL_SETUP_GUIDE.md). |

---

## 🎯 Final Vercel Production Checklist

Use this checklist to confirm your deployment is 100% complete:

- [ ] Code committed and pushed to GitHub `main` branch.
- [ ] Vercel project created with Root Directory kept at `./`.
- [ ] All 14 Environment Variables copied into Vercel dashboard.
- [ ] Build succeeded with 0 errors and generated live `.vercel.app` URL.
- [ ] Supabase Site URL and Redirect URLs updated with live Vercel URL.
- [ ] Paystack Webhook URL configured with `/api/v1/billing/webhook`.
- [ ] Live Health Check tested at `/api/v1/health` $\to$ returns HTTP 200 `{"status":"ok"}`.
- [ ] Live Sign-Up, Onboarding, POS Sale, and AI Bookkeeper tested successfully.
