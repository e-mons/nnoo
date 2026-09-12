'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ProductCategory, ItemType, CatalogItem } from '@nnoo/validation';
import { createCatalogItem, updateCatalogItem } from '@/lib/actions/catalog';

export function CatalogItemForm({
  businessId,
  businessSlug,
  categories,
  initialData,
}: {
  businessId: string;
  businessSlug: string;
  categories: ProductCategory[];
  initialData?: CatalogItem;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [itemType, setItemType] = useState<ItemType>(initialData?.itemType || 'product');

  async function handleSubmit(formData: FormData) {
    setError(null);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const categoryId = formData.get('categoryId') as string;
    const unitCode = formData.get('unitCode') as string;
    const sku = formData.get('sku') as string;
    const barcode = formData.get('barcode') as string;
    
    // UI collects major units (e.g. 1500.50). Convert to minor (150050)
    const sellingPriceMajor = formData.get('sellingPrice') as string;
    const costPriceMajor = formData.get('costPrice') as string;

    const sellingPriceMinor = Math.round(parseFloat(sellingPriceMajor) * 100).toString();
    const costPriceMinor = costPriceMajor ? Math.round(parseFloat(costPriceMajor) * 100).toString() : null;
    
    const trackInventory = formData.get('trackInventory') === 'on';

    startTransition(async () => {
      const payload = {
        itemType,
        name,
        description: description || null,
        categoryId: categoryId || null,
        unitCode,
        sku: sku || null,
        barcode: barcode || null,
        sellingPriceMinor,
        costPriceMinor,
        trackInventory: itemType === 'service' ? false : trackInventory,
      };

      let result;
      if (initialData) {
        result = await updateCatalogItem(businessId, initialData.id, payload);
      } else {
        result = await createCatalogItem(businessId, payload);
      }

      if (result.success) {
        router.push(`/app/${businessSlug}/products`);
        router.refresh();
      } else {
        setError(result.error || 'Failed to save item');
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-[#143628]/40 border border-white/10 rounded-2xl p-6 backdrop-blur-xl space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Item Type</label>
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value as ItemType)}
              disabled={!!initialData} // Cannot change type after creation easily
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50 appearance-none disabled:opacity-50"
            >
              <option value="product">Product</option>
              <option value="service">Service</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Name *</label>
            <input
              name="name"
              type="text"
              required
              defaultValue={initialData?.name}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50"
              placeholder="e.g. Premium Consulting"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">Description</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={initialData?.description || ''}
            className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50"
            placeholder="Item details..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Category</label>
            <select
              name="categoryId"
              defaultValue={initialData?.categoryId || ''}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50 appearance-none"
            >
              <option value="">No Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Unit Code *</label>
            <input
              name="unitCode"
              type="text"
              required
              defaultValue={initialData?.unitCode || 'item'}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">SKU</label>
            <input
              name="sku"
              type="text"
              defaultValue={initialData?.sku || ''}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Selling Price *</label>
            <input
              name="sellingPrice"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={initialData ? (Number(initialData.sellingPriceMinor) / 100).toFixed(2) : ''}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Cost Price</label>
            <input
              name="costPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={initialData?.costPriceMinor ? (Number(initialData.costPriceMinor) / 100).toFixed(2) : ''}
              className="w-full bg-[#0A1C16] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#B8F25C]/50"
              placeholder="0.00"
            />
          </div>
        </div>

        {itemType === 'product' && (
          <div>
            <label className="flex items-center gap-3 cursor-pointer p-4 bg-[#0A1C16] rounded-xl border border-white/10">
              <input
                type="checkbox"
                name="trackInventory"
                defaultChecked={initialData?.trackInventory}
                className="w-5 h-5 accent-[#B8F25C] rounded border-white/20 bg-transparent"
              />
              <span className="text-sm font-medium text-white">Track Inventory (Stock Management)</span>
            </label>
            <p className="text-xs text-white/40 mt-2 px-1">
              Do not fake stock numbers here. Inventory amounts are managed separately.
            </p>
          </div>
        )}

      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 rounded-xl text-white font-medium hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-[#B8F25C] text-[#0A1C16] font-semibold rounded-xl hover:bg-[#A3D94E] transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saving...' : initialData ? 'Update Item' : 'Create Item'}
        </button>
      </div>
    </form>
  );
}
