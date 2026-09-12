import { getExpenseDetails, getExpenseReceiptSignedUrl } from '@/lib/actions/expenses';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Download } from 'lucide-react';

const formatMoney = (minor: number, currency: string = 'NGN') => new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(minor / 100);
import { RecordExpensePaymentDialog } from '@/components/expenses/RecordExpensePaymentDialog';
import { ReverseExpenseDialog } from '@/components/expenses/ReverseExpenseDialog';

export default async function ExpenseDetailsPage({ params }: { params: Promise<{ businessSlug: string, expenseId: string }> }) {
  const resolvedParams = await params;
  const { expense, payments } = await getExpenseDetails(resolvedParams.businessSlug, resolvedParams.expenseId);

  if (!expense) {
    notFound();
  }

  const totalMinor = expense.total_minor;
  const totalPaidMinor = payments.reduce((acc: number, p: any) => acc + p.amount_minor, 0);
  const balanceDueMinor = totalMinor - totalPaidMinor;
  const isReversed = expense.status === 'reversed';

  let receiptUrl = null;
  if (expense.receipt_path) {
    const res = await getExpenseReceiptSignedUrl(expense.receipt_path);
    if (res.signedUrl) {
      receiptUrl = res.signedUrl;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link 
        href={`/app/${resolvedParams.businessSlug}/expenses`}
        className="inline-flex items-center text-white/60 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Expenses
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            {expense.expense_number}
            {isReversed && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-medium uppercase tracking-wider">
                Reversed
              </span>
            )}
          </h1>
          <p className="text-white/60 mt-1">{expense.description}</p>
        </div>

        {!isReversed && (
          <div className="flex items-center gap-3">
            {balanceDueMinor > 0 && (
              <RecordExpensePaymentDialog
                businessId={resolvedParams.businessSlug}
                expenseId={expense.id}
                balanceDueMinor={balanceDueMinor}
                currencyCode={expense.currency_code}
              />
            )}
            <ReverseExpenseDialog
              businessId={resolvedParams.businessSlug}
              expenseId={expense.id}
              expenseNumber={expense.expense_number}
            />
          </div>
        )}
      </div>

      {isReversed && expense.reversal_reason && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
          <h3 className="text-red-400 font-semibold mb-1">Reversal Reason</h3>
          <p className="text-red-300/80 text-sm">{expense.reversal_reason}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
          <h2 className="text-lg font-bold text-white mb-4">Expense Details</h2>
          <dl className="space-y-4 text-sm">
            <div className="grid grid-cols-2">
              <dt className="text-white/50">Category</dt>
              <dd className="text-white font-medium">{expense.expense_categories?.name}</dd>
            </div>
            <div className="grid grid-cols-2">
              <dt className="text-white/50">Supplier</dt>
              <dd className="text-white font-medium">{expense.suppliers?.name || 'Walk-up / None'}</dd>
            </div>
            <div className="grid grid-cols-2">
              <dt className="text-white/50">Effective Date</dt>
              <dd className="text-white font-medium">{new Date(expense.effective_date).toLocaleDateString('en-US')}</dd>
            </div>
            <div className="grid grid-cols-2">
              <dt className="text-white/50">Total Amount</dt>
              <dd className="text-white font-medium">{expense.currency_code} {formatMoney(expense.total_minor)}</dd>
            </div>
            <div className="grid grid-cols-2">
              <dt className="text-white/50">Amount Paid</dt>
              <dd className="text-emerald-400 font-medium">{expense.currency_code} {formatMoney(totalPaidMinor)}</dd>
            </div>
            <div className="grid grid-cols-2 pt-4 border-t border-white/10">
              <dt className="text-white/50 font-medium">Balance Due</dt>
              <dd className="text-white font-bold">{expense.currency_code} {formatMoney(balanceDueMinor)}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-6">
          {expense.receipt_path && receiptUrl && (
            <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl flex flex-col justify-center items-center text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 text-white/50">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-white font-medium mb-1">Receipt Attached</h3>
              <p className="text-white/50 text-sm mb-4">A receipt was uploaded for this expense.</p>
              <a 
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                View Receipt
              </a>
            </div>
          )}

          <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold text-white mb-4">Payment History</h2>
            {payments.length === 0 ? (
              <p className="text-sm text-white/50">No payments recorded.</p>
            ) : (
              <div className="space-y-4">
                {payments.map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {p.currency_code} {formatMoney(p.amount_minor)}
                      </p>
                      <p className="text-xs text-white/50 capitalize">
                        {new Date(p.effective_date).toLocaleDateString('en-US')} • {p.payment_method.replace('_', ' ')}
                      </p>
                    </div>
                    {p.external_reference && (
                      <span className="text-xs text-white/40 border border-white/10 rounded px-2 py-1">
                        Ref: {p.external_reference}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
