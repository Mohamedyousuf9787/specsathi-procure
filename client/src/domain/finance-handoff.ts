import type { ProcurementSession } from "./procurement";

export type FinanceHandoffLine = {
  item: string;
  quantity: number;
  vendor: string | null;
  unitPriceInr: number | null;
  totalInr: number | null;
  deliveryDays: number | null;
  status: string;
  policyReason: string;
  orderId: string | null;
};

export type FinanceHandoff = {
  handoffId: string;
  scope: "SIMULATED FINANCE HANDOFF — NO PAYMENT";
  batchLabel: string;
  generatedAt: string;
  totalInr: number;
  currency: "INR";
  lines: FinanceHandoffLine[];
  auditEventCount: number;
};

export function buildFinanceHandoff(session: ProcurementSession): FinanceHandoff {
  const lines = session.itemStates.map((state) => {
    const selected = state.recommendation.selected?.offer;
    return {
      item: state.item.name,
      quantity: state.item.quantity,
      vendor: selected?.vendor ?? null,
      unitPriceInr: selected?.unitPrice ?? null,
      totalInr: state.order?.total ?? (selected ? selected.unitPrice * state.item.quantity : null),
      deliveryDays: state.order?.deliveryDays ?? selected?.deliveryDays ?? null,
      status: state.status,
      policyReason: state.recommendation.reason,
      orderId: state.order?.id ?? null,
    };
  });
  return {
    handoffId: `FIN-HO-${session.variant.toUpperCase()}-${session.itemStates.length}`,
    scope: "SIMULATED FINANCE HANDOFF — NO PAYMENT",
    batchLabel: "Q3 onboarding procurement batch",
    generatedAt: new Date().toISOString(),
    totalInr: lines.reduce((sum, line) => sum + (line.totalInr ?? 0), 0),
    currency: "INR",
    lines,
    auditEventCount: session.audit.length,
  };
}

export function serializeFinanceHandoffCsv(handoff: FinanceHandoff) {
  const quote = (value: string | number | null) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const header = ["handoff_id", "scope", "item", "quantity", "vendor", "unit_price_inr", "total_inr", "delivery_days", "status", "policy_reason", "order_id"];
  const rows = handoff.lines.map((line) => [handoff.handoffId, handoff.scope, line.item, line.quantity, line.vendor, line.unitPriceInr, line.totalInr, line.deliveryDays, line.status, line.policyReason, line.orderId].map(quote).join(","));
  return [header.map(quote).join(","), ...rows].join("\n");
}

export function serializeFinanceHandoffJson(handoff: FinanceHandoff) {
  return JSON.stringify(handoff, null, 2);
}

export function getFinanceHandoffFilename(handoff: FinanceHandoff, extension: "json" | "csv") {
  return `${handoff.handoffId.toLowerCase()}-audit.${extension}`;
}
