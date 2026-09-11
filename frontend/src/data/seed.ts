import { computePurchaseCosts, computeSaleEconomics } from "../lib/commerce";
import { daysAgo, round2 } from "../lib/format";
import type {
  Alert,
  AppState,
  AuditLog,
  Company,
  Contract,
  Customer,
  InventoryLot,
  InventoryMovement,
  Location,
  MarketPrice,
  Product,
  Purchase,
  Sale,
  Subscription,
  Supplier,
  SupplierQuote,
  User,
} from "../types";

const APEX = "co_apex";
const VOLTA = "co_volta";
const GULF = "co_gulf";

function hist(base: number, wobble: number): { date: string; price: number }[] {
  const out: { date: string; price: number }[] = [];
  let p = base;
  for (let i = 90; i >= 0; i--) {
    const wave = Math.sin(i / 9) * wobble + ((i * 13) % 11 - 5) * (wobble / 8);
    p = Math.max(0.1, base + wave);
    out.push({ date: daysAgo(i), price: round2(p) });
  }
  return out;
}

function mkMarket(id: string, indicator: string, history: { date: string; price: number }[], currency: string, unit: string): MarketPrice {
  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  return {
    id,
    indicator,
    price: last.price,
    previousPrice: prev.price,
    currency,
    unit,
    timestamp: `${last.date}T07:30:00Z`,
    source: "demo-seed",
    isDemo: true,
    history,
  };
}

const companies: Company[] = [
  {
    id: APEX,
    name: "Apex Petroleum Ghana Ltd",
    shortName: "Apex",
    country: "Ghana",
    city: "Accra",
    licenseNo: "NPA-OMC-2019-084",
    status: "active",
    planId: "professional",
    billingEmail: "oscar.d@example.net",
    createdAt: "2024-02-11",
  },
  {
    id: VOLTA,
    name: "Volta Fuels Distribution",
    shortName: "Volta Fuels",
    country: "Ghana",
    city: "Ho",
    licenseNo: "NPA-DIST-2022-041",
    status: "active",
    planId: "starter",
    billingEmail: "hannah.h@example.com",
    createdAt: "2025-06-03",
  },
  {
    id: GULF,
    name: "Gulf Atlantic Energy GH",
    shortName: "Gulf Atlantic",
    country: "Ghana",
    city: "Tema",
    licenseNo: "NPA-BDC-2016-012",
    status: "active",
    planId: "enterprise",
    billingEmail: "julia.r@example.org",
    createdAt: "2023-09-18",
  },
];

const users: User[] = [
  { id: "u_platform", companyId: null, name: "Ama Mensah", email: "iva.t@example.net", password: "demo123", role: "super_admin", status: "active", lastLoginAt: "2026-09-11T07:10:00Z" },
  { id: "u_apex_admin", companyId: APEX, name: "Kwame Boateng", email: "oscar.d@example.net", password: "demo123", role: "company_admin", status: "active", lastLoginAt: "2026-09-11T06:40:00Z" },
  { id: "u_apex_cm", companyId: APEX, name: "Akosua Darko", email: "oscar.d@example.net", password: "demo123", role: "commercial_manager", status: "active", lastLoginAt: "2026-09-10T16:02:00Z" },
  { id: "u_apex_tr", companyId: APEX, name: "Yaw Owusu", email: "ursula.b@example.com", password: "demo123", role: "trader", status: "active", lastLoginAt: "2026-09-11T05:55:00Z" },
  { id: "u_apex_fin", companyId: APEX, name: "Efua Addo", email: "david.c@example.com", password: "demo123", role: "finance_user", status: "active", lastLoginAt: "2026-09-09T12:11:00Z" },
  { id: "u_apex_ops", companyId: APEX, name: "Kofi Asante", email: "iris.p@example.org", password: "demo123", role: "operations_user", status: "active", lastLoginAt: "2026-09-11T04:22:00Z" },
  { id: "u_apex_view", companyId: APEX, name: "Nana Adjei", email: "olivia.t@example.org", password: "demo123", role: "viewer", status: "active", lastLoginAt: "2026-09-08T09:00:00Z" },
  { id: "u_volta", companyId: VOLTA, name: "Selorm Agbeko", email: "hannah.h@example.com", password: "demo123", role: "company_admin", status: "active", lastLoginAt: "2026-09-07T18:30:00Z" },
  { id: "u_gulf", companyId: GULF, name: "Fatima Issah", email: "julia.r@example.org", password: "demo123", role: "company_admin", status: "active", lastLoginAt: "2026-09-11T07:01:00Z" },
];

