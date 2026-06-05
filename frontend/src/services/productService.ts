import api, { isDemoMode } from "./api";
import { mockDb } from "./mockDb";
import { Product } from "../types";

export const productService = {
  getProducts: async (): Promise<Product[]> => {
    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockDb.getProducts();
    }
    const response = await api.get<Product[]>("/products/");
    return response.data;
  },

  getProduct: async (id: number): Promise<Product> => {
    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const p = mockDb.getProductById(id);
      if (!p) throw new Error("Product not found");
      return p;
    }
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  addProduct: async (productData: Omit<Product, "id">): Promise<Product> => {
    // Validation matches prompt requirements:
    // - Name required
    // - SKU required
    // - Price greater than zero
    // - Stock quantity cannot be negative
    if (!productData.name || productData.name.trim() === "") {
      throw new Error("Name is required");
    }
    if (!productData.sku || productData.sku.trim() === "") {
      throw new Error("SKU is required");
    }
    if (productData.price <= 0) {
      throw new Error("Price must be greater than zero");
    }
    if (productData.stock_quantity < 0) {
      throw new Error("Stock quantity cannot be negative");
    }

    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockDb.addProduct(productData);
    }
    const response = await api.post<Product>("/products/", productData);
    return response.data;
  },

  updateProduct: async (id: number, productData: Omit<Product, "id">): Promise<Product> => {
    // Same validations:
    if (!productData.name || productData.name.trim() === "") {
      throw new Error("Name is required");
    }
    if (!productData.sku || productData.sku.trim() === "") {
      throw new Error("SKU is required");
    }
    if (productData.price <= 0) {
      throw new Error("Price must be greater than zero");
    }
    if (productData.stock_quantity < 0) {
      throw new Error("Stock quantity cannot be negative");
    }

    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockDb.updateProduct(id, productData);
    }
    const response = await api.put<Product>(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 200));
      mockDb.deleteProduct(id);
      return;
    }
    await api.delete(`/products/${id}`);
  }
};
