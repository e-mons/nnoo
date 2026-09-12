'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Tag, 
  User, 
  Truck, 
  XCircle, 
  RefreshCw, 
  ExternalLink,
  Info,
  Plus,
  Trash2
} from 'lucide-react';
import type { 
  BookkeepingReviewDetail, 
  BookkeepingFinalOperationKind,
  BookkeepingRejectionReason
} from '@nnoo/contracts/ai';

interface ReviewDetailViewProps {
  classification: BookkeepingReviewDetail;
  businessId: string;
  businessSlug: string;
  categories: Array<{ id: string; name: string }>;
  suppliers: Array<{ id: string; name: string }>;
  customers: Array<{ id: string; name: string }>;
  catalogItems: Array<{ id: string; name: string; selling_price_minor?: number | null; cost_price_minor?: number | null }>;
  unpaidSales?: Array<{ id: string; sale_number?: string; total_minor: number; payment_status?: string; customers?: { name: string } | null }>;
  unpaidExpenses?: Array<{ id: string; expense_number?: string; total_minor: number; payment_status?: string; expense_categories?: { name: string } | null; suppliers?: { name: string } | null }>;
  unpaidStockReceipts?: Array<{ id: string; receipt_number?: string; total_minor: number; payment_status?: string; suppliers?: { name: string } | null }>;
}

const formatMoney = (minor?: number | null, currency: string = 'NGN') => {
  if (minor === undefined || minor === null) return '₦0.00';
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(minor / 100);
};

