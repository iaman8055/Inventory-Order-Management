import api, { isDemoMode } from "./api";
import { mockDb } from "./mockDb";
import { DashboardMetrics } from "../types";

export const dashboardService = {
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    if (isDemoMode()) {
      // Simulate real short latency
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockDb.getDashboardMetrics();
    }
    const response = await api.get<DashboardMetrics>("/dashboard/");
    return response.data;
  }
};
