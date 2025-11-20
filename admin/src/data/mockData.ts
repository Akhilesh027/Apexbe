export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'vendor' | 'admin';
  status: 'active' | 'blocked';
  joinedDate: string;
  avatar?: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  shopName: string;
  shopLogo?: string;
  shopAddress: string;
  gst: string;
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
  joinedDate: string;
  totalProducts: number;
  totalSales: number;
  earnings: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  price: number;
  stock: number;
  vendorId: string;
  vendorName: string;
  status: 'pending' | 'approved' | 'rejected';
  image?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  vendorId: string;
  vendorName: string;
  products: { name: string; quantity: number; price: number }[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  deliveryDate?: string;
}

export interface Payout {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  processedDate?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalVendors: number;
  totalShops: number;
  pendingShopApprovals: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface SalesData {
  month: string;
  sales: number;
  revenue: number;
}

export const mockUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'customer', status: 'active', joinedDate: '2024-01-15' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'vendor', status: 'active', joinedDate: '2024-02-20' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'customer', status: 'active', joinedDate: '2024-03-10' },
  { id: '4', name: 'Alice Williams', email: 'alice@example.com', role: 'customer', status: 'blocked', joinedDate: '2024-01-05' },
  { id: '5', name: 'Charlie Brown', email: 'charlie@example.com', role: 'vendor', status: 'active', joinedDate: '2024-02-15' },
];

export const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1234567890',
    shopName: 'Electronics Hub',
    shopAddress: '123 Main St, City',
    gst: 'GST123456',
    status: 'approved',
    joinedDate: '2024-02-20',
    totalProducts: 45,
    totalSales: 230,
    earnings: 45000,
  },
  {
    id: '2',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    phone: '+1234567891',
    shopName: 'Fashion Store',
    shopAddress: '456 Oak Ave, Town',
    gst: 'GST654321',
    status: 'pending',
    joinedDate: '2024-02-15',
    totalProducts: 0,
    totalSales: 0,
    earnings: 0,
  },
  {
    id: '3',
    name: 'David Wilson',
    email: 'david@example.com',
    phone: '+1234567892',
    shopName: 'Home Essentials',
    shopAddress: '789 Pine Rd, Village',
    gst: 'GST789012',
    status: 'approved',
    joinedDate: '2024-01-10',
    totalProducts: 32,
    totalSales: 180,
    earnings: 32000,
  },
];

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Mouse',
    category: 'Electronics',
    subCategory: 'Computer Accessories',
    price: 29.99,
    stock: 150,
    vendorId: '1',
    vendorName: 'Electronics Hub',
    status: 'approved',
    createdAt: '2024-03-01',
  },
  {
    id: '2',
    name: 'Cotton T-Shirt',
    category: 'Fashion',
    subCategory: 'Men\'s Clothing',
    price: 19.99,
    stock: 200,
    vendorId: '2',
    vendorName: 'Fashion Store',
    status: 'pending',
    createdAt: '2024-03-15',
  },
  {
    id: '3',
    name: 'LED Desk Lamp',
    category: 'Home & Living',
    subCategory: 'Lighting',
    price: 39.99,
    stock: 80,
    vendorId: '3',
    vendorName: 'Home Essentials',
    status: 'approved',
    createdAt: '2024-02-20',
  },
  {
    id: '4',
    name: 'Bluetooth Headphones',
    category: 'Electronics',
    subCategory: 'Audio',
    price: 79.99,
    stock: 120,
    vendorId: '1',
    vendorName: 'Electronics Hub',
    status: 'approved',
    createdAt: '2024-03-10',
  },
];

export const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-001',
    customerId: '1',
    customerName: 'John Doe',
    vendorId: '1',
    vendorName: 'Electronics Hub',
    products: [
      { name: 'Wireless Mouse', quantity: 2, price: 29.99 },
    ],
    total: 59.98,
    status: 'delivered',
    orderDate: '2024-03-01',
    deliveryDate: '2024-03-05',
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-002',
    customerId: '3',
    customerName: 'Bob Johnson',
    vendorId: '3',
    vendorName: 'Home Essentials',
    products: [
      { name: 'LED Desk Lamp', quantity: 1, price: 39.99 },
    ],
    total: 39.99,
    status: 'shipped',
    orderDate: '2024-03-10',
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-003',
    customerId: '1',
    customerName: 'John Doe',
    vendorId: '1',
    vendorName: 'Electronics Hub',
    products: [
      { name: 'Bluetooth Headphones', quantity: 1, price: 79.99 },
    ],
    total: 79.99,
    status: 'pending',
    orderDate: '2024-03-18',
  },
];

export const mockPayouts: Payout[] = [
  {
    id: '1',
    vendorId: '1',
    vendorName: 'Electronics Hub',
    amount: 15000,
    status: 'pending',
    requestDate: '2024-03-15',
  },
  {
    id: '2',
    vendorId: '3',
    vendorName: 'Home Essentials',
    amount: 10000,
    status: 'approved',
    requestDate: '2024-03-10',
    processedDate: '2024-03-12',
  },
];

export const mockDashboardStats: DashboardStats = {
  totalUsers: 5,
  totalVendors: 3,
  totalShops: 3,
  pendingShopApprovals: 1,
  totalProducts: 4,
  totalOrders: 3,
  totalRevenue: 179.96,
};

export const mockSalesData: SalesData[] = [
  { month: 'Jan', sales: 45, revenue: 12000 },
  { month: 'Feb', sales: 52, revenue: 15000 },
  { month: 'Mar', sales: 48, revenue: 13500 },
  { month: 'Apr', sales: 61, revenue: 18000 },
  { month: 'May', sales: 55, revenue: 16500 },
  { month: 'Jun', sales: 67, revenue: 21000 },
];

export const mockRecentActivity = [
  { id: '1', action: 'New vendor registration', user: 'Charlie Brown', time: '5 minutes ago' },
  { id: '2', action: 'Product approved', product: 'Wireless Mouse', time: '10 minutes ago' },
  { id: '3', action: 'Order delivered', order: 'ORD-2024-001', time: '1 hour ago' },
  { id: '4', action: 'Payout requested', vendor: 'Electronics Hub', time: '2 hours ago' },
  { id: '5', action: 'New user registered', user: 'John Doe', time: '3 hours ago' },
];

export const mockCategories = [
  { id: '1', name: 'Electronics', subCategories: ['Computer Accessories', 'Audio', 'Mobile & Tablets'] },
  { id: '2', name: 'Fashion', subCategories: ['Men\'s Clothing', 'Women\'s Clothing', 'Accessories'] },
  { id: '3', name: 'Home & Living', subCategories: ['Furniture', 'Lighting', 'Decor'] },
  { id: '4', name: 'Books', subCategories: ['Fiction', 'Non-Fiction', 'Educational'] },
];
