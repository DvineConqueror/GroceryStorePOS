import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/format';

interface CashierSales {
  cashier_name: string;
  total_sales: number;
  items_sold: number;
}

export function CashierAnalytics() {
  const [cashierSales, setCashierSales] = useState<CashierSales[]>([]);

  const fetchCashierSales = async () => {
    try {
      // First get all completed transactions
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          total,
          cashier_id,
          cashier_name,
          transaction_items (
            quantity
          )
        `)
        .eq('status', 'completed');
    
      if (error) throw error;
    
      // Aggregate sales using cashier_name
      const salesMap = new Map<string, CashierSales>();
      transactions.forEach((transaction: any) => {
        const cashierName = transaction.cashier_name || 'Unknown';
        const totalSales = transaction.total;
        const itemsSold = transaction.transaction_items.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        );

        if (salesMap.has(cashierName)) {
          const existing = salesMap.get(cashierName)!;
          salesMap.set(cashierName, {
            cashier_name: cashierName,
            total_sales: existing.total_sales + totalSales,
            items_sold: existing.items_sold + itemsSold
          });
        } else {
          salesMap.set(cashierName, {
            cashier_name: cashierName,
            total_sales: totalSales,
            items_sold: itemsSold
          });
        }
      });
    
      const sortedSales = Array.from(salesMap.values())
        .sort((a, b) => b.total_sales - a.total_sales);
    
      setCashierSales(sortedSales);
    } catch (error) {
      console.error('Error fetching cashier sales:', error);
    }
  };

  useEffect(() => {
    fetchCashierSales();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cashier Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cashierSales.map((cashier) => (
            <div key={cashier.cashier_name} className="flex justify-between items-center p-4 border rounded">
              <div>
                <div className="font-medium">{cashier.cashier_name}</div>
                <div className="text-sm text-muted-foreground text-pos-primary">
                  {cashier.items_sold} items sold
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-pos-primary">{formatCurrency(cashier.total_sales)}</div>
                <div className="text-sm text-muted-foreground">Total Sales</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}