import api, { isDemoMode } from "./api";
import { mockDb } from "./mockDb";
import { Customer } from "../types";

export const customerService = {
  getCustomers: async (): Promise<Customer[]> => {
    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 200));
      return mockDb.getCustomers();
    }
    const response = await api.get<Customer[]>("/customers/");
    return response.data;
  },

  getCustomer: async (id: number): Promise<Customer> => {
    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const c = mockDb.getCustomerById(id);
      if (!c) throw new Error("Customer not found");
      return c;
    }
    const response = await api.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  addCustomer: async (customerData: Omit<Customer, "id">): Promise<Customer> => {
    // Validations:
    // - Valid email
    // - Required fields
    if (!customerData.full_name || customerData.full_name.trim() === "") {
      throw new Error("Full name is required");
    }
    if (!customerData.email || customerData.email.trim() === "") {
      throw new Error("Email address is required");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerData.email)) {
      throw new Error("Invalid email format");
    }
    if (!customerData.phone || customerData.phone.trim() === "") {
      throw new Error("Phone number is required");
    }

    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockDb.addCustomer(customerData);
    }
    const response = await api.post<Customer>("/customers/", customerData);
    return response.data;
  },

  deleteCustomer: async (id: number): Promise<void> => {
    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 200));
      mockDb.deleteCustomer(id);
      return;
    }
    await api.delete(`/customers/${id}`);
  }
};
