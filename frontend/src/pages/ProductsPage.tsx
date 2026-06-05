import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  Boxes, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Filter, 
  TrendingDown, 
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { productService } from "../services/productService";
import { Product } from "../types";
import { Loader } from "../components/shared/Loader";
import { EmptyState } from "../components/shared/EmptyState";
import { useToast } from "../components/shared/ToastContext";

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOption, setFilterOption] = useState<"all" | "low" | "out">("all");
  const [submitting, setSubmitting] = useState(false);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form input states
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const toast = useToast();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productService.getProducts();
      setProducts(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to fetch items from inventory registry.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
    const handleModeChange = () => fetchProducts();
    window.addEventListener("api-mode-change", handleModeChange);
    return () => window.removeEventListener("api-mode-change", handleModeChange);
  }, [fetchProducts]);

  // Open modal helpers
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName("");
    setSku("");
    setPrice("");
    setStockQuantity("");
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku);
    setPrice(String(product.price));
    setStockQuantity(String(product.stock_quantity));
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this product from the inventory?")) {
      try {
        await productService.deleteProduct(id);
        toast.success("Product deleted successfully");
        setProducts(prev => prev.filter(p => p.id !== id));
      } catch (err: any) {
        toast.error(err?.message || "Could not delete selected product.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    // Core prompt validation checks
    if (!name.trim()) {
      setErrorMsg("Product Name is required");
      return;
    }
    if (!sku.trim()) {
      setErrorMsg("Product SKU identifier is required");
      return;
    }
    
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMsg("Price must be a positive number greater than zero");
      return;
    }
    
    const parsedStock = parseInt(stockQuantity, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      setErrorMsg("Stock quantity cannot be negative");
      return;
    }

    setSubmitting(true);
    try {
      if (editingProduct) {
        const updated = await productService.updateProduct(editingProduct.id, {
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          price: parsedPrice,
          stock_quantity: parsedStock
        });
        toast.success(`Updated "${updated.name}" successfully`);
      } else {
        const added = await productService.addProduct({
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          price: parsedPrice,
          stock_quantity: parsedStock
        });
        toast.success(`Added "${added.name}" successfully`);
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "An API integration error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter & Search computation
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(product.id).includes(searchQuery);

      if (!matchSearch) return false;

      if (filterOption === "low") {
        return product.stock_quantity > 0 && product.stock_quantity <= 5;
      }
      if (filterOption === "out") {
        return product.stock_quantity === 0;
      }
      return true;
    });
  }, [products, searchQuery, filterOption]);

  return (
    <div className="space-y-6">
      {/* Top action header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" id="products-heading">
            Products Registry
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Maintain catalogs, adjust pricing schedules, and restock direct inventory.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchProducts}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer"
            title="Refresh product list"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={handleOpenAdd}
            id="add-product-btn"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Product
          </button>
        </div>
      </div>

      {/* Filter and Query controls container */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search inventory by name, SKU or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:outline-none rounded-lg text-xs transition-all text-gray-800"
          />
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-2 select-none w-full md:w-auto overflow-x-auto py-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" />
            Filter:
          </span>
          <button
            onClick={() => setFilterOption("all")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold shrink-0 transition-all cursor-pointer ${
              filterOption === "all"
                ? "bg-gray-900 text-white shadow-xs"
                : "bg-gray-50 hover:bg-gray-100 text-gray-600"
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setFilterOption("low")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold shrink-0 transition-all items-center gap-1 flex cursor-pointer ${
              filterOption === "low"
                ? "bg-[#FEF2F2] text-[#EF4444] border border-[#FEE2E2]"
                : "bg-red-50 hover:bg-red-100/60 text-red-650"
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-red-500" />
            Low Stock (&le;5)
          </button>
          <button
            onClick={() => setFilterOption("out")}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold shrink-0 transition-all items-center gap-1 flex cursor-pointer ${
              filterOption === "out"
                ? "bg-[#FEF2F2] text-[#EF4444] border border-[#FEE2E2]"
                : "bg-red-50 hover:bg-red-100/60 text-red-655"
            }`}
          >
            <X className="w-3 h-3 text-rose-500" />
            Out of Stock
          </button>
        </div>
      </div>

      {/* Main product table */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader message="Fetching stock profiles..." />
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title={searchQuery || filterOption !== "all" ? "No matching products found" : "No products inside catalog"}
          description={searchQuery || filterOption !== "all" ? "Optimize search parameters or reset filter togglers to query other materials." : "Kick off by adding initial products to database. Select Add Product above."}
          actionText={searchQuery || filterOption !== "all" ? undefined : "Add First Product"}
          onAction={searchQuery || filterOption !== "all" ? undefined : handleOpenAdd}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left" id="products-table">
              <thead className="bg-[#F8FAFC] border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Product Name</th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">Price</th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">
                      #{product.id}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                      ${product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold ${
                        product.stock_quantity === 0
                          ? "bg-[#FEF2F2] text-[#EF4444]"
                          : product.stock_quantity <= 5
                          ? "bg-amber-50 text-amber-700"
                          : "bg-green-50 text-green-700"
                      }`}>
                        {product.stock_quantity === 0 ? "Out of Stock" : `${product.stock_quantity} units`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right pr-6">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          id={`edit-product-${product.id}`}
                          className="p-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition cursor-pointer"
                          title="Edit product info"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          id={`delete-product-${product.id}`}
                          className="p-1.5 rounded-md border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                          title="Remove product"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span>Showing {filteredProducts.length} of {products.length} products</span>
            <span>All values stated in USD</span>
          </div>
        </div>
      )}

      {/* Drawer Dialog Form overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => !submitting && setModalOpen(false)} />
          
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-155">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#F8FAFC]">
              <h3 className="font-semibold text-gray-900 text-sm" id="modal-title">
                {editingProduct ? "Modify Registered Product" : "Enlist New Catalog Product"}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-450 disabled:opacity-30 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 rounded-md p-3 text-xs font-semibold text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. iPad Pro M4"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  id="product-input-name"
                  className="w-full bg-gray-50 px-3 py-2 border border-gray-200 rounded-md text-xs focus:bg-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  SKU Identifier Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AAPL-IPP-M4"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  disabled={submitting}
                  id="product-input-sku"
                  className="w-full bg-gray-50 px-3 py-2 border border-gray-200 rounded-md text-xs font-mono focus:bg-white focus:border-blue-500 focus:outline-none disabled:opacity-50 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Price (USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="299.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={submitting}
                    id="product-input-price"
                    className="w-full bg-gray-50 px-3 py-2 border border-gray-200 rounded-md text-xs focus:bg-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Stock Amount *
                  </label>
                  <input
                    type="number"
                    step="1"
                    required
                    placeholder="45"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    disabled={submitting}
                    id="product-input-stock"
                    className="w-full bg-gray-50 px-3 py-2 border border-gray-200 rounded-md text-xs focus:bg-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2 px-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="px-3.5 py-2 text-xs font-semibold border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  id="product-form-submit-btn"
                  className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition duration-150 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
