// @vitest-environment jsdom
import { createElement, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { runDemo, type ProcurementSession } from "@/domain/procurement";
import { FinanceHandoffCard } from "./Home";

function FinanceHandoffHarness() {
  const [session, setSession] = useState<ProcurementSession>(() => runDemo());
  return createElement(FinanceHandoffCard, { session, onSessionChange: setSession });
}

describe("multi-item finance handoff panel", () => {
  it("requires an explicit local action before the simulated finance handoff is recorded", () => {
    render(createElement(FinanceHandoffHarness));
    expect(screen.getByText("One batch. One auditable package.")).toBeTruthy();
    expect(screen.getByText("Draft")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Record simulated handoff" }));
    expect(screen.getByText("Recorded")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Finance handoff recorded" })).toBeTruthy();
  });
});
