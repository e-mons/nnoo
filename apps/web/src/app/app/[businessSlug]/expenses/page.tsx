import { getExpensesList } from '@/lib/actions/expenses';
import Link from 'next/link';

const formatMoney = (minor: number, currency: string = 'NGN') => new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(minor / 100);

export default async function ExpensesPage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const resolvedParams = await params;
  const expenses = await getExpensesList(resolvedParams.businessSlug);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Expenses</h1>
          <p className="text-white/60">Manage your business spending and accounts payable.</p>
        </div>
        <Link 
          href={`/app/${resolvedParams.businessSlug}/expenses/new`}
          className="bg-[#B8F25C] text-[#0A1C16] px-4 py-2 rounded-xl font-medium hover:bg-[#a3d951] transition-colors"
        >
          Record Expense
        </Link>
      </div>

      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
        {expenses.length === 0 ? (
          <div className="p-8 text-center text-white/50">
            No expenses recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-white">
              <thead className="bg-black/20 text-white/60 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Number</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Supplier</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {expenses.map((expense: any) => (
                  <tr key={expense.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      <Link href={`/app/${resolvedParams.businessSlug}/expenses/${expense.id}`} className="hover:underline">
                        {expense.expense_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(expense.effective_date).toLocaleDateString('en-US')}
                    </td>
                    <td className="px-6 py-4">
                      {expense.expense_categories?.name}
                    </td>
                    <td className="px-6 py-4">
                      {expense.suppliers?.name || <span className="text-white/40">None</span>}
                    </td>
                    <td className="px-6 py-4">
                      {formatMoney(expense.total_minor, expense.currency_code)}
                    </td>
                    <td className="px-6 py-4">
                      {expense.status === 'reversed' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                          Reversed
                        </span>
                      ) : expense.payment_status === 'paid' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Paid
                        </span>
                      ) : expense.payment_status === 'partially_paid' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          Partial
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          Unpaid
                        </span>
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
  );
}
