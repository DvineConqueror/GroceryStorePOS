import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Product } from '@/types';
import { useEffect } from 'react';

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product; // Add this for edit mode
}

export function ProductForm({ open, onClose, onSuccess, product }: ProductFormProps) {
  const [name, setName] = useState(product?.name || '');
  const [price, setPrice] = useState(product?.price.toString() || '');
  const [category, setCategory] = useState(product?.category || '');
  const [stock, setStock] = useState(product?.stock.toString() || '');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(product?.image || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Reset form when product changes
  useEffect(() => {
    setName(product?.name || '');
    setPrice(product?.price.toString() || '');
    setCategory(product?.category || '');
    setStock(product?.stock.toString() || '');
    setImagePreview(product?.image || '');
    setImage(null);
  }, [product]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      // Create preview URL for the new image
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const categories = ['Snacks', 'Beverages', 'Candies', 'Instant Noodles', 'Canned Goods', 'Personal Care', 'Soap', 'Others'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      let imageUrl = product?.image || null;

      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const productData = {
        name,
        price: parseFloat(price),
        category,
        stock: parseInt(stock),
        image: imageUrl
      };

      const { data: savedProduct, error } = await supabase
        .from('products')
        .upsert({
          id: product?.id,
          ...productData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: `Product ${product ? 'updated' : 'added'} successfully`,
      });

      onSuccess();
      onClose();
      setName('');
      setPrice('');
      setCategory('');
      setStock('');
      setImage(null);
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="image">Product Image</Label>
            {imagePreview && (
              <div className="mb-2 h-32 w-32 overflow-hidden rounded flex items-center justify-center bg-gray-100">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}