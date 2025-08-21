import { Product, Category } from '@/lib/types';

export const categories: Category[] = [
  {
    id: 'electronics',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Latest gadgets and electronic devices',
    productCount: 45,
    subcategories: [
      { id: 'phones', name: 'Smartphones', slug: 'phones', productCount: 12 },
      { id: 'laptops', name: 'Laptops', slug: 'laptops', productCount: 8 },
      { id: 'accessories', name: 'Accessories', slug: 'accessories', productCount: 25 }
    ]
  },
  {
    id: 'fashion',
    name: 'Fashion',
    slug: 'fashion',
    description: 'Trendy clothing and accessories',
    productCount: 128,
    subcategories: [
      { id: 'mens', name: "Men's Fashion", slug: 'mens', productCount: 45 },
      { id: 'womens', name: "Women's Fashion", slug: 'womens', productCount: 67 },
      { id: 'shoes', name: 'Shoes', slug: 'shoes', productCount: 16 }
    ]
  },
  {
    id: 'home',
    name: 'Home & Living',
    slug: 'home',
    description: 'Everything for your home',
    productCount: 89,
    subcategories: [
      { id: 'furniture', name: 'Furniture', slug: 'furniture', productCount: 34 },
      { id: 'decor', name: 'Home Decor', slug: 'decor', productCount: 28 },
      { id: 'kitchen', name: 'Kitchen', slug: 'kitchen', productCount: 27 }
    ]
  },
  {
    id: 'sports',
    name: 'Sports & Fitness',
    slug: 'sports',
    description: 'Fitness equipment and sportswear',
    productCount: 56,
    subcategories: [
      { id: 'fitness', name: 'Fitness Equipment', slug: 'fitness', productCount: 23 },
      { id: 'outdoor', name: 'Outdoor Sports', slug: 'outdoor', productCount: 18 },
      { id: 'sportswear', name: 'Sportswear', slug: 'sportswear', productCount: 15 }
    ]
  }
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Premium Wireless Headphones',
    description: 'High-quality wireless headphones with active noise cancellation, premium sound quality, and 30-hour battery life. Perfect for music lovers and professionals.',
    price: 299.99,
    originalPrice: 399.99,
    images: ['/api/placeholder/600/600', '/api/placeholder/600/600', '/api/placeholder/600/600'],
    category: 'electronics',
    subcategory: 'accessories',
    brand: 'AudioPro',
    inStock: true,
    stockQuantity: 25,
    sku: 'APH-001',
    tags: ['wireless', 'noise-canceling', 'premium', 'bluetooth'],
    rating: 4.8,
    reviewCount: 124,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    variants: [
      { id: 'v1', name: 'Color', value: 'Black', stockQuantity: 15, sku: 'APH-001-BLK' },
      { id: 'v2', name: 'Color', value: 'White', stockQuantity: 10, sku: 'APH-001-WHT' }
    ]
  },
  {
    id: '2',
    name: 'Smart Fitness Tracker',
    description: 'Advanced fitness tracker with heart rate monitoring, GPS, water resistance, and 7-day battery life. Track your workouts and health metrics.',
    price: 199.99,
    originalPrice: 249.99,
    images: ['/api/placeholder/600/600', '/api/placeholder/600/600'],
    category: 'sports',
    subcategory: 'fitness',
    brand: 'FitTech',
    inStock: true,
    stockQuantity: 42,
    sku: 'FT-002',
    tags: ['fitness', 'health', 'gps', 'waterproof'],
    rating: 4.6,
    reviewCount: 89,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    variants: [
      { id: 'v3', name: 'Size', value: 'Small', stockQuantity: 20, sku: 'FT-002-S' },
      { id: 'v4', name: 'Size', value: 'Large', stockQuantity: 22, sku: 'FT-002-L' }
    ]
  },
  {
    id: '3',
    name: 'Minimalist Desk Lamp',
    description: 'Modern LED desk lamp with adjustable brightness, USB charging port, and sleek minimalist design. Perfect for home office or study.',
    price: 89.99,
    images: ['/api/placeholder/600/600', '/api/placeholder/600/600'],
    category: 'home',
    subcategory: 'decor',
    brand: 'LightCraft',
    inStock: true,
    stockQuantity: 18,
    sku: 'LC-003',
    tags: ['led', 'adjustable', 'usb', 'modern'],
    rating: 4.7,
    reviewCount: 56,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-19')
  },
  {
    id: '4',
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable organic cotton t-shirt with premium quality fabric. Sustainable fashion that feels great and looks amazing.',
    price: 29.99,
    originalPrice: 39.99,
    images: ['/api/placeholder/600/600', '/api/placeholder/600/600'],
    category: 'fashion',
    subcategory: 'mens',
    brand: 'EcoWear',
    inStock: true,
    stockQuantity: 67,
    sku: 'EW-004',
    tags: ['organic', 'cotton', 'sustainable', 'comfortable'],
    rating: 4.5,
    reviewCount: 203,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-16'),
    variants: [
      { id: 'v5', name: 'Size', value: 'S', stockQuantity: 15, sku: 'EW-004-S' },
      { id: 'v6', name: 'Size', value: 'M', stockQuantity: 25, sku: 'EW-004-M' },
      { id: 'v7', name: 'Size', value: 'L', stockQuantity: 18, sku: 'EW-004-L' },
      { id: 'v8', name: 'Size', value: 'XL', stockQuantity: 9, sku: 'EW-004-XL' }
    ]
  },
  {
    id: '5',
    name: 'Professional Coffee Grinder',
    description: 'Burr coffee grinder with 40 grind settings, precision grinding, and durable stainless steel construction for the perfect cup.',
    price: 179.99,
    images: ['/api/placeholder/600/600', '/api/placeholder/600/600'],
    category: 'home',
    subcategory: 'kitchen',
    brand: 'BrewMaster',
    inStock: true,
    stockQuantity: 12,
    sku: 'BM-005',
    tags: ['coffee', 'grinder', 'burr', 'precision'],
    rating: 4.9,
    reviewCount: 78,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-21')
  },
  {
    id: '6',
    name: 'Wireless Gaming Mouse',
    description: 'High-performance gaming mouse with RGB lighting, programmable buttons, and ultra-precise tracking for competitive gaming.',
    price: 79.99,
    originalPrice: 99.99,
    images: ['/api/placeholder/600/600', '/api/placeholder/600/600'],
    category: 'electronics',
    subcategory: 'accessories',
    brand: 'GamePro',
    inStock: true,
    stockQuantity: 33,
    sku: 'GP-006',
    tags: ['gaming', 'wireless', 'rgb', 'precision'],
    rating: 4.4,
    reviewCount: 156,
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-17')
  }
];