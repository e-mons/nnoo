import Link from 'next/link';

export default async function ReportsLandingPage({
  params
}: {
  params: Promise<{ businessSlug: string }>
}) {
  const { businessSlug } = await params;
  
  const reports = [
    { title: 'Sales & Revenue', path: 'sales', desc: 'Detailed view of sales, payments, and refunds' },
    { title: 'Operating Expenses', path: 'expenses', desc: 'Breakdown of business expenses by category' },
    { title: 'Profitability', path: 'profitability', desc: 'Gross profit and operating results' },
    { title: 'Accounts Receivable', path: 'receivables', desc: 'Unpaid customer invoices and balances' },
    { title: 'Accounts Payable', path: 'payables', desc: 'Outstanding supplier bills' },
    { title: 'Inventory Value', path: 'inventory', desc: 'Stock on hand and current asset value' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reports.map((r) => (
        <Link 
          key={r.path}
          href={`/app/${businessSlug}/reports/${r.path}`}
          className="block bg-[#143628]/40 border border-white/10 rounded-2xl p-6 hover:bg-[#143628]/60 transition-colors backdrop-blur-xl"
        >
          <h2 className="text-lg font-bold text-white mb-2">{r.title}</h2>
          <p className="text-white/60 text-sm">{r.desc}</p>
        </Link>
      ))}
    </div>
  );
}
