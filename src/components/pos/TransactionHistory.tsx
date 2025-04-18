
import { usePos } from '@/context/PosContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function TransactionHistory() {
  const { state } = usePos();
  const { transactions } = state;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Transaction history and details</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cashier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 5).map((transaction) => {
                const date = new Date(transaction.timestamp);
                const formattedDate = date.toLocaleDateString();
                const formattedTime = date.toLocaleTimeString();
                
                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {transaction.cashierName}
                    </TableCell>
                    <TableCell>
                      <div>{formattedDate}</div>
                      <div className="text-xs text-muted-foreground">{formattedTime}</div>
                    </TableCell>
                    <TableCell>{transaction.items.length} items</TableCell>
                    <TableCell className="text-right text-pos-primary">{formatCurrency(transaction.total)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'destructive'}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No transactions yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
