import axios from "axios";
import { mockDb } from "./mockDb";

const api = axios.create({
  baseURL: "http://localhost:8000"
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
