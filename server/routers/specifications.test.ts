import { afterEach, describe, expect, it, vi } from "vitest";
import { getSpecificationProfile, normalizeSourcedSpecifications, scrapeWithFailover, specificationFieldContracts } from "./specifications";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("category-aware product specification normalization", () => {
  it("extracts laptop hardware features from sourced page content", () => {
    const specifications = normalizeSourcedSpecifications("laptop", "Acer business laptop", "Processor: Intel Core i5-13420H. RAM: 16 GB DDR5. Storage: 512 GB SSD NVMe. Graphics: NVIDIA GeForce RTX 3050. Display: 15.6 inch FHD IPS. Operating System: Windows 11 Home.", { brand: "Acer" });
    expect(specifications).toEqual(expect.arrayContaining([expect.objectContaining({ label: "Brand", value: "Acer" }), expect.objectContaining({ label: "RAM", value: "16 GB DDR5" }), expect.objectContaining({ label: "Storage", value: "512 GB SSD" }), expect.objectContaining({ label: "Graphics", value: "NVIDIA GeForce RTX 3050" })]));
  });

  it("extracts motorcycle engine, mileage, fuel, and braking features from sourced page content", () => {
    const specifications = normalizeSourcedSpecifications("motorcycle", "City motorcycle", "Engine: 199.5 cc. Mileage: 35 kmpl. Fuel tank: 13.4 litres. Max power: 24.6 PS. Max torque: 19.3 Nm. Transmission: 6 speed manual. Brakes: Dual channel ABS with disc brakes. Kerb weight: 158 kg.", { brand: "Example Motors" });
    expect(specifications).toEqual(expect.arrayContaining([expect.objectContaining({ label: "Engine", value: "199.5 cc" }), expect.objectContaining({ label: "Mileage", value: "35 kmpl" }), expect.objectContaining({ label: "Fuel tank", value: "13.4 litres" }), expect.objectContaining({ label: "Brakes", value: "Dual channel ABS with disc brakes" })]));
  });

  it("uses generic specifications when the category does not match a dedicated profile", () => {
    expect(getSpecificationProfile("office chair", "Ergonomic chair")).toBe("generic");
    expect(normalizeSourcedSpecifications("generic", "Office chair", "Material: Mesh. Warranty: 3 years.")).toEqual(expect.arrayContaining([expect.objectContaining({ label: "Material", value: "Mesh" }), expect.objectContaining({ label: "Warranty", value: "3 years" })]));
  });

  it("marks contradictory sourced RAM values as a conflict and exposes the explicit profile field contract", () => {
    const specifications = normalizeSourcedSpecifications("laptop", "Example laptop", "RAM: 16 GB DDR5. Memory: 32 GB DDR5.");
    expect(specifications).toEqual(expect.arrayContaining([expect.objectContaining({ label: "RAM", value: "16 GB DDR5", conflict: true })]));
    expect(specificationFieldContracts.laptop.map(field => field.label)).toEqual(expect.arrayContaining(["Processor", "RAM", "Storage", "Graphics", "Display"]));
    expect(specificationFieldContracts.motorcycle.map(field => field.label)).toEqual(expect.arrayContaining(["Engine", "Mileage", "Fuel tank", "Brakes"]));
  });

  it("rejects low-specificity page boilerplate instead of presenting it as verified hardware evidence", () => {
    const specifications = normalizeSourcedSpecifications("laptop", "ASUS Vivobook 15 Core i5 13th Gen 13420H Laptop", "Processor: to its vibrant display. RAM: 16 GB. Storage: 512GB SSD. Graphics: Processor Intel GPU Drive Type Solid State Drive Number of Cores Octa. Display: Yes Refresh Rate 60Hz Available Ports HDMI. Operating System: Windows OS Processor Brand Intel CPU Graphics Processor.");
    expect(specifications).toEqual(expect.arrayContaining([expect.objectContaining({ label: "RAM", value: "16 GB" }), expect.objectContaining({ label: "Storage", value: "512GB SSD" })]));
    expect(specifications.map(specification => specification.label)).not.toEqual(expect.arrayContaining(["Processor", "Graphics", "Display", "Operating system"]));
  });

  it("uses the fallback key only after a retryable primary failure", async () => {
    vi.stubEnv("FIRECRAWL_API_KEY", "primary-test-key");
    vi.stubEnv("FIRECRAWL_FALLBACK_API_KEY", "fallback-test-key");
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response("{}", { status: 429 })).mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { markdown: "RAM: 16 GB" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(scrapeWithFailover("https://example.test/product")).resolves.toMatchObject({ provider: "firecrawl_fallback" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({ Authorization: "Bearer primary-test-key" });
    expect((fetchMock.mock.calls[1][1] as RequestInit).headers).toMatchObject({ Authorization: "Bearer fallback-test-key" });
  });

  it("does not use the fallback key after a non-retryable primary failure", async () => {
    vi.stubEnv("FIRECRAWL_API_KEY", "primary-test-key");
    vi.stubEnv("FIRECRAWL_FALLBACK_API_KEY", "fallback-test-key");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(scrapeWithFailover("https://example.test/product")).rejects.toThrow("Firecrawl returned 400");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