function productsFor(companyId: string, prefix: string): Product[] {
  const now = "2026-08-01";
  return [
    { id: `${prefix}_pms`, companyId, name: "Petrol (PMS)", category: "Petrol", unit: "L", minInventory: 250000, description: "Premium motor spirit, 91 RON, Tema spec.", status: "active", createdAt: now, updatedAt: now, deletedAt: null },
    { id: `${prefix}_ago`, companyId, name: "Diesel (AGO)", category: "Diesel", unit: "L", minInventory: 400000, description: "Automotive gas oil for mining and haulage.", status: "active", createdAt: now, updatedAt: now, deletedAt: null },
    { id: `${prefix}_lpg`, companyId, name: "LPG", category: "LPG", unit: "MT", minInventory: 400, description: "Bottled and bulk LPG.", status: "active", createdAt: now, updatedAt: now, deletedAt: null },
    { id: `${prefix}_jet`, companyId, name: "Jet A-1", category: "Jet fuel", unit: "L", minInventory: 120000, description: "Aviation turbine fuel, Kotoka uplift.", status: "active", createdAt: now, updatedAt: now, deletedAt: null },
    { id: `${prefix}_ker`, companyId, name: "Kerosene", category: "Kerosene", unit: "L", minInventory: 40000, description: "Illuminating kerosene.", status: "active", createdAt: now, updatedAt: now, deletedAt: null },
  ];
}

const products = [...productsFor(APEX, "ax"), ...productsFor(VOLTA, "vf"), ...productsFor(GULF, "ga")];

const locations: Location[] = [
  { id: "ax_tema", companyId: APEX, name: "Tema Main Depot", city: "Tema", type: "Depot", status: "active" },
  { id: "ax_takoradi", companyId: APEX, name: "Takoradi Depot", city: "Takoradi", type: "Depot", status: "active" },
  { id: "ax_kumasi", companyId: APEX, name: "Kumasi Inland Depot", city: "Kumasi", type: "Depot", status: "active" },
  { id: "vf_ho", companyId: VOLTA, name: "Ho Yard", city: "Ho", type: "Yard", status: "active" },
  { id: "ga_tema", companyId: GULF, name: "Tema Tank Farm", city: "Tema", type: "Tank farm", status: "active" },
  { id: "ga_tadi", companyId: GULF, name: "Takoradi Shore", city: "Takoradi", type: "Depot", status: "active" },
];

const suppliers: Supplier[] = [
  { id: "ax_s_tor", companyId: APEX, name: "Tema Oil Refinery", country: "Ghana", contact: "Procurement desk", email: "hannah.h@example.com", phone: "+233 30 396 0000", paymentTerms: "Net 14", status: "active", notes: "Domestic refined barrels when CDU is up.", createdAt: "2024-03-01" },
  { id: "ax_s_sahara", companyId: APEX, name: "Sahara Energy Resources", country: "Nigeria", contact: "West Africa desk", email: "james.b@example.com", phone: "+234 1 270 0000", paymentTerms: "LC at sight", status: "active", notes: "Primary AGO cargoes into Tema.", createdAt: "2024-03-12" },
  { id: "ax_s_vitol", companyId: APEX, name: "Vitol Africa", country: "Switzerland", contact: "Accra representative", email: "xena.w@example.org", phone: "+233 30 261 4400", paymentTerms: "CAD 5 days", status: "active", notes: "Jet and PMS parcels.", createdAt: "2024-05-20" },
  { id: "ax_s_goil", companyId: APEX, name: "GOIL PLC", country: "Ghana", contact: "B2B sales", email: "hannah.h@example.com", phone: "+233 30 261 1800", paymentTerms: "Net 7", status: "active", notes: "Spot top-ups.", createdAt: "2025-01-08" },
  { id: "vf_s_apex", companyId: VOLTA, name: "Apex Petroleum Ghana Ltd", country: "Ghana", contact: "Wholesale", email: "oscar.d@example.net", phone: "+233 30 255 0100", paymentTerms: "Net 7", status: "active", notes: "Primary wholesale supply.", createdAt: "2025-06-04" },
  { id: "ga_s_traf", companyId: GULF, name: "Trafigura PTE", country: "Singapore", contact: "Crude & products", email: "ethan.b@example.com", phone: "+65 6319 0000", paymentTerms: "LC 30", status: "active", notes: "BDC cargo programme.", createdAt: "2023-10-01" },
];

