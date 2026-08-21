import React from "react";
import { Activity, CircleHelp, House, Info, Plus, X } from "lucide-react";

export type ProcurementMenuItem = "home" | "new" | "history" | "how" | "status" | "about";

type ProcurementMenuProps = { open: boolean; onClose: () => void; onSelect: (item: ProcurementMenuItem) => void };

const items: Array<{ id: ProcurementMenuItem; label: string; icon: typeof House }> = [
  { id: "home", label: "Home", icon: House },
  { id: "new", label: "New Procurement", icon: Plus },
  { id: "history", label: "Procurement History", icon: Activity },
  { id: "how", label: "How Specanic Works", icon: CircleHelp },
  { id: "status", label: "System Status", icon: Activity },
  { id: "about", label: "About Specanic", icon: Info },
];

export default function ProcurementMenu({ open, onClose, onSelect }: ProcurementMenuProps) {
  return <>
    {open && <button aria-label="Close navigation overlay" onClick={onClose} className="fixed inset-0 z-40 cursor-default bg-[#213183]/20 backdrop-blur-[1px]" />}
    <aside aria-label="Specanic navigation" aria-hidden={!open} className={`fixed right-0 top-0 z-50 flex h-full w-[min(88vw,360px)] flex-col border-l border-[#e6e6e6] bg-white shadow-[-12px_0_32px_rgba(33,49,131,.12)] transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}>
      <div className="flex min-h-20 items-center justify-between border-b border-[#e6e6e6] px-5"><div><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#0075de]">Specanic</p><h2 className="mt-1 text-[19px] font-bold tracking-[-0.35px] text-black">Procurement desk</h2></div><button onClick={onClose} aria-label="Close navigation" className="grid h-10 w-10 place-items-center rounded-lg border border-[#e6e6e6] bg-white text-[#31302e] hover:bg-[#f6f5f4]"><X className="h-4 w-4" /></button></div>
      <nav className="flex-1 p-3">{items.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => onSelect(id)} className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-left text-[14px] font-semibold text-[#31302e] hover:bg-[#edf6ff] hover:text-[#005bab]"><Icon className="h-4 w-4 text-[#0075de]" />{label}</button>)}</nav>
      <div className="border-t border-[#e6e6e6] bg-[#f6f5f4] px-5 py-4"><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#615d59]">Safety boundary</p><p className="mt-1 text-[12px] leading-5 text-[#615d59]">Human approval remains required where policy or vendor terms demand it. No real payment is created.</p></div>
    </aside>
  </>;
}
