
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  cashReceived?: number;
  change?: number;
  timestamp: string;
  status: 'completed' | 'cancelled';
  cashierName: string;
}

export interface SalesByCategory {
  category: string;
  amount: number;
}

export interface SalesByDate {
  date: string;
  amount: number;
}
