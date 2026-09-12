import { getExpenseCategories } from '@/lib/actions/expenses';
import { getSupplierList } from '@/lib/actions/supplier';
import { CreateExpenseForm } from '@/components/expenses/CreateExpenseForm';

export default async function NewExpensePage({ params }: { params: Promise<{ businessSlug: string }> }) {
  const resolvedParams = await params;
  const [categories, suppliersResponse] = await Promise.all([
    getExpenseCategories(resolvedParams.businessSlug),
    getSupplierList(resolvedParams.businessSlug)
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#143628]/40 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
        <h1 className="text-2xl font-bold text-white mb-6">Record New Expense</h1>
        <CreateExpenseForm 
          businessId={resolvedParams.businessSlug} 
          categories={categories}
          suppliers={suppliersResponse.data || []}
        />
      </div>
    </div>
  );
}