const quotes: SupplierQuote[] = [
  { id: "q1", companyId: APEX, supplierId: "ax_s_sahara", productId: "ax_ago", price: 0.78, currency: "USD", validUntil: "2026-09-20", notes: "CIF Tema, 8kt parcel", createdAt: daysAgo(4) },
  { id: "q2", companyId: APEX, supplierId: "ax_s_vitol", productId: "ax_ago", price: 0.81, currency: "USD", validUntil: "2026-09-18", notes: "CIF Tema, 6kt", createdAt: daysAgo(3) },
  { id: "q3", companyId: APEX, supplierId: "ax_s_tor", productId: "ax_ago", price: 11.85, currency: "GHS", validUntil: "2026-09-14", notes: "Ex-refinery, limited", createdAt: daysAgo(1) },
  { id: "q4", companyId: APEX, supplierId: "ax_s_vitol", productId: "ax_pms", price: 0.84, currency: "USD", validUntil: "2026-09-22", notes: "CIF Tema", createdAt: daysAgo(2) },
  { id: "q5", companyId: APEX, supplierId: "ax_s_goil", productId: "ax_pms", price: 12.4, currency: "GHS", validUntil: "2026-09-13", notes: "Spot trucked", createdAt: daysAgo(1) },
];

const customers: Customer[] = [
  { id: "ax_c_newmont", companyId: APEX, name: "Newmont Ghana Gold", segment: "Mining", city: "Akyem", contact: "Fuel coordinator", email: "zoe.m@example.net", phone: "+233 30 277 0000", creditLimit: 4500000, status: "active", notes: "AGO frame contract.", createdAt: "2024-04-02" },
  { id: "ax_c_goldfields", companyId: APEX, name: "Gold Fields Tarkwa", segment: "Mining", city: "Tarkwa", contact: "Supply chain", email: "kevin.m@example.com", phone: "+233 31 232 0000", creditLimit: 3800000, status: "active", notes: "Weekly AGO.", createdAt: "2024-06-15" },
  { id: "ax_c_vip", companyId: APEX, name: "VIP Jeoun Transport", segment: "Haulage", city: "Accra", contact: "Fleet manager", email: "frank.g@example.org", phone: "+233 24 400 1122", creditLimit: 650000, status: "active", notes: "PMS + AGO.", createdAt: "2025-02-01" },
  { id: "ax_c_kotoka", companyId: APEX, name: "Kotoka Into-Plane Services", segment: "Aviation", city: "Accra", contact: "Uplift desk", email: "hannah.h@example.com", phone: "+233 30 277 6000", creditLimit: 2200000, status: "active", notes: "Jet A-1.", createdAt: "2024-11-20" },
  { id: "ax_c_stc", companyId: APEX, name: "STC Coaches", segment: "Transport", city: "Accra", contact: "Procurement", email: "samuel.w@example.com", phone: "+233 30 222 0000", creditLimit: 400000, status: "active", notes: "Tight credit.", createdAt: "2025-03-12" },
  { id: "vf_c_market", companyId: VOLTA, name: "Ho Municipal Filling Stations", segment: "Retail", city: "Ho", contact: "Association secretary", email: "oscar.d@example.net", phone: "+233 36 202 1111", creditLimit: 180000, status: "active", notes: "Cash + 3-day.", createdAt: "2025-06-10" },
  { id: "ga_c_apex", companyId: GULF, name: "Apex Petroleum Ghana Ltd", segment: "OMC", city: "Accra", contact: "Trading", email: "ursula.b@example.com", phone: "+233 30 255 0100", creditLimit: 8000000, status: "active", notes: "Downstream offtake.", createdAt: "2024-01-05" },
];

function purchase(p: Omit<Purchase, "totalPurchaseCost" | "totalLandedCost" | "costPerUnit" | "createdAt" | "payableOutstanding"> & { payableOutstanding?: number }): Purchase {
  const costs = computePurchaseCosts(p);
  return { ...p, ...costs, payableOutstanding: p.payableOutstanding ?? round2(costs.totalLandedCost * 0.18), createdAt: p.date };
}

