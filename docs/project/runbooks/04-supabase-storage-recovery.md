# Runbook 04: Supabase Storage Recovery & PDF Regeneration

**Owner:** NNOO Engineering & Platform Operations  
**Audience:** Platform Admin / Software Engineers  
**Severity:** MEDIUM (Artifact Restoration)  

---

## 1. Overview & Bucket Inventory

This runbook covers the recovery of Supabase Storage bucket assets.

| Bucket | Criticality | Source of Truth | Recovery Strategy |
|---|---|---|---|
| `credit-passport-artifacts` | Derived / Immutable | `credit_passport_snapshots` table | **Deterministic Re-rendering:** PDFs are regenerated on-demand from immutable DB snapshots. |
| `business-logos` | Non-Critical | Uploaded logo file | Re-upload via Business Settings if lost. |
| `receipt-documents` | Important | Uploaded attachment | Restored from cloud storage mirror / S3 replica. |

---

## 2. Credit Passport PDF Recovery (Deterministic Invariant)

Credit Passport PDFs are derived, verifiable artifacts. The immutable system of record is the canonical database row in `credit_passport_snapshots`.

### Regeneration Procedure:
1. Identify missing passport PDF from `credit_passport_snapshots`:
   ```sql
   SELECT id, business_id, snapshot_version, artifact_hash, metrics_snapshot, issued_at 
   FROM credit_passport_snapshots 
   WHERE id = '$PASSPORT_ID';
   ```
2. Invoke server renderer (`CreditPassportService.generatePdfBuffer(snapshot)`).
3. Compute SHA-256 hash of generated artifact.
4. Verify computed SHA-256 equals `artifact_hash` stored in the database.
5. Upload regenerated buffer to `credit-passport-artifacts/` bucket with strict private access.

---

## 3. Storage RLS & Access Verification Post-Restore

1. Confirm all buckets have `public = false` (except public logos if configured).
2. Test signed URL issuance:
   - Business A user CAN access Business A signed document URLs.
   - Business A user CANNOT access Business B document URLs (HTTP 403 / denied).
3. Verify expired share tokens reject access.
