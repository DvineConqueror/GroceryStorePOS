
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CartItem, Product, Transaction } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type PosState = {
  products: Product[];
  cart: CartItem[];
  transactions: Transaction[];
  isCheckoutOpen: boolean;
  currentTransactionId: string | null;
};

type PosAction =
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CHECKOUT'; payload: boolean }
  | { type: 'COMPLETE_TRANSACTION'; payload: Transaction }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_CURRENT_TRANSACTION_ID'; payload: string | null };

const initialState: PosState = {
  products: [],
  cart: [],
  transactions: [],
  isCheckoutOpen: false,
  currentTransactionId: null,
};

function posReducer(state: PosState, action: PosAction): PosState {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return {
        ...state,
        products: action.payload,
      };
    case 'SET_TRANSACTIONS':
      return {
        ...state,
        transactions: action.payload,
      };
    case 'ADD_TO_CART': {
      const existingItem = state.cart.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item => 
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        cart: [...state.cart, { ...action.payload, quantity: 1 }],
      };
    }
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.id !== action.payload),
      };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        cart: state.cart.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    case 'CLEAR_CART':
      return {
        ...state,
        cart: [],
      };
    case 'TOGGLE_CHECKOUT':
      return {
        ...state,
        isCheckoutOpen: action.payload,
      };
    case 'COMPLETE_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
        cart: [],
      };
    case 'SET_CURRENT_TRANSACTION_ID':
      return {
        ...state,
        currentTransactionId: action.payload,
      };
    default:
      return state;
  }
}

type PosContextType = {
  state: PosState;
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCheckout: (isOpen: boolean) => void;
  completeTransaction: (transaction: Transaction) => Promise<void>;
  setCurrentTransactionId: (id: string | null) => void;
  calculateTotal: () => number;
  fetchProducts: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
};

const PosContext = createContext<PosContextType | undefined>(undefined);

export function PosProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(posReducer, initialState);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_deleted', false);

      if (error) throw error;
      
      dispatch({ type: 'SET_PRODUCTS', payload: data });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
      console.error('Error fetching products:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          cashier_name,
          transaction_items (
            quantity,
            price_at_time,
            product:products (
              id,
              name,
              price,
              category,
              image
            )
          )
        `)
        .order('created_at', { ascending: false });
  
      if (error) throw error;
  
      // Get cashier names in a separate query
      const cashierIds = transactions.map(t => t.cashier_id).filter(id => id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', cashierIds);
  
      // Create a map of cashier IDs to names
      const cashierMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
  
      const formattedTransactions: Transaction[] = transactions.map((t: any) => ({
        id: t.id,
        total: t.total,
        paymentMethod: t.payment_method,
        cashReceived: t.cash_received,
        change: t.change_amount,
        status: t.status as 'completed' | 'cancelled',
        timestamp: t.created_at,
        cashierName: t.cashier_name || 'Unknown',
        items: t.transaction_items.map((item: any) => ({
          id: item.product.id,
          name: item.product.name,
          price: item.price_at_time,
          category: item.product.category,
          image: item.product.image,
          quantity: item.quantity,
          stock: 0
        }))
      }));
  
      dispatch({ type: 'SET_TRANSACTIONS', payload: formattedTransactions });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions. Please try refreshing the page.",
        variant: "destructive"
      });
    }
  };

  const completeTransaction = async (transaction: Transaction) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }
  
      // Get the cashier's profile first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (profileError) throw profileError;
  
      // Start transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          total: transaction.total,
          payment_method: transaction.paymentMethod,
          cash_received: transaction.cashReceived,
          change_amount: transaction.change,
          status: transaction.status,
          cashier_id: user.id,
          cashier_name: profile.full_name,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      if (transactionError) throw transactionError;
  
      // Insert transaction items
      const transactionItems = transaction.items.map(item => ({
        transaction_id: transactionData.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price
      }));
  
      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(transactionItems);
  
      if (itemsError) throw itemsError;
  
      // Update stock levels
      for (const item of transaction.items) {
        const { error: stockError } = await supabase
          .rpc('decrement_stock', { 
            row_id: item.id, 
            amount: item.quantity 
          });
  
        if (stockError) throw stockError;
      }
  
      // Add cashier name to the transaction before dispatching
      const completedTransaction = {
        ...transaction,
        id: transactionData.id,
        cashierName: profile.full_name
      };
  
      dispatch({ type: 'COMPLETE_TRANSACTION', payload: completedTransaction });
      
      toast({
        title: "Success",
        description: "Transaction completed successfully",
      });
  
      } catch (error: any) {
        toast({
          title: "Error",
          description: "Failed to complete transaction",
          variant: "destructive"
        });
        console.error('Error completing transaction:', error);
      }
    };

  useEffect(() => {
    fetchProducts();
    fetchTransactions();
  }, []);

  const addToCart = (product: Product) => {
    dispatch({ type: 'ADD_TO_CART', payload: product });
  };

  const removeFromCart = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCheckout = (isOpen: boolean) => {
    dispatch({ type: 'TOGGLE_CHECKOUT', payload: isOpen });
  };

  const setCurrentTransactionId = (id: string | null) => {
    dispatch({ type: 'SET_CURRENT_TRANSACTION_ID', payload: id });
  };

  const calculateTotal = (): number => {
    return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  return (
    <PosContext.Provider
      value={{
        state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleCheckout,
        completeTransaction,
        setCurrentTransactionId,
        calculateTotal,
        fetchProducts,
        fetchTransactions,
      }}
    >
      {children}
    </PosContext.Provider>
  );
}

export function usePos() {
  const context = useContext(PosContext);
  if (context === undefined) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
}
