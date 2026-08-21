/**
 * Calm operational paper: warm canvas, quiet white surfaces, and blue-only actions.
 * Sticker colors are decorative; authorization and evidence use text plus icon semantics.
 */
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Box,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  FileClock,
  FileText,
  Filter,
  History,
  LayoutDashboard,
  MapPin,
  Menu,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRoundCheck,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  type AuditEvent,
  type DemoVariant,
  type ProcurementItemState,
  type ProcurementSession,
  goldenItems,
  resolveApproval,
  rupees,
  runDemo,
} from "@/domain/procurement";

const BRAND_MARK = "/manus-storage/specsathi-mark_01ab55be.png";
const NIGHT_DESK = "/manus-storage/specsathi-night-desk_d321b227.png";
const EVIDENCE_TILE = "/manus-storage/specsathi-evidence-tile_76cfabb8.png";
const goldenBrief =
  "For 8 new joiners, buy adjustable aluminum laptop stands under ₹3,000 each, ergonomic office chairs under ₹12,000 each, and 27-inch QHD HDMI monitors under ₹20,000 each. Delivery is required within 7 days. The agent may approve purchases only within the stated unit limits.";

type View = "intake" | "review" | "workspace";

const itemAccent: Record<string, string> = {
  stands: "bg-[#d6b6f6] text-[#391c57]",
  chairs: "bg-[#ff64c8] text-[#6a174e]",
  monitors: "bg-[#62aef0] text-[#123a67]",
};

function statusMeta(status: ProcurementItemState["status"]) {
  const statuses = {
    PURCHASED: { label: "Purchased", className: "border-[#1aae39]/25 bg-[#effaf1] text-[#14752b]", icon: PackageCheck },
    PENDING_APPROVAL: { label: "Approval needed", className: "border-[#dd5b00]/25 bg-[#fff5ed] text-[#9a3b00]", icon: AlertTriangle },
    REJECTED: { label: "Rejected", className: "border-[#ff64c8]/25 bg-[#fff1fa] text-[#9b2164]", icon: XCircle },
    BLOCKED: { label: "Blocked", className: "border-black/15 bg-[#f0efed] text-[#615d59]", icon: XCircle },
    AUTO_AUTHORIZED: { label: "Authorized", className: "border-[#1aae39]/25 bg-[#effaf1] text-[#14752b]", icon: ShieldCheck },
    APPROVED: { label: "Approved", className: "border-[#0075de]/25 bg-[#edf6ff] text-[#005bab]", icon: BadgeCheck },
    CONFIRMING: { label: "Confirming", className: "border-[#0075de]/25 bg-[#edf6ff] text-[#005bab]", icon: RefreshCw },
    DRAFT: { label: "Draft", className: "border-black/10 bg-white text-[#615d59]", icon: FileText },
    PARSED: { label: "Parsed", className: "border-black/10 bg-white text-[#615d59]", icon: FileText },
    SEARCHING: { label: "Searching", className: "border-[#0075de]/25 bg-[#edf6ff] text-[#005bab]", icon: Search },
    RECOMMENDED: { label: "Recommended", className: "border-[#0075de]/25 bg-[#edf6ff] text-[#005bab]", icon: Sparkles },
  } as const;
  return statuses[status];
}

