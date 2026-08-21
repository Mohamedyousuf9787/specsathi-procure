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
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  type AuditEvent,
  type DemoVariant,
  type ProcurementItemState,
  type ProcurementSession,
  goldenItems,
  recordFinanceHandoff,
  resolveApproval,
  rupees,
  runDemo,
} from "@/domain/procurement";
import GenericProcurementWorkspace, { type LiveEvidenceState } from "@/components/GenericProcurementWorkspace";
import EditableRequirementReview, { buildPolicyAgreementStatement, type PolicyAgreement } from "@/components/EditableRequirementReview";
import { parseBuyingBrief, type ValidationResult } from "@/domain/brief-parser";
import { furnitureDemoBrief, laptopDemoBrief, mobileDemoBrief, tyreDemoBrief, type BuyingBrief } from "@/domain/generic-procurement";
import { recordMarketplaceSearchOutcome, runGenericProcurement, runUnavailableTopVendorScenario, type GenericProcurementSession } from "@/domain/generic-vendor-flow";
import { resolveLaptopChallengeFallback } from "@/domain/laptop-challenge-templates";
import { resolveProductSearchFailure, resolveProductSearchSuccess } from "@/domain/product-search-outcome";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getExplicitFullVerificationRequest, getInitialProductSearchState, type ProductListing, type ProductListingViewState } from "@/components/ProductListingsPanel";
import { buildFinanceHandoff, getFinanceHandoffFilename, serializeFinanceHandoffCsv, serializeFinanceHandoffJson } from "@/domain/finance-handoff";

const BRAND_MARK = "/manus-storage/specsathi-mark_01ab55be.png";
const NIGHT_DESK = "/manus-storage/specsathi-night-desk_d321b227.png";
const EVIDENCE_TILE = "/manus-storage/specsathi-evidence-tile_76cfabb8.png";
type ProductListingState = ProductListingViewState;
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

