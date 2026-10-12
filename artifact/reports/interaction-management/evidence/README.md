# Interaction Management — Browser QA Evidence

Generated from the development build of `livora_admin` driven by Microsoft Edge (Playwright, isolated Python venv) at 1317×982 with 390×844 mobile checks.

| File | Purpose |
|---|---|
| `run_interaction_qa.py` | Automated QA script: serves the SPA build, drives Edge, records checks and screenshots. |
| `interaction-browser-interaction-results.json` | Machine-readable run summary (34/34 checks passed, 0 page errors). |
| `contact-list-1317x982.png`, `contact-detail-1317x982.png` | Contact list and detail dialog. |
| `review-list-1317x982.png`, `review-detail-1317x982.png` | Review list and detail dialog. |
| `voucher-list-1317x982.png`, `voucher-create-1317x982.png` | Voucher list and create dialog. |
| `shipping-list-1317x982.png`, `shipping-create-1317x982.png` | Shipping list and create dialog. |
| `contact-list-mobile-390x844.png`, `voucher-create-mobile-390x844.png` | Mobile width checks. |

Test actions (resolve, hide, create, toggle) mutate only the in-memory demo session and reset when the browser page reloads; no backend or database is involved. The mobile contact capture also shows the pre-existing shared Admin shell horizontal width, recorded in the implementation report.
