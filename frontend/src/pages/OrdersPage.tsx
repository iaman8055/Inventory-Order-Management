import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Eye, 
  User, 
  PlusCircle, 
  MinusCircle, 
  DollarSign, 
  CheckCircle, 
  X, 
  AlertTriangle,
  RefreshCw,
  FileCheck
} from "lucide-react";
import { orderService } from "../services/orderService";
import { customerService } from "../services/customerService";
import { productService } from "../services/productService";
import { Order, Customer, Product, OrderItemInput } from "../types";
import { Loader } from "../components/shared/Loader";
import { EmptyState } from "../components/shared/EmptyState";
import { useToast } from "../components/shared/ToastContext";

interface TempLineItem {
  id: string; // client-only temp key
  product_id: string;
  quantity: number;
}

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form states - Create Order Workspace
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [lineItems, setLineItems] = useState<TempLineItem[]>([
    { id: "1", product_id: "", quantity: 1 }
  ]);
  const [formError, setFormError] = useState("");

  // Post-submit success overlay state
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  const toast = useToast();

  const loadData = useCallback(async (showScreenLoader = true) => {
    if (showScreenLoader) {
      setLoading(true);
    }
    try {
      const [fetchedOrders, fetchedCustomers, fetchedProducts] = await Promise.all([
        orderService.getOrders(),
        customerService.getCustomers(),
        productService.getProducts()
      ]);

      // Map customer names for ease of presentation inside table rows
      const decoratedOrders = fetchedOrders.map(order => {
        const foundCust = fetchedCustomers.find(c => c.id === order.customer_id);
        return {
          ...order,
          customer_name: foundCust ? foundCust.full_name : `Customer ID #${order.customer_id}`
        };
      });

      setOrders(decoratedOrders);
      setCustomers(fetchedCustomers);
      setProducts(fetchedProducts);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to load order registers.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
    const handleModeChange = () => loadData(true);
    window.addEventListener("api-mode-change", handleModeChange);
    return () => window.removeEventListener("api-mode-change", handleModeChange);
  }, [loadData]);

  // Actions
  const handleDeleteOrder = async (id: number) => {
    if (window.confirm(`Are you sure you want to permanently delete Order #${id}?`)) {
      try {
        await orderService.deleteOrder(id);
        toast.success(`Deleted Order #${id}`);
        setOrders(prev => prev.filter(o => o.id !== id));
      } catch (err: any) {
        toast.error(err?.message || "Could not complete order removal.");
      }
    }
  };

  // Line item builders
  const handleAddLineRow = () => {
    const tempKey = Math.random().toString(36).substring(2, 9);
    setLineItems(prev => [...prev, { id: tempKey, product_id: "", quantity: 1 }]);
  };

  const handleRemoveLineRow = (id: string) => {
    if (lineItems.length === 1) {
      toast.warning("An order must contain at least one product row");
      return;
    }
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const handleLineProductChange = (lineId: string, productId: string) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === lineId) {
        return { ...item, product_id: productId };
      }
      return item;
    }));
  };

  const handleLineQtyChange = (lineId: string, qty: number) => {
    if (qty < 1) qty = 1;
    setLineItems(prev => prev.map(item => {
      if (item.id === lineId) {
        return { ...item, quantity: Math.floor(qty) };
      }
      return item;
    }));
  };

  // Live order calculations
  const orderDetailsSummary = useMemo(() => {
    let subtotal = 0;
    const hasInvalidLevel = lineItems.some(item => {
      if (!item.product_id) return false;
      const targetProd = products.find(p => p.id === Number(item.product_id));
      if (!targetProd) return false;
      return targetProd.stock_quantity < item.quantity;
    });

    lineItems.forEach(item => {
      if (!item.product_id) return;
      const prod = products.find(p => p.id === Number(item.product_id));
      if (prod) {
        subtotal += prod.price * item.quantity;
      }
    });

    return {
      subtotal,
      hasStockAlert: hasInvalidLevel
    };
  }, [lineItems, products]);

  // Form submission handler
  const handlePlaceOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedCustomerId) {
      setFormError("Please select a registered customer to attribute this purchase");
      return;
    }

    // Filter out rows missing a product selection
    const rawItems = lineItems.filter(item => item.product_id !== "");
    if (rawItems.length === 0) {
      setFormError("Please add at least one line product item to place order");
      return;
    }

    // Consolidate duplicates inside form lines
    const itemMap = new Map<number, number>();
    for (const item of rawItems) {
      const pId = Number(item.product_id);
      const qty = item.quantity;
      
      const pData = products.find(p => p.id === pId);
      if (!pData) continue;
      
      const currentQty = itemMap.get(pId) || 0;
      const targetQty = currentQty + qty;

      if (pData.stock_quantity < targetQty) {
        setFormError(`Insufficient stock available for "${pData.name}". Requested: ${targetQty} units, Available: ${pData.stock_quantity}`);
        return;
      }
      itemMap.set(pId, targetQty);
    }

    const itemsPayload: OrderItemInput[] = Array.from(itemMap.entries()).map(([product_id, quantity]) => ({
      product_id,
      quantity
    }));

    setSubmittingOrder(true);
    try {
      const placedOrder = await orderService.addOrder({
        customer_id: Number(selectedCustomerId),
        items: itemsPayload
      });

      // Show professional Success popup
      setSuccessOrder(placedOrder);
      toast.success("Order processed and stock levels updated!");
      
      // Reset Workspace
      setSelectedCustomerId("");
      setLineItems([{ id: "1", product_id: "", quantity: 1 }]);
      setIsCreating(false);
      loadData(false);
    } catch (err: any) {
      console.error(err);
      setFormError(err?.message || "An API integration failure occurred while placing order.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      {!isCreating ? (
        // STATE 1: List and Manage placed records
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900" id="orders-heading">
                Orders Registers
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Process order logs, track transaction values, and launch order summaries.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => loadData(true)}
                className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition"
                title="Refresh order logs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsCreating(true)}
                id="create-order-btn"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Order
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <Loader message="Synchronizing global order log..." />
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              title="No transactions placed inside registers"
              description="Coordinate customized clients and catalog systems to assemble checkout statements."
              actionText="Assemble First Order"
              onAction={() => setIsCreating(true)}
            />
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden animate-in fade-in duration-300">
              <div className="overflow-x-auto">
                <table className="w-full text-left" id="orders-table">
                  <thead className="bg-[#F8FAFC] border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Order ID</th>
                      <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Customer Name (ID)</th>
                      <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center font-bold">Items Count</th>
                      <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Total Amount</th>
                      <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right pr-8">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-black text-gray-900">
                          #{order.id}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-850">
                          {order.customer_name}
                          <span className="text-xs font-normal text-gray-450 block font-mono mt-0.5">
                            Client ID: #{order.customer_id}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-500 text-xs">
                          {order.items?.length || 1} distinct item(s)
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          ${order.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right pr-6">
                          <div className="inline-flex items-center gap-1.5">
                            <Link
                              to={`/orders/${order.id}`}
                              id={`view-order-${order.id}`}
                              className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition inline-flex items-center"
                              title="Inspect purchased items"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              id={`delete-order-${order.id}`}
                              className="p-1.5 rounded-md border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                              title="Delete Order Log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                <span>{orders.length} order entries overall</span>
              </div>
            </div>
          )}
        </>
      ) : (
        // STATE 2: Create Order Workspace flow
        <div className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#F8FAFC]">
            <div className="flex items-center gap-2.5">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900 tracking-tight">
                  New Order Workspace
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Construct cart item allocations, select designated clients, and process orders.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCreating(false)}
              className="px-3 py-1.5 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Cancel Workspace
            </button>
          </div>

          <form onSubmit={handlePlaceOrderSubmit} className="p-6 space-y-6">
            {formError && (
              <div className="bg-rose-50 border border-rose-200 rounded-md p-4 text-xs font-semibold text-red-800 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Stage 1: Select Customer */}
            <div className="p-5 bg-gray-55/50 rounded-lg border border-gray-100 space-y-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Stage 1: Link Buyer Customer Profile
              </span>
              
              <div className="space-y-1.5 max-w-md">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Select Customer *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </span>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    id="order-customer-select"
                    className="w-full bg-white pl-10 pr-4 py-2 border border-gray-200 focus:border-blue-500 focus:outline-none rounded-md text-xs cursor-pointer"
                  >
                    <option value="">-- Choose Client --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
                {customers.length === 0 && (
                  <p className="text-xs text-red-600 font-semibold mt-1">
                    Please register at least one customer inside Customer Management before starting orders.
                  </p>
                )}
              </div>
            </div>

            {/* Stage 2: Link Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  Stage 2: Allocate Cart Products
                </span>
                <button
                  type="button"
                  onClick={handleAddLineRow}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Cart Row
                </button>
              </div>

              <div className="space-y-3">
                {lineItems.map((item, index) => {
                  const targetProd = products.find(p => p.id === Number(item.product_id));
                  const isOutOfStock = targetProd && (targetProd.stock_quantity < item.quantity);
                  const maxStockText = targetProd ? `Limit of ${targetProd.stock_quantity} available` : "";

                  return (
                    <div 
                      key={item.id} 
                      className={`flex flex-col sm:flex-row items-stretch sm:items-center p-3.5 sm:p-4 rounded-lg border transition-all ${
                        isOutOfStock 
                          ? "bg-rose-50 border-rose-200 shrink-0" 
                          : "bg-white border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                      }`}
                    >
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
                        {/* Selector */}
                        <div className="sm:col-span-7 space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block sm:hidden">
                            Product Row #{index + 1}
                          </label>
                          <select
                            required
                            value={item.product_id}
                            onChange={(e) => handleLineProductChange(item.id, e.target.value)}
                            className="w-full bg-gray-50 px-3 py-2 border border-gray-200 focus:border-blue-500 rounded-md text-xs cursor-pointer"
                          >
                            <option value="">-- Select Product --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id} disabled={p.stock_quantity === 0}>
                                {p.name} - ${p.price.toFixed(2)} (Qty: {p.stock_quantity})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="sm:col-span-3 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400 select-none hidden sm:inline text-right shrink-0 w-8">
                              Qty:
                            </span>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              required
                              disabled={!item.product_id}
                              value={item.quantity}
                              onChange={(e) => handleLineQtyChange(item.id, parseInt(e.target.value, 10))}
                              className="w-full px-2.5 py-1 text-xs border border-gray-200 focus:border-blue-500 rounded-md text-right font-medium"
                            />
                          </div>
                          {targetProd && (
                            <span className={`text-[10px] block text-center ${isOutOfStock ? "text-red-650 font-bold" : "text-gray-400 font-medium"}`}>
                              {isOutOfStock ? `Over-limit! Available: ${targetProd.stock_quantity}` : `${maxStockText}`}
                            </span>
                          )}
                        </div>

                        {/* Price Subtotal */}
                        <div className="sm:col-span-2 text-right">
                          <span className="text-[10px] block font-bold text-gray-400 sm:hidden">
                            Line Subtotal:
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            ${targetProd ? (targetProd.price * item.quantity).toFixed(2) : "0.00"}
                          </span>
                        </div>
                      </div>

                      {/* Line Remove Trigger */}
                      <div className="mt-3.5 sm:mt-0 sm:ml-4 border-t sm:border-t-0 pt-2.5 sm:pt-0 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineRow(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-slate-50 rounded-md transition cursor-pointer"
                          title="Remove Cart row"
                        >
                          <MinusCircle className="w-4 h-4 shrink-0" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stage 3: Summary Pricing and Submission */}
            <div className="bg-gray-50/50 p-5 rounded-lg border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="text-center md:text-left">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Calculated Order Total
                </span>
                <span className="text-2xl font-bold text-gray-950 flex items-center md:justify-start justify-center gap-1 mt-0.5">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  {orderDetailsSummary.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {orderDetailsSummary.hasStockAlert && (
                <div className="bg-[#FEF2F2] border border-[#FEE2E2] text-[#EF4444] shrink-0 rounded-lg px-4 py-2 flex items-center gap-2 text-xs font-semibold max-w-sm">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Some allocated line items exceed available stock. Please reduce count.</span>
                </div>
              )}

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3.5 py-2 rounded-lg border border-gray-200 bg-white text-gray-600 font-semibold text-xs hover:bg-gray-50 transition cursor-pointer"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder || orderDetailsSummary.hasStockAlert || !selectedCustomerId}
                  id="checkout-submit-btn"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-40 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingOrder ? "Processing Checkout..." : "Place Checkout Order"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Success Modal Pop-up overlay */}
      {successOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setSuccessOrder(null)} />

          <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-md w-full overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4 border-b border-gray-100 bg-[#F8FAFC]">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-100">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Transaction Authorized
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  The invoice statement has been parsed and stock values synchronized.
                </p>
              </div>
            </div>

            <div className="p-5 bg-white space-y-4 font-sans">
              <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                <div>
                  <span className="text-gray-400 block uppercase tracking-wider font-bold text-[10px]">Order ID</span>
                  <span className="text-gray-900 font-semibold text-xs font-mono mt-0.5">#{successOrder.id}</span>
                </div>
                <div>
                  <span className="text-gray-400 block uppercase tracking-wider font-bold text-[10px]">Total Amount</span>
                  <span className="text-green-600 font-semibold text-xs mt-0.5">
                    ${successOrder.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {successOrder.items && successOrder.items.length > 0 && (
                <div className="space-y-1.5 border-t border-gray-100 pt-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Purchased Segments</span>
                  <div className="max-h-24 overflow-y-auto divide-y divide-gray-100 pr-1.5">
                    {successOrder.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 text-xs text-gray-700">
                        <span className="font-semibold text-gray-800">{item.product_name}</span>
                        <div className="text-gray-550">
                          <span>{item.quantity} units</span>
                          <span className="font-mono text-gray-400 ml-1">@ ${item.unit_price.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-150 flex items-center justify-end">
              <button
                onClick={() => setSuccessOrder(null)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-950 hover:bg-gray-900 text-white text-xs font-semibold rounded-lg transition"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