function StatusBadge({ status }: { status: ProcurementItemState["status"] }) {
  const meta = statusMeta(status);
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold ${meta.className}`}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function PolicyTape({ label, value, valid = true }: { label: string; value: string; valid?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#e6e6e6] py-3 last:border-b-0">
      <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[#615d59]">{label}</span>
      <span className={`inline-flex items-center gap-1.5 text-right text-[13px] font-semibold ${valid ? "text-[#14752b]" : "text-[#9a3b00]"}`}>
        {valid ? <BadgeCheck className="h-4 w-4" aria-hidden="true" /> : <AlertTriangle className="h-4 w-4" aria-hidden="true" />}
        {value}
      </span>
    </div>
  );
}

function AuditRow({ event }: { event: AuditEvent }) {
  const eventTone = event.type.includes("REJECTED") || event.type.includes("BLOCKED") ? "bg-[#ff64c8]" : event.type.includes("APPROVAL") ? "bg-[#dd5b00]" : event.type.includes("PURCHASED") || event.type.includes("CONFIRMED") ? "bg-[#1aae39]" : "bg-[#0075de]";
  return (
    <li className="relative pl-7">
      <span aria-hidden="true" className={`absolute left-0 top-1.5 h-3 w-3 rounded-full border-[3px] border-white ${eventTone}`} />
      <p className="text-[13px] font-medium leading-5 text-[#31302e]">{event.summary}</p>
      {event.detail && <p className="mt-0.5 text-[12px] leading-4 text-[#615d59]">{event.detail}</p>}
      <p className="mt-1 text-[11px] font-medium text-[#a39e98]">{event.actor} · {new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(new Date(event.timestamp))}</p>
    </li>
  );
}

function ItemPreview({ item, onChange }: { item: (typeof goldenItems)[number]; onChange: (next: (typeof goldenItems)[number]) => void }) {
  const label = item.name === "External monitor" ? "Monitor" : item.name;
  return (
    <article className="rounded-xl border border-[#e6e6e6] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,.02),0_6px_18px_rgba(0,0,0,.035)]">
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-9 w-9 place-items-center rounded-lg text-[13px] font-bold ${itemAccent[item.id]}`}>{item.quantity}</span>
        <span className="rounded-full bg-[#f6f5f4] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#615d59]">{item.id}</span>
      </div>
      <h3 className="mt-5 text-[20px] font-bold tracking-[-0.35px] text-black">{label}</h3>
      <p className="mt-1.5 text-[13px] leading-5 text-[#615d59]">{item.requiredSpecs.join(" · ")}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#e6e6e6] pt-4 text-[12px]">
        <label className="block text-[#a39e98]">Quantity<input aria-label={`${item.name} quantity`} type="number" min="1" value={item.quantity} onChange={(event) => onChange({ ...item, quantity: Math.max(1, Number(event.target.value) || 1) })} className="mt-1 block w-full rounded border border-[#ddd] bg-white px-2 py-1.5 font-bold tabular-nums text-[#31302e] outline-none ring-[#0075de] focus:ring-2" /></label>
        <label className="block text-[#a39e98]">Authority / unit<input aria-label={`${item.name} authority limit`} type="number" min="1" value={item.authorizationLimit} onChange={(event) => onChange({ ...item, authorizationLimit: Math.max(1, Number(event.target.value) || 1) })} className="mt-1 block w-full rounded border border-[#ddd] bg-white px-2 py-1.5 font-bold tabular-nums text-[#31302e] outline-none ring-[#0075de] focus:ring-2" /></label>
        <label className="col-span-2 block text-[#a39e98]">Delivery deadline<input aria-label={`${item.name} delivery deadline`} type="number" min="1" value={item.deliveryDays} onChange={(event) => onChange({ ...item, deliveryDays: Math.max(1, Number(event.target.value) || 1) })} className="mt-1 block w-full rounded border border-[#ddd] bg-white px-2 py-1.5 font-bold text-[#31302e] outline-none ring-[#0075de] focus:ring-2" /></label>
      </div>
    </article>
  );
}