const purchases: Purchase[] = [
  purchase({ id: "ax_po1", companyId: APEX, supplierId: "ax_s_sahara", productId: "ax_ago", locationId: "ax_tema", quantity: 1000000, purchasePrice: 0.76, currency: "USD", exchangeRate: 15.35, date: daysAgo(55), freight: 420000, insurance: 68000, portHandling: 185000, taxes: 940000, transportation: 210000, storage: 75000, financing: 160000, otherCosts: 22000 }),
  purchase({ id: "ax_po2", companyId: APEX, supplierId: "ax_s_vitol", productId: "ax_pms", locationId: "ax_tema", quantity: 650000, purchasePrice: 0.82, currency: "USD", exchangeRate: 15.42, date: daysAgo(40), freight: 310000, insurance: 52000, portHandling: 140000, taxes: 710000, transportation: 125000, storage: 48000, financing: 98000, otherCosts: 18000 }),
  purchase({ id: "ax_po3", companyId: APEX, supplierId: "ax_s_vitol", productId: "ax_jet", locationId: "ax_tema", quantity: 280000, purchasePrice: 0.88, currency: "USD", exchangeRate: 15.5, date: daysAgo(28), freight: 155000, insurance: 31000, portHandling: 92000, taxes: 240000, transportation: 64000, storage: 22000, financing: 41000, otherCosts: 9000 }),
  purchase({ id: "ax_po4", companyId: APEX, supplierId: "ax_s_tor", productId: "ax_ago", locationId: "ax_takoradi", quantity: 220000, purchasePrice: 11.7, currency: "GHS", exchangeRate: 1, date: daysAgo(18), freight: 0, insurance: 8000, portHandling: 0, taxes: 165000, transportation: 88000, storage: 12000, financing: 18000, otherCosts: 6000 }),
  purchase({ id: "ax_po5", companyId: APEX, supplierId: "ax_s_goil", productId: "ax_ker", locationId: "ax_kumasi", quantity: 55000, purchasePrice: 10.9, currency: "GHS", exchangeRate: 1, date: daysAgo(12), freight: 0, insurance: 2000, portHandling: 0, taxes: 28000, transportation: 34000, storage: 4000, financing: 5000, otherCosts: 1500, payableOutstanding: 0 }),
  purchase({ id: "ax_po6", companyId: APEX, supplierId: "ax_s_sahara", productId: "ax_lpg", locationId: "ax_tema", quantity: 850, purchasePrice: 620, currency: "USD", exchangeRate: 15.48, date: daysAgo(9), freight: 95000, insurance: 22000, portHandling: 41000, taxes: 180000, transportation: 27000, storage: 14000, financing: 36000, otherCosts: 8000 }),
  purchase({ id: "vf_po1", companyId: VOLTA, supplierId: "vf_s_apex", productId: "vf_ago", locationId: "vf_ho", quantity: 80000, purchasePrice: 13.2, currency: "GHS", exchangeRate: 1, date: daysAgo(20), freight: 0, insurance: 0, portHandling: 0, taxes: 0, transportation: 18000, storage: 2500, financing: 0, otherCosts: 800, payableOutstanding: 42000 }),
  purchase({ id: "ga_po1", companyId: GULF, supplierId: "ga_s_traf", productId: "ga_ago", locationId: "ga_tema", quantity: 3500000, purchasePrice: 0.74, currency: "USD", exchangeRate: 15.3, date: daysAgo(33), freight: 1100000, insurance: 210000, portHandling: 540000, taxes: 2800000, transportation: 0, storage: 190000, financing: 620000, otherCosts: 45000 }),
];

function unitCost(companyId: string, productId: string) {
  const lots = purchases.filter((p) => p.companyId === companyId && p.productId === productId);
  const qty = lots.reduce((s, p) => s + p.quantity, 0);
  const cost = lots.reduce((s, p) => s + p.totalLandedCost, 0);
  return qty ? cost / qty : 0;
}

function sale(s: Omit<Sale, "revenue" | "cost" | "grossProfit" | "grossMarginPct" | "createdAt"> & { receivableOutstanding?: number }): Sale {
  const econ = computeSaleEconomics({
    quantity: s.quantity,
    sellingPrice: s.sellingPrice,
    exchangeRate: s.exchangeRate,
    discounts: s.discounts,
    transportation: s.transportation,
    otherCosts: s.otherCosts,
    unitCost: unitCost(s.companyId, s.productId),
  });
  return { ...s, ...econ, receivableOutstanding: s.receivableOutstanding ?? 0, createdAt: s.date };
}

