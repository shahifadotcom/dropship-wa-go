import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CountryService } from '@/services/countryService';
import { ImageUpload } from '@/components/ImageUpload';

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSuccess: () => void;
}

export const AdminProductForm = ({ isOpen, onClose, categories, onSuccess }: ProductFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    description: '',
    price: '',
    original_price: '',
    cost_price: '',
    shipping_cost: '',
    tax_rate: '',
    weight: '',
    dimensions: { length: '', width: '', height: '' },
    images: [],
    category_id: '',
    country_id: '',
    brand: '',
    stock_quantity: '',
    sku: '',
    tags: '',
    // SEO Fields
    slug: '',
    meta_title: '',
    meta_description: '',
    social_preview_image: ''
  });

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Load countries when component mounts
  useEffect(() => {
    const loadCountries = async () => {
      const countriesList = await CountryService.getAllCountries();
      setCountries(countriesList);
    };
    if (isOpen) {
      loadCountries();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        // Basic Info
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        shipping_cost: formData.shipping_cost ? parseFloat(formData.shipping_cost) : 0,
        tax_rate: formData.tax_rate ? parseFloat(formData.tax_rate) : 0,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: (formData.dimensions.length || formData.dimensions.width || formData.dimensions.height) ? formData.dimensions : null,
        images: formData.images.filter(img => img.trim() !== ''),
        category_id: formData.category_id || null,
        country_id: formData.country_id && formData.country_id !== 'all-countries' ? formData.country_id : null,
        brand: formData.brand || null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        sku: formData.sku,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        in_stock: parseInt(formData.stock_quantity) > 0,
        rating: 0,
        review_count: 0,
        // SEO Fields
        slug: formData.slug || generateSlug(formData.name),
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        social_preview_image: formData.social_preview_image || null
      };

      const { error } = await supabase
        .from('products')
        .insert([productData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product added successfully"
      });

      onClose();
      onSuccess();
      
      // Reset form
      setFormData({
        name: '', description: '', price: '', original_price: '', cost_price: '', shipping_cost: '', tax_rate: '',
        weight: '', dimensions: { length: '', width: '', height: '' }, images: [], category_id: '', country_id: '', 
        brand: '', stock_quantity: '', sku: '', tags: '', slug: '', meta_title: '', meta_description: '', social_preview_image: ''
      });
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing & Costs</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setFormData({ 
                      ...formData, 
                      name: newName,
                      slug: generateSlug(newName)
                    });
                  }}
                  placeholder="Enter product name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter detailed product description"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="country">Target Country</Label>
                  <Select value={formData.country_id} onValueChange={(value) => setFormData({ ...formData, country_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-countries">All Countries</SelectItem>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name} ({country.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Enter brand name"
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Enter SKU"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label>Dimensions (cm)</Label>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.dimensions.length}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      dimensions: { ...formData.dimensions, length: e.target.value }
                    })}
                    placeholder="Length"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.dimensions.width}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      dimensions: { ...formData.dimensions, width: e.target.value }
                    })}
                    placeholder="Width"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.dimensions.height}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      dimensions: { ...formData.dimensions, height: e.target.value }
                    })}
                    placeholder="Height"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Selling Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="original_price">Original Price (for discount)</Label>
                  <Input
                    id="original_price"
                    type="number"
                    step="0.01"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost_price">Cost Price</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Your cost to acquire this product</p>
                </div>
                <div>
                  <Label htmlFor="shipping_cost">Shipping Cost</Label>
                  <Input
                    id="shipping_cost"
                    type="number"
                    step="0.01"
                    value={formData.shipping_cost}
                    onChange={(e) => setFormData({ ...formData, shipping_cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.01"
                  max="100"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              {formData.price && formData.cost_price && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Profit Analysis</h4>
                  <p className="text-sm">Gross Profit: ${(parseFloat(formData.price) - parseFloat(formData.cost_price)).toFixed(2)}</p>
                  <p className="text-sm">Margin: {(((parseFloat(formData.price) - parseFloat(formData.cost_price)) / parseFloat(formData.price)) * 100).toFixed(1)}%</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="images" className="space-y-4">
              <ImageUpload
                value={formData.images}
                onChange={(images) => setFormData({ ...formData, images })}
                maxImages={10}
                label="Product Images"
                required={true}
              />
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <div>
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="product-url-slug"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL: /products/{formData.slug || 'your-product-slug'}
                </p>
              </div>

              <div>
                <Label htmlFor="meta_title">SEO Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  placeholder="SEO optimized title (60 chars max)"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.meta_title.length}/60 characters
                </p>
              </div>

              <div>
                <Label htmlFor="meta_description">SEO Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="SEO optimized description (160 chars max)"
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.meta_description.length}/160 characters
                </p>
              </div>

              <div>
                <Label htmlFor="social_preview_image">Social Media Preview Image</Label>
                <Input
                  id="social_preview_image"
                  value={formData.social_preview_image}
                  onChange={(e) => setFormData({ ...formData, social_preview_image: e.target.value })}
                  placeholder="URL for social media preview (1200x630px recommended)"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended size: 1200x630px for optimal social media display
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">SEO Preview</h4>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-600">
                    {formData.meta_title || formData.name || 'Product Title'}
                  </p>
                  <p className="text-xs text-green-600">
                    yourstore.com/products/{formData.slug || 'product-slug'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formData.meta_description || formData.description?.substring(0, 160) || 'Product description will appear here...'}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding Product...' : 'Add Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};