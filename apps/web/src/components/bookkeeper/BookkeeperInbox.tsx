'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Search, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import type { BookkeepingInboxItem } from '@nnoo/contracts/ai';

interface BookkeeperInboxProps {
  businessId: string;
  businessSlug: string;
}

const formatMoney = (minor?: number | null, currency: string = 'NGN') => {
  if (minor === undefined || minor === null) return null;
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(minor / 100);
};

const getOperationBadge = (op: string) => {
  switch (op) {
    case 'OPERATING_EXPENSE':
      return { label: 'Expense', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    case 'STOCK_PURCHASE':
      return { label: 'Stock Purchase', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
    case 'CUSTOMER_PAYMENT':
      return { label: 'Customer Payment', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    case 'SUPPLIER_PAYMENT':
      return { label: 'Supplier Payment', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
    case 'SALE':
      return { label: 'Sale', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30' };
    case 'REFUND':
      return { label: 'Refund', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
    case 'UNSUPPORTED':
      return { label: 'Unsupported', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' };
    default:
      return { label: 'Unknown', color: 'bg-white/10 text-white/60 border-white/20' };
  }
};

const getConfidenceBadge = (confidence: string) => {
  switch (confidence) {
    case 'HIGH':
      return { label: 'High Confidence', color: 'text-[#B8F25C]' };
    case 'MEDIUM':
      return { label: 'Medium Confidence', color: 'text-amber-300' };
    default:
      return { label: 'Low Confidence', color: 'text-rose-300' };
  }
};

export function BookkeeperInbox({ businessId, businessSlug }: BookkeeperInboxProps) {
  const [activeTab, setActiveTab] = useState<'pending_review' | 'applied' | 'rejected' | 'all'>('pending_review');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<BookkeepingInboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        businessId,
        page: '1',
        limit: '50',
      });
      if (activeTab !== 'all') {
        params.append('status', activeTab);
      }
      if (search.trim()) {
        params.append('search', search.trim());
      }

      const res = await fetch(`/api/v1/ai/bookkeeper/reviews?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to fetch items');
      }
      setItems(data.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load inbox items.');
    } finally {
      setIsLoading(false);
    }
  }, [businessId, activeTab, search]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Status Tabs */}
        <div className="flex bg-black/30 border border-white/10 rounded-2xl p-1">
          <button
            onClick={() => setActiveTab('pending_review')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'pending_review'
                ? 'bg-[#B8F25C] text-[#0A1C16] shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Needs Review
          </button>
          <button
            onClick={() => setActiveTab('applied')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'applied'
                ? 'bg-[#B8F25C] text-[#0A1C16] shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Applied
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'rejected'
                ? 'bg-[#B8F25C] text-[#0A1C16] shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-[#B8F25C] text-[#0A1C16] shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            All
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suggestions..."
            className="w-full bg-black/30 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#B8F25C]"
          />
        </div>
      </div>

      {/* Item List */}
      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl divide-y divide-white/10">
        {isLoading ? (
          <div className="p-12 text-center text-white/50">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#B8F25C]" />
            <span>Loading bookkeeping suggestions...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">
            <p>{error}</p>
            <button onClick={fetchItems} className="mt-2 text-sm text-[#B8F25C] underline">
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-white/50 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-[#B8F25C]/60" />
            <h3 className="text-lg font-semibold text-white">No bookkeeping items need your review.</h3>
            <p className="text-sm text-white/60 max-w-md mx-auto">
              {activeTab === 'pending_review'
                ? 'All AI suggestions have been reviewed and recorded. Use the Quick Capture form above to record new transactions.'
                : 'No records match the current filter.'}
            </p>
          </div>
        ) : (
          items.map((item) => {
            const badge = getOperationBadge(item.operationKind);
            const confidence = getConfidenceBadge(item.confidenceBand);
            const isNeedsReview = item.classificationStatus === 'pending_review';

            return (
              <Link
                key={item.id}
                href={`/app/${businessSlug}/bookkeeper/${item.id}`}
                className="block p-5 sm:p-6 hover:bg-white/5 transition-colors group"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-white/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className={`text-xs font-medium ${confidence.color}`}>
                        {confidence.label}
                      </span>
                      {item.warningCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{item.warningCount} warning{item.warningCount > 1 ? 's' : ''}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-base font-medium text-white group-hover:text-[#B8F25C] transition-colors truncate">
                      {item.description}
                    </p>

                    <p className="text-xs text-white/60 line-clamp-1">
                      {item.shortExplanation}
                    </p>
                  </div>

                  <div className="flex sm:flex-col sm:items-end justify-between items-center shrink-0">
                    {item.amountMinor !== null && item.amountMinor !== undefined ? (
                      <span className="text-lg font-bold text-white">
                        {formatMoney(item.amountMinor, item.currencyCode)}
                      </span>
                    ) : (
                      <span className="text-xs text-white/40 italic">No amount</span>
                    )}

                    <div className="mt-1 flex items-center gap-1 text-xs font-medium">
                      {isNeedsReview ? (
                        <span className="text-[#B8F25C] flex items-center gap-0.5 group-hover:underline">
                          Review & Record <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      ) : item.classificationStatus === 'applied' ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Applied
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