const sales: Sale[] = [
  sale({ id: "ax_so1", companyId: APEX, customerId: "ax_c_newmont", productId: "ax_ago", locationId: "ax_tema", quantity: 280000, sellingPrice: 13.85, currency: "GHS", exchangeRate: 1, date: daysAgo(48), discounts: 0, transportation: 42000, otherCosts: 4000, receivableOutstanding: 0 }),
  sale({ id: "ax_so2", companyId: APEX, customerId: "ax_c_goldfields", productId: "ax_ago", locationId: "ax_takoradi", quantity: 190000, sellingPrice: 14.05, currency: "GHS", exchangeRate: 1, date: daysAgo(36), discounts: 15000, transportation: 51000, otherCosts: 3500, receivableOutstanding: 420000 }),
  sale({ id: "ax_so3", companyId: APEX, customerId: "ax_c_vip", productId: "ax_pms", locationId: "ax_tema", quantity: 85000, sellingPrice: 14.4, currency: "GHS", exchangeRate: 1, date: daysAgo(30), discounts: 8000, transportation: 12000, otherCosts: 1500, receivableOutstanding: 0 }),
  sale({ id: "ax_so4", companyId: APEX, customerId: "ax_c_kotoka", productId: "ax_jet", locationId: "ax_tema", quantity: 96000, sellingPrice: 16.1, currency: "GHS", exchangeRate: 1, date: daysAgo(22), discounts: 0, transportation: 18000, otherCosts: 6000, receivableOutstanding: 0 }),
  sale({ id: "ax_so5", companyId: APEX, customerId: "ax_c_stc", productId: "ax_pms", locationId: "ax_tema", quantity: 42000, sellingPrice: 14.25, currency: "GHS", exchangeRate: 1, date: daysAgo(16), discounts: 5000, transportation: 7000, otherCosts: 800, receivableOutstanding: 185000 }),
  sale({ id: "ax_so6", companyId: APEX, customerId: "ax_c_newmont", productId: "ax_ago", locationId: "ax_tema", quantity: 210000, sellingPrice: 13.95, currency: "GHS", exchangeRate: 1, date: daysAgo(11), discounts: 0, transportation: 36000, otherCosts: 2800, receivableOutstanding: 890000 }),
  sale({ id: "ax_so7", companyId: APEX, customerId: "ax_c_goldfields", productId: "ax_ago", locationId: "ax_tema", quantity: 125000, sellingPrice: 13.7, currency: "GHS", exchangeRate: 1, date: daysAgo(6), discounts: 22000, transportation: 28000, otherCosts: 2000, receivableOutstanding: 310000 }),
  sale({ id: "ax_so8", companyId: APEX, customerId: "ax_c_vip", productId: "ax_ago", locationId: "ax_kumasi", quantity: 38000, sellingPrice: 14.55, currency: "GHS", exchangeRate: 1, date: daysAgo(4), discounts: 0, transportation: 16000, otherCosts: 900, receivableOutstanding: 0 }),
  sale({ id: "ax_so9", companyId: APEX, customerId: "ax_c_kotoka", productId: "ax_jet", locationId: "ax_tema", quantity: 54000, sellingPrice: 15.85, currency: "GHS", exchangeRate: 1, date: daysAgo(3), discounts: 0, transportation: 11000, otherCosts: 2500, receivableOutstanding: 255000 }),
  sale({ id: "vf_so1", companyId: VOLTA, customerId: "vf_c_market", productId: "vf_ago", locationId: "vf_ho", quantity: 28000, sellingPrice: 14.8, currency: "GHS", exchangeRate: 1, date: daysAgo(8), discounts: 0, transportation: 4000, otherCosts: 400, receivableOutstanding: 22000 }),
  sale({ id: "ga_so1", companyId: GULF, customerId: "ga_c_apex", productId: "ga_ago", locationId: "ga_tema", quantity: 1000000, sellingPrice: 0.92, currency: "USD", exchangeRate: 15.45, date: daysAgo(20), discounts: 0, transportation: 0, otherCosts: 12000, receivableOutstanding: 0 }),
];

