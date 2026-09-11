import { useMemo, useState } from "react";
import { Button, Field, inputClass } from "../components/ui/Button";
import { PageHeader } from "../components/ui/EmptyState";
import { recommendedPrice } from "../lib/commerce";
import { ghs, pct } from "../lib/format";
import { useEnergy, useSession } from "../store/EnergyFlowContext";

export default function Pricing() {
  const { state } = useEnergy();
  const { company } = useSession();
  const products = state.products.filter((p) => p.companyId === company?.id && !p.deletedAt);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [intl, setIntl] = useState(0.8);
  const [qty, setQty] = useState(500000);
  const [fx, setFx] = useState(state.market.find((m) => m.id === "m_usd_ghs")?.price ?? 15.5);
  const [freight, setFreight] = useState(180000);
  const [insurance, setInsurance] = useState(40000);
  const [port, setPort] = useState(90000);
  const [taxes, setTaxes] = useState(420000);
  const [storage, setStorage] = useState(25000);
  const [transport, setTransport] = useState(80000);
  const [financing, setFinancing] = useState(55000);
  const [other, setOther] = useState(12000);
  const [margin, setMargin] = useState(8);

  const calc = useMemo(() => {
    const productCost = qty * intl * fx;
    const extras = freight + insurance + port + taxes + storage + transport + financing + other;
    const landed = productCost + extras;
    const cpu = qty ? landed / qty : 0;
    const sell = recommendedPrice(cpu, margin);
    const gpUnit = sell - cpu;
    const gp = gpUnit * qty;
    return { productCost, landed, cpu, sell, gpUnit, gp };
  }, [qty, intl, fx, freight, insurance, port, taxes, storage, transport, financing, other, margin]);

  const product = products.find((p) => p.id === productId);

  return (
    <div>
      <PageHeader
        eyebrow="Pricing engine"
        title="Landed cost calculator"
        subtitle="Change any assumption and the recommended GH₵ selling price updates immediately. This is a commercial worksheet, not a live NPA price build."
      />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form className="grid gap-3 rounded-2xl border border-line bg-panel p-5 sm:grid-cols-2">
          <Field label="Product">
            <select className={inputClass} value={productId} onChange={(e) => setProductId(e.target.value)}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="International price (USD / unit)">
            <input className={inputClass} type="number" step="0.001" value={intl} onChange={(e) => setIntl(Number(e.target.value))} />
          </Field>
          <Field label="Quantity">
            <input className={inputClass} type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          </Field>
          <Field label="USD/GHS">
            <input className={inputClass} type="number" step="0.01" value={fx} onChange={(e) => setFx(Number(e.target.value))} />
          </Field>
          {[
            ["Freight", freight, setFreight],
            ["Insurance", insurance, setInsurance],
            ["Port charges", port, setPort],
            ["Taxes / levies", taxes, setTaxes],
            ["Storage", storage, setStorage],
            ["Transportation", transport, setTransport],
            ["Financing", financing, setFinancing],
            ["Other costs", other, setOther],
          ].map(([label, val, set]) => (
            <Field key={String(label)} label={`${label} (GHS)`}>
              <input className={inputClass} type="number" value={val as number} onChange={(e) => (set as (n: number) => void)(Number(e.target.value))} />
            </Field>
          ))}
          <Field label="Desired margin %">
            <input className={inputClass} type="number" step="0.1" value={margin} onChange={(e) => setMargin(Number(e.target.value))} />
          </Field>
        </form>
        <div className="space-y-3">
          <Result label="Landed cost" value={ghs(calc.landed)} />
          <Result label={`Cost per ${product?.unit ?? "unit"}`} value={ghs(calc.cpu, 3)} />
          <Result label="Desired margin" value={pct(margin)} />
          <Result label="Recommended selling price" value={ghs(calc.sell, 3)} gold />
          <Result label="Expected gross profit" value={ghs(calc.gp)} />
          <p className="text-xs text-mist">Demo FX default is copied from the seeded USD/GHS series. Replace with your treasury rate when the market API is live.</p>
          <Button
            variant="ghost"
            onClick={() => {
              setIntl(0.8); setQty(500000); setMargin(8);
            }}
          >
            Reset worksheet
          </Button>
        </div>
      </div>
    </div>
  );
}

function Result({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${gold ? "border-gold bg-[#1a1608]" : "border-line bg-panel"}`}>
      <p className="text-xs uppercase tracking-wide text-mist">{label}</p>
      <p className="num mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
