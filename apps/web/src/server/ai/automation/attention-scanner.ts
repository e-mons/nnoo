/**
 * Deterministic Attention Condition Scanner & Lifecycle Manager
 * Evaluates operational conditions across inventory, invoices, bookkeeping, and health.
 * Deduplicates active conditions and automatically resolves conditions that have cleared.
 * ZERO Gemini calls, ZERO financial mutations.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@nnoo/supabase';
import type {
  BusinessAttentionType,
  BusinessAttentionSeverity,
  BusinessAttentionEvent,
} from '@nnoo/contracts';

export interface AttentionScanSummary {
  scannedAt: string;
  businessId: string;
  detectedCount: number;
  createdCount: number;
  updatedCount: number;
  resolvedCount: number;
  activeEvents: BusinessAttentionEvent[];
}

export class AttentionScannerService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Runs all deterministic attention scanners for a given business.
   */
  async scanBusiness(businessId: string): Promise<AttentionScanSummary> {
    const now = new Date().toISOString();
    let createdCount = 0;
    let updatedCount = 0;
    let resolvedCount = 0;
    let detectedCount = 0;

    // 1. Scan Stock / Inventory Conditions
    const stockResults = await this.scanInventoryConditions(businessId, now);
    createdCount += stockResults.created;
    updatedCount += stockResults.updated;
    resolvedCount += stockResults.resolved;
    detectedCount += stockResults.detected;

    // 2. Scan Overdue Invoices
    const invoiceResults = await this.scanInvoiceConditions(businessId, now);
    createdCount += invoiceResults.created;
    updatedCount += invoiceResults.updated;
    resolvedCount += invoiceResults.resolved;
    detectedCount += invoiceResults.detected;

    // 3. Scan Pending Bookkeeper Reviews
    const bookkeeperResults = await this.scanBookkeeperConditions(businessId, now);
    createdCount += bookkeeperResults.created;
    updatedCount += bookkeeperResults.updated;
    resolvedCount += bookkeeperResults.resolved;
    detectedCount += bookkeeperResults.detected;

    // 4. Scan Stale Credit Passport
    const passportResults = await this.scanPassportConditions(businessId, now);
    createdCount += passportResults.created;
    updatedCount += passportResults.updated;
    resolvedCount += passportResults.resolved;
    detectedCount += passportResults.detected;

    // 5. Query all currently active events for summary
    const { data: activeRows } = await this.supabase
      .from('business_attention_events')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    const activeEvents: BusinessAttentionEvent[] = (activeRows || []).map((r) => ({
      id: r.id,
      businessId: r.business_id,
      type: r.type as BusinessAttentionType,
      category: r.category as 'STATEFUL' | 'OCCURRENCE',
      dedupeKey: r.dedupe_key,
      status: r.status as 'active' | 'resolved' | 'dismissed',
      severity: r.severity as BusinessAttentionSeverity,
      firstDetectedAt: r.first_detected_at,
      lastDetectedAt: r.last_detected_at,
      resolvedAt: r.resolved_at,
      sourceType: r.source_type,
      sourceReference: r.source_reference,
      metadata: (r.metadata || {}) as Record<string, unknown>,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return {
      scannedAt: now,
      businessId,
      detectedCount,
      createdCount,
      updatedCount,
      resolvedCount,
      activeEvents,
    };
  }

  /**
   * Scans inventory positions for low stock or out of stock items.
   */
  private async scanInventoryConditions(
    businessId: string,
    now: string
  ): Promise<{ detected: number; created: number; updated: number; resolved: number }> {
    let created = 0;
    let updated = 0;
    let resolved = 0;
    let detected = 0;

    // Query catalog items with current inventory
    const { data: items } = await this.supabase
      .from('catalog_items')
      .select('id, name, sku, low_stock_threshold, status')
      .eq('business_id', businessId)
      .eq('status', 'active');

    const { data: positions } = await this.supabase
      .from('inventory_positions')
      .select('catalog_item_id, quantity_on_hand')
      .eq('business_id', businessId);

    const posMap = new Map<string, number>();
    for (const p of positions || []) {
      posMap.set(p.catalog_item_id, p.quantity_on_hand);
    }

    // Query currently active stock attention events
    const { data: activeEvents } = await this.supabase
      .from('business_attention_events')
      .select('*')
      .eq('business_id', businessId)
      .eq('source_type', 'inventory')
      .eq('status', 'active');

    const activeMap = new Map<string, any>();
    for (const e of activeEvents || []) {
      if (e.source_reference) {
        activeMap.set(e.source_reference, e);
      }
    }

    const currentDeficientItemIds = new Set<string>();

    for (const item of items || []) {
      const qty = posMap.get(item.id) ?? 0;
      const threshold = item.low_stock_threshold ?? 5;

      if (qty <= 0) {
        detected++;
        currentDeficientItemIds.add(item.id);
        const dedupeKey = `${businessId}:stock:${item.id}`;
        const existing = activeMap.get(item.id);

        if (existing) {
          if (existing.type !== 'OUT_OF_STOCK_PRESENT' || existing.severity !== 'important') {
            await this.supabase
              .from('business_attention_events')
              .update({
                type: 'OUT_OF_STOCK_PRESENT',
                severity: 'important',
                last_detected_at: now,
                updated_at: now,
                metadata: { itemName: item.name, sku: item.sku, onHandQuantity: qty, threshold },
              })
              .eq('id', existing.id);
            updated++;
          } else {
            await this.supabase
              .from('business_attention_events')
              .update({ last_detected_at: now, updated_at: now })
              .eq('id', existing.id);
            updated++;
          }
        } else {
          await this.supabase.from('business_attention_events').insert({
            business_id: businessId,
            type: 'OUT_OF_STOCK_PRESENT',
            category: 'STATEFUL',
            dedupe_key: dedupeKey,
            status: 'active',
            severity: 'important',
            first_detected_at: now,
            last_detected_at: now,
            source_type: 'inventory',
            source_reference: item.id,
            metadata: { itemName: item.name, sku: item.sku, onHandQuantity: qty, threshold },
          });
          created++;
        }
      } else if (qty <= threshold) {
        detected++;
        currentDeficientItemIds.add(item.id);
        const dedupeKey = `${businessId}:stock:${item.id}`;
        const existing = activeMap.get(item.id);

        if (existing) {
          if (existing.type !== 'LOW_STOCK_PRESENT' || existing.severity !== 'attention') {
            await this.supabase
              .from('business_attention_events')
              .update({
                type: 'LOW_STOCK_PRESENT',
                severity: 'attention',
                last_detected_at: now,
                updated_at: now,
                metadata: { itemName: item.name, sku: item.sku, onHandQuantity: qty, threshold },
              })
              .eq('id', existing.id);
            updated++;
          } else {
            await this.supabase
              .from('business_attention_events')
              .update({ last_detected_at: now, updated_at: now })
              .eq('id', existing.id);
            updated++;
          }
        } else {
          await this.supabase.from('business_attention_events').insert({
            business_id: businessId,
            type: 'LOW_STOCK_PRESENT',
            category: 'STATEFUL',
            dedupe_key: dedupeKey,
            status: 'active',
            severity: 'attention',
            first_detected_at: now,
            last_detected_at: now,
            source_type: 'inventory',
            source_reference: item.id,
            metadata: { itemName: item.name, sku: item.sku, onHandQuantity: qty, threshold },
          });
          created++;
        }
      }
    }

    // Auto-resolve any active stock events that are no longer deficient
    for (const [itemId, evt] of activeMap.entries()) {
      if (!currentDeficientItemIds.has(itemId)) {
        await this.supabase
          .from('business_attention_events')
          .update({
            status: 'resolved',
            resolved_at: now,
            updated_at: now,
          })
          .eq('id', evt.id);
        resolved++;
      }
    }

    return { detected, created, updated, resolved };
  }

  /**
   * Scans for overdue unpaid invoices.
   */
  private async scanInvoiceConditions(
    businessId: string,
    now: string
  ): Promise<{ detected: number; created: number; updated: number; resolved: number }> {
    let created = 0;
    let updated = 0;
    let resolved = 0;
    let detected = 0;

    const todayStr = now.slice(0, 10);

    // Query open issued invoices
    const { data: invoices } = await this.supabase
      .from('invoices')
      .select('id, invoice_number, customer_id, due_date, document_status, total_minor')
      .eq('business_id', businessId)
      .eq('document_status', 'issued');

    // Query active invoice attention events
    const { data: activeEvents } = await this.supabase
      .from('business_attention_events')
      .select('*')
      .eq('business_id', businessId)
      .eq('source_type', 'invoice')
      .eq('status', 'active');

    const activeMap = new Map<string, any>();
    for (const e of activeEvents || []) {
      if (e.source_reference) {
        activeMap.set(e.source_reference, e);
      }
    }

    const currentOverdueIds = new Set<string>();

    for (const inv of invoices || []) {
      if (inv.due_date && inv.due_date < todayStr) {
        detected++;
        currentOverdueIds.add(inv.id);
        const dedupeKey = `${businessId}:invoice:${inv.id}`;
        const existing = activeMap.get(inv.id);

        const daysOverdue = Math.max(
          1,
          Math.floor((new Date(todayStr).getTime() - new Date(inv.due_date).getTime()) / 86400000)
        );
        const severity: BusinessAttentionSeverity = daysOverdue > 14 ? 'important' : 'attention';

        if (existing) {
          await this.supabase
            .from('business_attention_events')
            .update({
              severity,
              last_detected_at: now,
              updated_at: now,
              metadata: {
                invoiceNumber: inv.invoice_number,
                dueDate: inv.due_date,
                daysOverdue,
                totalMinor: inv.total_minor,
              },
            })
            .eq('id', existing.id);
          updated++;
        } else {
          await this.supabase.from('business_attention_events').insert({
            business_id: businessId,
            type: 'OVERDUE_INVOICES_PRESENT',
            category: 'STATEFUL',
            dedupe_key: dedupeKey,
            status: 'active',
            severity,
            first_detected_at: now,
            last_detected_at: now,
            source_type: 'invoice',
            source_reference: inv.id,
            metadata: {
              invoiceNumber: inv.invoice_number,
              dueDate: inv.due_date,
              daysOverdue,
              totalMinor: inv.total_minor,
            },
          });
          created++;
        }
      }
    }

    // Resolve any active invoice events that are no longer overdue (paid or voided)
    for (const [invId, evt] of activeMap.entries()) {
      if (!currentOverdueIds.has(invId)) {
        await this.supabase
          .from('business_attention_events')
          .update({
            status: 'resolved',
            resolved_at: now,
            updated_at: now,
          })
          .eq('id', evt.id);
        resolved++;
      }
    }

    return { detected, created, updated, resolved };
  }

  /**
   * Scans for pending AI Bookkeeper classification reviews.
   */
  private async scanBookkeeperConditions(
    businessId: string,
    now: string
  ): Promise<{ detected: number; created: number; updated: number; resolved: number }> {
    let created = 0;
    let updated = 0;
    let resolved = 0;
    let detected = 0;

    const { data: pending } = await this.supabase
      .from('ai_bookkeeping_classifications')
      .select('id, operation_kind, amount_minor, confidence_band, created_at')
      .eq('business_id', businessId)
      .eq('classification_status', 'pending_review');

    const pendingCount = (pending || []).length;
    const dedupeKey = `${businessId}:bookkeeper:pending`;

    const { data: existing } = await this.supabase
      .from('business_attention_events')
      .select('*')
      .eq('business_id', businessId)
      .eq('dedupe_key', dedupeKey)
      .eq('status', 'active')
      .maybeSingle();

    if (pendingCount > 0) {
      detected++;
      const severity: BusinessAttentionSeverity = pendingCount >= 5 ? 'attention' : 'info';

      if (existing) {
        await this.supabase
          .from('business_attention_events')
          .update({
            severity,
            last_detected_at: now,
            updated_at: now,
            metadata: {
              pendingCount,
              classificationIds: (pending || []).slice(0, 10).map((p) => p.id),
            },
          })
          .eq('id', existing.id);
        updated++;
      } else {
        await this.supabase.from('business_attention_events').insert({
          business_id: businessId,
          type: 'BOOKKEEPER_REVIEW_PENDING',
          category: 'STATEFUL',
          dedupe_key: dedupeKey,
          status: 'active',
          severity,
          first_detected_at: now,
          last_detected_at: now,
          source_type: 'bookkeeper',
          source_reference: 'pending_batch',
          metadata: {
            pendingCount,
            classificationIds: (pending || []).slice(0, 10).map((p) => p.id),
          },
        });
        created++;
      }
    } else if (existing) {
      await this.supabase
        .from('business_attention_events')
        .update({
          status: 'resolved',
          resolved_at: now,
          updated_at: now,
        })
        .eq('id', existing.id);
      resolved++;
    }

    return { detected, created, updated, resolved };
  }

  /**
   * Scans for stale Credit Passport condition.
   */
  private async scanPassportConditions(
    businessId: string,
    now: string
  ): Promise<{ detected: number; created: number; updated: number; resolved: number }> {
    let created = 0;
    let updated = 0;
    let resolved = 0;
    let detected = 0;

    const dedupeKey = `${businessId}:passport:stale`;

    const { data: latestSnapshot } = await this.supabase
      .from('credit_passport_snapshots')
      .select('id, passport_code, passport_version, created_at')
      .eq('business_id', businessId)
      .order('passport_version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: existing } = await this.supabase
      .from('business_attention_events')
      .select('*')
      .eq('business_id', businessId)
      .eq('dedupe_key', dedupeKey)
      .eq('status', 'active')
      .maybeSingle();

    let isStale = false;
    let ageDays = 0;

    if (latestSnapshot) {
      const snapDate = new Date(latestSnapshot.created_at);
      ageDays = Math.floor((new Date(now).getTime() - snapDate.getTime()) / 86400000);
      if (ageDays >= 30) {
        isStale = true;
      }
    }

    if (isStale) {
      detected++;
      if (existing) {
        await this.supabase
          .from('business_attention_events')
          .update({
            last_detected_at: now,
            updated_at: now,
            metadata: {
              passportCode: latestSnapshot?.passport_code,
              passportVersion: latestSnapshot?.passport_version,
              ageDays,
            },
          })
          .eq('id', existing.id);
        updated++;
      } else {
        await this.supabase.from('business_attention_events').insert({
          business_id: businessId,
          type: 'CREDIT_PASSPORT_STALE',
          category: 'STATEFUL',
          dedupe_key: dedupeKey,
          status: 'active',
          severity: 'info',
          first_detected_at: now,
          last_detected_at: now,
          source_type: 'credit_passport',
          source_reference: latestSnapshot?.passport_code || null,
          metadata: {
            passportCode: latestSnapshot?.passport_code,
            passportVersion: latestSnapshot?.passport_version,
            ageDays,
          },
        });
        created++;
      }
    } else if (existing) {
      await this.supabase
        .from('business_attention_events')
        .update({
          status: 'resolved',
          resolved_at: now,
          updated_at: now,
        })
        .eq('id', existing.id);
      resolved++;
    }

    return { detected, created, updated, resolved };
  }
}
