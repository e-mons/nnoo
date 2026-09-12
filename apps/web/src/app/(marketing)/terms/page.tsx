import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — NNOO',
  description: 'NNOO Terms of Service',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-24">
      <div className="container mx-auto px-4 md:px-8 max-w-3xl">
        <h1 className="text-4xl font-bold text-[#0A1C16] mb-8">Terms of Service</h1>
        
        <div className="prose prose-green max-w-none text-gray-600">
          <p className="mb-6 bg-yellow-50 p-4 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            <strong>Note:</strong> This is a placeholder terms of service document pending formal legal review.
          </p>

          <h2 className="text-2xl font-semibold text-[#143628] mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            By accessing and using the NNOO platform (&quot;Service&quot;), you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
          </p>

          <h2 className="text-2xl font-semibold text-[#143628] mt-8 mb-4">2. Description of Service</h2>
          <p className="mb-4">
            NNOO provides businesses with tools to organise and understand sales, expenses, stock, customers, and business performance. We reserve the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice.
          </p>

          <h2 className="text-2xl font-semibold text-[#143628] mt-8 mb-4">3. Registration Obligations</h2>
          <p className="mb-4">
            In consideration of your use of the Service, you represent that you are of legal age to form a binding contract and are not a person barred from receiving services under the laws of applicable jurisdictions. You also agree to provide true, accurate, current and complete information about yourself as prompted by the Service&apos;s registration form.
          </p>

          <h2 className="text-2xl font-semibold text-[#143628] mt-8 mb-4">4. User Account, Password, and Security</h2>
          <p className="mb-4">
            You are responsible for maintaining the confidentiality of the password and account, and are fully responsible for all activities that occur under your password or account. You agree to immediately notify NNOO of any unauthorized use of your password or account or any other breach of security.
          </p>

          <h2 className="text-2xl font-semibold text-[#143628] mt-8 mb-4">5. Contact Information</h2>
          <p className="mb-4">
            For any questions regarding these Terms of Service, please reach out via our <Link href="/#contact" className="text-[#143628] underline font-medium">contact form</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
