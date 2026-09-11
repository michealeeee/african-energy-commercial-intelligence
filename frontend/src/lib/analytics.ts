import type { AppState } from "../types";
import { changePct } from "./format";

export function companyKpis(state: AppState, companyId: string) {
  const sales = state.sales.filter((s) => s.companyId === companyId);
  const purchases = state.purchases.filter((p) => p.companyId === companyId);
  const inventory = state.inventory.filter((i) => i.companyId === companyId);
  const products = state.products.filter((p) => p.companyId === companyId);

  const totalSales = sales.reduce((s, r) => s + r.revenue, 0);
  const totalPurchases = purchases.reduce((s, r) => s + r.totalLandedCost, 0);
  const grossProfit = sales.reduce((s, r) => s + r.grossProfit, 0);
  const grossMargin = totalSales ? (grossProfit / totalSales) * 100 : 0;
  const inventoryQty = inventory.reduce((s, r) => s + r.quantity, 0);
  const inventoryValue = inventory.reduce((s, r) => s + r.quantity * r.averageCost, 0);
  const receivables = sales.reduce((s, r) => s + r.receivableOutstanding, 0);
  const payables = purchases.reduce((s, r) => s + r.payableOutstanding, 0);

  const marketMap = Object.fromEntries(state.market.map((m) => [m.id, m]));
  const week = (m: (typeof state.market)[0]) => m.history[m.history.length - 8]?.price ?? m.previousPrice;
  const month = (m: (typeof state.market)[0]) => m.history[m.history.length - 31]?.price ?? m.previousPrice;

  const positions = products.map((p) => {
    const bought = purchases.filter((x) => x.productId === p.id).reduce((s, r) => s + r.quantity, 0);
    const sold = sales.filter((x) => x.productId === p.id).reduce((s, r) => s + r.quantity, 0);
    const remaining = inventory.filter((x) => x.productId === p.id).reduce((s, r) => s + r.quantity, 0);
    const avgCost = remaining
      ? inventory.filter((x) => x.productId === p.id).reduce((s, r) => s + r.quantity * r.averageCost, 0) / remaining
      : 0;
    const lastSale = [...sales.filter((x) => x.productId === p.id)].sort((a, b) => b.date.localeCompare(a.date))[0];
    const marketUnit = lastSale?.sellingPrice ?? avgCost * 1.08;
    const unrealized = remaining * (marketUnit - avgCost);
    return { product: p, bought, sold, remaining, avgCost, marketUnit, unrealized };
  });

  const realized = grossProfit;
  const unrealized = positions.reduce((s, p) => s + p.unrealized, 0);

  return {
    totalSales,
    totalPurchases,
    grossProfit,
    grossMargin,
    inventoryQty,
    inventoryValue,
    receivables,
    payables,
    openPositions: positions.filter((p) => p.remaining > 0).length,
    positions,
    realized,
    unrealized,
    brent: marketMap.m_brent,
    wti: marketMap.m_wti,
    fx: marketMap.m_usd_ghs,
    brentD: marketMap.m_brent ? changePct(marketMap.m_brent.price, marketMap.m_brent.previousPrice) : 0,
    wtiD: marketMap.m_wti ? changePct(marketMap.m_wti.price, marketMap.m_wti.previousPrice) : 0,
    fxD: marketMap.m_fx ? 0 : marketMap.m_usd_ghs ? changePct(marketMap.m_usd_ghs.price, marketMap.m_usd_ghs.previousPrice) : 0,
    brentW: marketMap.m_brent ? changePct(marketMap.m_brent.price, week(marketMap.m_brent)) : 0,
    wtiW: marketMap.m_wti ? changePct(marketMap.m_wti.price, week(marketMap.m_wti)) : 0,
    fxW: marketMap.m_usd_ghs ? changePct(marketMap.m_usd_ghs.price, week(marketMap.m_usd_ghs)) : 0,
    brentM: marketMap.m_brent ? changePct(marketMap.m_brent.price, month(marketMap.m_brent)) : 0,
    wtiM: marketMap.m_wti ? changePct(marketMap.m_wti.price, month(marketMap.m_wti)) : 0,
    fxM: marketMap.m_usd_ghs ? changePct(marketMap.m_usd_ghs.price, month(marketMap.m_usd_ghs)) : 0,
  };
}

export function monthlyPnl(state: AppState, companyId: string) {
  const sales = state.sales.filter((s) => s.companyId === companyId);
  const map = new Map<string, { revenue: number; cost: number; gp: number }>();
  for (const s of sales) {
    const m = s.date.slice(0, 7);
    const cur = map.get(m) ?? { revenue: 0, cost: 0, gp: 0 };
    cur.revenue += s.revenue;
    cur.cost += s.cost;
    cur.gp += s.grossProfit;
    map.set(m, cur);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([month, v]) => ({ month, ...v }));
}