function downloadLocalExport(filename: string, content: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function FinanceHandoffCard({ session, onSessionChange }: { session: ProcurementSession; onSessionChange: (next: ProcurementSession) => void }) {
  const handoff = useMemo(() => buildFinanceHandoff(session), [session]);
  const sent = session.audit.some((event) => event.type === "FINANCE_HANDOFF_SENT");
  return <section className="rounded-xl border border-[#0075de]/25 bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,.02),0_6px_18px_rgba(0,0,0,.025)]"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#005bab]">Finance handoff</p><h3 className="mt-1 text-[19px] font-bold tracking-[-0.3px] text-black">One batch. One auditable package.</h3><p className="mt-1 max-w-[560px] text-[12px] leading-5 text-[#615d59]">Exports carry the multi-item decision record only. They do not create a payment, a purchase instruction, or a vendor commitment.</p></div><p className="text-[17px] font-bold tabular-nums text-[#31302e]">{rupees(handoff.totalInr)}</p></div><div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-[#e6e6e6] bg-[#e6e6e6] text-center text-[11px]"><div className="bg-white p-3"><p className="text-[#a39e98]">Items</p><p className="mt-1 font-bold text-[#31302e]">{handoff.lines.length}</p></div><div className="bg-white p-3"><p className="text-[#a39e98]">Audit events</p><p className="mt-1 font-bold text-[#31302e]">{handoff.auditEventCount}</p></div><div className="bg-white p-3"><p className="text-[#a39e98]">Handoff</p><p className={`mt-1 font-bold ${sent ? "text-[#14752b]" : "text-[#005bab]"}`}>{sent ? "Recorded" : "Draft"}</p></div></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => onSessionChange(recordFinanceHandoff(session))} disabled={sent} className="min-h-9 rounded-full bg-[#0075de] px-3.5 text-[12px] font-semibold text-white disabled:cursor-default disabled:opacity-65">{sent ? "Finance handoff recorded" : "Record simulated handoff"}</button><button onClick={() => downloadLocalExport(getFinanceHandoffFilename(handoff, "json"), serializeFinanceHandoffJson(handoff), "application/json")} className="min-h-9 rounded-md border border-[#e6e6e6] bg-white px-3 text-[12px] font-semibold text-[#31302e]">Export JSON</button><button onClick={() => downloadLocalExport(getFinanceHandoffFilename(handoff, "csv"), serializeFinanceHandoffCsv(handoff), "text/csv")} className="min-h-9 rounded-md border border-[#e6e6e6] bg-white px-3 text-[12px] font-semibold text-[#31302e]">Export CSV</button></div></section>;
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

          <FinanceHandoffCard session={session} onSessionChange={setSession} />

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

function LegacyHome() {
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

/**
 * Calm operational paper: the category-agnostic buying brief is the primary entry point.
 * Laptop and multi-item buttons are reliable demos, not product-category tabs.
 */
export default function Home() {
  const [view, setView] = useState<"intake" | "review" | "editable-review" | "generic-workspace" | "legacy-workspace">("intake");
  const [brief, setBrief] = useState("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [genericSession, setGenericSession] = useState<GenericProcurementSession | null>(null);
  const [legacySession, setLegacySession] = useState<ProcurementSession | null>(null);
  const [useSecureNlp, setUseSecureNlp] = useState(false);
  const [nlpFailure, setNlpFailure] = useState<string | null>(null);
  const [liveEvidence, setLiveEvidence] = useState<LiveEvidenceState>({ status: "idle", results: [] });
  const [productListings, setProductListings] = useState<ProductListingState>({ status: "idle", listings: [] });
  const { user: authenticatedUser } = useAuth();
  const [auditPersistence, setAuditPersistence] = useState<"local" | "saving" | "persisted" | "unavailable">("local");
  const persistedAuditKeys = useRef(new Set<string>());
  const lastConfirmedBriefRef = useRef<BuyingBrief | null>(null);
  const liveSearch = trpc.liveSearch.searchEvidence.useMutation({ onSuccess: (result) => setLiveEvidence({ status: result.status, message: result.message, results: result.results }), onError: () => setLiveEvidence({ status: "fallback", message: "Live search could not be reached. Local Vendor A and Vendor B remain active.", results: [] }) });
  const specificationSearch = trpc.specifications.enrich.useMutation({
    onSuccess: (result) => setProductListings(current => ({ ...current, listings: current.listings.map(listing => {
      const enriched = result.results.find(item => item.id === listing.id);
      return enriched ? { ...listing, specificationStatus: enriched.status, specificationSource: "page", specificationProfile: enriched.profile, specifications: enriched.specifications } : listing;
    }) })),
    onError: (_error, variables) => setProductListings(current => ({ ...current, listings: current.listings.map(listing => variables.products.some(product => product.id === listing.id) ? { ...listing, specificationStatus: "unavailable" } : listing) })),
  });
  const productSearch = trpc.products.search.useMutation({
    onSuccess: (result, variables) => {
      const outcome = resolveProductSearchSuccess(lastConfirmedBriefRef.current, result);
      const initialState = getInitialProductSearchState<ProductListing>(outcome.listings);
      setProductListings({ status: outcome.status, message: outcome.message, listings: initialState.listings });
      setGenericSession(current => !current || current.brief.id !== lastConfirmedBriefRef.current?.id ? current : recordMarketplaceSearchOutcome(current, { status: outcome.status, listingCount: outcome.listings.length, message: outcome.message }));
    },
    onError: () => {
      const outcome = resolveProductSearchFailure(lastConfirmedBriefRef.current);
      const initialState = getInitialProductSearchState<ProductListing>(outcome.listings);
      setProductListings({ status: outcome.status, message: outcome.message, listings: initialState.listings });
      setGenericSession(current => !current || current.brief.id !== lastConfirmedBriefRef.current?.id ? current : recordMarketplaceSearchOutcome(current, { status: outcome.status, listingCount: outcome.listings.length, message: outcome.message }));
    },
  });
  const auditPersistenceMutation = trpc.audit.persistSession.useMutation({ onSuccess: () => setAuditPersistence("persisted"), onError: () => setAuditPersistence("unavailable") });
  useEffect(() => {
    if (!genericSession) {
      setAuditPersistence("local");
      return;
    }
    if (!authenticatedUser) {
      setAuditPersistence("local");
      return;
    }
    const sessionKey = `${genericSession.brief.id}-${genericSession.audit.length}`;
    if (persistedAuditKeys.current.has(sessionKey)) return;
    persistedAuditKeys.current.add(sessionKey);
    setAuditPersistence("saving");
    auditPersistenceMutation.mutate({ sessionKey, events: genericSession.audit.map(({ type, actor, itemId, summary }) => ({ eventType: type, actor, itemId: itemId ?? genericSession.brief.id, summary })) });
  }, [genericSession, authenticatedUser?.id]);
  const applyDeterministicFallback = (text: string, prefix?: string) => {
    const result = parseBuyingBrief(text);
    setValidation({ ...result, warnings: prefix ? [prefix, ...result.warnings] : result.warnings });
    if (result.status === "valid") setView("editable-review");
    else setView("intake");
  };
  const nlpExtraction = trpc.nlp.extractBrief.useMutation({
    onSuccess: (result) => {
      if (result.source !== "gemini" || !result.candidate) {
        setNlpFailure(result.message);
        applyDeterministicFallback(brief, result.message);
        return;
      }
      setNlpFailure(null);
      if (result.issues.length || !result.candidate.quantity) {
        setValidation({ status: "needs_clarification", missingFields: result.issues, conflicts: [], warnings: ["Real NLP extracted the available fields. Complete the missing policy fields before searching."], clarifyingQuestions: result.issues.map((issue) => `Please clarify the ${issue}.`) });
        setView("intake");
        return;
      }
      setValidation({
        status: "valid",
        normalizedBrief: {
          id: `nlp-${result.candidate.productCategory.replace(/\s+/g, "-")}-${result.candidate.quantity}`,
          productCategory: result.candidate.productCategory,
          productDescription: result.candidate.productDescription ?? result.candidate.productCategory,
          quantity: result.candidate.quantity,
          hardRequirements: result.candidate.hardRequirements.map((requirement) => ({ ...requirement, unit: requirement.unit ?? undefined, isHard: true })),
          softPreferences: result.candidate.softPreferences.map((requirement) => ({ ...requirement, unit: requirement.unit ?? undefined, operator: "preferred" as const, isHard: false })),
          maxUnitPriceInr: result.candidate.maxUnitPriceInr ?? undefined,
          maxTotalPriceInr: result.candidate.maxTotalPriceInr ?? undefined,
          deliveryDeadlineDays: result.candidate.deliveryDeadlineDays ?? undefined,
          returnPolicyRequirement: result.candidate.returnPolicyRequirement ?? undefined,
          sellerRequirement: result.candidate.sellerRequirement ?? undefined,
          authorizationLimitInr: result.candidate.maxUnitPriceInr ?? (result.candidate.maxTotalPriceInr ? Math.floor(result.candidate.maxTotalPriceInr / result.candidate.quantity) : undefined),
          sourceText: brief,
          confidence: 0.9,
        },
        missingFields: [], conflicts: [], warnings: ["Structured by secure server-side NLP. Deterministic policy checks still control every subsequent decision."], clarifyingQuestions: [],
      });
      setView("editable-review");
    },
    onError: () => {
      const message = "Real NLP could not be reached. The offline deterministic parser remains active.";
      setNlpFailure(message);
      applyDeterministicFallback(brief, message);
    },
  });

  const newBrief = () => {
    setBrief("");
    setValidation(null);
    setGenericSession(null);
    setNlpFailure(null);
    setLiveEvidence({ status: "idle", results: [] });
    setProductListings({ status: "idle", listings: [] });
    setAuditPersistence("local");
    setView("intake");
  };
  const reviewBrief = () => {
    if (!brief.trim()) {
      applyDeterministicFallback(brief);
      return;
    }
    if (!useSecureNlp) {
      applyDeterministicFallback(brief, "The local deterministic parser was used because secure NLP was not enabled for this request.");
      return;
    }
    nlpExtraction.mutate({ text: brief });
  };
  const loadCuratedDemo = (demoBrief: BuyingBrief) => {
    setBrief(demoBrief.sourceText);
    setValidation({ status: "valid", normalizedBrief: demoBrief, missingFields: [], conflicts: [], warnings: [`Curated deterministic ${demoBrief.productCategory} demo record loaded. You can edit every requirement before search.`], clarifyingQuestions: [] });
    setView("editable-review");
  };
  const loadLaptopDemo = () => loadCuratedDemo(laptopDemoBrief);
  const runLaptopChallengeDemo = async () => {
    const agreement: PolicyAgreement = { statement: `Demonstration policy agreement. ${buildPolicyAgreementStatement(laptopDemoBrief)}`, agreedAt: Date.now() };
    lastConfirmedBriefRef.current = laptopDemoBrief;
    const session = await runGenericProcurement(laptopDemoBrief);
    const fallback = resolveProductSearchFailure(laptopDemoBrief);
    setGenericSession({ ...session, audit: [...session.audit, { id: `challenge-policy-agreement-${agreement.agreedAt}`, type: "POLICY_AGREEMENT", actor: "Requester", itemId: laptopDemoBrief.id, summary: "Demonstration policy agreement recorded before laptop challenge comparison.", detail: agreement.statement, timestamp: new Date(agreement.agreedAt).toISOString() }] });
    setProductListings({ ...fallback, message: "Reliable Vendor A/B laptop challenge demo. These deterministic template cards illustrate the same safe fallback path and are not live marketplace offers." });
    setLiveEvidence({ status: "idle", results: [] });
    setView("generic-workspace");
  };
  const runUnavailableTopVendorDemo = async () => {
    const agreement: PolicyAgreement = { statement: `Demonstration policy agreement. ${buildPolicyAgreementStatement(laptopDemoBrief)}`, agreedAt: Date.now() };
    lastConfirmedBriefRef.current = laptopDemoBrief;
    const scenario = await runUnavailableTopVendorScenario();
    const fallback = resolveProductSearchFailure(laptopDemoBrief);
    setGenericSession({ ...scenario, audit: [...scenario.audit, { id: `unavailable-policy-agreement-${agreement.agreedAt}`, type: "POLICY_AGREEMENT", actor: "Requester", itemId: laptopDemoBrief.id, summary: "Policy agreement recorded before unavailable-top-vendor re-ranking.", detail: agreement.statement, timestamp: new Date(agreement.agreedAt).toISOString() }] });
    setProductListings({ ...fallback, message: "Unavailable-top-vendor challenge demo. Vendor A is retained as unavailable evidence; the deterministic comparison selects the next eligible Vendor B offer. These template cards are not live marketplace offers." });
    setLiveEvidence({ status: "idle", results: [] });
    setView("generic-workspace");
  };
  useEffect(() => {
    const demo = new URLSearchParams(window.location.search).get("demo");
    if (demo === "laptop-challenge") void runLaptopChallengeDemo();
    if (demo === "multi-item") loadMultiDemo();
    if (demo === "tyre") loadCuratedDemo(tyreDemoBrief);
  }, []);
  const loadMultiDemo = () => {
    setLegacySession(runDemo());
    setView("legacy-workspace");
  };
  const startProcurement = async (confirmedBrief = validation?.normalizedBrief, policyAgreement?: PolicyAgreement) => {
    if (!confirmedBrief) return;
    lastConfirmedBriefRef.current = confirmedBrief;
    setValidation(current => current ? { ...current, normalizedBrief: confirmedBrief } : current);
    const session = await runGenericProcurement(confirmedBrief);
    setGenericSession(policyAgreement ? { ...session, audit: [...session.audit, { id: `policy-agreement-${policyAgreement.agreedAt}`, type: "POLICY_AGREEMENT" as const, actor: "Requester", itemId: confirmedBrief.id, summary: "Policy agreement recorded before marketplace comparison.", detail: policyAgreement.statement, timestamp: new Date(policyAgreement.agreedAt).toISOString() }] } : session);
    const query = `${confirmedBrief.productCategory} ${confirmedBrief.hardRequirements.map((requirement) => `${requirement.label} ${String(requirement.value)}`).join(" ")} under ${confirmedBrief.maxUnitPriceInr ?? confirmedBrief.maxTotalPriceInr ?? "market price"} India`;
    setLiveEvidence({ status: "loading", results: [] });
    setProductListings({ status: "loading", listings: [] });
    liveSearch.mutate({ query });
    productSearch.mutate({ query, category: confirmedBrief.productCategory, maxUnitPriceInr: confirmedBrief.maxUnitPriceInr, authorizationLimitInr: confirmedBrief.authorizationLimitInr });
    setView("generic-workspace");
  };
  const verifyFullSpecifications = (listing: ProductListing) => {
    if (!genericSession) return;
    const request = getExplicitFullVerificationRequest(genericSession.brief.productCategory, listing);
    if (!request) return;
    setProductListings(current => ({ ...current, listings: current.listings.map(item => item.id === listing.id ? { ...item, specificationStatus: "loading" } : item) }));
    specificationSearch.mutate(request);
  };
  const normalized = validation?.normalizedBrief;
  return <div className="min-h-screen bg-[#f6f5f4] text-[#31302e]">
    <header className="sticky top-0 z-30 border-b border-[#e6e6e6] bg-white/95 backdrop-blur-md"><div className="mx-auto flex min-h-16 max-w-[1360px] items-center justify-between px-4 sm:px-6 lg:px-8"><button onClick={newBrief} className="flex items-center gap-2.5 text-left"><img src={BRAND_MARK} alt="SpecSathi receipt and approval mark" className="h-11 w-11" /><span><span className="block text-[17px] font-bold tracking-[-0.7px] text-black">Spec<span className="text-[#0075de]">Sathi</span></span><span className="mt-0.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#615d59]"><i aria-hidden="true" className="h-px w-3 bg-[#0075de]" />Procure control</span></span></button><nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex"><button onClick={newBrief} className="rounded-md px-3 py-2 text-[13px] font-semibold text-[#31302e] hover:bg-[#f6f5f4]">New request</button><button onClick={loadLaptopDemo} className="rounded-md px-3 py-2 text-[13px] font-semibold text-[#31302e] hover:bg-[#f6f5f4]">Laptop demo</button><button onClick={loadMultiDemo} className="rounded-md px-3 py-2 text-[13px] font-semibold text-[#31302e] hover:bg-[#f6f5f4]">Multi-item demo</button></nav><div className="flex items-center gap-2"><span className="hidden items-center gap-2 rounded-full border border-[#1aae39]/25 bg-[#effaf1] px-3 py-1.5 text-[12px] font-semibold text-[#14752b] sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-[#1aae39]" />Demo mode</span><button onClick={newBrief} className="hidden min-h-10 rounded-lg border border-[#e6e6e6] bg-white px-3 text-[13px] font-semibold text-[#31302e] hover:border-[#a39e98] sm:inline-flex sm:items-center">New brief</button><button className="grid h-10 w-10 place-items-center rounded-lg border border-[#e6e6e6] bg-white md:hidden" aria-label="Open navigation"><Menu className="h-4 w-4" /></button></div></div></header>
    {(view === "intake" || view === "review") && <><section className="relative overflow-hidden bg-[#213183] text-white"><div className="mx-auto grid min-h-[230px] max-w-[1360px] items-center px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_410px] lg:px-8"><div className="relative z-10 max-w-[720px]"><span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-[#0075de]"><ShieldCheck className="h-3.5 w-3.5" />Autonomous procurement control</span><h1 className="mt-4 text-[38px] font-bold leading-[.98] tracking-[-1.5px] sm:text-[50px]">Record the purchase.<br />Hold the boundary.</h1><p className="mt-3 max-w-[590px] text-[14px] leading-5 text-white/75">SpecSathi normalizes the brief, compares two vendor records, and pauses exactly where authorization requires a human decision.</p></div><div className="relative hidden lg:block"><img src={NIGHT_DESK} alt="Decorative receipt, approval, vendor ticket, and delivery evidence stickers" className="h-auto w-full" /><div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5"><span className="rounded bg-white/95 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-[#213183]">Receipt verified</span><span className="rounded bg-white/95 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-[#213183]">Approval held</span></div></div></div></section><main className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {view === "intake" && <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="rounded-xl border border-[#e6e6e6] bg-white p-6 shadow-[0_1px_1px_rgba(0,0,0,.02),0_8px_20px_rgba(0,0,0,.035)] sm:p-8"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[#d6b6f6] text-[#391c57]"><FileText className="h-5 w-5" /></span><div><p className="text-[12px] font-semibold uppercase tracking-[0.07em] text-[#0075de]">Procurement control record</p><h2 className="mt-1 text-[28px] font-bold tracking-[-0.7px] text-black">Name the online purchase.</h2></div></div><label htmlFor="generic-brief" className="mt-7 block text-[13px] font-semibold text-[#31302e]">Buying brief</label><textarea id="generic-brief" value={brief} onChange={(event) => { setBrief(event.target.value); setValidation(null); setNlpFailure(null); }} placeholder="Purchase 10 laptops with 16 GB RAM and 512 GB SSD under ₹45,000 each within 5 days." className="mt-2 min-h-40 w-full resize-y rounded border border-[#ddd] bg-white p-3 text-[14px] leading-6 text-[#31302e] outline-none ring-[#0075de] placeholder:text-[#a39e98] focus:ring-2" /><label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg border border-[#e6e6e6] bg-[#fdfdfc] p-3 text-[12px] leading-5 text-[#615d59]"><input type="checkbox" checked={useSecureNlp} onChange={(event) => setUseSecureNlp(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0075de]" /><span><strong className="text-[#31302e]">Use secure NLP for this brief.</strong> I understand this request is sent to the server-side extraction service. The local deterministic parser remains available if I leave this unchecked or the service fails.</span></label><div className="mt-3 grid gap-px border-y border-[#e6e6e6] py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#615d59] sm:grid-cols-3"><span className="py-1">01 · Record constraints</span><span className="py-1">02 · Compare evidence</span><span className="py-1">03 · Hold exceptions</span></div>{nlpExtraction.isPending && <p role="status" className="mt-3 inline-flex items-center gap-2 text-[12px] font-semibold text-[#005bab]"><Sparkles className="h-4 w-4 animate-pulse" />Secure NLP is structuring the buying brief.</p>}{nlpFailure && <div role="status" className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#dd5b00]/25 bg-[#fff5ed] p-3 text-[12px] leading-5 text-[#9a3b00]"><span>{nlpFailure}</span>{useSecureNlp && <button onClick={() => nlpExtraction.mutate({ text: brief })} className="rounded-md border border-[#dd5b00]/25 bg-white px-2.5 py-1.5 font-semibold text-[#9a3b00]">Retry secure NLP</button>}</div>}{validation && validation.status !== "valid" && <div role="status" className="mt-3 rounded-lg border border-[#dd5b00]/25 bg-[#fff5ed] p-3 text-[12px] leading-5 text-[#9a3b00]"><p className="font-bold">{validation.status === "invalid" ? "The control record needs correction before a safe search." : "A concise clarification is needed before a safe search."}</p><p className="mt-1">{validation.conflicts[0]?.message ?? validation.clarifyingQuestions[0]}</p></div>}<div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="inline-flex items-center gap-2 text-[12px] leading-5 text-[#615d59]"><ShieldCheck className="h-4 w-4 text-[#1aae39]" />Secure NLP with consent; deterministic local fallback always remains.</p><div className="flex flex-wrap gap-2"><button onClick={loadLaptopDemo} className="min-h-10 rounded-lg border border-[#e6e6e6] bg-white px-4 text-[13px] font-semibold text-[#31302e] transition hover:border-[#a39e98] active:scale-[.97]">Load live laptop demo</button><button onClick={() => void runLaptopChallengeDemo()} className="min-h-10 rounded-lg border border-[#005bab]/25 bg-[#edf6ff] px-4 text-[13px] font-semibold text-[#005bab] transition hover:border-[#005bab] active:scale-[.97]">Run Vendor A/B challenge</button><button onClick={loadMultiDemo} className="min-h-10 rounded-lg border border-[#e6e6e6] bg-white px-4 text-[13px] font-semibold text-[#31302e] transition hover:border-[#a39e98] active:scale-[.97]">Load multi-item demo</button><button disabled={nlpExtraction.isPending} onClick={reviewBrief} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#0075de] px-4 text-[13px] font-semibold text-white shadow-[0_5px_13px_rgba(0,117,222,.18)] transition hover:bg-[#005bab] disabled:cursor-wait disabled:opacity-60 active:scale-[.97]">{nlpExtraction.isPending ? "Structuring brief…" : "Inspect policy record"} <ArrowRight className="h-4 w-4" /></button></div></div><details className="mt-4 rounded-lg border border-[#e6e6e6] bg-[#fdfdfc] px-3 py-2"><summary className="cursor-pointer text-[12px] font-semibold text-[#005bab]">More curated demo records</summary><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => loadCuratedDemo(mobileDemoBrief)} className="min-h-9 rounded-md border border-[#e6e6e6] bg-white px-3 text-[12px] font-semibold text-[#31302e]">Mobile devices · 5G</button><button onClick={() => loadCuratedDemo(furnitureDemoBrief)} className="min-h-9 rounded-md border border-[#e6e6e6] bg-white px-3 text-[12px] font-semibold text-[#31302e]">Furniture · task chairs</button></div><p className="mt-2 text-[11px] leading-4 text-[#615d59]">Curated Vendor A/Vendor B records remain deterministic examples and always pass through editable confirmation and policy checks.</p></details></div><aside className="rounded-xl border border-[#e6e6e6] bg-white p-6"><p className="text-[12px] font-semibold uppercase tracking-[0.07em] text-[#615d59]">Control sequence</p><div className="mt-5 space-y-5">{[[Search, "Record requirements", "Product, quantity, budget, delivery, and authorization become an explicit policy record."], [ShieldCheck, "Verify vendor evidence", "Vendor A and Vendor B are normalized before any recommendation is made."], [FileClock, "Write the decision trail", "Every search, boundary, approval, and simulated order remains inspectable."]].map(([Icon, title, copy]) => { const Symbol = Icon as typeof Search; return <div key={title as string} className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#f6f5f4] text-[#0075de]"><Symbol className="h-4 w-4" /></span><div><h3 className="text-[14px] font-bold text-[#31302e]">{title as string}</h3><p className="mt-1 text-[12px] leading-5 text-[#615d59]">{copy as string}</p></div></div>; })}</div><div className="mt-7 border-y border-[#e6e6e6] py-4"><p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#615d59]">Policy tape</p><p className="mt-2 text-[12px] font-bold leading-5 text-[#31302e]">Hard requirement → two-source evidence → authorization check</p></div><div className="mt-5"><p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[#a39e98]">Simulation notice</p><p className="mt-2 text-[13px] font-semibold leading-5 text-[#31302e]">SIMULATED PURCHASE — NO REAL PAYMENT</p></div></aside></section>}
    </main></>}
    {view === "editable-review" && normalized && <EditableRequirementReview brief={normalized} onBack={() => setView("intake")} onConfirm={startProcurement} searching={productSearch.isPending} />}
    {view === "generic-workspace" && genericSession && <main className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8"><GenericProcurementWorkspace session={genericSession} onSessionChange={setGenericSession} onNewBrief={newBrief} onLoadMultiDemo={loadMultiDemo} onLoadUnavailableDemo={() => void runUnavailableTopVendorDemo()} liveEvidence={liveEvidence} productListings={productListings} onVerifyFullSpecifications={verifyFullSpecifications} auditPersistence={auditPersistence} /></main>}
    {view === "legacy-workspace" && legacySession && <main className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8"><div className="pt-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e6e6e6] bg-white px-5 py-3"><p className="text-[13px] text-[#615d59]"><strong className="text-[#31302e]">Compatibility demo:</strong> the original multi-item onboarding workflow remains available and offline-first.</p><button onClick={newBrief} className="rounded-lg border border-[#e6e6e6] bg-white px-3 py-2 text-[12px] font-semibold text-[#005bab]">Return to generic brief</button></div></div><Workspace session={legacySession} setSession={setLegacySession} onReset={() => setLegacySession(runDemo())} /></main>}
    <footer className="border-t border-[#e6e6e6] bg-[#f6f5f4]"><div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 px-4 py-7 text-[12px] text-[#615d59] sm:px-6 lg:px-8"><p>SpecSathi Procure · Category-agnostic mechanism with a laptop-focused demo.</p><p className="inline-flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-[#0075de]" />Local demo data · Simulated vendors · No real payment</p></div></footer>
  </div>;
}
