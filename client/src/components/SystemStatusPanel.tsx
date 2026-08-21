import React from "react";
import { Activity, AlertTriangle, CheckCircle2, CircleHelp, RefreshCw, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { SystemServiceStatus } from "../../../server/routers/status";

type StatusPanelProps = { onClose?: () => void };

const tone: Record<SystemServiceStatus["state"], { icon: typeof CheckCircle2; className: string }> = {
  Operational: { icon: CheckCircle2, className: "border-[#1aae39]/25 bg-[#effaf1] text-[#14752b]" },
  Degraded: { icon: AlertTriangle, className: "border-[#dd5b00]/25 bg-[#fff5ed] text-[#9a3b00]" },
  Unavailable: { icon: XCircle, className: "border-[#ff64c8]/25 bg-[#fff1fa] text-[#9b2164]" },
  "Not configured": { icon: CircleHelp, className: "border-[#e6e6e6] bg-[#f6f5f4] text-[#615d59]" },
};

export default function SystemStatusPanel({ onClose }: StatusPanelProps) {
  const status = trpc.status.get.useQuery(undefined, { staleTime: 30_000, refetchOnWindowFocus: false });
  return <section id="system-status" aria-label="System status" className="rounded-2xl border border-[#e6e6e6] bg-white p-5 shadow-[0_1px_1px_rgba(0,0,0,.02),0_10px_26px_rgba(0,0,0,.04)] sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#0075de]"><Activity className="h-4 w-4" />System status</p><h2 className="mt-1 text-[23px] font-bold tracking-[-0.5px] text-black">Services behind the workflow.</h2><p className="mt-1 max-w-[720px] text-[12px] leading-5 text-[#615d59]">Status is checked by the server. A provider is never shown as operational only because a key exists.</p></div><button onClick={() => void status.refetch()} disabled={status.isFetching} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#e6e6e6] bg-white px-3 text-[12px] font-semibold text-[#005bab] disabled:opacity-60"><RefreshCw className={`h-3.5 w-3.5 ${status.isFetching ? "animate-spin" : ""}`} />Refresh</button></div>
    {status.isLoading && <div role="status" className="mt-5 rounded-lg border border-[#e6e6e6] bg-[#f6f5f4] p-4 text-[13px] font-semibold text-[#615d59]">Checking service status…</div>}
    {status.isError && <div role="alert" className="mt-5 rounded-lg border border-[#dd5b00]/25 bg-[#fff5ed] p-4 text-[13px] leading-5 text-[#9a3b00]">System status could not be retrieved. The procurement workflow remains available with its normal failure handling.</div>}
    {status.data && <><div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{status.data.services.map((service) => { const meta = tone[service.state]; const Icon = meta.icon; return <article key={service.id} className="rounded-xl border border-[#e6e6e6] bg-[#fdfdfc] p-3"><div className="flex items-center justify-between gap-2"><h3 className="text-[13px] font-bold text-[#31302e]">{service.label}</h3><span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${meta.className}`}><Icon className="h-3 w-3" />{service.state}</span></div><p className="mt-2 text-[11px] leading-4 text-[#615d59]">{service.detail}</p></article>; })}</div><p className="mt-4 text-[10px] font-medium text-[#a39e98]">Last checked {new Date(status.data.checkedAt).toLocaleString()}</p></>}
    {onClose && <button onClick={onClose} className="mt-5 min-h-9 rounded-lg border border-[#e6e6e6] bg-white px-3 text-[12px] font-semibold text-[#31302e]">Close status</button>}
  </section>;
}
