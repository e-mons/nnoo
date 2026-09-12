'use client';

import React, { useState } from 'react';
import { updateEnquiryStatusAction } from '@/lib/actions/admin';

export default function EnquiryStatusForm({ id, currentStatus }: { id: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);

  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    if (newStatus === status) return;

    setLoading(true);
    const result = await updateEnquiryStatusAction(id, newStatus);
    setLoading(false);

    if (result?.error) {
      alert(result.error);
    } else {
      setStatus(newStatus);
    }
  }

  return (
    <div className="flex items-center gap-3 bg-[#0A1C16] p-2 rounded-lg border border-[rgba(255,255,255,0.1)]">
      <label htmlFor="status" className="text-xs font-semibold text-[rgba(255,255,255,0.6)] pl-2">Status:</label>
      <select
        id="status"
        name="status"
        value={status}
        onChange={handleStatusChange}
        disabled={loading}
        className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white text-xs font-medium rounded-md focus:ring-1 focus:ring-[#B8F25C] focus:border-[#B8F25C] block p-2 pr-8 disabled:opacity-50"
      >
        <option value="new" className="bg-[#0A1C16] text-white">New</option>
        <option value="in_progress" className="bg-[#0A1C16] text-white">In Progress</option>
        <option value="resolved" className="bg-[#0A1C16] text-white">Resolved</option>
        <option value="closed" className="bg-[#0A1C16] text-white">Closed</option>
      </select>
    </div>
  );
}
