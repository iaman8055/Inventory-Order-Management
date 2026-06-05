export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
}

export interface Customer {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
}

export interface OrderItemInput {
  product_id: number;
  quantity: number;
}

export interface OrderInput {
  customer_id: number;
  items: OrderItemInput[];
}

export interface OrderItem {
  id?: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  customer_id: number;
  customer_name?: string;
  total_amount: number;
  items?: OrderItem[];
}

export interface DashboardMetrics {
  total_products: number;
  total_customers: number;
  total_orders: number;
  low_stock_count: number;
  inventory_value: number;
  total_revenue: number;
  low_stock_products: Product[];
}
