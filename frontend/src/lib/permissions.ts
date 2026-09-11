import { PLANS, type FeatureKey, type PlanId, type Role } from "../types";

const WRITE: Role[] = ["super_admin", "company_admin", "commercial_manager", "trader", "finance_user", "operations_user"];

export const NAV_FEATURES: Record<string, FeatureKey | null> = {
  "/": "dashboard",
  "/market": "dashboard",
  "/purchases": "purchases",
  "/sales": "sales",
  "/inventory": "inventory",
  "/positions": "positions",
  "/pricing": "purchases",
  "/customers": "customers",
  "/suppliers": "suppliers",
  "/contracts": "purchases",
  "/products": "products",
  "/analytics": "analytics",
  "/reports": "reports_basic",
  "/assistant": "ai",
  "/alerts": "alerts",
  "/settings": "dashboard",
};

export function planHas(planId: PlanId, feature: FeatureKey) {
  return PLANS.find((p) => p.id === planId)?.features.includes(feature) ?? false;
}

export function canWrite(role: Role) {
  return role !== "viewer";
}

export function canMutateModule(role: Role, module: string) {
  if (role === "super_admin" || role === "company_admin") return true;
  if (role === "viewer") return false;
  if (role === "trader") return ["purchases", "sales", "pricing", "positions", "market"].includes(module);
  if (role === "finance_user") return ["sales", "customers", "reports", "analytics", "purchases"].includes(module);
  if (role === "operations_user") return ["inventory", "products", "contracts"].includes(module);
  if (role === "commercial_manager") return WRITE.includes(role);
  return false;
}

export function routeAllowed(role: Role, path: string, planId: PlanId | null) {
  if (role === "super_admin") return path.startsWith("/admin") || path === "/settings";
  if (path.startsWith("/admin")) return false;
  const feature = Object.entries(NAV_FEATURES).find(([p]) => p === path)?.[1];
  if (!feature || !planId) return true;
  return planHas(planId, feature);
}
