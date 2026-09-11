import { useState } from "react";
import { PlanGate } from "../components/layout/guards";
import { Button, inputClass } from "../components/ui/Button";
import { PageHeader } from "../components/ui/EmptyState";
import { answerQuestion } from "../lib/ai";
import { useEnergy, useSession } from "../store/EnergyFlowContext";

const PROMPTS = [
  "What is our most profitable product?",
  "Which customers generate the highest margin?",
  "Why did our diesel margin decrease?",
  "Which supplier gave us the lowest purchase cost?",
  "What is our current inventory value?",
  "Show me transactions with margins below 5%.",
  "What were our sales last month?",
  "Which products are losing money?",
  "Which customers owe us money?",
  "What is our current gross profit?",
];

export default function Assistant() {
  const { state } = useEnergy();
  const { company } = useSession();
  const [q, setQ] = useState(PROMPTS[0]);
  const [log, setLog] = useState<{ q: string; a: ReturnType<typeof answerQuestion> }[]>([]);
  if (!company) return null;

  const ask = (question: string) => {
    const a = answerQuestion(question, state, company.id);
    setLog((l) => [{ q: question, a }, ...l]);
  };

  return (
    <PlanGate feature="ai">
      <PageHeader
        eyebrow="Assistant"
        title="AI commercial assistant"
        subtitle="Questions run against this company's book in the browser. No database credentials leave the device. A Django /api/ai/ layer will replace this with a constrained query tool."
      />
      <div className="rounded-xl border border-gold/30 bg-[#161208] px-4 py-3 text-sm text-gold-2">
        Company data answers are computed from recorded transactions. Interpretations (for example diesel margin drivers) are labelled as estimates.
      </div>
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
      >
        <input className={inputClass} value={q} onChange={(e) => setQ(e.target.value)} />
        <Button variant="gold" type="submit">Ask</Button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {PROMPTS.map((p) => (
          <button key={p} className="rounded-full border border-line px-3 py-1 text-xs text-mist hover:text-paper" onClick={() => { setQ(p); ask(p); }}>
            {p}
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {log.map((item, i) => (
          <article key={i} className="rounded-2xl border border-line bg-panel p-4">
            <p className="text-xs uppercase tracking-wide text-mist">You</p>
            <p className="font-medium">{item.q}</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-gold">{item.a.estimate ? "Estimate / interpretation" : "Company data"}</p>
            <p className="mt-1 text-sm leading-relaxed">{item.a.text}</p>
            <p className="mt-2 text-xs text-mist">{item.a.sourceNote}</p>
          </article>
        ))}
      </div>
    </PlanGate>
  );
}
