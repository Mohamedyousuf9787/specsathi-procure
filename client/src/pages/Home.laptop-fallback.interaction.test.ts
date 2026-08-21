/** @vitest-environment jsdom */
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const productHandlers: { onError?: () => void; onSuccess?: (result: unknown) => void } = {};
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
  afterEach(() => {
    cleanup();
    productHandlers.onError = undefined;
    productHandlers.onSuccess = undefined;
  });

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

  it("renders labelled GPU ranked evidence after the requester agrees to policy and the live GPU search returns no cards", async () => {
    productMutate.mockClear();
    render(createElement(Home));
    fireEvent.change(screen.getByLabelText("Buying brief"), { target: { value: "Purchase 5 RTX 4060 graphics cards with 8 GB VRAM under ₹20,000 each within 10 days." } });
    fireEvent.click(screen.getByRole("button", { name: "Inspect policy record" }));
    await screen.findByText("Make the request record yours.");
    fireEvent.click(screen.getByLabelText(/Policy agreement required/));
    fireEvent.click(screen.getByRole("button", { name: /Agree & find products/ }));
    await waitFor(() => expect(productMutate).toHaveBeenCalledTimes(1));
    await act(async () => productHandlers.onError?.());
    expect((await screen.findAllByText("Forge RTX 4060 8 GB")).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("3 compared")).toBeTruthy();
    expect(screen.getByText("Marketplace cards are temporarily unavailable.")).toBeTruthy();
    expect(screen.getByText(/3 labelled deterministic Vendor A\/B candidates are available below/)).toBeTruthy();
  });

  it("renders a verified live marketplace card when the normal product search succeeds", async () => {
    productMutate.mockClear();
    render(createElement(Home));
    fireEvent.change(screen.getByLabelText("Buying brief"), { target: { value: "Purchase 10 laptops with 16 GB RAM and 512 GB SSD under ₹45,000 each within 5 days." } });
    fireEvent.click(screen.getByRole("button", { name: "Inspect policy record" }));
    await screen.findByText("Make the request record yours.");
    fireEvent.click(screen.getByLabelText(/Policy agreement required/));
    fireEvent.click(screen.getByRole("button", { name: /Agree & find products/ }));
    await waitFor(() => expect(productMutate).toHaveBeenCalledTimes(1));
    await act(async () => productHandlers.onSuccess?.({ status: "live", message: "Live marketplace response.", listings: [{ id: "live-1", title: "Live Business Laptop", merchant: "Live merchant", priceText: "₹42,000", rating: null, reviews: null, imageUrl: null, productUrl: "https://example.test/live", delivery: "Within 5 days", availability: "In stock", completeness: "complete", policy: "eligible", specificationProfile: "laptop", specifications: [{ label: "RAM", value: "16 GB RAM" }] }] }));
    expect(await screen.findByText("Live Business Laptop")).toBeTruthy();
    expect(screen.queryByText("BEST MATCH FOR YOUR CONFIRMED REQUIREMENTS")).toBeNull();
  });
});