function rebuildInventory(companyId: string): { lots: InventoryLot[]; moves: InventoryMovement[] } {
  const lots = new Map<string, InventoryLot>();
  const moves: InventoryMovement[] = [];
  const key = (p: string, l: string) => `${p}:${l}`;
  const bump = (productId: string, locationId: string, qty: number, cost: number, date: string) => {
    const k = key(productId, locationId);
    const cur = lots.get(k) ?? { id: `inv_${companyId}_${productId}_${locationId}`, companyId, productId, locationId, quantity: 0, averageCost: 0, updatedAt: date };
    const newQty = cur.quantity + qty;
    const avg = qty > 0 && newQty > 0 ? (cur.quantity * cur.averageCost + qty * cost) / newQty : cur.averageCost;
    lots.set(k, { ...cur, quantity: newQty, averageCost: round2(avg), updatedAt: date });
  };
  for (const p of purchases.filter((x) => x.companyId === companyId)) {
    bump(p.productId, p.locationId, p.quantity, p.costPerUnit, p.date);
    moves.push({ id: `mv_${p.id}`, companyId, productId: p.productId, fromLocationId: null, toLocationId: p.locationId, type: "purchase", quantity: p.quantity, unitCost: p.costPerUnit, referenceId: p.id, notes: "Inbound cargo / lift", date: p.date, createdAt: p.date });
  }
  for (const s of sales.filter((x) => x.companyId === companyId)) {
    const lot = lots.get(key(s.productId, s.locationId));
    const cost = lot?.averageCost ?? unitCost(companyId, s.productId);
    bump(s.productId, s.locationId, -s.quantity, cost, s.date);
    moves.push({ id: `mv_${s.id}`, companyId, productId: s.productId, fromLocationId: s.locationId, toLocationId: null, type: "sale", quantity: s.quantity, unitCost: cost, referenceId: s.id, notes: "Customer lift", date: s.date, createdAt: s.date });
  }
  if (companyId === APEX) {
    bump("ax_ago", "ax_tema", -40000, lots.get(key("ax_ago", "ax_tema"))?.averageCost ?? 0, daysAgo(15));
    bump("ax_ago", "ax_kumasi", 40000, lots.get(key("ax_ago", "ax_tema"))?.averageCost ?? 0, daysAgo(15));
    moves.push({
      id: "mv_ax_tr1",
      companyId,
      productId: "ax_ago",
      fromLocationId: "ax_tema",
      toLocationId: "ax_kumasi",
      type: "transfer",
      quantity: 40000,
      unitCost: lots.get(key("ax_ago", "ax_tema"))?.averageCost ?? 0,
      referenceId: null,
      notes: "Inland replenishment",
      date: daysAgo(15),
      createdAt: daysAgo(15),
    });
  }
  return { lots: [...lots.values()].filter((l) => l.quantity !== 0 || true), moves };
}

const invA = rebuildInventory(APEX);
const invV = rebuildInventory(VOLTA);
const invG = rebuildInventory(GULF);

const contracts: Contract[] = [
  { id: "ax_ct1", companyId: APEX, partyType: "customer", partyId: "ax_c_newmont", productId: "ax_ago", quantity: 1200000, fulfilledQty: 490000, price: 13.9, currency: "GHS", startDate: daysAgo(80), expiryDate: daysAgo(-40), paymentTerms: "Net 21", deliveryTerms: "DAP mine gate", notes: "Q3 AGO frame.", createdAt: daysAgo(80) },
  { id: "ax_ct2", companyId: APEX, partyType: "supplier", partyId: "ax_s_sahara", productId: "ax_ago", quantity: 2000000, fulfilledQty: 1000000, price: 0.76, currency: "USD", startDate: daysAgo(70), expiryDate: daysAgo(-12), paymentTerms: "LC at sight", deliveryTerms: "CIF Tema", notes: "H2 cargo window.", createdAt: daysAgo(70) },
  { id: "ax_ct3", companyId: APEX, partyType: "customer", partyId: "ax_c_kotoka", productId: "ax_jet", quantity: 400000, fulfilledQty: 150000, price: 16.0, currency: "GHS", startDate: daysAgo(50), expiryDate: daysAgo(6), paymentTerms: "Net 14", deliveryTerms: "Into-plane ACC", notes: "Expires this month — alert.", createdAt: daysAgo(50) },
];

