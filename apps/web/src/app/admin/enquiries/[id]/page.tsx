import React from 'react';
import { createAdminClient } from '../../../../lib/supabase/admin';
import { requireServerAdmin } from '@/lib/auth/admin-guard';
import Link from 'next/link';
import { ChevronLeft, MessageSquare, Mail, Phone, Building2, Calendar, ShieldCheck } from 'lucide-react';
import EnquiryStatusForm from './EnquiryStatusForm';

export const metadata = {
  title: 'Enquiry Details - NNOO Admin',
  description: 'View and manage inbound lead details.',
};

export default async function AdminEnquiryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireServerAdmin();
  const resolvedParams = await params;

  const adminSupabase = createAdminClient();

  const [{ data: enquiry, error }, { data: auditEvents }] = await Promise.all([
    adminSupabase
      .from('contact_enquiries')
      .select('*')
      .eq('id', resolvedParams.id)
      .single(),
    adminSupabase
      .from('platform_audit_events')
      .select('*')
      .eq('target_type', 'enquiry')
      .eq('target_id', resolvedParams.id)
      .order('created_at', { ascending: false }),
  ]);

  if (error || !enquiry) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-12">
        <p className="text-red-400">Enquiry not found or an error occurred.</p>
        <Link href="/admin/enquiries" className="text-[#B8F25C] hover:underline mt-4 inline-block">Back to Enquiries</Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/admin/enquiries" className="inline-flex items-center text-sm text-[rgba(255,255,255,0.6)] hover:text-white transition-colors mb-6">
          <ChevronLeft size={16} className="mr-1" /> Back to Enquiries
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <MessageSquare className="h-7 w-7 text-[#B8F25C]" />
              Enquiry Details
            </h1>
            <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#B8F25C]" />
              Submitted on {new Date(enquiry.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`mailto:${enquiry.email}?subject=Regarding%20your%20NNOO%20enquiry`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#B8F25C] text-[#0A1C16] text-xs font-bold hover:bg-[#a5e048] transition-colors"
            >
              <Mail className="h-3.5 w-3.5" /> Email Contact
            </a>
            <EnquiryStatusForm id={enquiry.id} currentStatus={enquiry.status} />
          </div>
        </div>
      </div>

      <div className="bg-[#0A1C16] rounded-xl border border-[rgba(255,255,255,0.1)] p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Contact Name</h3>
            <p className="text-white font-medium">{enquiry.name}</p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Email Address</h3>
            <a href={`mailto:${enquiry.email}`} className="text-[#B8F25C] hover:underline text-sm font-mono">{enquiry.email}</a>
          </div>
          <div>
            <h3 className="text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Phone Number</h3>
            {enquiry.phone ? (
              <a href={`tel:${enquiry.phone}`} className="text-white hover:text-[#B8F25C] text-sm font-mono flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-[#B8F25C]" /> {enquiry.phone}
              </a>
            ) : (
              <p className="text-gray-500 text-sm">Not provided</p>
            )}
          </div>
          <div>
            <h3 className="text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Business Name</h3>
            <p className="text-white font-medium flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-[rgba(255,255,255,0.4)]" />
              {enquiry.business_name || 'Not provided'}
            </p>
          </div>
          <div>
            <h3 className="text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Category</h3>
            <span className="inline-block px-2.5 py-0.5 rounded text-xs font-medium bg-[rgba(255,255,255,0.05)] text-white capitalize">
              {enquiry.category.replace(/_/g, ' ')}
            </span>
          </div>
          <div>
            <h3 className="text-xs font-medium text-[rgba(255,255,255,0.5)] mb-1">Inbound Source</h3>
            <span className="text-[rgba(255,255,255,0.7)] text-sm capitalize">{enquiry.source || 'Website'}</span>
          </div>
        </div>

        <div className="border-t border-[rgba(255,255,255,0.05)] pt-6">
          <h3 className="text-xs font-medium text-[rgba(255,255,255,0.5)] mb-3">Submitted Message</h3>
          <div className="bg-[rgba(255,255,255,0.02)] rounded-lg p-4 text-[rgba(255,255,255,0.85)] whitespace-pre-wrap border border-[rgba(255,255,255,0.05)] text-sm leading-relaxed">
            {enquiry.message}
          </div>
        </div>
      </div>

      {/* Status History & Audit Log */}
      <div className="bg-[#0A1C16] rounded-xl border border-[rgba(255,255,255,0.1)] p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#B8F25C]" /> Enquiry Status & Audit Trail
        </h3>
        {auditEvents && auditEvents.length > 0 ? (
          <div className="space-y-3">
            {auditEvents.map((evt: any) => (
              <div key={evt.id} className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white capitalize">{evt.action.replace(/_/g, ' ')}</span>
                  <p className="text-gray-400 mt-0.5">{evt.reason}</p>
                </div>
                <span className="text-gray-500 font-mono">{new Date(evt.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">No status change events recorded yet.</p>
        )}
      </div>
    </div>
  );
}
