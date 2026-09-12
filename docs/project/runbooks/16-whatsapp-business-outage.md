# Runbook 16: Meta WhatsApp Business Outage Response

**Severity:** SEV-3 (Medium - WhatsApp Channel Degraded)  
**Target:** Meta WhatsApp Cloud API, Webhook Ingestion, Account Linking & Template Delivery  
**Authority:** David Bako (NNOO Lead Developer / Platform Owner)

---

## 1. Operating Invariants
1. **WhatsApp outage must NEVER affect core Web, Mobile, Accounting, or In-App notifications.**
2. **User STOP opt-out signals MUST be preserved unconditionally under all circumstances.**
3. **NEVER attempt financial mutations over WhatsApp.**

---

## 2. Trigger Conditions
- Meta WhatsApp Cloud API returns 5xx or `GraphMethodException`.
- Meta webhook delivery drops to 0 or incoming webhook signatures fail HMAC validation.
- Outbound WhatsApp template delivery failure rate > 25%.

---

## 3. Diagnostic Procedures
1. Check Meta for Developers status page (https://metastatus.com).
2. Filter structured logs for `service: "whatsapp"`:
   - Check `errorCode` (`WHATSAPP_WEBHOOK_INVALID_SIGNATURE`, `META_API_UNAVAILABLE`, `RATE_LIMITED`).
3. Check `public.whatsapp_delivery_logs` for status distribution:
   ```sql
   SELECT delivery_status, error_code, count(*) 
   FROM public.whatsapp_delivery_logs 
   WHERE created_at > now() - interval '2 hours' 
   GROUP BY delivery_status, error_code;
   ```

---

## 4. Remediation Procedures
- **Scenario A: Meta Cloud API Outage**
  - Switch WhatsApp channel to degraded status in Platform Admin.
  - In-App and Push channels continue handling customer notifications without disruption.
- **Scenario B: Webhook Signature Failure Storm**
  - Verify that `META_WHATSAPP_APP_SECRET` and `META_WHATSAPP_VERIFY_TOKEN` match Meta App Dashboard settings.
- **Scenario C: Rate-Limiting on WhatsApp Tier**
  - Respect Meta messaging tier limits (e.g. 1,000 unique business-initiated conversations / 24 hours on initial tier).

---

## 5. Verification & Return to Service
1. Dispatch single test message via `/api/v1/ai/whatsapp/test-message` to verified operator test number.
2. Confirm message receipt and webhook delivery acknowledgment from Meta.
3. Verify zero user consent violations or financial mutations occurred ($\Delta 0$).
