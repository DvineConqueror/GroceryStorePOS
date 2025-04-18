
import { useState } from 'react';
import { usePos } from '@/context/PosContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { SalesByCategory, SalesByDate } from '@/types';
import { formatCurrency } from '@/utils/format';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function AnalyticsCharts() {
  const { state } = usePos();
  const { transactions } = state;
  const [timeFrame, setTimeFrame] = useState('today');

  // Add time frame filter function
  const filterTransactionsByTime = (transactions: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return transactions.filter(transaction => {
      const txDate = new Date(transaction.timestamp);
      switch (timeFrame) {
        case 'today':
          return txDate >= today;
        case 'week':
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          return txDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
          return txDate >= monthAgo;
        default:
          return true;
      }
    });
  };

  // Update calculation functions to use filtered transactions
  const calculateSalesByCategory = (): SalesByCategory[] => {
    const salesMap = new Map<string, number>();
    const filteredTransactions = filterTransactionsByTime(transactions);
    
    filteredTransactions.forEach(transaction => {
      transaction.items.forEach(item => {
        const category = item.category;
        const amount = item.price * item.quantity;
        
        if (salesMap.has(category)) {
          salesMap.set(category, salesMap.get(category)! + amount);
        } else {
          salesMap.set(category, amount);
        }
      });
    });
    
    return Array.from(salesMap.entries()).map(([category, amount]) => ({
      category,
      amount,
    }));
  };

  // Calculate sales by date
  const calculateSalesByDate = (): SalesByDate[] => {
    const salesMap = new Map<string, number>();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.timestamp).toLocaleDateString();
      const amount = transaction.total;
      
      if (salesMap.has(date)) {
        salesMap.set(date, salesMap.get(date)! + amount);
      } else {
        salesMap.set(date, amount);
      }
    });
    
    return Array.from(salesMap.entries()).map(([date, amount]) => ({
      date,
      amount,
    }));
  };

  // Calculate total sales
  const calculateTotalSales = (): number => {
    return transactions.reduce((sum, transaction) => sum + transaction.total, 0);
  };

  // Calculate total number of transactions
  const calculateTotalTransactions = (): number => {
    return transactions.length;
  };

  // Calculate average transaction value
  const calculateAverageTransactionValue = (): number => {
    const total = calculateTotalSales();
    const count = calculateTotalTransactions();
    return count > 0 ? total / count : 0;
  };

  const salesByCategory = calculateSalesByCategory();
  const salesByDate = calculateSalesByDate();

  return (
    <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold text-pos-primary">Sales Analytics</CardTitle>
            <CardDescription className="text-gray-600">Overview of your store's performance</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTimeFrame('today')}
              className={`${timeFrame === 'today' ? 'bg-pos-primary text-white' : 'bg-pos-primary/5'}`}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTimeFrame('week')}
              className={`${timeFrame === 'week' ? 'bg-pos-primary text-white' : 'bg-pos-primary/5'}`}
            >
              Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTimeFrame('month')}
              className={`${timeFrame === 'month' ? 'bg-pos-primary text-white' : 'bg-pos-primary/5'}`}
            >
              Month
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-pos-primary/5 border-none p-4">
            <div className="text-sm text-gray-600">Total Sales</div>
            <div className="text-2xl font-bold text-pos-primary">{formatCurrency(calculateTotalSales())}</div>
          </Card>
          <Card className="bg-pos-primary/5 border-none p-4">
            <div className="text-sm text-gray-600">Total Transactions</div>
            <div className="text-2xl font-bold text-pos-primary">{calculateTotalTransactions()}</div>
          </Card>
          <Card className="bg-pos-primary/5 border-none p-4">
            <div className="text-sm text-gray-600">Average Transaction</div>
            <div className="text-2xl font-bold text-pos-primary">{formatCurrency(calculateAverageTransactionValue())}</div>
          </Card>
        </div>

        <Tabs defaultValue="category" className="w-full">
          <TabsList className="mb-4 bg-white/50 backdrop-blur-sm p-1 rounded-lg border border-gray-100">
            <TabsTrigger 
              value="category"
              className="data-[state=active]:bg-pos-primary data-[state=active]:text-white"
            >
              Sales by Category
            </TabsTrigger>
            <TabsTrigger 
              value="timeline"
              className="data-[state=active]:bg-pos-primary data-[state=active]:text-white"
            >
              Sales Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="category" className="space-y-4">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={calculateSalesByCategory()}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    fill="#8884d8"
                    label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {calculateSalesByCategory().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calculateSalesByDate()}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Bar dataKey="amount" fill="#0088FE" radius={[4, 4, 0, 0]}>
                    {calculateSalesByDate().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
