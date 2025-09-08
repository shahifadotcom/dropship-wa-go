import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CountryService } from '@/services/countryService';
import { ProductImageUpload } from '@/components/ProductImageUpload';

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSuccess: () => void;
  product?: any; // For editing existing products
}

export const EnhancedAdminProductForm = ({ isOpen, onClose, categories, onSuccess, product }: ProductFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    description: '',
    slug: '',
    
    // Pricing
    price: '',
    original_price: '',
    cost_price: '',
    shipping_cost: '',
    tax_rate: '',
    
    // Media
    images: [''],
    
    // Classification
    category_id: '',
    country_id: '',
    vendor_id: '',
    auto_order_enabled: false,
    brand: '',
    tags: '',
    
    // Inventory
    stock_quantity: '',
    sku: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    },
    
    // SEO
    meta_title: '',
    meta_description: '',
    social_preview_image: ''
  });

  // Load countries and vendors when component mounts
  useEffect(() => {
    const loadData = async () => {
      const countriesList = await CountryService.getAllCountries();
      setCountries(countriesList);
      
      // Load vendors
      const { data: vendorData, error } = await supabase
        .from('vendors')
        .select('id, name, is_active')
        .eq('is_active', true);
      
      if (!error && vendorData) {
        setVendors(vendorData);
      }
    };
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Load product data for editing
  useEffect(() => {
    if (isOpen && product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        slug: product.slug || '',
        price: product.price?.toString() || '',
        original_price: product.original_price?.toString() || '',
        cost_price: product.cost_price?.toString() || '',
        shipping_cost: product.shipping_cost?.toString() || '',
        tax_rate: product.tax_rate?.toString() || '',
        images: product.images && product.images.length > 0 ? product.images : [''],
        category_id: product.category_id || '',
        country_id: product.country_id || '',
        vendor_id: product.vendor_id || '',
        auto_order_enabled: product.auto_order_enabled || false,
        brand: product.brand || '',
        tags: product.tags ? product.tags.join(', ') : '',
        stock_quantity: product.stock_quantity?.toString() || '',
        sku: product.sku || '',
        weight: product.weight?.toString() || '',
        dimensions: {
          length: product.dimensions?.length?.toString() || '',
          width: product.dimensions?.width?.toString() || '',
          height: product.dimensions?.height?.toString() || ''
        },
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        social_preview_image: product.social_preview_image || ''
      });
    } else if (isOpen && !product) {
      // Reset form for new product
      setFormData({
        name: '', description: '', slug: '', price: '', original_price: '', cost_price: '', 
        shipping_cost: '', tax_rate: '', images: [''], category_id: '', country_id: '', 
        vendor_id: '', auto_order_enabled: false,
        brand: '', tags: '', stock_quantity: '', sku: '', weight: '',
        dimensions: { length: '', width: '', height: '' },
        meta_title: '', meta_description: '', social_preview_image: ''
      });
    }
  }, [isOpen, product]);

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && !formData.slug) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name, formData.slug]);

  // Auto-generate meta title from name
  useEffect(() => {
    if (formData.name && !formData.meta_title) {
      setFormData(prev => ({ 
        ...prev, 
        meta_title: formData.name.substring(0, 60) 
      }));
    }
  }, [formData.name, formData.meta_title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.description || !formData.price || !formData.sku) {
        throw new Error('Please fill in all required fields');
      }

      // Validate slug uniqueness (only for new products or if slug changed)
      if (!product || product.slug !== formData.slug) {
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('slug', formData.slug)
          .single();

        if (existingProduct && existingProduct.id !== product?.id) {
          throw new Error('Product slug already exists. Please choose a different name or slug.');
        }
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        slug: formData.slug,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        shipping_cost: formData.shipping_cost ? parseFloat(formData.shipping_cost) : 0,
        tax_rate: formData.tax_rate ? parseFloat(formData.tax_rate) : 0,
        images: formData.images.filter(img => img.trim() !== ''),
        category_id: formData.category_id || null,
        country_id: formData.country_id && formData.country_id !== 'all-countries' ? formData.country_id : null,
        brand: formData.brand || null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        sku: formData.sku,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        weight: formData.weight ? parseFloat(formData.weight) : null,
        dimensions: {
          length: formData.dimensions.length ? parseFloat(formData.dimensions.length) : null,
          width: formData.dimensions.width ? parseFloat(formData.dimensions.width) : null,
          height: formData.dimensions.height ? parseFloat(formData.dimensions.height) : null
        },
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
        social_preview_image: formData.social_preview_image || null,
        in_stock: parseInt(formData.stock_quantity) > 0,
        rating: 0,
        review_count: 0
      };

      let error;
      if (product) {
        // Update existing product
        ({ error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id));
      } else {
        // Create new product
        ({ error } = await supabase
          .from('products')
          .insert([productData]));
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: product ? "Product updated successfully" : "Product added successfully with SEO optimization"
      });

      onClose();
      onSuccess();
      
      // Reset form
      setFormData({
        name: '', description: '', slug: '', price: '', original_price: '', cost_price: '', 
        shipping_cost: '', tax_rate: '', images: [''], category_id: '', country_id: '', 
        vendor_id: '', auto_order_enabled: false,
        brand: '', tags: '', stock_quantity: '', sku: '', weight: '',
        dimensions: { length: '', width: '', height: '' },
        meta_title: '', meta_description: '', social_preview_image: ''
      });
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
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
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Essential product details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">URL Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="product-url-slug"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will be used in the product URL. Auto-generated from name.
                    </p>
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
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        placeholder="Enter brand name"
                      />
                    </div>
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

                  <div>
                    <Label htmlFor="vendor">Vendor (Optional - For Auto Order)</Label>
                    <Select value={formData.vendor_id} onValueChange={(value) => setFormData({ ...formData, vendor_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vendor for auto ordering" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Manual Order (No Auto Order)</SelectItem>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.vendor_id && (
                      <div className="mt-2 flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="auto_order_enabled"
                          checked={formData.auto_order_enabled}
                          onChange={(e) => setFormData({ ...formData, auto_order_enabled: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="auto_order_enabled" className="text-sm">
                          Enable automatic order placement for this product
                        </Label>
                      </div>
                    )}
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing */}
            <TabsContent value="pricing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing & Costs</CardTitle>
                  <CardDescription>Set pricing and cost information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Sale Price *</Label>
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
                      <Label htmlFor="original_price">Original Price</Label>
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
                      <p className="text-xs text-gray-500 mt-1">
                        Your cost to acquire/produce this product
                      </p>
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
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Media */}
            <TabsContent value="media" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Product Images</CardTitle>
                  <CardDescription>Upload or add product images</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductImageUpload
                    images={formData.images.filter(img => img.trim() !== '')}
                    onImagesChange={(images) => setFormData({ ...formData, images })}
                    maxImages={5}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inventory */}
            <TabsContent value="inventory" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory & Shipping</CardTitle>
                  <CardDescription>Stock and physical properties</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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

                  <div>
                    <Label>Dimensions (cm)</Label>
                    <div className="grid grid-cols-3 gap-2">
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
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEO */}
            <TabsContent value="seo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>SEO Optimization</CardTitle>
                  <CardDescription>Optimize for search engines and social media</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="meta_title">Meta Title</Label>
                    <Input
                      id="meta_title"
                      value={formData.meta_title}
                      onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                      placeholder="SEO title (60 characters max)"
                      maxLength={60}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.meta_title.length}/60 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="meta_description">Meta Description</Label>
                    <Textarea
                      id="meta_description"
                      value={formData.meta_description}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                      placeholder="SEO description (160 characters max)"
                      maxLength={160}
                      rows={3}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.meta_description.length}/160 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="social_preview_image">Social Media Preview Image</Label>
                    <Input
                      id="social_preview_image"
                      value={formData.social_preview_image}
                      onChange={(e) => setFormData({ ...formData, social_preview_image: e.target.value })}
                      placeholder="URL for social media sharing (1200x630 recommended)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Used when product is shared on social media platforms
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="flex gap-2 pt-4">
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