import { round2 } from "./format";

export type LandedInput = {
  quantity: number;
  purchasePrice: number;
  exchangeRate: number;
  freight: number;
  insurance: number;
  portHandling: number;
  taxes: number;
  transportation: number;
  storage: number;
  financing: number;
  otherCosts: number;
};

export function computePurchaseCosts(input: LandedInput) {
  const productCost = input.quantity * input.purchasePrice * input.exchangeRate;
  const extras =
    input.freight +
    input.insurance +
    input.portHandling +
    input.taxes +
    input.transportation +
    input.storage +
    input.financing +
    input.otherCosts;
  const totalLandedCost = productCost + extras;
  return {
    totalPurchaseCost: round2(productCost),
    totalLandedCost: round2(totalLandedCost),
    costPerUnit: input.quantity ? round2(totalLandedCost / input.quantity) : 0,
  };
}

export function computeSaleEconomics(args: {
  quantity: number;
  sellingPrice: number;
  exchangeRate: number;
  discounts: number;
  transportation: number;
  otherCosts: number;
  unitCost: number;
}) {
  const revenue = args.quantity * args.sellingPrice * args.exchangeRate - args.discounts;
  const cost = args.quantity * args.unitCost;
  const grossProfit = revenue - cost - args.transportation - args.otherCosts;
  const grossMarginPct = revenue ? (grossProfit / revenue) * 100 : 0;
  return {
    revenue: round2(revenue),
    cost: round2(cost),
    grossProfit: round2(grossProfit),
    grossMarginPct: round2(grossMarginPct),
  };
}

export function recommendedPrice(costPerUnit: number, marginPct: number) {
  return round2(costPerUnit * (1 + marginPct / 100));
}
