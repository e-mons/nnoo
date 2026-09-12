'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { initializeInventoryAction, adjustInventoryAction } from '@/lib/actions/inventory';
import { Loader2, PackagePlus, Settings2 } from 'lucide-react';

const formatMoney = (minor: number, currency: string = 'NGN') =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(minor / 100);

export function InventoryActionsClient({
  businessId,
  position,
  mode,
  currencyCode,
}: {
  businessId: string;
  position: any;
  mode: 'initialize' | 'adjust';
  currencyCode: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize fields
  const [initQty, setInitQty] = useState('');
  const [initCost, setInitCost] = useState('');

  // Adjust fields
  const [adjDelta, setAdjDelta] = useState('');
  const [adjCost, setAdjCost] = useState('');
  const [adjReason, setAdjReason] = useState('count');
  const [adjNotes, setAdjNotes] = useState('');

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await initializeInventoryAction(businessId, {
      catalogItemId: position.catalog_item_id,
      quantity: initQty,
      unitCostMinor: initCost,
      currencyCode,
      idempotencyKey: crypto.randomUUID(),
    });

    setIsSubmitting(false);
    if (res.error) {
      setError(typeof res.error === 'string' ? res.error : 'Validation failed.');
    } else {
      setIsOpen(false);
      router.refresh();
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await adjustInventoryAction(businessId, {
      catalogItemId: position.catalog_item_id,
      quantityDelta: adjDelta,
      unitCostMinor: adjCost || undefined,
      reasonCode: adjReason,
      notes: adjNotes || null,
      currencyCode,
      idempotencyKey: crypto.randomUUID(),
    });

    setIsSubmitting(false);
    if (res.error) {
      setError(typeof res.error === 'string' ? res.error : 'Validation failed.');
    } else {
      setIsOpen(false);
      setAdjDelta('');
      setAdjCost('');
      setAdjNotes('');
      router.refresh();
    }
  };

  return (
    <>
      <button
        onClick={() => { setError(null); setIsOpen(true); }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#B8F25C]/10 text-[#B8F25C] border border-[#B8F25C]/20 hover:bg-[#B8F25C]/20 rounded-lg text-xs font-medium transition-colors"
      >
        {mode === 'initialize' ? (
          <><PackagePlus className="w-3.5 h-3.5" /> Initialize</>
        ) : (
          <><Settings2 className="w-3.5 h-3.5" /> Adjust</>
        )}
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0A1C16] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">
                {mode === 'initialize' ? 'Initialize Inventory' : 'Adjust Stock'}
              </h2>
              <p className="text-white/60 text-sm mt-1">
                {position.catalog_items?.name || 'Product'}
              </p>
            </div>

            <form
              onSubmit={mode === 'initialize' ? handleInitialize : handleAdjust}
              className="p-6 space-y-4"
            >
              {mode === 'initialize' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Opening Quantity
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={initQty}
                      onChange={(e) => setInitQty(e.target.value)}
                      required
                      className="w-full bg-[#143628] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50"
                      placeholder="e.g. 100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Unit Cost (minor units)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={initCost}
                      onChange={(e) => setInitCost(e.target.value)}
                      required
                      className="w-full bg-[#143628] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50"
                      placeholder="e.g. 15000 (= ₦150.00)"
                    />
                    {initQty && initCost && (
                      <p className="text-xs text-white/50 mt-1">
                        Total opening value: {formatMoney(
                          Math.round(parseFloat(initQty) * parseInt(initCost, 10)),
                          currencyCode
                        )}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-white/60 mb-2">
                    Current: <span className="text-white font-mono">{parseFloat(position.quantity_on_hand)}</span> on hand,{' '}
                    <span className="text-white font-mono">{formatMoney(Number(position.inventory_value_minor), currencyCode)}</span> value
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Quantity Delta (+ to increase, − to decrease)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={adjDelta}
                      onChange={(e) => setAdjDelta(e.target.value)}
                      required
                      className="w-full bg-[#143628] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50"
                      placeholder="e.g. -5 or 10"
                    />
                  </div>
                  {adjDelta && parseFloat(adjDelta) > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-1">
                        Unit Cost for increase (minor units)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        value={adjCost}
                        onChange={(e) => setAdjCost(e.target.value)}
                        className="w-full bg-[#143628] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50"
                        placeholder="Cost per unit in minor"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Reason</label>
                    <select
                      value={adjReason}
                      onChange={(e) => setAdjReason(e.target.value)}
                      className="w-full bg-[#143628] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50 appearance-none"
                    >
                      <option value="count">Physical Count</option>
                      <option value="damaged">Damaged</option>
                      <option value="expired">Expired</option>
                      <option value="theft">Theft / Loss</option>
                      <option value="found">Found / Recovered</option>
                      <option value="correction">Correction</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">Notes</label>
                    <textarea
                      value={adjNotes}
                      onChange={(e) => setAdjNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-[#143628] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#B8F25C]/50"
                      placeholder="Optional notes"
                    />
                  </div>
                </>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center min-w-[100px] px-5 py-2.5 bg-[#B8F25C] text-[#0A1C16] rounded-xl text-sm font-bold hover:bg-[#a3d951] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'initialize' ? 'Initialize' : 'Apply'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
