# Runbook 17: Incident Postmortem Template

**Philosophy:** Blameless, evidence-based, transparent, and focused on systemic resilience.  
**Ownership:** David Bako (NNOO Lead Developer / Platform Owner)

---

## 1. Incident Overview
- **Incident ID:** `INC-YYYYMMDD-XX`
- **Date & Time (UTC):** `YYYY-MM-DD HH:MM UTC`
- **Severity Level:** `SEV-1 (Critical) | SEV-2 (High) | SEV-3 (Medium) | SEV-4 (Low)`
- **Affected Subsystems:** `[e.g. Core Web / Supabase Database / Paystack / Gemini / Inngest / Push / WhatsApp]`
- **Incident Commander / Lead:** David Bako
- **Status:** `RESOLVED`

---

## 2. Executive Summary
*Provide a concise 2-3 sentence summary of what occurred, why it happened, and how it was resolved.*

---

## 3. Impact Assessment
- **Business Impact:** *[e.g. 12 business users experienced delayed invoice PDF generation for 18 minutes]*
- **Financial Integrity Result:** `CONFIRMED ZERO FINANCIAL CORRUPTION (Δ 0)`
- **Data Confidentiality Result:** `CONFIRMED ZERO CROSS-TENANT DATA LEAKS`
- **Duration of Outage:** `XX minutes`
- **Time to Detect (TTD):** `XX minutes`
- **Time to Mitigate (TTM):** `XX minutes`
- **Time to Resolve (TTR):** `XX minutes`

---

## 4. Chronological Timeline (UTC)
| Timestamp | Event / Action | Actor / System |
|---|---|---|
| `HH:MM:SS` | Initial trigger condition / error rate spike observed | Monitoring Telemetry |
| `HH:MM:SS` | Incident declared as SEV-X | Incident Lead |
| `HH:MM:SS` | Upstream provider outage diagnosed / kill-switch engaged | Operator |
| `HH:MM:SS` | Mitigation deployed / traffic stabilized | Operator |
| `HH:MM:SS` | Mathematical reconciliation audit verified ($\Delta 0$) | Verification Script |
| `HH:MM:SS` | Incident declared RESOLVED | Incident Lead |

---

## 5. Root Cause Analysis
*Detail the fundamental technical or operational root cause using the 5-Whys methodology. Do not record "Fixed" without confirming the root cause.*

---

## 6. What Went Well & What Could Be Improved
### What Went Well
- *[e.g. Fail-open telemetry prevented core accounting operations from failing]*
- *[e.g. Runbook 13 kill switch stopped failing Gemini API requests instantly]*

### What Could Be Improved
- *[e.g. Alert threshold was too high, delaying detection by 5 minutes]*

---

## 7. Preventive & Corrective Actions
| Action Item | Owner | Target Date | Tracking ID |
|---|---|---|---|
| Enhance rate-limit backoff logic | Lead Developer | YYYY-MM-DD | `T4GAP-XXX` |
| Update operational runbook with new error signature | Lead Developer | YYYY-MM-DD | `DOC-XXX` |

---

## 8. Sign-Off & Closure
- **Reviewed & Approved By:** David Bako
- **Date of Sign-Off:** `YYYY-MM-DD`