function Workspace({ session, setSession, onReset }: { session: ProcurementSession; setSession: (next: ProcurementSession) => void; onReset: () => void }) {
  const [activeItemId, setActiveItemId] = useState("monitors");
  const [auditFilter, setAuditFilter] = useState<"all" | "attention" | "purchases">("all");
  const active = session.itemStates.find((state) => state.item.id === activeItemId) ?? session.itemStates[0];
  const recommendation = active.recommendation;
  const selected = recommendation.selected;
  const filteredAudit = useMemo(() => {
    if (auditFilter === "attention") return session.audit.filter((event) => event.type.includes("APPROVAL") || event.type.includes("BLOCKED") || event.type.includes("TERMS"));
    if (auditFilter === "purchases") return session.audit.filter((event) => event.type.includes("PURCHASE") || event.type.includes("CONFIRMED") || event.type.includes("AUTHORIZED"));
    return session.audit;
  }, [auditFilter, session.audit]);

  const resetToVariant = (variant: DemoVariant) => {
    setSession(runDemo(variant));
    setActiveItemId(variant === "no-match" ? "monitors" : "stands");
  };

  return (
    <section className="pb-12 pt-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0075de]">Procurement batch / Q3 onboarding</p>
          <h1 className="mt-1 text-[32px] font-bold tracking-[-1px] text-black">One batch. Three policy outcomes.</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#1aae39]/25 bg-[#effaf1] px-3 py-1.5 text-[12px] font-semibold text-[#14752b]"><span className="h-1.5 w-1.5 rounded-full bg-[#1aae39]" />Offline Demo Mode</span>
          <button onClick={onReset} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#e6e6e6] bg-white px-3.5 text-[13px] font-semibold text-[#31302e] transition hover:border-[#a39e98] active:scale-[.97]"><RefreshCw className="h-4 w-4" />Reset session</button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[230px_minmax(0,1fr)_310px]">
        <aside className="rounded-xl border border-[#e6e6e6] bg-white p-3 shadow-[0_1px_1px_rgba(0,0,0,.02),0_6px_18px_rgba(0,0,0,.025)]">
          <div className="px-2 pb-3 pt-2"><p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#615d59]">Batch items</p><p className="mt-1 text-[12px] text-[#a39e98]">8 new joiners</p></div>
          <div className="space-y-1.5">
            {session.itemStates.map((state) => {
              const current = state.item.id === activeItemId;
              return <button key={state.item.id} onClick={() => setActiveItemId(state.item.id)} className={`w-full rounded-lg border p-3 text-left transition active:scale-[.98] ${current ? "border-[#0075de]/35 bg-[#edf6ff]" : "border-transparent hover:bg-[#f6f5f4]"}`}>
                <div className="flex items-center gap-2.5"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md text-[12px] font-bold ${itemAccent[state.item.id]}`}>{state.item.quantity}</span><span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-bold text-[#31302e]">{state.item.name}</span><span className="mt-1 block"><StatusBadge status={state.status} /></span></span></div>
              </button>;
            })}
          </div>
          <div className="mx-2 mt-4 border-t border-[#e6e6e6] pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#615d59]">Demo controls</p>
            <button onClick={() => resetToVariant("vendor-unavailable")} className="mt-2 flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-[12px] font-semibold text-[#31302e] hover:bg-[#f6f5f4]"><span>Simulate vendor unavailable</span><ChevronRight className="h-3.5 w-3.5" /></button>
            <button onClick={() => resetToVariant("no-match")} className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-[12px] font-semibold text-[#31302e] hover:bg-[#f6f5f4]"><span>Simulate no compliant match</span><ChevronRight className="h-3.5 w-3.5" /></button>
            <button onClick={() => resetToVariant("changed-terms")} className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-[12px] font-semibold text-[#31302e] hover:bg-[#f6f5f4]"><span>Simulate changed vendor terms</span><ChevronRight className="h-3.5 w-3.5" /></button>
            {session.variant !== "golden" && <button onClick={() => resetToVariant("golden")} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-[#f6f5f4] px-2 py-2 text-[12px] font-semibold text-[#005bab]"><RefreshCw className="h-3.5 w-3.5" />Restore golden path</button>}
          </div>
        </aside>

        <main className="min-w-0 space-y-5">
          <section className="rounded-xl border border-[#e6e6e6] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,.02),0_6px_18px_rgba(0,0,0,.025)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3"><span className={`grid h-11 w-11 place-items-center rounded-lg text-[15px] font-bold ${itemAccent[active.item.id]}`}>{active.item.quantity}</span><div><p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#615d59]">Active decision</p><h2 className="mt-0.5 text-[26px] font-bold tracking-[-0.6px] text-black">{active.item.name}</h2></div></div>
              <StatusBadge status={active.status} />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_220px]">
              <div>
                <p className="text-[13px] leading-5 text-[#615d59]">{recommendation.reason}</p>
                {selected ? <div className="mt-5 overflow-hidden rounded-xl border border-[#e6e6e6] bg-[#fdfdfc]"><div className="flex items-center justify-between gap-3 border-b border-[#e6e6e6] bg-[#f6f5f4] px-5 py-2.5"><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#615d59]">Vendor ticket · normalized evidence</p><span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#005bab]">Score {selected.score}/100</span></div><div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0075de]">Recommended source</p><h3 className="mt-1 text-[20px] font-bold tracking-[-0.3px] text-black">{selected.offer.product}</h3><p className="mt-1 text-[13px] text-[#615d59]">{selected.offer.vendor} · {selected.offer.sellerRating}/5 seller reliability</p></div><p className="text-[24px] font-bold tracking-[-0.6px] tabular-nums text-black">{rupees(selected.offer.unitPrice)}<span className="ml-1 text-[12px] font-medium text-[#615d59]">/ unit</span></p></div>
                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#e6e6e6] pt-4 sm:grid-cols-4"><div><p className="text-[11px] text-[#a39e98]">Quantity</p><p className="mt-1 text-[13px] font-bold text-[#31302e]">{active.item.quantity} units</p></div><div><p className="text-[11px] text-[#a39e98]">Delivery</p><p className="mt-1 text-[13px] font-bold text-[#31302e]">{selected.offer.deliveryDays} days</p></div><div><p className="text-[11px] text-[#a39e98]">Return</p><p className="mt-1 text-[13px] font-bold text-[#31302e]">{selected.offer.returnDays} days</p></div><div><p className="text-[11px] text-[#a39e98]">Total</p><p className="mt-1 text-[13px] font-bold tabular-nums text-[#31302e]">{rupees(selected.offer.unitPrice * active.item.quantity)}</p></div></div>
                </div></div> : <div className="mt-5 rounded-xl border border-dashed border-[#a39e98]/45 bg-[#f6f5f4] p-5"><p className="text-[14px] font-bold text-[#31302e]">No eligible offer is available.</p><p className="mt-1 text-[13px] leading-5 text-[#615d59]">The agent will not silently relax a delivery, specification, availability, or return-policy requirement.</p></div>}
              </div>
              <div className="rounded-lg bg-[#f6f5f4] p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#615d59]">Policy tape</p><div className="mt-2"><PolicyTape label="Quantity" value={`${active.item.quantity} units requested`} /><PolicyTape label="Deadline" value={`≤ ${active.item.deliveryDays} days`} /><PolicyTape label="Authority" value={selected ? `${rupees(active.item.authorizationLimit)} / unit` : "No selected offer"} valid={active.status !== "PENDING_APPROVAL"} /></div></div>
            </div>
          </section>

          {active.status === "PENDING_APPROVAL" && selected && <section className="overflow-hidden rounded-xl border border-[#dd5b00]/35 bg-white shadow-[0_1px_1px_rgba(0,0,0,.02),0_8px_22px_rgba(0,0,0,.035)]">
            <div className="border-b border-[#dd5b00]/20 bg-[#fff5ed] px-6 py-4"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-[#dd5b00]" /><p className="text-[12px] font-bold uppercase tracking-[0.07em] text-[#9a3b00]">Human authorization boundary</p></div><h3 className="mt-1 text-[21px] font-bold tracking-[-0.35px] text-black">This recommendation needs an explicit exception.</h3></div>
            <div className="grid gap-5 p-6 md:grid-cols-[1fr_210px]"><div><p className="text-[14px] leading-6 text-[#31302e]">{selected.offer.vendor} meets the required QHD, HDMI, delivery, quantity, and availability constraints. Its unit price is <strong>{rupees(selected.offer.unitPrice)}</strong>, which is <strong>{rupees(selected.offer.unitPrice - active.item.authorizationLimit)}</strong> above the agent’s authority.</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-[#f6f5f4] px-3 py-1.5 text-[12px] font-semibold text-[#31302e]">{selected.offer.deliveryDays}-day delivery</span><span className="rounded-full bg-[#f6f5f4] px-3 py-1.5 text-[12px] font-semibold text-[#31302e]">{selected.offer.sellerRating}/5 reliability</span><span className="rounded-full bg-[#f6f5f4] px-3 py-1.5 text-[12px] font-semibold text-[#31302e]">{selected.offer.returnDays}-day return</span></div></div><div className="rounded-lg border border-[#e6e6e6] bg-[#fdfdfc] p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#615d59]">Exception impact</p><p className="mt-2 text-[23px] font-bold tracking-[-0.6px] tabular-nums text-[#9a3b00]">+{rupees(selected.offer.unitPrice - active.item.authorizationLimit)}</p><p className="text-[12px] text-[#615d59]">per unit · +{rupees((selected.offer.unitPrice - active.item.authorizationLimit) * active.item.quantity)} batch impact</p></div></div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-[#e6e6e6] bg-[#fdfdfc] px-6 py-4"><button onClick={() => setSession(resolveApproval(session, active.item.id, false))} className="min-h-10 rounded-lg border border-[#e6e6e6] bg-white px-4 text-[13px] font-semibold text-[#31302e] transition hover:border-[#a39e98] active:scale-[.97]">Reject exception</button><button onClick={() => setSession(resolveApproval(session, active.item.id, true))} className="min-h-10 rounded-full bg-[#0075de] px-4 text-[13px] font-semibold text-white shadow-[0_5px_13px_rgba(0,117,222,.18)] transition hover:bg-[#005bab] active:scale-[.97]">Approve exception</button></div>
          </section>}

          {active.status === "PURCHASED" && active.order && <section className="rounded-xl border border-[#1aae39]/30 bg-[#effaf1] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#1aae39] text-white"><BadgeCheck className="h-5 w-5" /></span><div><p className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#14752b]">Simulated purchase — no real payment</p><h3 className="mt-1 text-[18px] font-bold tracking-[-0.25px] text-black">Order {active.order.id} recorded</h3><p className="mt-1 text-[13px] text-[#31603a]">Final terms were re-checked with {active.order.vendor}. Delivery is expected in {active.order.deliveryDays} days.</p></div></div><p className="text-[15px] font-bold tabular-nums text-[#14752b]">{rupees(active.order.total)}</p></div></section>}

          <section className="rounded-xl border border-[#e6e6e6] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,.02),0_6px_18px_rgba(0,0,0,.025)]"><div className="flex items-center justify-between gap-3"><div><p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#615d59]">Offer evidence</p><h3 className="mt-1 text-[20px] font-bold tracking-[-0.35px] text-black">Four criteria. No hidden trade-off.</h3></div><Filter className="h-4 w-4 text-[#a39e98]" /></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[680px] border-collapse text-left"><thead><tr className="border-y border-[#e6e6e6] text-[11px] font-semibold uppercase tracking-[0.06em] text-[#615d59]"><th className="px-2 py-3">Offer</th><th className="px-2 py-3">Price</th><th className="px-2 py-3">Spec fit</th><th className="px-2 py-3">Delivery</th><th className="px-2 py-3">Reliability</th><th className="px-2 py-3">Return</th><th className="px-2 py-3">Outcome</th></tr></thead><tbody>{recommendation.candidates.map((candidate) => <tr key={candidate.offer.id} className={`border-b border-[#e6e6e6] text-[13px] ${candidate.offer.id === selected?.offer.id ? "bg-[#edf6ff]/55" : ""}`}><td className="px-2 py-3.5"><p className="font-bold text-[#31302e]">{candidate.offer.product}</p><p className="mt-0.5 text-[11px] text-[#a39e98]">{candidate.offer.vendor}</p></td><td className="px-2 py-3.5 font-semibold tabular-nums text-[#31302e]">{rupees(candidate.offer.unitPrice)}</td><td className="px-2 py-3.5 text-[#31302e]">{candidate.scoreBreakdown.specifications}/30</td><td className="px-2 py-3.5 text-[#31302e]">{candidate.offer.deliveryDays} days</td><td className="px-2 py-3.5 text-[#31302e]">{candidate.offer.sellerRating}/5</td><td className="px-2 py-3.5 text-[#31302e]">{candidate.offer.returnDays} days</td><td className="px-2 py-3.5"><span className={`text-[12px] font-semibold ${candidate.eligible ? candidate.requiresApproval ? "text-[#9a3b00]" : "text-[#14752b]" : "text-[#a39e98]"}`}>{candidate.eligible ? candidate.requiresApproval ? "Approval required" : "Eligible" : candidate.hardFailures[0]}</span></td></tr>)}</tbody></table></div></section>
        </main>

        <aside className="rounded-xl border border-[#e6e6e6] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,.02),0_6px_18px_rgba(0,0,0,.025)]"><div className="flex items-start justify-between gap-3"><div><p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#615d59]">Evidence thread</p><h2 className="mt-1 text-[20px] font-bold tracking-[-0.35px] text-black">Audit log</h2></div><img className="h-10 w-10 rounded-lg border border-[#e6e6e6]" src={EVIDENCE_TILE} alt="" /></div><label className="mt-4 block text-[11px] font-semibold uppercase tracking-[0.06em] text-[#615d59]" htmlFor="audit-filter">Show events</label><select id="audit-filter" value={auditFilter} onChange={(event) => setAuditFilter(event.target.value as typeof auditFilter)} className="mt-1.5 min-h-10 w-full rounded border border-[#ddd] bg-white px-2.5 text-[13px] text-[#31302e] outline-none ring-[#0075de] focus:ring-2"><option value="all">All material events</option><option value="attention">Approvals and blocks</option><option value="purchases">Policy and purchases</option></select><ol className="mt-5 max-h-[630px] space-y-5 overflow-y-auto border-l border-[#e6e6e6] pl-0.5 pr-2">{filteredAudit.map((event) => <AuditRow key={event.id} event={event} />)}</ol></aside>
      </div>
    </section>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("workspace");
  const [brief, setBrief] = useState(goldenBrief);
  const [items, setItems] = useState(() => goldenItems.map((item) => ({ ...item, requiredSpecs: [...item.requiredSpecs] })));
  const [briefNotice, setBriefNotice] = useState<string | null>(null);
  const [session, setSession] = useState<ProcurementSession | null>(() => runDemo());

  const begin = () => {
    if (!/buy|purchase|chair|monitor|stand/i.test(brief)) {
      setBriefNotice("This demo is scoped to a procurement request. Describe an item, quantity, constraint, and delivery need—or load the validated golden scenario.");
      return;
    }
    setBriefNotice(null);
    setView("review");
  };
  const startProcurement = () => {
    setSession(runDemo("golden", items));
    setView("workspace");
  };
  const reset = () => {
    setSession(null);
    setBrief(goldenBrief);
    setItems(goldenItems.map((item) => ({ ...item, requiredSpecs: [...item.requiredSpecs] })));
    setBriefNotice(null);
    setView("intake");
  };

  return (
    <div className="min-h-screen bg-[#f6f5f4] text-[#31302e]">
      <header className="sticky top-0 z-30 border-b border-[#e6e6e6] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-[1360px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={reset} className="flex items-center gap-2.5 text-left"><img src={BRAND_MARK} alt="SpecSathi" className="h-10 w-10" /><span><span className="block text-[18px] font-bold tracking-[-0.65px] text-black">Spec<span className="text-[#0075de]">Sathi</span></span><span className="mt-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#615d59]"><i aria-hidden="true" className="h-px w-3 bg-[#0075de]" />Procure</span></span></button>
          <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex"><button onClick={() => setView(session ? "workspace" : "intake")} className="rounded-md px-3 py-2 text-[13px] font-semibold text-[#31302e] hover:bg-[#f6f5f4]">Workspace</button><button onClick={() => session && setView("workspace")} className="rounded-md px-3 py-2 text-[13px] font-semibold text-[#31302e] hover:bg-[#f6f5f4]">Policy</button><button onClick={() => session && setView("workspace")} className="rounded-md px-3 py-2 text-[13px] font-semibold text-[#31302e] hover:bg-[#f6f5f4]">Audit</button></nav>
          <div className="flex items-center gap-2"><span className="hidden items-center gap-2 rounded-full border border-[#1aae39]/25 bg-[#effaf1] px-3 py-1.5 text-[12px] font-semibold text-[#14752b] sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-[#1aae39]" />Demo mode</span><button onClick={reset} className="hidden min-h-10 rounded-lg border border-[#e6e6e6] bg-white px-3 text-[13px] font-semibold text-[#31302e] hover:border-[#a39e98] sm:inline-flex sm:items-center">New brief</button><button className="grid h-10 w-10 place-items-center rounded-lg border border-[#e6e6e6] bg-white md:hidden" aria-label="Open navigation"><Menu className="h-4 w-4" /></button></div>
        </div>
      </header>

      {view !== "workspace" && <>
        <section className="relative overflow-hidden bg-[#213183] text-white"><div className="mx-auto grid min-h-[220px] max-w-[1360px] items-center px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_410px] lg:px-8"><div className="relative z-10 max-w-[700px]"><span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[#0075de]"><ShieldCheck className="h-3.5 w-3.5" />Policy-controlled procurement</span><h1 className="mt-4 text-[36px] font-bold leading-[.98] tracking-[-1.4px] sm:text-[46px]">Buy within policy.<br />Pause at the boundary.</h1><p className="mt-3 max-w-[580px] text-[14px] leading-5 text-white/75">SpecSathi compares local vendor evidence, acts only within authority, and leaves a readable trail behind every simulated purchase.</p></div><img src={NIGHT_DESK} alt="Decorative procurement desk stickers" className="pointer-events-none absolute right-0 top-0 h-full w-full object-cover object-right opacity-95 lg:relative lg:h-auto lg:w-full" /></div></section>
        <main className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          {view === "intake" && <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="rounded-xl border border-[#e6e6e6] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,.02),0_8px_20px_rgba(0,0,0,.035)] sm:p-8"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[#d6b6f6] text-[#391c57]"><FileText className="h-5 w-5" /></span><div><p className="text-[12px] font-semibold uppercase tracking-[0.07em] text-[#0075de]">Buying brief</p><h2 className="mt-1 text-[28px] font-bold tracking-[-0.7px] text-black">What does the team need?</h2></div></div><label htmlFor="brief" className="mt-7 block text-[13px] font-semibold text-[#31302e]">Procurement request</label><textarea id="brief" value={brief} onChange={(event) => setBrief(event.target.value)} className="mt-2 min-h-40 w-full resize-y rounded border border-[#ddd] bg-white p-3 text-[14px] leading-6 text-[#31302e] outline-none ring-[#0075de] placeholder:text-[#a39e98] focus:ring-2" />{briefNotice && <p role="status" className="mt-3 rounded-lg border border-[#dd5b00]/25 bg-[#fff5ed] px-3 py-2 text-[12px] font-medium leading-5 text-[#9a3b00]">{briefNotice}</p>}<div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="inline-flex items-center gap-2 text-[12px] leading-5 text-[#615d59]"><ShieldCheck className="h-4 w-4 text-[#1aae39]" />No API key or connection is needed for the demo path.</p><div className="flex flex-wrap gap-2"><button onClick={() => { setBrief(goldenBrief); setItems(goldenItems.map((item) => ({ ...item, requiredSpecs: [...item.requiredSpecs] }))); setBriefNotice(null); }} className="min-h-10 rounded-lg border border-[#e6e6e6] bg-white px-4 text-[13px] font-semibold text-[#31302e] transition hover:border-[#a39e98] active:scale-[.97]">Load golden scenario</button><button onClick={begin} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#0075de] px-4 text-[13px] font-semibold text-white shadow-[0_5px_13px_rgba(0,117,222,.18)] transition hover:bg-[#005bab] active:scale-[.97]">Review constraints <ArrowRight className="h-4 w-4" /></button></div></div></div><aside className="rounded-xl border border-[#e6e6e6] bg-white p-6"><p className="text-[12px] font-semibold uppercase tracking-[0.07em] text-[#615d59]">What the agent proves</p><div className="mt-5 space-y-5">{[[Search, "Two vendor sources", "Vendor A and Vendor B are normalized into the same decision record."], [ShieldCheck, "Authorization enforced", "The agent acts automatically only within the stated unit limit."], [FileClock, "Evidence retained", "Every major decision appears in the audit thread."]].map(([Icon, title, copy]) => { const Symbol = Icon as typeof Search; return <div key={title as string} className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#f6f5f4] text-[#0075de]"><Symbol className="h-4 w-4" /></span><div><h3 className="text-[14px] font-bold text-[#31302e]">{title as string}</h3><p className="mt-1 text-[12px] leading-5 text-[#615d59]">{copy as string}</p></div></div>; })}</div><div className="mt-7 border-t border-[#e6e6e6] pt-5"><p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#a39e98]">Simulation notice</p><p className="mt-2 text-[13px] font-semibold leading-5 text-[#31302e]">SIMULATED PURCHASE — NO REAL PAYMENT</p></div></aside></section>}

          {view === "review" && <section><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[12px] font-semibold uppercase tracking-[0.07em] text-[#0075de]">Step 1 of 3 / confirm constraints</p><h2 className="mt-1 text-[34px] font-bold tracking-[-1px] text-black">The agent heard three buying jobs.</h2><p className="mt-2 max-w-[640px] text-[14px] leading-6 text-[#615d59]">These editable fields are the policy record for the next action. The offline demo uses a validated deterministic scenario, then re-evaluates every offer against your changes.</p></div><button onClick={() => setView("intake")} className="min-h-10 rounded-lg border border-[#e6e6e6] bg-white px-4 text-[13px] font-semibold text-[#31302e] hover:border-[#a39e98]">Edit brief</button></div><div className="mt-7 grid gap-5 md:grid-cols-3">{items.map((item) => <ItemPreview key={item.id} item={item} onChange={(next) => setItems((current) => current.map((entry) => entry.id === next.id ? next : entry))} />)}</div><div className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e6e6e6] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,.02),0_8px_20px_rgba(0,0,0,.025)]"><p className="text-[13px] leading-5 text-[#615d59]"><strong className="text-[#31302e]">Authorization rule:</strong> comply with hard constraints first; request human approval whenever the best eligible offer exceeds the unit authority.</p><button onClick={startProcurement} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0075de] px-5 text-[14px] font-semibold text-white shadow-[0_5px_13px_rgba(0,117,222,.18)] transition hover:bg-[#005bab] active:scale-[.97]">Start procurement <ArrowRight className="h-4 w-4" /></button></div></section>}
        </main>
      </>}

      {view === "workspace" && session && <main className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8"><Workspace session={session} setSession={setSession} onReset={reset} /></main>}

      <footer className="border-t border-[#e6e6e6] bg-[#f6f5f4]"><div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 px-4 py-7 text-[12px] text-[#615d59] sm:px-6 lg:px-8"><p>SpecSathi Procure · Offline-first autonomy with human oversight.</p><p className="inline-flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-[#0075de]" />Local demo data · Simulated vendors · No real payment</p></div></footer>
    </div>
  );
}
