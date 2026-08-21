import type { ProcurementSession } from "./procurement";
import { buildFinanceHandoff, getFinanceHandoffFilename } from "./finance-handoff";

export type FinanceAuditPdfDocument = { filename: string; lines: string[] };

const formatInr = (value: number | null) => value === null ? "Not available" : `INR ${value.toLocaleString("en-IN")}`;

export function buildFinanceAuditPdfDocument(session: ProcurementSession): FinanceAuditPdfDocument {
  const handoff = buildFinanceHandoff(session);
  const lines = [
    "SPECANIC - FINANCE AUDIT RECORD",
    handoff.scope,
    `Handoff ID: ${handoff.handoffId}`,
    `Generated: ${handoff.generatedAt}`,
    `Batch: ${handoff.batchLabel}`,
    `Total: ${formatInr(handoff.totalInr)}`,
    "",
    "PROCUREMENT LINES",
    ...handoff.lines.flatMap((line, index) => [
      `${index + 1}. ${line.item} | ${line.status}`,
      `Vendor: ${line.vendor ?? "Not selected"} | Quantity: ${line.quantity} | Unit price: ${formatInr(line.unitPriceInr)} | Total: ${formatInr(line.totalInr)}`,
      `Delivery: ${line.deliveryDays === null ? "Not verified" : `${line.deliveryDays} days`} | Order: ${line.orderId ?? "No simulated order"}`,
      `Policy: ${line.policyReason}`,
    ]),
    "",
    "AUDIT TRAIL",
    ...session.audit.flatMap((event, index) => [
      `${index + 1}. ${new Date(event.timestamp).toISOString()} | ${event.type} | ${event.actor}`,
      event.detail ? `${event.summary} - ${event.detail}` : event.summary,
    ]),
    "",
    "SIMULATED PURCHASES ONLY - NO REAL PAYMENT OR PAYMENT INSTRUCTION.",
  ];
  return { filename: getFinanceHandoffFilename(handoff, "pdf"), lines };
}
