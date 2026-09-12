# Complete Beginner’s Step-by-Step Guide: Setting Up Resend Email in NNOO (Localhost & Production)

Document ID: `GUIDE-RESEND-EMAIL-01`  
Project: **NNOO — Africa’s AI Business Operating System**  
Target Audience: **Complete Novices & Beginners (Zero Technical Background Required)**  
Canonical Supabase Reference: **`hoorlxgtnamwdxszsbwt` (NNOO Bus Project)**  
Canonical Organization: **`ggxbxqtzlevaceudwnri`**  
Last Updated: **2026-09-04**

---

## 🧭 The Big Picture (What We Are Doing and Why)

Imagine your NNOO application is like a secure digital office building:
1. **The Security Guard (Supabase Auth):** When a user signs up on your website or mobile app, the guard creates a secret 6-digit verification code.
2. **The Postman (Resend):** The guard cannot walk to the user's house to give them the code. The guard hands the letter to a trusted, lightning-fast postman named **Resend**.
3. **The Mailbox (User's Inbox):** Resend immediately flies across the internet and places the verification letter right into the user's inbox (not their spam folder!).

### Why can't we just use Supabase's default mailer?
By default, Supabase gives you a small built-in test postman, but:
* It has a strict limit of only **3 to 4 emails per hour**. If you try to test your sign-up page 4 times, it stops working and gives you an error saying *"Email rate limit exceeded"*.
* Its emails frequently land in the **Spam or Junk** folder.

By connecting **Resend** directly to Supabase as your **Custom SMTP Provider**, you get:
* **3,000 emails per month 100% FREE**.
* **Instant delivery (under 2 seconds)**.
* **Flawless 6-digit OTP codes and login links** on both **Localhost** (`http://localhost:3000`) and **Live Production** (`https://yourdomain.com`).

---

## 🛑 The #1 Rule to Know Before You Start (Avoid 99% of Errors!)

Before doing anything, understand how Resend works in **Testing vs. Live Production**:

| Environment | Sender Email Address | Who Can Receive Emails? | Where You Use It |
|---|---|---|---|
| **Localhost Testing** (Sandbox) | `onboarding@resend.dev` | **ONLY YOU** (the exact email address you used to register on Resend.com) | On your laptop when testing `http://localhost:3000` |
| **Live Production** (Custom Domain) | `noreply@yourdomain.com` (e.g. `noreply@nnoo.co`) | **ANYONE ON EARTH** (Gmail, Yahoo, Outlook, Apple, etc.) | On your live website and public app |

> [!IMPORTANT]
> **The Golden Sandbox Rule:**
> When you first sign up for Resend, you don't own a verified domain on Resend yet. Resend gives you a free testing address: `onboarding@resend.dev`.
> Resend's safety rule states: **When sending from `onboarding@resend.dev`, you can ONLY send emails to the email address of your own Resend account!**  
> If you try to sign up on your local website with `fakeuser123@gmail.com` before verifying a domain, Resend will reject it. When testing locally, **always test with your own Resend account email!**

---

## 📋 Table of Contents

1. [Step 1: Create Your Free Resend Account](#step-1-create-your-free-resend-account)
2. [Step 2: Generate Your Resend API Key](#step-2-generate-your-resend-api-key)
3. [Step 3: Connect Resend into Supabase (Custom SMTP)](#step-3-connect-resend-into-supabase-custom-smtp)
4. [Step 4: Configure Supabase Email Templates (6-Digit OTP)](#step-4-configure-supabase-email-templates-6-digit-otp)
5. [Step 5: Set Redirect URLs for Localhost & Production](#step-5-set-redirect-urls-for-localhost--production)
6. [Step 6: Test Localhost Email Delivery (Proof Test)](#step-6-test-localhost-email-delivery-proof-test)
7. [Step 7: Connect Your Custom Domain for Production (Send to Anyone)](#step-7-connect-your-custom-domain-for-production-send-to-anyone)
8. [Step 8: Configure Environment Variables in the Codebase](#step-8-configure-environment-variables-in-the-codebase)
9. [Step 9: Beginner Troubleshooting & Error Guide](#step-9-beginner-troubleshooting--error-guide)

---

## 🔑 Step 1: Create Your Free Resend Account

* **Website:** [https://resend.com/signup](https://resend.com/signup)
* **Cost:** 100% Free (3,000 emails/month, 100 emails/day).

### Click-by-click instructions:
1. Open your browser and go to [https://resend.com/signup](https://resend.com/signup).
2. You can click **"Sign up with GitHub"** or enter your **Email** and choose a password.
3. If you used your email, Resend will send you a quick 6-digit confirmation code. Check your inbox, enter the code, and log in.
4. You are now inside the clean, dark-mode Resend Dashboard!

---

## 🗝️ Step 2: Generate Your Resend API Key

Your API key is like a secret digital passport that allows Supabase to send emails through your Resend account.

* **Direct Link:** [https://resend.com/api-keys](https://resend.com/api-keys)

### Click-by-click instructions:
1. On the left sidebar of the Resend dashboard, click **"API Keys"** (or click the direct link above).
2. Look at the top right corner and click the black button: **"Create API Key"**.
3. A popup window will appear with 3 simple options:
   * **Name:** Type `NNOO-Supabase-Mailer`
   * **Permission:** Select **"Full access"** (Do NOT select "Sending access only", because Supabase SMTP requires Full Access).
   * **Domain:** Keep it on **"All domains"**.
4. Click the black **"Add"** button.
5. **CRITICAL STEP:** A box will appear showing your new API Key. It starts with `re_` followed by letters and numbers, like:
   ```text
   re_12345678_abcdefghijklmnopqrstuvwxyz
   ```
6. Click the **"Copy"** button next to it.
7. Paste this key into a safe temporary notepad file.  
   *(⚠️ Resend will NEVER show this secret key again for your security! If you lose it, you will have to create a new one).*

---

## ⚙️ Step 3: Connect Resend into Supabase (Custom SMTP)

Now we tell your Supabase project (`hoorlxgtnamwdxszsbwt`) to use Resend as its official email postman.

* **Direct Link to Supabase Auth Settings:**  
  [https://supabase.com/dashboard/project/hoorlxgtnamwdxszsbwt/settings/auth](https://supabase.com/dashboard/project/hoorlxgtnamwdxszsbwt/settings/auth)

### Click-by-click instructions:
1. Open the direct link above in your browser.  
   *(Make sure you see **NNOO Bus Project** at the top).*
2. Scroll down the page until you find the section titled **"SMTP Settings"**.
3. Find the toggle switch labeled **"Enable Custom SMTP"** and switch it to **ON** (the toggle turns green).
4. Fill in the exact fields as shown in the table below:

| Field Name in Supabase | What to Type / Paste | Explanation (For 5-Year-Olds) |
|---|---|---|
| **Sender email** | `onboarding@resend.dev` *(for testing)* <br> **OR** <br> `noreply@yourdomain.com` *(for production with verified domain)* | The email address people will see the email coming from. |
| **Sender name** | `NNOO` | The name that appears in the user's inbox header (e.g. "NNOO"). |
| **Host** | `smtp.resend.com` | The address of Resend's high-speed SMTP computer. |
| **Port number** | `465` *(SSL)* **OR** `587` *(TLS)* | `465` is the most secure and reliable port for Resend. |
| **Minimum interval between emails** | `1` | Wait 1 second between sending emails to prevent being flagged. |
| **SMTP Username** | `resend` | ⚠️ **DO NOT TYPE YOUR EMAIL!** You must type the literal 6 letters: `resend`. |
| **SMTP Password** | `re_your_api_key_here` | Paste the secret Resend API key you copied in **Step 2**. |

5. Scroll down to the bottom right corner of the page and click the green **"Save changes"** button.
6. Supabase will show a small green popup saying *"Auth settings saved successfully"*.

---

## ✉️ Step 4: Configure Supabase Email Templates (6-Digit OTP)

In NNOO, when someone creates an account, they are taken to a verification screen (`/verify-email`) where they can type a **6-digit code** or click a link.

Let's make sure the email template looks modern and clearly presents the 6-digit code!

* **Direct Link to Supabase Templates:**  
  [https://supabase.com/dashboard/project/hoorlxgtnamwdxszsbwt/auth/templates](https://supabase.com/dashboard/project/hoorlxgtnamwdxszsbwt/auth/templates)

### Click-by-click instructions:
1. Open the link above.
2. In the list of templates, click on **"Confirm signup"**.
3. In the **Subject** field, type:
   ```text
   Your NNOO Verification Code
   ```
4. In the **Message Body (HTML)** box, select all existing text, delete it, and paste this ready-to-use template:

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0A0D14; color: #FFFFFF; border-radius: 12px; border: 1px solid #1F2937;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #B8F25C; font-size: 28px; margin: 0; letter-spacing: 2px;">NNOO</h1>
    <p style="color: #9CA3AF; font-size: 14px; margin-top: 4px;">Africa's AI Business Operating System</p>
  </div>

  <div style="background-color: #111827; padding: 24px; border-radius: 8px; border: 1px solid #374151; text-align: center;">
    <h2 style="color: #FFFFFF; font-size: 20px; margin-top: 0;">Verify Your Email Address</h2>
    <p style="color: #D1D5DB; font-size: 15px; line-height: 1.5;">
      Welcome to NNOO! Use this 6-digit verification code to complete your registration:
    </p>
    
    <div style="background-color: #1F2937; display: inline-block; padding: 12px 28px; border-radius: 8px; margin: 20px 0; border: 1px solid #4B5563;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #B8F25C; font-family: monospace;">{{ .Token }}</span>
    </div>

    <p style="color: #9CA3AF; font-size: 13px;">This code will expire in 1 hour.</p>

    <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #374151;">
      <p style="color: #9CA3AF; font-size: 13px; margin-bottom: 12px;">Or click the direct confirmation button below:</p>
      <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #B8F25C; color: #0A0D14; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px;">Confirm My Email</a>
    </div>
  </div>

  <p style="color: #6B7280; font-size: 12px; text-align: center; margin-top: 24px;">
    If you did not sign up for an NNOO account, you can safely ignore this email.
  </p>
</div>
```

5. Click **"Save changes"** at the bottom right.
6. *(Optional but Recommended)* Click on **"Reset password"** template and do the exact same thing so password recovery emails also look stunning and include `{{ .Token }}`.

---

## 🌐 Step 5: Set Redirect URLs for Localhost & Production

When a user clicks the "Confirm My Email" link in their email, Supabase needs to know which website to redirect them back to. We want this to work for **BOTH** your local computer and your future live website at the exact same time!

* **Direct Link:**  
  [https://supabase.com/dashboard/project/hoorlxgtnamwdxszsbwt/auth/url-configuration](https://supabase.com/dashboard/project/hoorlxgtnamwdxszsbwt/auth/url-configuration)

### Click-by-click instructions:
1. Open the direct link above.
2. In the **Site URL** field:
   * If you are testing locally, set it to: `http://localhost:3000`
   * If you have deployed live, set it to: `https://your-production-domain.com`
3. In the **Redirect URLs** section:
   * Click **"Add URL"** and add: `http://localhost:3000/**`
   * Click **"Add URL"** and add: `http://localhost:3001/**` *(fallback if port 3000 is busy)*
   * Click **"Add URL"** and add: `https://your-production-domain.com/**` *(for your live production site)*
   * Click **"Add URL"** and add: `exp://**` *(for local mobile Expo testing)*
4. Click **"Save changes"**.

---

## 🧪 Step 6: Test Localhost Email Delivery (Proof Test)

Now let's see Resend in action right on your computer!

### 1. Enable Email Confirmation in Supabase
* Go to: [https://supabase.com/dashboard/project/hoorlxgtnamwdxszsbwt/auth/providers](https://supabase.com/dashboard/project/hoorlxgtnamwdxszsbwt/auth/providers)
* Click on **"Email"** provider to expand it.
* Make sure **"Enable Email provider"** is **ON**.
* Make sure **"Confirm email"** toggle is **ON** (green).
* Click **"Save"**.

### 2. Start Your NNOO Web App
Open your terminal (PowerShell or VS Code terminal) and run:
```bash
pnpm run dev:web
```
Wait until it says: `✓ Ready in 1500ms` at `http://localhost:3000`.

### 3. Sign Up with Your Resend Email Address
1. Open your browser to: [http://localhost:3000/sign-up](http://localhost:3000/sign-up).
2. Fill in the form:
   * **First Name:** `Test`
   * **Last Name:** `User`
   * **Email:** ⚠️ **Enter the exact email address of your Resend account!** *(Remember: In testing mode, Resend's sandbox only delivers to your own email address).*
   * **Password:** `TestPassword123!`
   * **Confirm Password:** `TestPassword123!`
3. Click **"Create Account"**.
4. The page will immediately take you to: `http://localhost:3000/verify-email?email=your_email...`

### 4. Watch the Live Delivery in Resend!
1. Open a new tab and go to: [https://resend.com/emails](https://resend.com/emails).
2. You will see a new email logged at the top with a green badge: **"Delivered"**!
3. Open your personal email inbox:
   * You will see the email titled: **Your NNOO Verification Code** from **NNOO**.
   * Look at the large green 6-digit code (for example: `739104`).
4. Go back to `http://localhost:3000/verify-email` and type the 6 digits into the boxes.
5. **SUCCESS!** NNOO verifies the code instantly and directs you straight into the onboarding screen (`/onboarding`).

---

## 🌍 Step 7: Connect Your Custom Domain for Production (Send to Anyone)

When you are ready to launch NNOO to real customers, you want emails to come from your official domain (e.g. `noreply@nnoo.co` or `noreply@yourdomain.com`), and you want to be able to send to **anyone on Earth** without any sandbox restriction.

Here is how to set up your domain in Resend in 5 minutes:

### 1. Add Your Domain in Resend
1. Go to: [https://resend.com/domains](https://resend.com/domains).
2. Click the black button: **"Add Domain"**.
3. Type your domain name (e.g. `nnoo.co` or a subdomain like `send.nnoo.co` or `mail.yourdomain.com`).
4. Select the Region closest to your users (e.g. **US East** or **Europe**).
5. Click **"Add"**.

### 2. Add the DNS Records to Your Domain Registrar
Resend will display a page with **3 or 4 DNS records**. Keep this page open.

Open another browser tab and log in to where you bought your domain (Namecheap, GoDaddy, Cloudflare, Google Domains, Hostinger, Vercel, etc.):
* Go to your domain's **DNS Management / Advanced DNS** settings.
* Click **"Add New Record"** for each row Resend gives you:

| Record Type | Host / Name in Registrar | Value / Content in Registrar | Priority (if asked) | What it does |
|---|---|---|---|---|
| **TXT** | `resend._domainkey` | Copy the long DKIM string from Resend | *(Leave blank)* | Proves to Google/Yahoo that NNOO is allowed to send emails from your domain. |
| **MX** | `bounces` | `feedback-smtp.resend.com` | `10` | Handles any bounced emails cleanly. |
| **TXT** | `bounces` | `v=spf1 include:amazonses.com ~all` | *(Leave blank)* | Guarantees SPF validation so emails don't go to spam. |
| **TXT** *(Optional DMARC)* | `_dmarc` | `v=DMARC1; p=none;` | *(Leave blank)* | Protects your domain reputation. |

### 3. Verify in Resend
1. Go back to the Resend tab and click **"Verify DNS Records"**.
2. DNS records usually update within 1 to 5 minutes.
3. Once verified, the status next to your domain will turn green: **"Verified"**!

### 4. Update Supabase with Your Verified Domain
1. Go back to Supabase SMTP Settings:  
   [https://supabase.com/dashboard/project/hoorlxgtnamwdxszsbwt/settings/auth](https://supabase.com/dashboard/project/hoorlxgtnamwdxszsbwt/settings/auth)
2. Scroll to **SMTP Settings**.
3. Change the **Sender email** from `onboarding@resend.dev` to:  
   `noreply@yourdomain.com` (e.g. `noreply@nnoo.co`).
4. Click **"Save changes"**.

🎉 **You are now 100% in Production Mode!** You can send emails to any customer, employee, or partner in the world without restrictions!

---

## 💻 Step 8: Configure Environment Variables in the Codebase

To allow your server code (e.g. Next.js server actions, direct transactional invoices, invitations) to also interact directly with Resend if needed:

### 1. In Your Local File: `apps/web/.env.local`
Open [apps/web/.env.local](file:///c:/Users/H-P/Desktop/nnoo/apps/web/.env.local) and verify or add your Resend API Key:
```env
# ------------------------------------------------------------------------------
# Resend Transactional Email API (Optional / Direct Server Sending)
# ------------------------------------------------------------------------------
RESEND_API_KEY="re_your_api_key_here"
```

### 2. In Your Production Hosting (Vercel, Render, Railway, AWS)
When deploying to production:
1. Go to your Hosting Dashboard (e.g. Vercel Project Settings $\to$ **Environment Variables**).
2. Add the variable:
   * **Key:** `RESEND_API_KEY`
   * **Value:** `re_your_api_key_here`
3. Set `NEXT_PUBLIC_SITE_URL` to your live domain (e.g. `https://nnoo.co`).

---

## 🛠️ Step 9: Beginner Troubleshooting & Error Guide

Here is a quick reference table for every single issue that could possibly occur:

| What Happened? | Why It Happened | How to Fix It in 10 Seconds |
|---|---|---|
| **Error: "You can only send to your own email address while using the testing domain"** | You are using `onboarding@resend.dev` and tried to sign up with someone else's email address. | **Fix:** For local tests, sign up using your own Resend account email! To send to anyone else, complete **Step 7** to verify a custom domain. |
| **Error: "SMTP 535: Authentication failed"** | Either the username is wrong, or the API key has a typo. | **Fix:** Make sure the **SMTP Username** in Supabase is literally the word `resend` (NOT your email!), and re-paste your Resend API key (`re_...`) into **SMTP Password**. |
| **Error: "Email rate limit exceeded"** | Supabase is still using its default mailer instead of Resend. | **Fix:** Go to Supabase Auth Settings, make sure **"Enable Custom SMTP"** toggle is turned **ON (Green)**, and click **"Save changes"**. |
| **Email didn't arrive in my inbox** | It might be in Spam, or was blocked by your email provider. | **Fix 1:** Check your **Spam / Junk** folder. <br>**Fix 2:** Open [https://resend.com/emails](https://resend.com/emails) to view the real-time delivery log and see if it was delivered or bounced. |
| **Error: "Connection timeout on port 465"** | Your local internet provider or firewall blocks port 465. | **Fix:** In Supabase SMTP Settings, change the **Port number** from `465` to `587`, and save. |
| **Verification code expired or invalid** | The code was generated more than 60 minutes ago, or a digit was mistyped. | **Fix:** On the NNOO verification screen, click **"Resend Code"** to immediately receive a fresh 6-digit code. |

---

## 🎯 Final Verification Checklist

Use this checklist to confirm your setup is 100% complete:

- [ ] Resend account created at [resend.com](https://resend.com).
- [ ] API Key generated starting with `re_` with **Full Access**.
- [ ] Supabase project `hoorlxgtnamwdxszsbwt` has **Enable Custom SMTP** turned **ON**.
- [ ] Supabase SMTP Host is `smtp.resend.com`, Port is `465`, Username is `resend`.
- [ ] Supabase SMTP Password contains your `re_...` key.
- [ ] Supabase Confirm Signup Email Template updated with `{{ .Token }}`.
- [ ] Supabase URL Configuration includes `http://localhost:3000/**` and production domain.
- [ ] Localhost sign-up tested successfully with Resend account email.
- [ ] Email showed **Delivered** in Resend Dashboard at [resend.com/emails](https://resend.com/emails).
- [ ] *(When Ready for Production)* Custom domain added and verified with green badge at [resend.com/domains](https://resend.com/domains).
