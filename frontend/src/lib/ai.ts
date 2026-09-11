import { changePct, ghs } from "./format";
import type { AppState, Customer, Product, Sale } from "../types";

function nameOf(products: Product[], id: string) {
  return products.find((p) => p.id === id)?.name ?? id;
}

export function answerQuestion(q: string, state: AppState, companyId: string) {
  const query = q.trim().toLowerCase();
  const products = state.products.filter((p) => p.companyId === companyId && !p.deletedAt);
  const sales = state.sales.filter((s) => s.companyId === companyId);
  const purchases = state.purchases.filter((p) => p.companyId === companyId);
  const customers = state.customers.filter((c) => c.companyId === companyId);
  const suppliers = state.suppliers.filter((s) => s.companyId === companyId);
  const inventory = state.inventory.filter((i) => i.companyId === companyId);

  const gp = sales.reduce((s, r) => s + r.grossProfit, 0);
  const rev = sales.reduce((s, r) => s + r.revenue, 0);
  const invValue = inventory.reduce((s, r) => s + r.quantity * r.averageCost, 0);

  const byProduct = new Map<string, { gp: number; rev: number; qty: number }>();
  for (const s of sales) {
    const cur = byProduct.get(s.productId) ?? { gp: 0, rev: 0, qty: 0 };
    cur.gp += s.grossProfit;
    cur.rev += s.revenue;
    cur.qty += s.quantity;
    byProduct.set(s.productId, cur);
  }
  const byCustomer = new Map<string, { gp: number; rev: number; ar: number }>();
  for (const s of sales) {
    const cur = byCustomer.get(s.customerId) ?? { gp: 0, rev: 0, ar: 0 };
    cur.gp += s.grossProfit;
    cur.rev += s.revenue;
    cur.ar += s.receivableOutstanding;
    byCustomer.set(s.customerId, cur);
  }
  const bySupplier = new Map<string, { cost: number; qty: number }>();
  for (const p of purchases) {
    const cur = bySupplier.get(p.supplierId) ?? { cost: 0, qty: 0 };
    cur.cost += p.totalLandedCost;
    cur.qty += p.quantity;
    bySupplier.set(p.supplierId, cur);
  }

  const lastMonth = sales.filter((s) => s.date.slice(0, 7) === "2026-08");
  const lastMonthRev = lastMonth.reduce((s, r) => s + r.revenue, 0);

  const dieselSales = sales.filter((s) => nameOf(products, s.productId).toLowerCase().includes("diesel"));
  const dieselRecent = [...dieselSales].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const dieselOlder = [...dieselSales].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const avg = (rows: Sale[]) => (rows.length ? rows.reduce((s, r) => s + r.grossMarginPct, 0) / rows.length : 0);

  const lowMargin = sales.filter((s) => s.grossMarginPct < 5);
  const losing = [...byProduct.entries()].filter(([, v]) => v.gp < 0);
  const owing = [...byCustomer.entries()].filter(([, v]) => v.ar > 0).sort((a, b) => b[1].ar - a[1].ar);

  const customerName = (id: string) => customers.find((c: Customer) => c.id === id)?.name ?? id;
  const supplierName = (id: string) => suppliers.find((s) => s.id === id)?.name ?? id;

  const lowestSupplier = [...bySupplier.entries()]
    .map(([id, v]) => ({ id, unit: v.qty ? v.cost / v.qty : 0 }))
    .sort((a, b) => a.unit - b.unit)[0];

  const mostProfitable = [...byProduct.entries()].sort((a, b) => b[1].gp - a[1].gp)[0];
  const bestCustomer = [...byCustomer.entries()].sort((a, b) => b[1].gp - a[1].gp)[0];

  const sourceNote = "Answered from this company's demo commercial book on the device. Not a live model and not a live market feed.";

  if (/most profitable product/.test(query)) {
    if (!mostProfitable) return { text: "No sales in this company book yet.", estimate: false, sourceNote };
    return { text: `${nameOf(products, mostProfitable[0])} is the most profitable product, with ${ghs(mostProfitable[1].gp)} gross profit on ${ghs(mostProfitable[1].rev)} revenue.`, estimate: false, sourceNote };
  }
  if (/highest margin|customers generate/.test(query)) {
    if (!bestCustomer) return { text: "No customer margin data yet.", estimate: false, sourceNote };
    const m = bestCustomer[1].rev ? (bestCustomer[1].gp / bestCustomer[1].rev) * 100 : 0;
    return { text: `${customerName(bestCustomer[0])} generates the most gross profit (${ghs(bestCustomer[1].gp)}, ${m.toFixed(1)}% on revenue).`, estimate: false, sourceNote };
  }
  if (/diesel margin decrease|why did our diesel/.test(query)) {
    const recent = avg(dieselRecent);
    const older = avg(dieselOlder);
    const delta = changePct(recent, older);
    return {
      text: `Diesel (AGO) recent lifts average ${recent.toFixed(1)}% margin versus ${older.toFixed(1)}% on earlier lifts (${delta.toFixed(1)} pts relative). Likely drivers in this book: Gold Fields sale ax_so7 discounted AGO to GH₵13.70/L while landed cost stayed elevated after the Sahara cargo, plus inland transport on Tarkwa/Kumasi lifts.`,
      estimate: true,
      sourceNote: sourceNote + " Narrative drivers are an interpretation of recorded prices and costs.",
    };
  }
  if (/lowest purchase cost|which supplier/.test(query) && /cost|lowest|supplier/.test(query)) {
    if (!lowestSupplier) return { text: "No purchase history.", estimate: false, sourceNote };
    return { text: `${supplierName(lowestSupplier.id)} shows the lowest average landed cost in this book at GH₵${lowestSupplier.unit.toFixed(2)} per unit.`, estimate: false, sourceNote };
  }
  if (/inventory value/.test(query)) {
    return { text: `Current inventory value is ${ghs(invValue)} across ${inventory.length} depot lots (quantity × average landed cost).`, estimate: false, sourceNote };
  }
  if (/margins below 5|below 5%/.test(query)) {
    if (!lowMargin.length) return { text: "No recorded sales with gross margin below 5%.", estimate: false, sourceNote };
    const lines = lowMargin.map((s) => `${s.id} · ${nameOf(products, s.productId)} · ${s.grossMarginPct.toFixed(1)}% · ${ghs(s.grossProfit)}`).join("; ");
    return { text: `${lowMargin.length} sale(s) cleared below 5% margin: ${lines}.`, estimate: false, sourceNote };
  }
  if (/sales last month/.test(query)) {
    return { text: `Sales dated August 2026 total ${ghs(lastMonthRev)} across ${lastMonth.length} invoices in the demo calendar.`, estimate: false, sourceNote };
  }
  if (/losing money/.test(query)) {
    if (!losing.length) return { text: "No product is loss-making on realised gross profit in this book.", estimate: false, sourceNote };
    return { text: `Loss-making products: ${losing.map(([id, v]) => `${nameOf(products, id)} (${ghs(v.gp)})`).join(", ")}.`, estimate: false, sourceNote };
  }
  if (/owe us|outstanding|receivable/.test(query)) {
    if (!owing.length) return { text: "No outstanding customer balances.", estimate: false, sourceNote };
    return { text: `Customers with open receivables: ${owing.map(([id, v]) => `${customerName(id)} ${ghs(v.ar)}`).join("; ")}.`, estimate: false, sourceNote };
  }
  if (/gross profit/.test(query)) {
    const m = rev ? (gp / rev) * 100 : 0;
    return { text: `Current realised gross profit is ${ghs(gp)} on ${ghs(rev)} revenue (${m.toFixed(1)}% gross margin). Unrealised depot P&L is not included in this figure.`, estimate: false, sourceNote };
  }

  return {
    text: `I can analyse this company's purchases, sales, inventory and counterparties. Try: most profitable product, customers with highest margin, diesel margin, lowest supplier cost, inventory value, sales below 5% margin, last month sales, loss-making products, who owes us, or current gross profit.`,
    estimate: false,
    sourceNote,
  };
}
