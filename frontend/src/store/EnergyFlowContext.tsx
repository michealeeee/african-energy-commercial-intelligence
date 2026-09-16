import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from "react";
import { SEED_STATE } from "../data/seed";
import { computePurchaseCosts, computeSaleEconomics } from "../lib/commerce";
import { round2, uid } from "../lib/format";
import type {
  Alert,
  AppState,
  Company,
  Contract,
  Customer,
  InventoryLot,
  Product,
  Purchase,
  Sale,
  Supplier,
  SupplierQuote,
  User,
} from "../types";

const KEY = "aeci.v2";

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return SEED_STATE;
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.companies?.length || !parsed.users?.length) return SEED_STATE;
    const sessionUser = parsed.session?.userId
      ? parsed.users.find((u) => u.id === parsed.session?.userId)
      : null;
    return {
      ...SEED_STATE,
      ...parsed,
      session: sessionUser ? parsed.session : null,
    };
  } catch {
    return SEED_STATE;
  }
}

function persist(state: AppState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function lotKey(productId: string, locationId: string) {
  return `${productId}:${locationId}`;
}

function applyInventoryDelta(state: AppState, args: {
  companyId: string;
  productId: string;
  locationId: string;
  qtyDelta: number;
  unitCost: number;
  date: string;
}): InventoryLot[] {
  const lots = [...state.inventory];
  const idx = lots.findIndex((l) => l.companyId === args.companyId && l.productId === args.productId && l.locationId === args.locationId);
  if (idx === -1) {
    lots.push({
      id: uid("inv"),
      companyId: args.companyId,
      productId: args.productId,
      locationId: args.locationId,
      quantity: args.qtyDelta,
      averageCost: args.unitCost,
      updatedAt: args.date,
    });
    return lots;
  }
  const cur = lots[idx];
  const newQty = cur.quantity + args.qtyDelta;
  let avg = cur.averageCost;
  if (args.qtyDelta > 0 && newQty > 0) {
    avg = (cur.quantity * cur.averageCost + args.qtyDelta * args.unitCost) / newQty;
  }
  lots[idx] = { ...cur, quantity: newQty, averageCost: round2(avg), updatedAt: args.date };
  return lots;
}

function avgCost(state: AppState, companyId: string, productId: string, locationId: string) {
  return state.inventory.find((l) => l.companyId === companyId && l.productId === productId && l.locationId === locationId)?.averageCost ?? 0;
}

export type Action =
  | { type: "login"; email: string; password: string; userId?: string }
  | { type: "logout" }
  | { type: "reset" }
  | { type: "upsert_product"; product: Product }
  | { type: "soft_delete_product"; id: string }
  | { type: "upsert_supplier"; supplier: Supplier }
  | { type: "add_quote"; quote: SupplierQuote }
  | { type: "upsert_customer"; customer: Customer }
  | { type: "add_purchase"; purchase: Omit<Purchase, "totalPurchaseCost" | "totalLandedCost" | "costPerUnit" | "createdAt"> }
  | { type: "add_sale"; sale: Omit<Sale, "revenue" | "cost" | "grossProfit" | "grossMarginPct" | "createdAt"> }
  | { type: "adjust_inventory"; companyId: string; productId: string; locationId: string; quantity: number; notes: string }
  | { type: "transfer_inventory"; companyId: string; productId: string; fromLocationId: string; toLocationId: string; quantity: number }
  | { type: "upsert_contract"; contract: Contract }
  | { type: "ack_alert"; id: string }
  | { type: "resolve_alert"; id: string }
  | { type: "upsert_company"; company: Company }
  | { type: "set_company_status"; id: string; status: Company["status"] }
  | { type: "upsert_user"; user: User }
  | { type: "set_plan"; companyId: string; planId: Company["planId"] }
  | { type: "audit"; companyId: string | null; actorId: string; action: string; entity: string; detail: string };

function reducer(state: AppState, action: Action): AppState {
  const now = new Date().toISOString();
  switch (action.type) {
    case "login": {
      const user =
        (action.userId
          ? state.users.find((u) => u.id === action.userId && u.password === action.password && u.status === "active")
          : undefined) ||
        state.users.find((u) => u.email === action.email && u.password === action.password && u.status === "active");
      if (!user) return state;
      if (user.companyId) {
        const co = state.companies.find((c) => c.id === user.companyId);
        if (co?.status === "suspended") return state;
      }
      const users = state.users.map((u) => (u.id === user.id ? { ...u, lastLoginAt: now } : u));
      const next = {
        ...state,
        users,
        session: { token: `demo.${user.id}.${Date.now()}`, userId: user.id, issuedAt: now },
        auditLogs: [{ id: uid("au"), companyId: user.companyId, actorId: user.id, action: "login", entity: "session", detail: "Signed in (demo JWT)", createdAt: now }, ...state.auditLogs],
      };
      persist(next);
      return next;
    }
    case "logout": {
      const next = { ...state, session: null };
      persist(next);
      return next;
    }
    case "reset": {
      persist({ ...SEED_STATE, session: state.session });
      return { ...SEED_STATE, session: state.session };
    }
    case "upsert_product": {
      const exists = state.products.some((p) => p.id === action.product.id);
      const products = exists ? state.products.map((p) => (p.id === action.product.id ? action.product : p)) : [action.product, ...state.products];
      const next = { ...state, products };
      persist(next);
      return next;
    }
    case "soft_delete_product": {
      const products = state.products.map((p) => (p.id === action.id ? { ...p, deletedAt: now, status: "inactive" as const } : p));
      const next = { ...state, products };
      persist(next);
      return next;
    }
    case "upsert_supplier": {
      const exists = state.suppliers.some((s) => s.id === action.supplier.id);
      const suppliers = exists ? state.suppliers.map((s) => (s.id === action.supplier.id ? action.supplier : s)) : [action.supplier, ...state.suppliers];
      const next = { ...state, suppliers };
      persist(next);
      return next;
    }
    case "add_quote": {
      const next = { ...state, quotes: [action.quote, ...state.quotes] };
      persist(next);
      return next;
    }
    case "upsert_customer": {
      const exists = state.customers.some((c) => c.id === action.customer.id);
      const customers = exists ? state.customers.map((c) => (c.id === action.customer.id ? action.customer : c)) : [action.customer, ...state.customers];
      const next = { ...state, customers };
      persist(next);
      return next;
    }
    case "add_purchase": {
      const costs = computePurchaseCosts(action.purchase);
      const row: Purchase = { ...action.purchase, ...costs, createdAt: now };
      const inventory = applyInventoryDelta(state, {
        companyId: row.companyId,
        productId: row.productId,
        locationId: row.locationId,
        qtyDelta: row.quantity,
        unitCost: row.costPerUnit,
        date: row.date,
      });
      const next: AppState = {
        ...state,
        purchases: [row, ...state.purchases],
        inventory,
        movements: [
          {
            id: uid("mv"),
            companyId: row.companyId,
            productId: row.productId,
            fromLocationId: null,
            toLocationId: row.locationId,
            type: "purchase",
            quantity: row.quantity,
            unitCost: row.costPerUnit,
            referenceId: row.id,
            notes: "Purchase receipt",
            date: row.date,
            createdAt: now,
          },
          ...state.movements,
        ],
      };
      persist(next);
      return next;
    }
    case "add_sale": {
      const unit = avgCost(state, action.sale.companyId, action.sale.productId, action.sale.locationId);
      const econ = computeSaleEconomics({
        quantity: action.sale.quantity,
        sellingPrice: action.sale.sellingPrice,
        exchangeRate: action.sale.exchangeRate,
        discounts: action.sale.discounts,
        transportation: action.sale.transportation,
        otherCosts: action.sale.otherCosts,
        unitCost: unit,
      });
      const row: Sale = { ...action.sale, ...econ, createdAt: now };
      const inventory = applyInventoryDelta(state, {
        companyId: row.companyId,
        productId: row.productId,
        locationId: row.locationId,
        qtyDelta: -row.quantity,
        unitCost: unit,
        date: row.date,
      });
      const next: AppState = {
        ...state,
        sales: [row, ...state.sales],
        inventory,
        movements: [
          {
            id: uid("mv"),
            companyId: row.companyId,
            productId: row.productId,
            fromLocationId: row.locationId,
            toLocationId: null,
            type: "sale",
            quantity: row.quantity,
            unitCost: unit,
            referenceId: row.id,
            notes: "Customer sale",
            date: row.date,
            createdAt: now,
          },
          ...state.movements,
        ],
      };
      persist(next);
      return next;
    }
    case "adjust_inventory": {
      const unit = avgCost(state, action.companyId, action.productId, action.locationId);
      const inventory = applyInventoryDelta(state, {
        companyId: action.companyId,
        productId: action.productId,
        locationId: action.locationId,
        qtyDelta: action.quantity,
        unitCost: unit,
        date: now.slice(0, 10),
      });
      const next: AppState = {
        ...state,
        inventory,
        movements: [
          {
            id: uid("mv"),
            companyId: action.companyId,
            productId: action.productId,
            fromLocationId: action.quantity < 0 ? action.locationId : null,
            toLocationId: action.quantity > 0 ? action.locationId : null,
            type: "adjustment",
            quantity: Math.abs(action.quantity),
            unitCost: unit,
            referenceId: null,
            notes: action.notes,
            date: now.slice(0, 10),
            createdAt: now,
          },
          ...state.movements,
        ],
      };
      persist(next);
      return next;
    }
    case "transfer_inventory": {
      const unit = avgCost(state, action.companyId, action.productId, action.fromLocationId);
      let inventory = applyInventoryDelta(state, {
        companyId: action.companyId,
        productId: action.productId,
        locationId: action.fromLocationId,
        qtyDelta: -action.quantity,
        unitCost: unit,
        date: now.slice(0, 10),
      });
      inventory = applyInventoryDelta({ ...state, inventory }, {
        companyId: action.companyId,
        productId: action.productId,
        locationId: action.toLocationId,
        qtyDelta: action.quantity,
        unitCost: unit,
        date: now.slice(0, 10),
      });
      const next: AppState = {
        ...state,
        inventory,
        movements: [
          {
            id: uid("mv"),
            companyId: action.companyId,
            productId: action.productId,
            fromLocationId: action.fromLocationId,
            toLocationId: action.toLocationId,
            type: "transfer",
            quantity: action.quantity,
            unitCost: unit,
            referenceId: null,
            notes: "Depot transfer",
            date: now.slice(0, 10),
            createdAt: now,
          },
          ...state.movements,
        ],
      };
      persist(next);
      return next;
    }
    case "upsert_contract": {
      const exists = state.contracts.some((c) => c.id === action.contract.id);
      const contracts = exists ? state.contracts.map((c) => (c.id === action.contract.id ? action.contract : c)) : [action.contract, ...state.contracts];
      const next = { ...state, contracts };
      persist(next);
      return next;
    }
    case "ack_alert": {
      const alerts = state.alerts.map((a) => (a.id === action.id ? { ...a, status: "acknowledged" as const } : a));
      const next = { ...state, alerts };
      persist(next);
      return next;
    }
    case "resolve_alert": {
      const alerts = state.alerts.map((a) => (a.id === action.id ? { ...a, status: "resolved" as const } : a));
      const next = { ...state, alerts };
      persist(next);
      return next;
    }
    case "upsert_company": {
      const exists = state.companies.some((c) => c.id === action.company.id);
      const companies = exists ? state.companies.map((c) => (c.id === action.company.id ? action.company : c)) : [action.company, ...state.companies];
      const next = { ...state, companies };
      persist(next);
      return next;
    }
    case "set_company_status": {
      const companies = state.companies.map((c) => (c.id === action.id ? { ...c, status: action.status } : c));
      const next = { ...state, companies };
      persist(next);
      return next;
    }
    case "upsert_user": {
      const exists = state.users.some((u) => u.id === action.user.id);
      const users = exists ? state.users.map((u) => (u.id === action.user.id ? action.user : u)) : [action.user, ...state.users];
      const next = { ...state, users };
      persist(next);
      return next;
    }
    case "set_plan": {
      const companies = state.companies.map((c) => (c.id === action.companyId ? { ...c, planId: action.planId } : c));
      const subscriptions = state.subscriptions.map((s) => (s.companyId === action.companyId ? { ...s, planId: action.planId } : s));
      const next = { ...state, companies, subscriptions };
      persist(next);
      return next;
    }
    case "audit": {
      const next = {
        ...state,
        auditLogs: [{ id: uid("au"), companyId: action.companyId, actorId: action.actorId, action: action.action, entity: action.entity, detail: action.detail, createdAt: now }, ...state.auditLogs],
      };
      persist(next);
      return next;
    }
    default:
      return state;
  }
}

const Ctx = createContext<{ state: AppState; dispatch: Dispatch<Action> } | null>(null);

export function EnergyFlowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEnergy() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("EnergyFlowProvider missing");
  return ctx;
}

export function useSession() {
  const { state } = useEnergy();
  const user = state.users.find((u) => u.id === state.session?.userId) ?? null;
  const company = user?.companyId ? state.companies.find((c) => c.id === user.companyId) ?? null : null;
  return { user, company, token: state.session?.token ?? null };
}

export function tenantId(user: User | null) {
  return user?.role === "super_admin" ? null : user?.companyId ?? null;
}

export function scoped<T extends { companyId: string | null }>(rows: T[], companyId: string | null): T[] {
  if (!companyId) return rows;
  return rows.filter((r) => r.companyId === companyId);
}

export function scopedOwned<T extends { companyId: string }>(rows: T[], companyId: string | null): T[] {
  if (!companyId) return [];
  return rows.filter((r) => r.companyId === companyId);
}

export function openAlerts(alerts: Alert[], companyId: string | null) {
  return alerts.filter((a) => a.status !== "resolved" && (!companyId || a.companyId === companyId || a.companyId === null));
}

export { lotKey };
