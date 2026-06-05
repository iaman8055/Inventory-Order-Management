import api, { isDemoMode } from "./api";
import { mockDb } from "./mockDb";
import { Order, OrderInput } from "../types";

export const orderService = {
  getOrders: async (): Promise<Order[]> => {
    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockDb.getOrders();
    }
    const response = await api.get<Order[]>("/orders/");
    return response.data;
  },

  getOrder: async (id: number): Promise<Order> => {
    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 250));
      const order = mockDb.getOrderById(id);
      if (!order) throw new Error("Order not found");
      return order;
    }
    const response = await api.get<Order>(`/orders/${id}`);
    return response.data;
  },

  addOrder: async (orderData: OrderInput): Promise<Order> => {
    if (!orderData.customer_id) {
      throw new Error("Please select a customer for this order");
    }
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error("An order must contain at least one item");
    }
    // Check item validity
    for (const item of orderData.items) {
      if (!item.product_id) {
        throw new Error("Each added item must have a valid product selected");
      }
      if (item.quantity <= 0) {
        throw new Error("Quantity must be greater than zero");
      }
    }

    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 350));
      return mockDb.addOrder(orderData);
    }
    const response = await api.post<Order>("/orders/", orderData);
    return response.data;
  },

  deleteOrder: async (id: number): Promise<void> => {
    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 200));
      mockDb.deleteOrder(id);
      return;
    }
    await api.delete(`/orders/${id}`);
  }
};
