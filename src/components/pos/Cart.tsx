import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { usePos } from '@/context/PosContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/format';
import { useState } from 'react';

export function Cart() {
  const { state, removeFromCart, updateQuantity, clearCart, toggleCheckout, calculateTotal } = usePos();
  const { cart } = state;
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClearCart = () => {
    if (confirmClear) {
      clearCart();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000); // Reset after 3 seconds
    }
  };

  const handleCheckout = () => {
    if (cart.length > 0) {
      toggleCheckout(true);
    }
  };

  return (
    <Card className="flex flex-col h-[500px] p-4"> {/* Reduced fixed height */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <ShoppingBag className="mr-4 h-10 w-10" />
          Shopping Cart
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearCart}
          disabled={cart.length === 0}
          className={confirmClear ? 'bg-red-100 text-red-600' : ''}
        >
          {confirmClear ? 'Confirm Clear' : 'Clear'}
        </Button>
      </div>

      <div className="flex-grow overflow-y-auto mb-4 pr-2" style={{ maxHeight: 'calc(100vh - 300px)' }}>
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ShoppingBag className="h-12 w-12 mb-2" />
            <p>Cart is empty</p>
            <p className="text-sm">Add items to begin</p>
          </div>
        ) : (
          <ul className="space-y-3">
            <div className="flex items-center justify-between mt-2">
              <span className="font-bold  text-lg">Items:</span>
              <span className="font-bold  text-lg">Price:</span>
            </div>
            {cart.map(item => (
              <li key={item.id} className="border-b pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.name}</span>
                  <span className='text-pos-primary'>{formatCurrency(item.price)}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-16 h-7 text-center"
                      min="1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-pos-blue">{formatCurrency(item.price * item.quantity)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t pt-4 space-y-4 mt-auto">
        <div className="flex items-center justify-between font-bold text-lg ">
          <span>Total</span>
          <span className='text-pos-primary'>{formatCurrency(calculateTotal())}</span>
        </div>
        <Button
          className="w-full bg-pos-primary hover:bg-pos-primary/90"
          size="lg"
          onClick={handleCheckout}
          disabled={cart.length === 0}
        >
          Proceed to Checkout
        </Button>
      </div>
    </Card>
  );
}