const market: MarketPrice[] = [
  mkMarket("m_brent", "Brent crude", hist(78.4, 3.8), "USD", "bbl"),
  mkMarket("m_wti", "WTI crude", hist(74.1, 4.2), "USD", "bbl"),
  mkMarket("m_usd_ghs", "USD / GHS", hist(15.52, 0.22), "GHS", "USD"),
  mkMarket("m_ago_platts", "AGO CIF NWE (proxy)", hist(0.79, 0.04), "USD", "L"),
  mkMarket("m_pms_platts", "Gasoline 10ppm (proxy)", hist(0.83, 0.035), "USD", "L"),
];

const alerts: Alert[] = [
  { id: "al1", companyId: APEX, type: "low_inventory", severity: "high", status: "open", message: "Kerosene at Kumasi is below the 40,000 L minimum.", relatedEntity: "ax_ker", createdAt: daysAgo(1) + "T08:00:00Z" },
  { id: "al2", companyId: APEX, type: "contract_expiry", severity: "critical", status: "open", message: "Kotoka Jet A-1 contract expires in 6 days.", relatedEntity: "ax_ct3", createdAt: daysAgo(0) + "T06:10:00Z" },
  { id: "al3", companyId: APEX, type: "outstanding_receivable", severity: "high", status: "open", message: "Newmont outstanding receivables exceed GH₵890,000.", relatedEntity: "ax_c_newmont", createdAt: daysAgo(2) + "T11:00:00Z" },
  { id: "al4", companyId: APEX, type: "low_margin", severity: "medium", status: "acknowledged", message: "Gold Fields AGO sale ax_so7 cleared at 4.8% gross margin.", relatedEntity: "ax_so7", createdAt: daysAgo(6) + "T14:22:00Z" },
  { id: "al5", companyId: APEX, type: "fx_move", severity: "medium", status: "open", message: "USD/GHS demo series moved more than 1.2% week-on-week.", relatedEntity: "m_usd_ghs", createdAt: daysAgo(0) + "T07:31:00Z" },
  { id: "al6", companyId: APEX, type: "market_move", severity: "low", status: "open", message: "Brent demo print changed more than 1% versus prior session.", relatedEntity: "m_brent", createdAt: daysAgo(0) + "T07:31:00Z" },
  { id: "al7", companyId: APEX, type: "outstanding_payable", severity: "medium", status: "open", message: "Open payables remain on Sahara and Vitol cargoes.", relatedEntity: "ax_s_sahara", createdAt: daysAgo(3) + "T09:00:00Z" },
];

const subscriptions: Subscription[] = [
  { id: "sub_apex", companyId: APEX, planId: "professional", status: "active", periodStart: "2026-09-01", periodEnd: "2026-10-01", mockPaymentRef: "MOCK-PAY-88421" },
  { id: "sub_volta", companyId: VOLTA, planId: "starter", status: "active", periodStart: "2026-09-01", periodEnd: "2026-10-01", mockPaymentRef: "MOCK-PAY-10933" },
  { id: "sub_gulf", companyId: GULF, planId: "enterprise", status: "active", periodStart: "2026-09-01", periodEnd: "2026-10-01", mockPaymentRef: "MOCK-PAY-55102" },
];

const auditLogs: AuditLog[] = [
  { id: "au1", companyId: APEX, actorId: "u_apex_tr", action: "create", entity: "sale", detail: "Recorded Jet A-1 uplift to Kotoka", createdAt: daysAgo(3) + "T10:12:00Z" },
  { id: "au2", companyId: APEX, actorId: "u_apex_cm", action: "update", entity: "contract", detail: "Reviewed Newmont AGO frame remaining quantity", createdAt: daysAgo(1) + "T15:40:00Z" },
  { id: "au3", companyId: null, actorId: "u_platform", action: "view", entity: "subscription", detail: "Inspected active Ghana tenant billing", createdAt: daysAgo(0) + "T07:12:00Z" },
];

export const SEED_STATE: AppState = {
  companies,
  users,
  products,
  suppliers,
  quotes,
  customers,
  locations,
  purchases,
  sales,
  inventory: [...invA.lots, ...invV.lots, ...invG.lots],
  movements: [...invA.moves, ...invV.moves, ...invG.moves],
  contracts,
  market,
  alerts,
  subscriptions,
  auditLogs,
  session: null,
};
