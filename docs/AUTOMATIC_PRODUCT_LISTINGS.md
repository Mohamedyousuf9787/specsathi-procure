# Automatic Product Listings

## Chosen approach

Specanic uses the server-side **SerpAPI Google Shopping adapter** to retrieve structured marketplace records after a requester confirms the editable procurement brief. This is an automatic discovery path: the requester does not maintain a spreadsheet, create an eBay developer application, or manually curate product cards.

The application renders the returned title, merchant, price, image when supplied, rating when supplied, availability, delivery information, and original product URL directly inside its procurement workspace. The original listing URL is an evidence link for that individual card; it does not become a procurement order or authorization action.

## Evidence boundary

> A marketplace card is a candidate record, not a verified vendor offer.

The card is deterministically classified using the requester-confirmed unit-price ceiling and authorization limit. A complete record within both limits is **Eligible**. A complete record within the ceiling but above the authority limit is **Approval needed**. A complete record that is unavailable or above the ceiling is **Blocked**. Any record missing a decision-critical field is **Unverified**.

Live web-search snippets are retained only as **Supporting sources** in a collapsed disclosure below the main procurement decision. They are never substituted for product cards and never change procurement eligibility.

## Availability and fallback

The third-party provider can return no items, rate-limit requests, or become temporarily unavailable. The server returns explicit `live` or `fallback` status; the interface distinguishes an empty result from a provider fallback and never fabricates cards. In either case, the deterministic local Vendor A/Vendor B comparison remains available as the offline-safe procurement path.

The product adapter limits each response to 12 normalized marketplace cards and uses a 15-second upstream timeout. Credentials remain server-side only. Product price, stock, seller, delivery, and return terms must be independently confirmed before any simulated procurement decision.