export function ReviewDetailView({
  classification,
  businessId,
  businessSlug,
  categories,
  suppliers,
  customers,
  catalogItems,
  unpaidSales = [],
  unpaidExpenses = [],
  unpaidStockReceipts = [],
}: ReviewDetailViewProps) {
  const router = useRouter();

  // Initial operation kind mapping
  const initialOp: BookkeepingFinalOperationKind =
    classification.operationKind === 'STOCK_PURCHASE'
      ? 'STOCK_PURCHASE'
      : classification.operationKind === 'CUSTOMER_PAYMENT'
      ? 'CUSTOMER_PAYMENT'
      : classification.operationKind === 'SUPPLIER_PAYMENT'
      ? 'SUPPLIER_PAYMENT'
      : classification.operationKind === 'SALE'
      ? 'SALE'
      : classification.operationKind === 'REFUND'
      ? 'REFUND'
      : 'OPERATING_EXPENSE';

  const [operationKind, setOperationKind] = useState<BookkeepingFinalOperationKind>(initialOp);

  // Common Form Fields
  const [description, setDescription] = useState(classification.description || '');
  const [amountStr, setAmountStr] = useState(
    classification.amountMinor ? (classification.amountMinor / 100).toString() : ''
  );
  const [occurredAt, setOccurredAt] = useState(
    classification.transactionDate || new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState(classification.paymentMethod || 'cash');
  const [isPaid, setIsPaid] = useState(true);
  const [notes, setNotes] = useState('');

  // Expense fields
  const [categoryId, setCategoryId] = useState(
    classification.categorySuggestion?.id || (categories.length > 0 ? categories[0].id : '')
  );
  const [supplierId, setSupplierId] = useState(classification.supplierSuggestion?.id || '');

  // Customer Payment fields
  const [selectedSaleId, setSelectedSaleId] = useState(unpaidSales.length > 0 ? unpaidSales[0].id : '');

  // Supplier Payment fields
  const [payableSourceType, setPayableSourceType] = useState<'EXPENSE' | 'STOCK_RECEIPT'>('EXPENSE');
  const [selectedExpensePayableId, setSelectedExpensePayableId] = useState(
    unpaidExpenses.length > 0 ? unpaidExpenses[0].id : ''
  );
  const [selectedStockPayableId, setSelectedStockPayableId] = useState(
    unpaidStockReceipts.length > 0 ? unpaidStockReceipts[0].id : ''
  );

  // Stock Purchase / Sale items
  const [stockItems, setStockItems] = useState<Array<{ catalogItemId: string; quantity: number; unitCostStr: string }>>([
    {
      catalogItemId: catalogItems.length > 0 ? catalogItems[0].id : '',
      quantity: 1,
      unitCostStr: catalogItems.length > 0 && catalogItems[0].cost_price_minor ? (catalogItems[0].cost_price_minor / 100).toString() : '0',
    },
  ]);

  const [saleItems, setSaleItems] = useState<Array<{ catalogItemId: string; quantity: number; unitPriceStr: string }>>([
    {
      catalogItemId: catalogItems.length > 0 ? catalogItems[0].id : '',
      quantity: 1,
      unitPriceStr: catalogItems.length > 0 && catalogItems[0].selling_price_minor ? (catalogItems[0].selling_price_minor / 100).toString() : '0',
    },
  ]);

  const [customerId, setCustomerId] = useState(classification.customerSuggestion?.id || '');

  // Modals & UI States
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<BookkeepingRejectionReason>('NOT_A_BUSINESS_TRANSACTION');
  const [rejectionNotes, setRejectionNotes] = useState('');

  const [showReclassifyModal, setShowReclassifyModal] = useState(false);
  const [reclassifyDesc, setReclassifyDesc] = useState(classification.description);
  const [reclassifyAmount, setReclassifyAmount] = useState(
    classification.amountMinor ? (classification.amountMinor / 100).toString() : ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [appliedResult, setAppliedResult] = useState<any>(classification.application || null);

  const isApplied = classification.classificationStatus === 'applied' || !!appliedResult;
  const isRejected = classification.classificationStatus === 'rejected';

  // Handler: Apply Transaction
  const handleApply = async () => {
    setIsSubmitting(true);
    setActionError(null);

    try {
      const parsedAmount = parseFloat(amountStr.replace(/[^0-9.]/g, ''));
      const amountMinor = !isNaN(parsedAmount) && parsedAmount > 0 ? Math.round(parsedAmount * 100) : 0;

      let payload: any = null;

      if (operationKind === 'OPERATING_EXPENSE') {
        if (!categoryId) throw new Error('Please select an expense category.');
        if (amountMinor <= 0) throw new Error('Please enter a valid expense amount.');

        payload = {
          amountMinor,
          expenseCategoryId: categoryId,
          description: description.trim() || 'Expense',
          occurredAt,
          supplierId: supplierId || null,
          payment: isPaid
            ? {
                amountMinor,
                paymentMethod,
                reference: classification.referenceText || null,
                notes: notes || null,
              }
            : null,
          notes: notes || null,
        };
      } else if (operationKind === 'STOCK_PURCHASE') {
        if (!supplierId) throw new Error('Please select a supplier.');
        if (stockItems.length === 0) throw new Error('Please add at least one product.');

        const validatedItems = stockItems.map((item) => {
          const cost = parseFloat(item.unitCostStr.replace(/[^0-9.]/g, ''));
          if (isNaN(cost) || cost <= 0) throw new Error('Please enter a valid unit cost for each item.');
          if (item.quantity <= 0) throw new Error('Quantity must be greater than 0.');
          return {
            catalogItemId: item.catalogItemId,
            quantity: item.quantity,
            unitCostMinor: Math.round(cost * 100),
          };
        });

        const totalCostMinor = validatedItems.reduce((acc, i) => acc + i.unitCostMinor * i.quantity, 0);

        payload = {
          supplierId,
          receivedAt: occurredAt,
          items: validatedItems,
          payment: isPaid
            ? {
                amountMinor: totalCostMinor,
                paymentMethod,
                reference: classification.referenceText || null,
                notes: notes || null,
              }
            : null,
          notes: notes || null,
        };
      } else if (operationKind === 'CUSTOMER_PAYMENT') {
        if (!selectedSaleId) throw new Error('Please select an outstanding sale/invoice.');
        if (amountMinor <= 0) throw new Error('Please enter payment amount.');

        payload = {
          saleId: selectedSaleId,
          amountMinor,
          paymentMethod,
          occurredAt,
          reference: classification.referenceText || null,
          notes: notes || null,
        };
      } else if (operationKind === 'SUPPLIER_PAYMENT') {
        const payableId = payableSourceType === 'EXPENSE' ? selectedExpensePayableId : selectedStockPayableId;
        if (!payableId) throw new Error('Please select an outstanding payable.');
        if (amountMinor <= 0) throw new Error('Please enter payment amount.');

        payload = {
          payableSourceType,
          payableId,
          amountMinor,
          paymentMethod,
          occurredAt,
          reference: classification.referenceText || null,
          notes: notes || null,
        };
      } else if (operationKind === 'SALE') {
        if (saleItems.length === 0) throw new Error('Please add at least one sale item.');

        const validatedItems = saleItems.map((item) => {
          const price = parseFloat(item.unitPriceStr.replace(/[^0-9.]/g, ''));
          if (isNaN(price) || price <= 0) throw new Error('Please enter a valid unit price.');
          if (item.quantity <= 0) throw new Error('Quantity must be greater than 0.');
          return {
            catalogItemId: item.catalogItemId,
            quantity: item.quantity,
            unitPriceMinor: Math.round(price * 100),
          };
        });

        const totalSaleMinor = validatedItems.reduce((acc, i) => acc + (i.unitPriceMinor || 0) * i.quantity, 0);

        payload = {
          customerId: customerId || null,
          occurredAt,
          items: validatedItems,
          payments: isPaid
            ? [
                {
                  amountMinor: totalSaleMinor,
                  paymentMethod,
                  reference: classification.referenceText || null,
                  notes: notes || null,
                },
              ]
            : [],
          staffNotes: notes || null,
        };
      } else {
        throw new Error(`Direct review application for ${operationKind} is not supported in this form.`);
      }

      const idempotencyKey = `apply_${classification.id}_${Date.now()}`;

      const res = await fetch(`/api/v1/ai/bookkeeper/reviews/${classification.id}/apply?businessId=${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classificationId: classification.id,
          finalOperationKind: operationKind,
          payload,
          idempotencyKey,
          businessId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to apply bookkeeping transaction.');
      }

      setAppliedResult(data);
    } catch (err: any) {
      setActionError(err.message || 'An error occurred while recording the transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Reject
  const handleReject = async () => {
    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/v1/ai/bookkeeper/reviews/${classification.id}/reject?businessId=${businessId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classificationId: classification.id,
          reasonCode: rejectionReason,
          notes: rejectionNotes.trim() || undefined,
          businessId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to reject classification.');
      }

      setShowRejectModal(false);
      router.push(`/app/${businessSlug}/bookkeeper`);
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject suggestion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Reclassify
  const handleReclassify = async () => {
    setIsSubmitting(true);
    setActionError(null);

    try {
      let amountMinor: number | null = null;
      if (reclassifyAmount.trim()) {
        const cleaned = reclassifyAmount.replace(/[^0-9.]/g, '');
        const parsedFloat = parseFloat(cleaned);
        if (!isNaN(parsedFloat) && parsedFloat > 0) {
          amountMinor = Math.round(parsedFloat * 100);
        }
      }

      const res = await fetch('/api/v1/ai/bookkeeper/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          description: reclassifyDesc.trim(),
          amountMinor,
          currencyCode: 'NGN',
          reclassifyFromId: classification.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Reclassification failed.');
      }

      setShowReclassifyModal(false);
      router.push(`/app/${businessSlug}/bookkeeper/${data.id}`);
    } catch (err: any) {
      setActionError(err.message || 'Failed to reclassify.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href={`/app/${businessSlug}/bookkeeper`}
        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to AI Bookkeeper</span>
      </Link>

      {/* Applied Banner */}
      {isApplied && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 backdrop-blur-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-white">Recorded in your books!</h3>
              <p className="text-sm text-emerald-300">
                This transaction has been successfully confirmed and applied to your canonical records.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {appliedResult?.canonicalTargetType === 'EXPENSE' && (
              <Link
                href={`/app/${businessSlug}/expenses/${appliedResult.canonicalTargetId}`}
                className="bg-emerald-500 text-[#0A1C16] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-400 transition-colors flex items-center gap-1.5"
              >
                <span>View Expense</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
            {appliedResult?.canonicalTargetType === 'SALE' && (
              <Link
                href={`/app/${businessSlug}/sales/${appliedResult.canonicalTargetId}`}
                className="bg-emerald-500 text-[#0A1C16] px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-400 transition-colors flex items-center gap-1.5"
              >
                <span>View Sale</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
            <Link
              href={`/app/${businessSlug}/bookkeeper`}
              className="bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/20 transition-colors"
            >
              Back to Inbox
            </Link>
          </div>
        </div>
      )}

      {/* Rejected Banner */}
      {isRejected && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-6 backdrop-blur-xl flex items-center gap-3">
          <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-white">Suggestion Rejected</h3>
            <p className="text-sm text-rose-300">
              This suggestion was dismissed. Zero journal or financial entries were created.
            </p>
          </div>
        </div>
      )}

      {/* Grid: Original Input & AI Suggestion */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: What was entered */}
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
              1. What was entered
            </h3>
            <span className="text-xs text-white/40 flex items-center gap-1" suppressHydrationWarning>
              <Clock className="w-3 h-3" />
              {new Date(classification.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs text-white/40 block">Description</span>
              <p className="text-base font-medium text-white">{classification.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <span className="text-xs text-white/40 block">Entered Amount</span>
                <p className="text-sm font-semibold text-white">
                  {classification.amountMinor ? formatMoney(classification.amountMinor) : 'Not specified'}
                </p>
              </div>
              <div>
                <span className="text-xs text-white/40 block">Direction</span>
                <p className="text-sm text-white">
                  {classification.transactionDirection === 'MONEY_OUT'
                    ? 'Money Out'
                    : classification.transactionDirection === 'MONEY_IN'
                    ? 'Money In'
                    : 'Unspecified'}
                </p>
              </div>
            </div>

            {classification.counterpartyText && (
              <div>
                <span className="text-xs text-white/40 block">Counterparty</span>
                <p className="text-sm text-white">{classification.counterpartyText}</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: AI Suggestion */}
        <div className="bg-[#143628]/60 border border-[#B8F25C]/30 rounded-3xl p-6 backdrop-blur-xl space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#B8F25C]/20 border border-[#B8F25C]/40 text-[#B8F25C] flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Suggestion
              </span>
            </div>
            <span
              className={`text-xs font-semibold ${
                classification.confidenceBand === 'HIGH'
                  ? 'text-[#B8F25C]'
                  : classification.confidenceBand === 'MEDIUM'
                  ? 'text-amber-300'
                  : 'text-rose-300'
              }`}
            >
              {classification.confidenceBand} Confidence
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs text-white/40 block">Suggested Operation</span>
              <p className="text-lg font-bold text-white">{classification.operationKind.replace('_', ' ')}</p>
            </div>

            <p className="text-xs text-white/70 bg-black/20 p-3 rounded-2xl border border-white/10">
              {classification.shortExplanation}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {classification.categorySuggestion && (
                <div>
                  <span className="text-xs text-white/40 block">Suggested Category</span>
                  <p className="text-sm text-white font-medium flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-[#B8F25C]" /> {classification.categorySuggestion.name}
                  </p>
                </div>
              )}
              {classification.supplierSuggestion && (
                <div>
                  <span className="text-xs text-white/40 block">Suggested Supplier</span>
                  <p className="text-sm text-white font-medium flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-blue-400" /> {classification.supplierSuggestion.name}
                  </p>
                </div>
              )}
              {classification.customerSuggestion && (
                <div>
                  <span className="text-xs text-white/40 block">Suggested Customer</span>
                  <p className="text-sm text-white font-medium flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-emerald-400" /> {classification.customerSuggestion.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Warnings & Missing Info */}
      {(classification.warningCodes.length > 0 || classification.missingFields.length > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 backdrop-blur-xl space-y-2">
          <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <span>Items requiring your attention</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-amber-200">
            {classification.missingFields.map((f, i) => (
              <div key={i} className="flex items-center gap-2 bg-black/20 p-2 rounded-xl">
                <Info className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>
                  {f === 'PRODUCT_LINES_REQUIRED'
                    ? 'Add the products or services involved.'
                    : f === 'CATEGORY_REVIEW_REQUIRED'
                    ? 'Select an expense category.'
                    : f === 'PAYABLE_SELECTION_REQUIRED'
                    ? 'Select the outstanding payable to settle.'
                    : f === 'SALE_SELECTION_REQUIRED'
                    ? 'Select the outstanding sale/invoice.'
                    : (f as string).replace('_', ' ')}
                </span>
              </div>
            ))}
            {classification.warningCodes.map((w, i) => (
              <div key={i} className="flex items-center gap-2 bg-black/20 p-2 rounded-xl">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>
                  {w === 'POSSIBLE_DUPLICATE'
                    ? 'Something similar may already have been recorded.'
                    : w === 'DIRECTION_CONFLICT'
                    ? 'Direction contradicted the suggested operation.'
                    : w.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Human Review & Completion Form */}
      {!isApplied && !isRejected && (
        <div className="bg-[#143628]/50 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-lg font-bold text-white">Review & Complete Details</h3>
            <p className="text-xs text-white/60 mt-0.5">
              Confirm or adjust the details below before saving to your official records.
            </p>
          </div>

          {/* Operation Kind Picker */}
          <div>
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
              Record as
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'OPERATING_EXPENSE', label: 'Operating Expense' },
                { id: 'STOCK_PURCHASE', label: 'Stock Purchase' },
                { id: 'CUSTOMER_PAYMENT', label: 'Customer Payment' },
                { id: 'SUPPLIER_PAYMENT', label: 'Supplier Payment' },
                { id: 'SALE', label: 'Sale' },
              ].map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setOperationKind(op.id as BookkeepingFinalOperationKind)}
                  className={`p-3 rounded-2xl text-xs font-medium border text-left transition-colors ${
                    operationKind === op.id
                      ? 'bg-[#B8F25C]/20 border-[#B8F25C] text-[#B8F25C]'
                      : 'bg-black/20 border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Operation Form */}
          <div className="space-y-4 pt-2">
            {/* OPERATING EXPENSE FORM */}
            {operationKind === 'OPERATING_EXPENSE' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/60 mb-1">Expense Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#B8F25C]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#0A1C16]">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1">Amount (₦) *</label>
                  <input
                    type="text"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    placeholder="75,000"
                    className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#B8F25C]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1">Supplier (Optional)</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#B8F25C]"
                  >
                    <option value="" className="bg-[#0A1C16]">None</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#0A1C16]">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1">Date</label>
                  <input
                    type="date"
                    value={occurredAt}
                    onChange={(e) => setOccurredAt(e.target.value)}
                    className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#B8F25C]"
                  />
                </div>
              </div>
            )}

            {/* STOCK PURCHASE FORM */}
            {operationKind === 'STOCK_PURCHASE' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Supplier *</label>
                    <select
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#B8F25C]"
                    >
                      <option value="" className="bg-[#0A1C16]">Select Supplier</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id} className="bg-[#0A1C16]">
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Received Date</label>
                    <input
                      type="date"
                      value={occurredAt}
                      onChange={(e) => setOccurredAt(e.target.value)}
                      className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#B8F25C]"
                    />
                  </div>
                </div>

                {/* Stock Items Line Table */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-white/70">Products Received *</span>
                    <button
                      type="button"
                      onClick={() =>
                        setStockItems([
                          ...stockItems,
                          {
                            catalogItemId: catalogItems.length > 0 ? catalogItems[0].id : '',
                            quantity: 1,
                            unitCostStr: '0',
                          },
                        ])
                      }
                      className="text-xs text-[#B8F25C] flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Product
                    </button>
                  </div>

                  {stockItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-black/20 p-2.5 rounded-2xl border border-white/10">
                      <select
                        value={item.catalogItemId}
                        onChange={(e) => {
                          const updated = [...stockItems];
                          updated[idx].catalogItemId = e.target.value;
                          setStockItems(updated);
                        }}
                        className="flex-1 bg-black/40 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      >
                        {catalogItems.map((catItem) => (
                          <option key={catItem.id} value={catItem.id} className="bg-[#0A1C16]">
                            {catItem.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...stockItems];
                          updated[idx].quantity = parseInt(e.target.value, 10) || 1;
                          setStockItems(updated);
                        }}
                        placeholder="Qty"
                        className="w-16 bg-black/40 border border-white/15 rounded-xl px-2 py-1.5 text-xs text-white text-center"
                      />
                      <input
                        type="text"
                        value={item.unitCostStr}
                        onChange={(e) => {
                          const updated = [...stockItems];
                          updated[idx].unitCostStr = e.target.value;
                          setStockItems(updated);
                        }}
                        placeholder="Unit Cost"
                        className="w-24 bg-black/40 border border-white/15 rounded-xl px-2 py-1.5 text-xs text-white text-right"
                      />
                      {stockItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setStockItems(stockItems.filter((_, i) => i !== idx))}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CUSTOMER PAYMENT FORM */}
            {operationKind === 'CUSTOMER_PAYMENT' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Outstanding Sale / Invoice *</label>
                    <select
                      value={selectedSaleId}
                      onChange={(e) => {
                        setSelectedSaleId(e.target.value);
                        const s = unpaidSales.find((x) => x.id === e.target.value);
                        if (s) {
                          setAmountStr((s.total_minor / 100).toString());
                        }
                      }}
                      className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#B8F25C]"
                    >
                      {unpaidSales.length === 0 ? (
                        <option value="" className="bg-[#0A1C16]">No outstanding sales found</option>
                      ) : (
                        unpaidSales.map((s) => (
                          <option key={s.id} value={s.id} className="bg-[#0A1C16]">
                            {s.sale_number} — {s.customers?.name || 'Walk-in'} ({formatMoney(s.total_minor)})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-white/60 mb-1">Amount Paid (₦) *</label>
                    <input
                      type="text"
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                      placeholder="50,000"
                      className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#B8F25C]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SUPPLIER PAYMENT FORM */}
            {operationKind === 'SUPPLIER_PAYMENT' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPayableSourceType('EXPENSE')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border ${
                      payableSourceType === 'EXPENSE'
                        ? 'bg-[#B8F25C]/20 border-[#B8F25C] text-[#B8F25C]'
                        : 'bg-black/20 border-white/10 text-white/60'
                    }`}
                  >
                    Expense Payable
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayableSourceType('STOCK_RECEIPT')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border ${
                      payableSourceType === 'STOCK_RECEIPT'
                        ? 'bg-[#B8F25C]/20 border-[#B8F25C] text-[#B8F25C]'
                        : 'bg-black/20 border-white/10 text-white/60'
                    }`}
                  >
                    Stock Purchase Payable
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-white/60 mb-1">Select Payable *</label>
                  {payableSourceType === 'EXPENSE' ? (
                    <select
                      value={selectedExpensePayableId}
                      onChange={(e) => {
                        setSelectedExpensePayableId(e.target.value);
                        const exp = unpaidExpenses.find((x) => x.id === e.target.value);
                        if (exp) setAmountStr((exp.total_minor / 100).toString());
                      }}
                      className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#B8F25C]"
                    >
                      {unpaidExpenses.length === 0 ? (
                        <option value="" className="bg-[#0A1C16]">No outstanding expense payables</option>
                      ) : (
                        unpaidExpenses.map((exp) => (
                          <option key={exp.id} value={exp.id} className="bg-[#0A1C16]">
                            {exp.expense_number} — {exp.suppliers?.name || exp.expense_categories?.name} ({formatMoney(exp.total_minor)})
                          </option>
                        ))
                      )}
                    </select>
                  ) : (
                    <select
                      value={selectedStockPayableId}
                      onChange={(e) => {
                        setSelectedStockPayableId(e.target.value);
                        const rec = unpaidStockReceipts.find((x) => x.id === e.target.value);
                        if (rec) setAmountStr((rec.total_minor / 100).toString());
                      }}
                      className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#B8F25C]"
                    >
                      {unpaidStockReceipts.length === 0 ? (
                        <option value="" className="bg-[#0A1C16]">No outstanding stock payables</option>
                      ) : (
                        unpaidStockReceipts.map((rec) => (
                          <option key={rec.id} value={rec.id} className="bg-[#0A1C16]">
                            {rec.receipt_number} — {rec.suppliers?.name} ({formatMoney(rec.total_minor)})
                          </option>
                        ))
                      )}
                    </select>
                  )}
                </div>
              </div>
            )}

            {/* SALE FORM */}
            {operationKind === 'SALE' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Customer (Optional for Walk-in)</label>
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#B8F25C]"
                    >
                      <option value="" className="bg-[#0A1C16]">Walk-in Customer</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id} className="bg-[#0A1C16]">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Date</label>
                    <input
                      type="date"
                      value={occurredAt}
                      onChange={(e) => setOccurredAt(e.target.value)}
                      className="w-full bg-black/30 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#B8F25C]"
                    />
                  </div>
                </div>

                {/* Sale Items Line Table */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-white/70">Products Sold *</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSaleItems([
                          ...saleItems,
                          {
                            catalogItemId: catalogItems.length > 0 ? catalogItems[0].id : '',
                            quantity: 1,
                            unitPriceStr: '0',
                          },
                        ])
                      }
                      className="text-xs text-[#B8F25C] flex items-center gap-1 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Product
                    </button>
                  </div>

                  {saleItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-black/20 p-2.5 rounded-2xl border border-white/10">
                      <select
                        value={item.catalogItemId}
                        onChange={(e) => {
                          const updated = [...saleItems];
                          updated[idx].catalogItemId = e.target.value;
                          setSaleItems(updated);
                        }}
                        className="flex-1 bg-black/40 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                      >
                        {catalogItems.map((catItem) => (
                          <option key={catItem.id} value={catItem.id} className="bg-[#0A1C16]">
                            {catItem.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...saleItems];
                          updated[idx].quantity = parseInt(e.target.value, 10) || 1;
                          setSaleItems(updated);
                        }}
                        placeholder="Qty"
                        className="w-16 bg-black/40 border border-white/15 rounded-xl px-2 py-1.5 text-xs text-white text-center"
                      />
                      <input
                        type="text"
                        value={item.unitPriceStr}
                        onChange={(e) => {
                          const updated = [...saleItems];
                          updated[idx].unitPriceStr = e.target.value;
                          setSaleItems(updated);
                        }}
                        placeholder="Price"
                        className="w-24 bg-black/40 border border-white/15 rounded-xl px-2 py-1.5 text-xs text-white text-right"
                      />
                      {saleItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSaleItems(saleItems.filter((_, i) => i !== idx))}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Method / Settlement toggle */}
            {(operationKind === 'OPERATING_EXPENSE' || operationKind === 'STOCK_PURCHASE' || operationKind === 'SALE') && (
              <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="rounded border-white/20 text-[#B8F25C] focus:ring-[#B8F25C]"
                  />
                  <span>Mark as fully paid now</span>
                </label>

                {isPaid && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/60">Method:</span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="bg-black/30 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="card">Card / POS</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {actionError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
              {actionError}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => setShowReclassifyModal(true)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reclassify</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleApply}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-2xl font-bold bg-[#B8F25C] text-[#0A1C16] hover:bg-[#a3d951] disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#0A1C16] border-t-transparent" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {operationKind === 'OPERATING_EXPENSE'
                      ? 'Record Expense'
                      : operationKind === 'STOCK_PURCHASE'
                      ? 'Create Stock Purchase'
                      : operationKind === 'CUSTOMER_PAYMENT'
                      ? 'Apply Customer Payment'
                      : operationKind === 'SUPPLIER_PAYMENT'
                      ? 'Record Supplier Payment'
                      : 'Record Sale'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A1C16] border border-white/20 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Reject AI Suggestion</h3>
            <p className="text-xs text-white/60">
              Rejecting this suggestion will mark it as dismissed. Zero financial records or journal entries will be created.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-white/60 mb-1">Reason</label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value as BookkeepingRejectionReason)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 text-sm text-white"
                >
                  <option value="NOT_A_BUSINESS_TRANSACTION">Not a business transaction (Personal)</option>
                  <option value="DUPLICATE">Duplicate of an existing transaction</option>
                  <option value="INCORRECT_SUGGESTION">Incorrect classification</option>
                  <option value="NO_LONGER_NEEDED">No longer needed</option>
                  <option value="TEST_OR_ERROR">Test entry or mistake</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-white/60 mb-1">Optional Note</label>
                <input
                  type="text"
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="e.g. Personal lunch"
                  className="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 text-sm text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECLASSIFY MODAL */}
      {showReclassifyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A1C16] border border-white/20 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Reclassify with AI</h3>
            <p className="text-xs text-white/60">
              Edit the description or amount below to request a new AI classification. The previous suggestion will be preserved.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-white/60 mb-1">Description</label>
                <textarea
                  value={reclassifyDesc}
                  onChange={(e) => setReclassifyDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-white/60 mb-1">Amount (₦)</label>
                <input
                  type="text"
                  value={reclassifyAmount}
                  onChange={(e) => setReclassifyAmount(e.target.value)}
                  className="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 text-sm text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReclassifyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReclassify}
                disabled={isSubmitting || !reclassifyDesc.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#B8F25C] text-[#0A1C16] hover:bg-[#a3d951] transition-colors"
              >
                {isSubmitting ? 'Reclassifying...' : 'Reclassify Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
