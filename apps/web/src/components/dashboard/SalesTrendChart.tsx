'use client';

import { SalesTrendPoint } from '@nnoo/contracts';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export function SalesTrendChart({ 
  data,
  currencyCode
}: { 
  data: SalesTrendPoint[],
  currencyCode: string 
}) {
  const chartData = data.map(d => ({
    date: d.date,
    netSales: parseInt(d.netSalesMinor, 10) / 100,
    expenses: parseInt(d.expensesMinor, 10) / 100,
  }));

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="h-72 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#ffffff60" 
            fontSize={12} 
            tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          />
          <YAxis 
            stroke="#ffffff60" 
            fontSize={12} 
            tickFormatter={formatCurrency}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#143628', borderColor: '#ffffff20', borderRadius: '8px' }}
            formatter={(value: any) => [formatCurrency(value as number), undefined]}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="netSales" 
            name="Net Sales" 
            stroke="#B8F25C" 
            strokeWidth={3} 
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="expenses" 
            name="Expenses" 
            stroke="#F87171" 
            strokeWidth={3} 
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
