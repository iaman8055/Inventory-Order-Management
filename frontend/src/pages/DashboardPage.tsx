import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Boxes,
  Users,
  ShoppingCart,
  AlertTriangle,
  CircleDollarSign,
  Briefcase,
  ChevronRight,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { dashboardService } from "../services/dashboardService";
import { DashboardMetrics } from "../types";
import { Loader } from "../components/shared/Loader";
import { useToast } from "../components/shared/ToastContext";

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const fetchMetrics = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const data = await dashboardService.getDashboardMetrics();
      setMetrics(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to fetch dashboard metrics from service.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMetrics();
    
    // Refresh on API mode changes too
    const handleModeChange = () => fetchMetrics();
    window.addEventListener("api-mode-change", handleModeChange);
    return () => window.removeEventListener("api-mode-change", handleModeChange);
  }, [fetchMetrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader message="Synchronizing dashboard measurements..." />
      </div>
    );
  }

  const cards = [
    {
      title: "Total Products",
      value: metrics?.summary?.total_products ?? 0,
      icon: Boxes,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
      link: "/products"
    },
    {
      title: "Total Customers",
      value: metrics?.summary?.total_customers ?? 0,
      icon: Users,
      color: "bg-teal-500",
      textColor: "text-teal-600",
      bgColor: "bg-teal-50",
      link: "/customers"
    },
    {
      title: "Total Orders",
      value: metrics?.summary?.total_orders ?? 0,
      icon: ShoppingCart,
      color: "bg-indigo-500",
      textColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      link: "/orders"
    },
    {
      title: "Low Stock Items",
      value: metrics?.summary?.low_stock_count ?? 0,
      icon: AlertTriangle,
      color: "bg-rose-500",
      textColor: "text-rose-600",
      bgColor: "bg-rose-50",
      link: "/products",
      alert: (metrics?.low_stock_count ?? 0) > 0
    },
    {
      title: "Inventory Value",
      value: `$${(metrics?.summary?.inventory_value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Briefcase,
      color: "bg-amber-500",
      textColor: "text-amber-600",
      bgColor: "bg-amber-50"
    },
    {
      title: "Total Revenue",
      value: `$${(metrics?.summary?.total_revenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: CircleDollarSign,
      color: "bg-emerald-500",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" id="dashboard-heading">
            Dashboard Overview
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time inventory and sales tracking
          </p>
        </div>
        
        <button
          onClick={() => fetchMetrics(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.05)] disabled:opacity-50 select-none cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          const isInteractive = !!card.link;
          const CardContent = (
            <div className={`p-6 bg-white border border-gray-200 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:border-gray-300 transition-all flex items-center justify-between group relative overflow-hidden ${
              isInteractive ? "cursor-pointer" : ""
            }`}>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  {card.title}
                </span>
                <span className={`text-2xl font-bold tracking-tight block ${card.title === "Low Stock Items" && (metrics?.low_stock_count ?? 0) > 0 ? "text-red-600" : "text-gray-900"}`}>
                  {card.value}
                </span>
                {isInteractive && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    View list <ChevronRight className="w-3 h-3" />
                  </span>
                )}
              </div>
              
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200 ${card.bgColor} ${card.textColor}`}>
                <Icon className="w-5 h-5" />
              </div>

              {card.alert && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500"></span>
              )}
            </div>
          );

          if (isInteractive) {
            return (
              <Link key={i} to={card.link || "#"}>
                {CardContent}
              </Link>
            );
          }
          return <div key={i}>{CardContent}</div>;
        })}
      </div>

      {/* Low Stock Alerts Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <div>
              <h4 className="text-sm font-semibold text-gray-900">
                Low Stock Alerts
              </h4>
              <p className="text-xs text-gray-500">
                Products currently with critically low volumes needing attention.
              </p>
            </div>
          </div>
          <Link to="/products" className="text-xs text-blue-600 font-medium hover:underline">
            View All Products
          </Link>
        </div>

        {(!metrics?.low_stock_products || metrics.low_stock_products.length === 0) ? (
          <div className="p-8 text-center text-gray-500 text-xs">
            🎉 All system products currently maintain healthy catalog stock levels!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#F8FAFC] border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">Quantity</th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Price</th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {metrics.low_stock_products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-[#FEF2F2] text-[#EF4444] px-2.5 py-1 rounded text-[11px] font-semibold inline-block">
                        {product.stock_quantity === 0 ? "0 units (Out)" : `${product.stock_quantity} units`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600 font-medium">
                      ${(product.price * product.stock_quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
