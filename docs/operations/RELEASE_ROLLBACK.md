# NNOO — Release Rollback & Rapid Mitigation Guide

Document ID: `ROLLBACK-01`  
Governance Version: `1.0.0`  
Last Reconciled: `2026-08-20` (Tranche 4 Prompt 12 Handover)  
Status: **Authoritative Rollback Guide**

---

## 1. Fundamental Principle: Web Rollback $\neq$ Database Rollback

> [!IMPORTANT]
> **APPLICATION ROLLBACK AND DATABASE RECOVERY ARE DISTINCT OPERATIONS.**  
> - **Web Application Rollback:** Reverts frontend and serverless API execution to a previous immutable Vercel deployment (< 30 seconds).
> - **Database Schema:** Forward-compatible and additive migrations ensure that rolling back the Web application does **NOT** break the database schema.
> - **Database Data Incidents:** If data corruption occurs, follow [01-database-recovery.md](file:///c:/Users/H-P/Desktop/nnoo/docs/project/runbooks/01-database-recovery.md) rather than executing an ad-hoc drop script.

---

## 2. Web Application Instant Rollback (Vercel)

If a critical frontend defect or server-side exception is discovered following a production deployment:

### Step 1: Open Vercel Deployments
Navigate to `https://vercel.com/dashboard/projects/nnoo/deployments`.

### Step 2: Locate Previous Accepted Deployment
Identify the last known green deployment corresponding to the previous release SHA.

### Step 3: Promote to Production
Click the three dots (`...`) next to the previous deployment and select **"Promote to Production"**.

### Step 4: Verify Apex Domain
Verify `https://nnoo.app` immediately serves the promoted release.

---

## 3. Mobile Application Release Mitigation

Mobile apps cannot be instantly rolled back once downloaded to user devices:
- **Pre-Release Stage:** If a blocker is discovered before store release, immediately cancel the build or remove the release candidate from the Open Testing track in Google Play Console / TestFlight.
- **Post-Release Stage:** If an issue is discovered after public publication, patch the issue forward, increment `versionCode` / `buildNumber`, and submit an emergency hotfix build via EAS.
