// @vitest-environment jsdom
import { createElement, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { laptopDemoBrief } from "@/domain/generic-procurement";
import { runGenericProcurement, type GenericProcurementSession } from "@/domain/generic-vendor-flow";
import GenericProcurementWorkspace from "./GenericProcurementWorkspace";

function WorkspaceHarness({ initial }: { initial: GenericProcurementSession }) {
  const [session, setSession] = useState(initial);
  return createElement(GenericProcurementWorkspace, {
    session,
    onSessionChange: setSession,
    onNewBrief: () => undefined,
    onLoadMultiDemo: () => undefined,
    onLoadUnavailableDemo: () => undefined,
    liveEvidence: { status: "idle", results: [] },
    productListings: { status: "idle", listings: [] },
    auditPersistence: "local",
  });
}

describe("final-round procurement controls", () => {
  it("shows the ranked all-candidates table and requires explicit vendor confirmation before a simulated purchase", async () => {
    const session = await runGenericProcurement(laptopDemoBrief);
    render(createElement(WorkspaceHarness, { initial: session }));

    expect(screen.getByText("All candidates · ranked evidence")).toBeTruthy();
    expect(screen.getAllByText("Requirement fit").length).toBeGreaterThan(0);
    expect(screen.getByText("Policy state")).toBeTruthy();
    expect(screen.getByText("Decision reason")).toBeTruthy();
    expect(screen.getAllByText("Atlas Business 14").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Vector Work 14").length).toBeGreaterThan(0);
    expect(screen.getByText("Confirm terms or submit a counter-offer.")).toBeTruthy();
    expect(screen.queryByText(/Order GEN-ORD-/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Accept confirmed terms" }));
    expect((await screen.findAllByText(/Order GEN-ORD-/)).length).toBeGreaterThan(0);
  });
});
