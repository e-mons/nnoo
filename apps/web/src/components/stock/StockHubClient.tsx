'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  Tag, 
  Layers, 
  TrendingDown, 
  Edit, 
  ArrowUpRight,
  Boxes,
  CheckCircle2
} from 'lucide-react';
import { InventoryActionsClient } from '@/components/inventory/InventoryActionsClient';

interface StockHubProps {
  businessId: string;
  businessSlug: string;
  currencyCode: string;
  initialTab?: string;
  catalogItems: any[];
  inventoryPositions: any[];
  categories: any[];
}

export function StockHubClient({
  businessId,
  businessSlug,
  currencyCode = 'NGN',
  initialTab = 'items',
  catalogItems = [],
  inventoryPositions = [],
  categories = [],
}: StockHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || initialTab;

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'service'>('all');

  const setTab = (tab: string) => {
    router.replace(`/app/${businessSlug}/stock?tab=${tab}`, { scroll: false });
  };

  const formatMoney = (minor: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(minor / 100);
  };

  // Build merged items where catalog item has its linked inventory position
  const positionMap = new Map<string, any>();
  inventoryPositions.forEach((pos) => {
    if (pos.catalog_item_id) {
      positionMap.set(pos.catalog_item_id, pos);
    }
  });

  const mergedItems = catalogItems.map((item) => {
    const position = positionMap.get(item.id);
    const qty = position ? parseFloat(position.quantity_on_hand) || 0 : 0;
    const isPending = position?.status === 'pending_initialization';
    const isLowStock = item.trackInventory && qty <= (item.lowStockThreshold || 5);
    const isOutOfStock = item.trackInventory && qty <= 0;

    return {
      ...item,
      position,
      quantityOnHand: qty,
      isPending,
      isLowStock,
      isOutOfStock,
    };
  });

  const lowStockItems = mergedItems.filter((i) => i.isLowStock || i.isPending);

  const totalStockValueMinor = inventoryPositions
    .filter((p) => p.status === 'initialized')
    .reduce((sum, p) => sum + (Number(p.inventory_value_minor) || 0), 0);

  const totalUnits = inventoryPositions
    .filter((p) => p.status === 'initialized')
    .reduce((sum, p) => sum + (parseFloat(p.quantity_on_hand) || 0), 0);

  // Search and type filtering
  const filteredItems = mergedItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.barcode && item.barcode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'all' || item.itemType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header & Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8F25C]/10 border border-[#B8F25C]/20 text-[#B8F25C] text-xs font-semibold mb-2">
            <Boxes className="w-3.5 h-3.5" />
            Inventory & Store Shelves
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Items & Stock</h1>
          <p className="text-white/60 text-sm mt-1">
            Manage your products, set selling prices, and track live stock counts in real time.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Link
            href={`/app/${businessSlug}/products/new`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#B8F25C] hover:bg-[#A3D94E] text-[#0A1C16] font-bold text-sm shadow-lg shadow-[#B8F25C]/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Add New Item</span>
          </Link>

          <Link
            href={`/app/${businessSlug}/inventory/receipts/new`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold text-sm transition-all"
          >
            <ArrowUpRight className="w-4 h-4 text-[#B8F25C]" />
            <span>+ Receive Stock Shipment</span>
          </Link>
        </div>
      </div>

      {/* Urgent Attention Banner for Low Stock */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-200">
                ⚠️ {lowStockItems.length} item(s) need replenishment!
              </h3>
              <p className="text-xs text-amber-300/70 mt-0.5">
                Some items are running out of stock or need their opening quantities set.
              </p>
            </div>
          </div>
          <button
            onClick={() => setTab('low-stock')}
            className="px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl hover:bg-amber-400 transition shrink-0"
          >
            View Urgent Items ({lowStockItems.length})
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Total Items for Sale</span>
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2 tabular-nums">{catalogItems.length}</p>
          <p className="text-xs text-white/50 mt-1 font-medium">Products & services listed</p>
        </div>

        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Total Units on Hand</span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mt-2 tabular-nums">
            {totalUnits % 1 === 0 ? totalUnits.toFixed(0) : totalUnits.toFixed(2)}
          </p>
          <p className="text-xs text-white/50 mt-1 font-medium">Counted across all shelves</p>
        </div>

        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Total Stock Value</span>
            <div className="p-2 rounded-xl bg-[#B8F25C]/20 text-[#B8F25C]">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#B8F25C] mt-2 tabular-nums">
            {formatMoney(totalStockValueMinor)}
          </p>
          <p className="text-xs text-white/50 mt-1 font-medium">Cost value of all stored units</p>
        </div>

        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Low / Out of Stock</span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-300">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-300 mt-2 tabular-nums">
            {lowStockItems.length}
          </p>
          <p className="text-xs text-white/50 mt-1 font-medium">Items that need ordering soon</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar p-1.5 bg-black/30 border border-white/10 rounded-2xl">
          <button
            onClick={() => setTab('items')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'items'
                ? 'bg-[#B8F25C] text-[#0A1C16] shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            📦 All Items & Prices ({catalogItems.length})
          </button>
          <button
            onClick={() => setTab('low-stock')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'low-stock'
                ? 'bg-[#B8F25C] text-[#0A1C16] shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            ⚠️ Low Stock Alert ({lowStockItems.length})
          </button>
          <button
            onClick={() => setTab('categories')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-[#B8F25C] text-[#0A1C16] shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            🏷️ Categories ({categories.length})
          </button>
          <button
            onClick={() => setTab('receipts')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'receipts'
                ? 'bg-[#B8F25C] text-[#0A1C16] shadow'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            🚚 Stock Receipts & History
          </button>
        </div>

        {/* TAB 1: ALL ITEMS & PRICES */}
        {activeTab === 'items' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search item name, SKU, barcode..."
                  className="w-full bg-[#143628]/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#B8F25C]/50"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    typeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  All Types
                </button>
                <button
                  onClick={() => setTypeFilter('product')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    typeFilter === 'product' ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  Products
                </button>
                <button
                  onClick={() => setTypeFilter('service')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    typeFilter === 'service' ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  Services
                </button>
              </div>
            </div>

            {/* Catalog & Live Inventory Table */}
            <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
              {filteredItems.length === 0 ? (
                <div className="p-16 text-center">
                  <Package className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white">No items found</h3>
                  <p className="text-white/50 text-sm mt-1 max-w-sm mx-auto">
                    Add your first product or service to begin tracking prices and inventory.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-white/50 uppercase bg-black/20">
                      <tr>
                        <th className="px-6 py-4">Item Name</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Selling Price</th>
                        <th className="px-6 py-4">Cost Price</th>
                        <th className="px-6 py-4">Stock on Hand</th>
                        <th className="px-6 py-4 text-right">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-white">{item.name}</div>
                            {(item.sku || item.barcode) && (
                              <div className="text-xs text-white/40 mt-0.5">
                                {item.sku ? `SKU: ${item.sku}` : ''}
                                {item.sku && item.barcode ? ' • ' : ''}
                                {item.barcode ? `Bar: ${item.barcode}` : ''}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-md font-semibold capitalize ${
                                item.itemType === 'product'
                                  ? 'bg-blue-500/15 text-blue-300'
                                  : 'bg-purple-500/15 text-purple-300'
                              }`}
                            >
                              {item.itemType}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-white">
                            {formatMoney(Number(item.sellingPriceMinor))}
                          </td>
                          <td className="px-6 py-4 text-white/60">
                            {item.costPriceMinor ? formatMoney(Number(item.costPriceMinor)) : '—'}
                          </td>
                          <td className="px-6 py-4">
                            {item.trackInventory ? (
                              item.isPending ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-1 rounded-md">
                                  <AlertTriangle className="w-3 h-3" /> Awaiting Initial Stock
                                </span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-sm font-bold tabular-nums ${
                                      item.isOutOfStock
                                        ? 'text-rose-400'
                                        : item.isLowStock
                                        ? 'text-amber-400'
                                        : 'text-emerald-400'
                                    }`}
                                  >
                                    {item.quantityOnHand % 1 === 0
                                      ? item.quantityOnHand.toFixed(0)
                                      : item.quantityOnHand.toFixed(2)}{' '}
                                    {item.unitCode || 'units'}
                                  </span>
                                  {item.isLowStock && (
                                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                                      Low
                                    </span>
                                  )}
                                </div>
                              )
                            ) : (
                              <span className="text-xs text-white/30 italic">Not tracked</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              {item.trackInventory && item.position && (
                                <InventoryActionsClient
                                  businessId={businessSlug}
                                  position={item.position}
                                  mode={item.isPending ? 'initialize' : 'adjust'}
                                  currencyCode={currencyCode}
                                />
                              )}
                              <Link
                                href={`/app/${businessSlug}/products/${item.id}/edit`}
                                className="p-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg transition"
                                title="Edit Item Details"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LOW STOCK URGENT ITEMS */}
        {activeTab === 'low-stock' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white">Items Running Out of Stock</h2>
                <p className="text-xs text-white/50">These items have low or zero units on hand</p>
              </div>
              <Link
                href={`/app/${businessSlug}/inventory/receipts/new`}
                className="px-4 py-2 bg-[#B8F25C] text-[#0A1C16] font-bold rounded-xl text-xs hover:bg-[#A3D94E] transition"
              >
                + Receive Shipment
              </Link>
            </div>

            <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
              {lowStockItems.length === 0 ? (
                <div className="p-16 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white">All shelves are healthy!</h3>
                  <p className="text-white/50 text-sm mt-1">No items currently below low stock thresholds.</p>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-white/50 uppercase bg-black/20">
                      <tr>
                        <th className="px-6 py-4">Item Name</th>
                        <th className="px-6 py-4">SKU</th>
                        <th className="px-6 py-4">Remaining Units</th>
                        <th className="px-6 py-4">Selling Price</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {lowStockItems.map((item) => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-bold text-white">{item.name}</td>
                          <td className="px-6 py-4 text-white/60">{item.sku || '—'}</td>
                          <td className="px-6 py-4">
                            <span className="text-amber-400 font-bold text-base">
                              {item.quantityOnHand} units
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-white">
                            {formatMoney(Number(item.sellingPriceMinor))}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {item.position && (
                              <InventoryActionsClient
                                businessId={businessSlug}
                                position={item.position}
                                mode={item.isPending ? 'initialize' : 'adjust'}
                                currencyCode={currencyCode}
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white">Product Categories</h2>
                <p className="text-xs text-white/50">Organize your store catalog into sections</p>
              </div>
              <Link
                href={`/app/${businessSlug}/products/categories`}
                className="px-4 py-2 bg-[#B8F25C] text-[#0A1C16] font-bold rounded-xl text-xs hover:bg-[#A3D94E] transition"
              >
                Manage Categories
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.length === 0 ? (
                <div className="col-span-full p-12 text-center text-white/50 bg-[#143628]/40 border border-white/10 rounded-3xl">
                  No categories created yet.
                </div>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-5 bg-[#143628]/40 border border-white/10 rounded-2xl backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#B8F25C]" />
                      <h3 className="font-bold text-white text-base">{cat.name}</h3>
                    </div>
                    {cat.description && (
                      <p className="text-xs text-white/60 mt-1">{cat.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: STOCK RECEIPTS */}
        {activeTab === 'receipts' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white">Stock Delivery Receipts</h2>
                <p className="text-xs text-white/50">Log of received shipments and additions</p>
              </div>
              <Link
                href={`/app/${businessSlug}/inventory/receipts/new`}
                className="px-4 py-2 bg-[#B8F25C] text-[#0A1C16] font-bold rounded-xl text-xs hover:bg-[#A3D94E] transition"
              >
                + New Stock Receipt
              </Link>
            </div>

            <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-xl">
              <Boxes className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/70 text-sm">
                Receive incoming inventory batches from suppliers with full line-item inspection.
              </p>
              <Link
                href={`/app/${businessSlug}/inventory/receipts`}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition"
              >
                View Complete Delivery History →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
