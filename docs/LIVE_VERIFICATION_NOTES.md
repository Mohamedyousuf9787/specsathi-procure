# Live Verification Notes

## 2026-08-21 — Browser Laptop Flow

- **Input submitted through live UI:** `I need 2 laptops under ₹70,000 each with at least 16GB RAM, 512GB SSD, good battery life and delivery within 7 days.`
- **Initial incomplete variant:** The same brief without a quantity was correctly held at clarification with `How many units do you need?`; no search began.
- **Requirement review:** Gemini-based editable review rendered laptop, quantity `2`, ceiling `₹70,000`, delivery `7` days, authority `₹70,000`, RAM `16 GB`, and SSD storage `512 GB` before the policy agreement was confirmed.
- **Live marketplace result:** SerpAPI rendered `12` cards in the browser. Observed merchants included Amazon.in, Flipkart, ubuy.co.in, Gadgets Now, EMI Snapmint, and Google Shopping URLs. Example live products included ASUS Vivobook 15 Core i5 13th Gen (₹65,990), Lenovo IdeaPad Slim 3 Gen 8 (₹64,971), Acer Aspire Lite Ryzen 5 5625U (₹59,990), and Lenovo V15 G4 (₹54,890).
- **Live fields:** Titles, merchants, INR prices, product URLs, images, and ratings/delivery where supplied rendered. Marketplace stock was absent from the observed cards, so they were truthfully held as partial evidence and remained excluded from automatic recommendation.
- **Specifications:** Title/extension extraction rendered live fields such as RAM `16 GB RAM`, storage `512 GB SSD`, processor `AMD Ryzen 5`, and display `15.6 inch FHD`; cards without structured values rendered a clearly labelled listed model rather than a blank panel.
- **Live evidence:** Tavily supporting sources rendered separately as supporting links and were not treated as marketplace offers.

## Interpretation

This is **LIVE** marketplace and supporting-evidence data observed through the running browser UI. The local Vendor A/Vendor B comparison, approval, counter-offer, unavailable-vendor, no-match, and simulated-purchase paths remain separately labelled deterministic demo/fallback controls.

## 2026-08-21 — Live Firecrawl Page Verification Retest

The first live ASUS listing was verified through the card’s **Verify full page specifications** action. Before the quality repair, the page response supplied boilerplate fragments that appeared as processor, graphics, display, and operating-system values. The parser now rejected those fragments in the live browser. The resulting card showed only the retained source-grounded values: `RAM 16 GB`, `Storage 512GB SSD`, and the marketplace `Listed model`. The card still remained unverified because marketplace stock had not been reported; this safeguard was not relaxed.

## 2026-08-21 — Browser Mobile Flow

The real brief `Find 2 Android smartphones under ₹30,000 each with at least 8GB RAM, 128GB storage, good camera and rating above 4 stars.` initially exposed a genuine category defect: a camera preference was rendered as the product category. Both server-side and editable-review safeguards were added and retested through the browser. The corrected review rendered `mobile`, quantity `2`, and a ₹30,000 unit ceiling before policy confirmation.

After confirmation, the browser received `12` **LIVE** SerpAPI marketplace cards. Observed cards included OnePlus Nord CE5 5G from bigbasket.com at ₹24,999, Realme 15 5G from amazon.in at ₹29,999, and Vivo T5x 5G from JioMart at ₹24,799. Titles, merchants, prices, images, links, delivery where reported, ratings where reported, and marketplace-derived 5G fields rendered. Stock was not supplied by the marketplace, so every live card correctly remained policy-held as partial evidence. The separate local mobile comparison was also correctly blocked because its deterministic records lacked verified RAM evidence; it did not relax requirements or simulate an order.

The missing-RAM comparison defect was then repaired by normalizing secure-NLP mobile `ram` and `storage` aliases and adding the declared RAM evidence to existing labelled mobile templates. A fresh browser run selected **Vendor A / Pulse Field 5G** at ₹19,900 per unit with `30/30` requirement fit, two eligible candidates, and an explicit vendor-confirmation boundary. The live marketplace result remained separate: `12` live cards, each unverified only because stock was not reported by the marketplace.
