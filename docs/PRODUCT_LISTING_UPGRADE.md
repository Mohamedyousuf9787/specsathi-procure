# Product Listing Upgrade

## User journey

1. The requester enters a short ordinary-language purchase need.
2. With consent, Gemini extracts a structured draft on the server. If Gemini is unavailable, rate-limited, or the brief contains an instruction-override attempt, the deterministic local parser takes over or blocks the request.
3. The requester edits product category, quantity, budget, delivery deadline, authorization, and every listed requirement.
4. Only an explicit **Confirm & find products** action creates the SerpAPI Google Shopping query.
5. The workspace displays normalized marketplace product cards in-app and keeps them distinct from local verified offers.

## Listing evidence boundary

SerpAPI listings may include title, image, merchant, displayed price, rating, availability, delivery text, and a source URL. Deterministic code labels each card **Eligible candidate**, **Approval needed**, **Blocked**, or **Unverified**. A listing is unverified when core marketplace fields are absent, blocked when it is unavailable or over the confirmed price ceiling, and approval-needed when it is within the ceiling but exceeds the requester’s authority. Listings cannot create a mock order, override requirements, grant approval, or become a verified offer until price, quantity, merchant, delivery, and return terms are independently confirmed.

## Provider security

Gemini and SerpAPI keys are server-only environment secrets. Raw keys, raw briefs, raw search queries, and product excerpts are not stored in audit metadata. The existing local Vendor A/Vendor B route remains the offline fallback.
