
import { ProductCatalog } from '@/components/pos/ProductCatalog';
import { Cart } from '@/components/pos/Cart';
import { CheckoutDialog } from '@/components/pos/CheckoutDialog';
import { AnalyticsCharts } from '@/components/pos/AnalyticsCharts';
import { CashierAnalytics } from '@/components/pos/CashierAnalytics';
import { TransactionHistory } from '@/components/pos/TransactionHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Image } from 'lucide-react';

export default function PosPage() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pos-primary/30 to-pos-background">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="container mx-auto flex justify-between items-center p-4">
          <div className="flex items-center space-x-6">
            <div className="bg-pos-primary/30 p-2 rounded-full">
              <img src="/src/assets/BlesseStoreIcon.png" className="w-12 h-12 rounded-full" alt="Store Logo" />
            </div>
            <h1 className="text-2xl font-bold text-pos-primary">Grocery POS</h1>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-gray-700">
              <span className="text-sm">Cashier:</span>
              <span className="font-medium">{profile?.full_name}</span>
            </div>
            <Button 
              variant="outline" 
              onClick={signOut}
              className="border-pos-primary/20 text-pos-primary hover:bg-pos-primary/5"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto p-3">
        <Tabs defaultValue="pos" className="flex flex-col">
        <div className="flex justify-center">
            <TabsList className="mb-1 bg-white/50 backdrop-blur-sm p-2 rounded-lg border border-gray-100">
              <TabsTrigger 
                value="pos" 
                className="data-[state=active]:bg-pos-primary data-[state=active]:text-white"
              >
                Point of Sale
              </TabsTrigger>
              <TabsTrigger 
                value="analytics"
                className="data-[state=active]:bg-pos-primary data-[state=active]:text-white"
              >
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="pos" className="flex-grow flex flex-col space-y-4 md:space-y-0 md:flex-row md:space-x-6">
            <div className="md:w-2/3 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <ProductCatalog />
            </div>
            <div className="md:w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <Cart />
            </div>
            <CheckoutDialog />
          </TabsContent>
          
          <TabsContent value="analytics" className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <AnalyticsCharts />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <CashierAnalytics />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <TransactionHistory />
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-100 p-4 text-center">
        <div className="container mx-auto text-sm text-gray-600">
          Grocery POS System &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
