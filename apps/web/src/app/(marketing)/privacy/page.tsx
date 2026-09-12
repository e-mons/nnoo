import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — NNOO',
  description: 'NNOO Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white py-24">
      <div className="container mx-auto px-4 md:px-8 max-w-3xl">
        <h1 className="text-4xl font-bold text-[#0A1C16] mb-8">Privacy Policy</h1>
        
        <div className="prose prose-green max-w-none text-gray-600">
          <p className="mb-6 bg-yellow-50 p-4 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            <strong>Note:</strong> This is a placeholder privacy policy pending formal legal review.
          </p>

          <h2 className="text-2xl font-semibold text-[#143628] mt-8 mb-4">1. Introduction</h2>
          <p className="mb-4">
            Welcome to NNOO. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
          </p>

          <h2 className="text-2xl font-semibold text-[#143628] mt-8 mb-4">2. The Data We Collect About You</h2>
          <p className="mb-4">
            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
            <li><strong>Contact Data</strong> includes email address and telephone numbers.</li>
            <li><strong>Business Data</strong> includes business name, industry, and operational metrics you choose to provide.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-[#143628] mt-8 mb-4">3. How We Use Your Personal Data</h2>
          <p className="mb-4">
            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
            <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
            <li>Where we need to comply with a legal obligation.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-[#143628] mt-8 mb-4">4. Contact Us</h2>
          <p className="mb-4">
            If you have any questions about this privacy policy or our privacy practices, please contact us via our <Link href="/#contact" className="text-[#143628] underline font-medium">contact form</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
