export type Role =
  | "super_admin"
  | "company_admin"
  | "commercial_manager"
  | "trader"
  | "finance_user"
  | "operations_user"
  | "viewer";

export type PlanId = "starter" | "professional" | "enterprise";
export type CompanyStatus = "active" | "suspended";
export type EntityStatus = "active" | "inactive";
export type AlertSeverity = "critical" | "high" | "medium" | "low";
export type AlertStatus = "open" | "acknowledged" | "resolved";
export type MovementType = "purchase" | "sale" | "adjustment" | "transfer" | "return";
export type ContractParty = "supplier" | "customer";
export type Currency = "GHS" | "USD";

export type FeatureKey =
  | "dashboard"
  | "products"
  | "customers"
  | "suppliers"
  | "purchases"
  | "sales"
  | "inventory"
  | "reports_basic"
  | "analytics"
  | "pnl"
  | "positions"
  | "ai"
  | "alerts"
  | "reports_advanced"
  | "multi_location"
  | "advanced_permissions"
  | "api_integrations"
  | "custom_config";

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  monthlyPriceUsd: number;
  userLimit: number;
  locationLimit: number;
  features: FeatureKey[];
  blurb: string;
}

export interface Company {
  id: string;
  name: string;
  shortName: string;
  country: string;
  city: string;
  licenseNo: string;
  status: CompanyStatus;
  planId: PlanId;
  billingEmail: string;
  createdAt: string;
}

export interface User {
  id: string;
  companyId: string | null;
  name: string;
  email: string;
  password: string;
  role: Role;
  status: EntityStatus;
  lastLoginAt: string | null;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  category: string;
  unit: string;
  minInventory: number;
  description: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  country: string;
  contact: string;
  email: string;
  phone: string;
  paymentTerms: string;
  status: EntityStatus;
  notes: string;
  createdAt: string;
}

export interface SupplierQuote {
  id: string;
  companyId: string;
  supplierId: string;
  productId: string;
  price: number;
  currency: Currency;
  validUntil: string;
  notes: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  segment: string;
  city: string;
  contact: string;
  email: string;
  phone: string;
  creditLimit: number;
  status: EntityStatus;
  notes: string;
  createdAt: string;
}

export interface Location {
  id: string;
  companyId: string;
  name: string;
  city: string;
  type: string;
  status: EntityStatus;
}

export interface Purchase {
  id: string;
  companyId: string;
  supplierId: string;
  productId: string;
  locationId: string;
  quantity: number;
  purchasePrice: number;
  currency: Currency;
  exchangeRate: number;
  date: string;
  freight: number;
  insurance: number;
  portHandling: number;
  taxes: number;
  transportation: number;
  storage: number;
  financing: number;
  otherCosts: number;
  totalPurchaseCost: number;
  totalLandedCost: number;
  costPerUnit: number;
  payableOutstanding: number;
  createdAt: string;
}

export interface Sale {
  id: string;
  companyId: string;
  customerId: string;
  productId: string;
  locationId: string;
  quantity: number;
  sellingPrice: number;
  currency: Currency;
  exchangeRate: number;
  date: string;
  discounts: number;
  transportation: number;
  otherCosts: number;
  revenue: number;
  cost: number;
  grossProfit: number;
  grossMarginPct: number;
  receivableOutstanding: number;
  createdAt: string;
}

export interface InventoryLot {
  id: string;
  companyId: string;
  productId: string;
  locationId: string;
  quantity: number;
  averageCost: number;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  companyId: string;
  productId: string;
  fromLocationId: string | null;
  toLocationId: string | null;
  type: MovementType;
  quantity: number;
  unitCost: number;
  referenceId: string | null;
  notes: string;
  date: string;
  createdAt: string;
}

export interface Contract {
  id: string;
  companyId: string;
  partyType: ContractParty;
  partyId: string;
  productId: string;
  quantity: number;
  fulfilledQty: number;
  price: number;
  currency: Currency;
  startDate: string;
  expiryDate: string;
  paymentTerms: string;
  deliveryTerms: string;
  notes: string;
  createdAt: string;
}

export interface MarketPrice {
  id: string;
  indicator: string;
  price: number;
  previousPrice: number;
  currency: string;
  unit: string;
  timestamp: string;
  source: string;
  isDemo: true;
  history: { date: string; price: number }[];
}

export interface Alert {
  id: string;
  companyId: string | null;
  type: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  relatedEntity: string | null;
  createdAt: string;
}

export interface Subscription {
  id: string;
  companyId: string;
  planId: PlanId;
  status: "active" | "past_due" | "cancelled";
  periodStart: string;
  periodEnd: string;
  mockPaymentRef: string;
}

export interface AuditLog {
  id: string;
  companyId: string | null;
  actorId: string;
  action: string;
  entity: string;
  detail: string;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  issuedAt: string;
}

export interface AppState {
  companies: Company[];
  users: User[];
  products: Product[];
  suppliers: Supplier[];
  quotes: SupplierQuote[];
  customers: Customer[];
  locations: Location[];
  purchases: Purchase[];
  sales: Sale[];
  inventory: InventoryLot[];
  movements: InventoryMovement[];
  contracts: Contract[];
  market: MarketPrice[];
  alerts: Alert[];
  subscriptions: Subscription[];
  auditLogs: AuditLog[];
  session: Session | null;
}

export const PLANS: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPriceUsd: 149,
    userLimit: 5,
    locationLimit: 1,
    features: [
      "dashboard",
      "products",
      "customers",
      "suppliers",
      "purchases",
      "sales",
      "inventory",
      "reports_basic",
    ],
    blurb: "For small distributors running the core commercial loop.",
  },
  {
    id: "professional",
    name: "Professional",
    monthlyPriceUsd: 449,
    userLimit: 25,
    locationLimit: 3,
    features: [
      "dashboard",
      "products",
      "customers",
      "suppliers",
      "purchases",
      "sales",
      "inventory",
      "reports_basic",
      "analytics",
      "pnl",
      "positions",
      "ai",
      "alerts",
      "reports_advanced",
    ],
    blurb: "Positions, P&L, alerts and the AI commercial assistant.",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPriceUsd: 1290,
    userLimit: 200,
    locationLimit: 50,
    features: [
      "dashboard",
      "products",
      "customers",
      "suppliers",
      "purchases",
      "sales",
      "inventory",
      "reports_basic",
      "analytics",
      "pnl",
      "positions",
      "ai",
      "alerts",
      "reports_advanced",
      "multi_location",
      "advanced_permissions",
      "api_integrations",
      "custom_config",
    ],
    blurb: "Multi-depot books, advanced permissions and API-ready architecture.",
  },
];

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  company_admin: "Company Admin",
  commercial_manager: "Commercial Manager",
  trader: "Trader",
  finance_user: "Finance User",
  operations_user: "Operations User",
  viewer: "Viewer",
};
