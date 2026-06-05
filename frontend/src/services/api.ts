import axios from "axios";
import { mockDb } from "./mockDb";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

// Utility to helper direct call or wrap mockDb
export function isDemoMode(): boolean {
  return mockDb.getUseMockMode();
}

export function setDemoMode(value: boolean): void {
  mockDb.setUseMockMode(value);
  // dispatch custom event to alert app of mode changes
  window.dispatchEvent(new Event("api-mode-change"));
}

export default api;
