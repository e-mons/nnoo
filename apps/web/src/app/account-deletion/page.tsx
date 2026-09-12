import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Account Deletion & Data Privacy | NNOO',
  description: 'Learn how to request deletion of your personal NNOO user account, associated devices, and personal data.',
};

export default function AccountDeletionPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-lime-400 hover:text-lime-300 font-semibold text-sm">
            &larr; Back to NNOO
          </Link>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-white mb-6">
          Account Deletion & Data Retention Policy
        </h1>

        <div className="space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed">
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">How to Delete Your NNOO Account</h2>
            <p className="mb-4">
              You can initiate account deletion at any time directly within the NNOO Mobile application or by submitting a verified deletion request.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-slate-300">
              <li>Open the <strong>NNOO Mobile App</strong> or <strong>Web Dashboard</strong>.</li>
              <li>Navigate to <strong>Settings</strong> &rarr; <strong>Account & Security</strong>.</li>
              <li>Select <strong>Request Account Deletion</strong>.</li>
              <li>Confirm your identity via password or email verification.</li>
            </ol>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">What Data Is Deleted</h2>
            <p className="mb-3">
              Upon account deletion processing:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>Your personal login credentials, profile name, phone number, and authentication tokens are permanently removed or de-identified.</li>
              <li>All registered mobile push device tokens (APNs and FCM) are revoked immediately.</li>
              <li>Active Meta WhatsApp communication linkages and conversational sessions are terminated.</li>
              <li>You will no longer receive notifications or access any business records.</li>
            </ul>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Business Data & Financial Record Retention</h2>
            <p className="mb-3">
              NNOO is Africa’s Business Operating System. To maintain statutory accounting integrity, tax compliance, and commercial obligations:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-300">
              <li>
                <strong>Financial Records:</strong> Past sales, expenses, invoices, payments, and double-entry ledger entries created by your account remain preserved as immutable business records belonging to the respective business entity.
              </li>
              <li>
                <strong>Sole Business Owners:</strong> If you are the sole Owner of an active business, you must transfer business ownership or close the business before deleting your personal account to prevent orphaned enterprise records.
              </li>
            </ul>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Manual Deletion Assistance</h2>
            <p className="mb-3">
              If you are unable to access your device or require assistance with an account deletion request, contact our Data Privacy & Compliance Officer:
            </p>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-slate-200">
              <p><strong>Email:</strong> privacy@nnoo.app</p>
              <p><strong>Subject:</strong> Account Deletion Request</p>
              <p><strong>Response SLA:</strong> Within 7 business days</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
