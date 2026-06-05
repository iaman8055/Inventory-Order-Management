import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  Users,
  ShoppingCart,
  Menu,
  X,
  Server,
  Database,
  RefreshCw,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { isDemoMode, setDemoMode } from "../../services/api";
import { useToast } from "../shared/ToastContext";
import { mockDb } from "../../services/mockDb";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoModeActive, setDemoModeActive] = useState(isDemoMode());
  const [resettingData, setResettingData] = useState(false);
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    const handleModeChange = () => {
      setDemoModeActive(isDemoMode());
    };
    window.addEventListener("api-mode-change", handleModeChange);
    return () => window.removeEventListener("api-mode-change", handleModeChange);
  }, []);

  const toggleApiMode = () => {
    const newValue = !demoModeActive;
    setDemoMode(newValue);
    setDemoModeActive(newValue);
    if (newValue) {
      toast.info("Switched to Local Demo Database (localStorage backup)");
    } else {
      toast.success("Switched to Live API Mode (connecting with http://localhost:8000)");
    }
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to restore original mock assets? This clears custom mutations in Demo Mode.")) {
      setResettingData(true);
      mockDb.resetData();
      setTimeout(() => {
        setResettingData(false);
        toast.success("Demo Database reset successfully!");
        window.location.reload();
      }, 500);
    }
  };

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Products", path: "/products", icon: Boxes },
    { name: "Customers", path: "/customers", icon: Users },
    { name: "Orders", path: "/orders", icon: ShoppingCart },
  ];

  return (
    /* FIXED: Changed min-h-screen to h-screen and overflow-hidden to lock parent layout */
    <div className="h-screen w-screen bg-[#F9FAFB] text-slate-850 flex overflow-hidden">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white text-gray-700 border-r border-gray-200 shrink-0 select-none h-full">
        <div className="h-16 flex items-center px-6 gap-3 border-b border-gray-100">
          <Boxes className="w-6 h-6 text-blue-600 shrink-0" />
          <span className="font-bold text-lg tracking-tight text-gray-900 font-sans">
            StockSync
          </span>
        </div>

        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
          <div className="px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu</div>
          {menuItems.map(item => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                id={`sidebar-link-${item.name.toLowerCase()}`}
                className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-[#EFF6FF] text-[#2563EB] border-r-2 border-[#2563EB]"
                    : "text-gray-600 hover:bg-gray-50 border-r-2 border-transparent"
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? "text-[#2563EB]" : "text-gray-400 group-hover:text-[#2563EB]"
                }`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Extra Info */}
        <div className="p-4 border-t border-gray-100 bg-white text-xs">
          <div className="flex flex-col gap-2.5">
            {demoModeActive && (
              <button
                disabled={resettingData}
                onClick={handleResetData}
                className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:text-gray-900 text-gray-600 transition-colors duration-150 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resettingData ? 'animate-spin' : ''}`} />
                Reset Mock Data
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Header Section */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              id="mobile-menu-toggle"
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-slate-600 transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Logo replacement for mobile layout view */}
            <div className="flex md:hidden items-center gap-2">
              <Boxes className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-sm tracking-tight font-sans text-slate-900">
                StockSync
              </span>
            </div>

            {/* Breadcrumb info */}
            <div className="hidden md:flex items-center">
              <span className="text-sm text-gray-500">Overview</span>
              <span className="mx-2 text-gray-300">/</span>
              <span className="text-sm font-semibold text-gray-900">
                {location.pathname === "/" ? "Dashboard" : 
                 location.pathname.startsWith("/products") ? "Products" : 
                 location.pathname.startsWith("/customers") ? "Customers" : 
                 location.pathname.startsWith("/orders") ? "Orders" : "Dashboard"}
              </span>
            </div>
          </div>

          {/* System Control & Status Bar */}
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={toggleApiMode}
              className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-205 transition-all duration-200 active:scale-95 ${
                demoModeActive
                  ? "bg-slate-50 hover:bg-slate-100 text-slate-755"
                  : "bg-blue-50 hover:bg-blue-100 text-blue-700"
              }`}
              title="Click to toggle between real HubSpot backend and Demo Storage"
            >
              {demoModeActive ? (
                <>
                  <Database className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
                  <span className="hidden sm:inline">Use Live API</span>
                  <span className="inline sm:hidden">Live API</span>
                </>
              ) : (
                <>
                  <Server className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Use Demo Mode</span>
                  <span className="inline sm:hidden">Demo Mode</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* FIXED: Added a custom scrollbar style and smooth scrolling container */}
        <main className="flex-1 overflow-y-auto p-8 scroll-smooth style-scrollbar">
          <div className="max-w-7xl mx-auto pb-12">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer Navigation Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex justify-start">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Panel slider */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="relative w-72 max-w-xs bg-white text-gray-700 flex flex-col h-full shadow-2xl z-10"
            >
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                aria-label="Close sidebar menu"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="h-16 flex items-center px-6 gap-3 border-b border-gray-100">
                <Boxes className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-lg tracking-tight text-gray-900 font-sans">
                  StockSync
                </span>
              </div>

              <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
                {menuItems.map(item => {
                  const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-650 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};