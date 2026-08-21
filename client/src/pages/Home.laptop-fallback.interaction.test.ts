/** @vitest-environment jsdom */
import { createElement } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const productHandlers: { onError?: () => void } = {};
const productMutate = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    nlp: { extractBrief: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } },
    liveSearch: { searchEvidence: { useMutation: () => ({ mutate: vi.fn() }) } },
    products: { search: { useMutation: (handlers: typeof productHandlers) => { Object.assign(productHandlers, handlers); return { mutate: productMutate }; } } },
    specifications: { enrich: { useMutation: () => ({ mutate: vi.fn() }) } },
    audit: { persistSession: { useMutation: () => ({ mutate: vi.fn() }) } },
  },
}));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: null }) }));

import Home from "./Home";

describe("normal laptop product-search fallback", () => {
  it("renders deterministic Vendor A/B cards after the requester agrees to policy and the live product search fails", async () => {
    productMutate.mockClear();
    render(createElement(Home));
    fireEvent.change(screen.getByLabelText("Buying brief"), { target: { value: "Purchase 10 laptops with 16 GB RAM and 512 GB SSD under ₹45,000 each within 5 days." } });
    fireEvent.click(screen.getByRole("button", { name: "Inspect policy record" }));
    expect(await screen.findByText("Make the request record yours.")).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/Policy agreement required/));
    fireEvent.click(screen.getByRole("button", { name: /Agree & find products/ }));
    await waitFor(() => expect(productMutate).toHaveBeenCalledTimes(1));
    await act(async () => productHandlers.onError?.());
    expect(await screen.findByText("BEST MATCH FOR YOUR CONFIRMED REQUIREMENTS")).toBeTruthy();
    expect(screen.getAllByText("Atlas Business 14").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/deterministic Vendor A\/B laptop challenge templates/)).toBeTruthy();
  });
});
