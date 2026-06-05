import { Product, Customer, Order, DashboardMetrics, OrderInput } from "../types";

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: "iPhone 15 Pro", sku: "AAPL-IP15P", price: 999.00, stock_quantity: 45 },
  { id: 2, name: "Samsung Galaxy S24", sku: "SSG-S24", price: 899.00, stock_quantity: 3 },
  { id: 3, name: "MacBook Air M3", sku: "AAPL-MBA3", price: 1099.00, stock_quantity: 12 },
  { id: 4, name: "Sony WH-1000XM5", sku: "SNY-XM5", price: 349.00, stock_quantity: 0 },
  { id: 5, name: "Dell XPS 15", sku: "DLL-XPS15", price: 1599.00, stock_quantity: 8 },
  { id: 6, name: "iPad Pro", sku: "AAPL-IPP", price: 799.00, stock_quantity: 5 }
];

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 1, full_name: "Alex Rivera", email: "alex@example.com", phone_number: "+1 (555) 123-4567" },
  { id: 2, full_name: "Jordan Lee", email: "jordan@example.com", phone_number: "+1 (555) 765-4321" },
  { id: 3, full_name: "Taylor Smith", email: "taylor@example.com", phone_number: "+1 (555) 987-6543" },
  { id: 4, full_name: "Casey Johnson", email: "casey@example.com", phone_number: "+1 (555) 345-6789" }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 1001,
    customer_id: 1,
    customer_name: "Alex Rivera",
    total_amount: 1348.00,
    items: [
      { product_id: 1, product_name: "iPhone 15 Pro", quantity: 1, unit_price: 999.00, subtotal: 999.00 },
      { product_id: 4, product_name: "Sony WH-1000XM5", quantity: 1, unit_price: 349.00, subtotal: 349.00 }
    ]
  },
  {
    id: 1002,
    customer_id: 2,
    customer_name: "Jordan Lee",
    total_amount: 1099.00,
    items: [
      { product_id: 3, product_name: "MacBook Air M3", quantity: 1, unit_price: 1099.00, subtotal: 1099.00 }
    ]
  }
];

class MockDatabase {
  private getStorageItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(`inv_sys_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setStorageItem<T>(key: string, value: T): void {
    localStorage.setItem(`inv_sys_${key}`, JSON.stringify(value));
  }

  getProducts(): Product[] {
    return this.getStorageItem<Product[]>("products", INITIAL_PRODUCTS);
  }

  setProducts(products: Product[]): void {
    this.setStorageItem("products", products);
  }

  getCustomers(): Customer[] {
    return this.getStorageItem<Customer[]>("customers", INITIAL_CUSTOMERS);
  }

  setCustomers(customers: Customer[]): void {
    this.setStorageItem("customers", customers);
  }

  getOrders(): Order[] {
    return this.getStorageItem<Order[]>("orders", INITIAL_ORDERS);
  }

  setOrders(orders: Order[]): void {
    this.setStorageItem("orders", orders);
  }

  getUseMockMode(): boolean {
    const mode = localStorage.getItem("inv_sys_use_mock_mode");
    // Default to true so standard previews look fully packed and operational out-of-the-box,
    // but allowing them to toggle back to true localhost API instantly.
    return mode !== "false";
  }

  setUseMockMode(value: boolean): void {
    localStorage.setItem("inv_sys_use_mock_mode", String(value));
  }

  // Operations
  getProductById(id: number): Product | undefined {
    return this.getProducts().find(p => p.id === id);
  }

  addProduct(productData: Omit<Product, "id">): Product {
    const products = this.getProducts();
    const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const newProduct: Product = { ...productData, id: nextId };
    products.push(newProduct);
    this.setProducts(products);
    return newProduct;
  }

  updateProduct(id: number, productData: Omit<Product, "id">): Product {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Product not found");
    const updated: Product = { id, ...productData };
    products[index] = updated;
    this.setProducts(products);
    return updated;
  }

  deleteProduct(id: number): void {
    const products = this.getProducts();
    this.setProducts(products.filter(p => p.id !== id));
  }

  getCustomerById(id: number): Customer | undefined {
    return this.getCustomers().find(c => c.id === id);
  }

  addCustomer(customerData: Omit<Customer, "id">): Customer {
    const customers = this.getCustomers();
    const nextId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;
    const newCustomer: Customer = { ...customerData, id: nextId };
    customers.push(newCustomer);
    this.setCustomers(customers);
    return newCustomer;
  }

  deleteCustomer(id: number): void {
    const customers = this.getCustomers();
    this.setCustomers(customers.filter(c => c.id !== id));
  }

  getOrderById(id: number): Order | undefined {
    const order = this.getOrders().find(o => o.id === id);
    if (order) {
      // populate customer name
      const customer = this.getCustomerById(order.customer_id);
      order.customer_name = customer ? customer.full_name : `Customer #${order.customer_id}`;
    }
    return order;
  }

  addOrder(input: OrderInput): Order {
    const customers = this.getCustomers();
    const customer = customers.find(c => c.id === Number(input.customer_id));
    if (!customer) throw new Error(`Customer with ID ${input.customer_id} not found`);

    let total_amount = 0;
    const items = input.items.map(item => {
      const product = this.getProductById(Number(item.product_id));
      if (!product) throw new Error(`Product with ID ${item.product_id} not found`);
      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for product "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
      }

      const subtotal = product.price * item.quantity;
      total_amount += subtotal;

      // Update product stock quantity
      product.stock_quantity -= item.quantity;
      this.updateProduct(product.id, {
        name: product.name,
        sku: product.sku,
        price: product.price,
        stock_quantity: product.stock_quantity
      });

      return {
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        subtotal
      };
    });

    const orders = this.getOrders();
    const nextId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1001;
    const newOrder: Order = {
      id: nextId,
      customer_id: Number(input.customer_id),
      customer_name: customer.full_name,
      total_amount,
      items
    };
    orders.push(newOrder);
    this.setOrders(orders);
    return newOrder;
  }

  deleteOrder(id: number): void {
    const orders = this.getOrders();
    this.setOrders(orders.filter(o => o.id !== id));
  }

  getDashboardMetrics(): DashboardMetrics {
    const products = this.getProducts();
    const customers = this.getCustomers();
    const orders = this.getOrders();

    const low_stock_threshold = 5;
    const low_stock_products = products.filter(p => p.stock_quantity <= low_stock_threshold);
    const low_stock_count = low_stock_products.length;

    const inventory_value = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);
    const total_revenue = orders.reduce((sum, o) => sum + o.total_amount, 0);

    return {
      total_products: products.length,
      total_customers: customers.length,
      total_orders: orders.length,
      low_stock_count,
      inventory_value,
      total_revenue,
      low_stock_products
    };
  }

  resetData(): void {
    localStorage.removeItem("inv_sys_products");
    localStorage.removeItem("inv_sys_customers");
    localStorage.removeItem("inv_sys_orders");
  }
}

export const mockDb = new MockDatabase();
