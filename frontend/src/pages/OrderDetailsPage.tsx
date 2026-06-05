import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  ShoppingCart, 
  Printer, 
  Trash2, 
  User, 
  Calendar, 
  Briefcase, 
  AlertCircle,
  TrendingUp,
  Mail,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { orderService } from "../services/orderService";
import { customerService } from "../services/customerService";
import { Order, Customer } from "../types";
import { Loader } from "../components/shared/Loader";
import { useToast } from "../components/shared/ToastContext";

export const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const navigate = useNavigate();
  const toast = useToast();

  const loadOrderDetails = useCallback(async (isSilent = false) => {
    if (!id) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const orderIdNum = Number(id);
      if (isNaN(orderIdNum)) {
        throw new Error("Invalid order query parameters.");
      }

      const fetchedOrder = await orderService.getOrder(orderIdNum);
      setOrder(fetchedOrder);

      // fetch associated buyer profile
      try {
        const fetchedCust = await customerService.getCustomer(fetchedOrder.customer_id);
        setCustomer(fetchedCust);
      } catch {
        // Customer profile might be removed already: fallback graceful representation
        setCustomer(null);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to load order audit profile.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, toast]);

  useEffect(() => {
    loadOrderDetails();
    const handleModeChange = () => loadOrderDetails(true);
    window.addEventListener("api-mode-change", handleModeChange);
    return () => window.removeEventListener("api-mode-change", handleModeChange);
  }, [loadOrderDetails]);

  // Handle order deletion from detail view
  const handleDelete = async () => {
    if (!order) return;
    if (window.confirm(`Are you sure you want to permanently withdraw invoice records for Order #${order.id}?`)) {
      try {
        await orderService.deleteOrder(order.id);
        toast.success(`Removed Order #${order.id} from active records`);
        navigate("/orders");
      } catch (err: any) {
        toast.error(err?.message || "Could not complete order removal.");
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader message="Synchronizing invoice segments..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center p-12 max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 bg-rose-50 text-red-500 rounded-full flex items-center justify-center mx-auto border border-rose-100">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h2 className="text-sm font-semibold text-gray-900 tracking-tight">Order Not Found</h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          The requested transaction ID #{id} could not be resolved inside active systems.
        </p>
        <Link 
          to="/orders" 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-950 hover:bg-gray-900 text-white font-semibold rounded-lg text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto print:max-w-full">
      {/* Back button and page controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Orders List
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadOrderDetails(true)}
            disabled={refreshing}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 transition cursor-pointer"
            title="Refresh order"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-50 border border-gray-200 bg-white text-gray-700 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-gray-500" />
            Print Invoice
          </button>

          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            Delete Order
          </button>
        </div>
      </div>

      {/* Main Invoice Sheet card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden print:border-none print:shadow-none animate-in fade-in duration-300">
        
        {/* Header Section */}
        <div className="p-6 md:p-8 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Order Invoice Profile</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Invoice Statement #{order.id}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                Auth Date: June 05, 2026
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="inline-flex items-center gap-1 text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-md border border-green-100/50">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                Settled & Validated
              </span>
            </div>
          </div>

          <div className="text-left sm:text-left md:text-right">
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Total Valuation</span>
            <span className="text-2xl font-bold text-gray-900 mt-0.5 block">
              ${order.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Customer Info & Summary Segment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 md:p-8 border-b border-gray-200 bg-gray-50/50">
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-gray-400 shrink-0" />
              Linked Customer details
            </span>

            {customer ? (
              <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] space-y-1">
                <h4 className="font-semibold text-gray-900 text-sm">{customer.full_name}</h4>
                <div className="text-xs text-gray-500 flex flex-col gap-1 mt-2">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {customer.email}
                  </span>
                  <span>CustomerID: #{customer.id}</span>
                  <span>Contact: {customer.phone_number}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-150 text-amber-800 text-xs">
                <p className="font-semibold">Original buyer profile unavailable</p>
                <p className="mt-1 text-amber-700 leading-relaxed font-medium">
                  Associated customer folder (ID #{order.customer_id}) has been removed or anonymized. Historical order registry value remains locked.
                </p>
              </div>
            )}
          </div>

          
        </div>

        {/* Invoice Grid items table */}
        <div className="p-6 md:p-8">
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Allocated Products & Ledger</span>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)] bg-white">
              <table className="w-full text-left" id="invoice-items-table">
                <thead className="bg-[#F8FAFC] border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Product ID</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Item Name / Stock ID</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">Quantity</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Unit Price</th>
                    <th className="px-5 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right pr-6">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-[11px] text-gray-400">
                          #{item.product_id}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-gray-800">
                          {item.product_name || `Product Profile ID: #${item.product_id}`}
                        </td>
                        <td className="px-5 py-3.5 text-center font-medium text-gray-600">
                          {item.quantity}
                        </td>
                        <td className="px-5 py-3.5 text-right text-gray-600">
                          ${item.unit_price ? item.unit_price.toFixed(2) : "0.00"}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-gray-900 pr-6">
                          ${item.subtotal ? item.subtotal.toFixed(2) : (item.unit_price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Fallback to generic representing line item
                    <tr>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-gray-400">
                        #----
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-850">
                        Consolidated Invoice Product Stack
                      </td>
                      <td className="px-5 py-3.5 text-center font-medium text-gray-650">
                        1
                      </td>
                      <td className="px-5 py-3.5 text-right text-gray-650">
                        ${order.total_amount.toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-gray-900 pr-6">
                        ${order.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Total Summary Footer inside Invoice card */}
              <div className="p-5 border-t border-gray-200 bg-gray-50/50 flex flex-col items-end space-y-2 select-none">
                <div className="flex items-center gap-6 text-xs text-gray-500 font-medium">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-gray-800">${order.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-6 text-xs text-gray-500 font-medium pb-1.5 border-b border-gray-200 w-full sm:w-auto justify-end">
                  <span>Surcharge Fee:</span>
                  <span className="font-semibold text-green-600">Free / $0.00</span>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-900 font-bold pt-1">
                  <span>Authorized Total (USD):</span>
                  <span className="text-base font-semibold text-blue-600">${order.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

       
      </div>
    </div>
  );
};
