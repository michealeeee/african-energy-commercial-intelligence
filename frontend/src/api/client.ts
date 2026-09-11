/** REST surface the Django API will implement. Today these helpers read the in-memory tenant store. */
export const API_PREFIX = "/api";

export const endpoints = {
  auth: `${API_PREFIX}/auth/`,
  companies: `${API_PREFIX}/companies/`,
  products: `${API_PREFIX}/products/`,
  suppliers: `${API_PREFIX}/suppliers/`,
  customers: `${API_PREFIX}/customers/`,
  purchases: `${API_PREFIX}/purchases/`,
  sales: `${API_PREFIX}/sales/`,
  inventory: `${API_PREFIX}/inventory/`,
  movements: `${API_PREFIX}/inventory-movements/`,
  positions: `${API_PREFIX}/positions/`,
  contracts: `${API_PREFIX}/contracts/`,
  market: `${API_PREFIX}/market-data/`,
  analytics: `${API_PREFIX}/analytics/`,
  reports: `${API_PREFIX}/reports/`,
  alerts: `${API_PREFIX}/alerts/`,
  ai: `${API_PREFIX}/ai/`,
  subscriptions: `${API_PREFIX}/subscriptions/`,
  audit: `${API_PREFIX}/audit-logs/`,
};

export function authHeader(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
