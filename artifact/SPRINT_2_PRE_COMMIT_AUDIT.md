# LIVORA Sprint 2 — Pre-commit scope and regression audit

**Audit date:** 25 October 2026
**Decision after cleanup:** **CONDITIONAL GO — remaining teammate and environment approvals listed in Section 17.**

**Record:** Sections 1–16 and Appendix A preserve the original pre-cleanup audit and 84-file inventory. Section 17 records the subsequent code cleanup and repeat verification; earlier FIX/REVERT recommendations are historical unless repeated there.

## 1. Executive summary

The two approved integrations work in the recorded isolated local MongoDB/browser exercise: a Customer profile edit is read by Admin from the same Customer ID; Admin Voucher and Shipping configuration reaches Customer checkout; the server computes and stores a VND order. Existing evidence reports 6/6 backend tests, 19/19 Customer tests, 19 local database/security checks, and eight browser steps. This is **local test evidence**, not acceptance against the team's shared MongoDB or every payment/cart path.

The Admin suite is not a new Sprint 2 regression: a clean `origin/main` worktree and the feature worktree, with identical lockfiles and the same installed dependencies, each ran **204 tests: 79 passed, 125 failed**. All 204 named test outcomes match; newly introduced Admin test failures: **0**. The earlier implementation report's 83/121 result is not reproducible in this like-for-like comparison and should be corrected when documentation updates are authorized.

There are **84 pre-audit changed files**: 33 modified tracked files and 51 untracked files. Nothing is staged. The branch has no commits ahead of `origin/main`. The file-level inventory below records each path, including evidence. Some files mix approved changes with unrelated changes; a file-level KEEP does not approve every hunk.

Classification counts (overlapping because files can contain multiple hunk types): **39 direct-scope files (A or B), 28 necessary integration files (C), 18 shared-review files (F), 12 out-of-scope candidate files (D), 46 documentation/test/evidence files (E), and 0 newly introduced Admin test failures**. These counts exclude this newly written audit file from the pre-audit change set.

Before committing, fix the visible corrupted Vietnamese order-history strings; decide with the payment/order owner whether the removed QR flow, bank-transfer behavior, and order-history rewrite may ship; preserve or explicitly resolve the prior local-order merge behavior; and enforce integer VND for checkout-derived fees and discounts. Avoid a blanket revert of authentication hardening or transactional checkout.

## 2. Exact approved scope

- **Task 1 (A):** Customer edits permitted profile fields, backend validates and persists them in canonical MongoDB Customer, and Admin reads the updated same record under appropriate authentication.
- **Task 2 (B):** Admin-managed Voucher and Shipping settings affect Customer checkout. The backend validates eligibility, computes authoritative product-subtotal discount and shipping fee in integer VND, and stores selected settings with the Order.
- **Supporting integration (C):** Targeted authentication, Order snapshots, checkout transaction, and API wiring required by A/B. Room, Inspiration, Space, Product Management redesign, general inventory, payment settlement, broad Order Management, and unrelated UI are not independent deliverables.

## 3. Git baseline, worktrees, and attribution

The active worktree is `E:/web2/LIVORA/.worktrees/customer-settings-integration`, branch `feature/customer-settings-integration`, HEAD and merge-base with `origin/main` `8ae55fda2c58524dfc06c4a0594d51f25d18a9c0`. All 33 tracked modifications are unstaged against that commit; 51 files are untracked; `git diff --cached` is empty. A separate original worktree `E:/web2/LIVORA` is on `hung-room-management` at `282c99ac481c6ea9d452707f354eb6d77f921fa5` and contains unrelated pre-existing uncommitted package/lockfile edits. They are **excluded** from Sprint 2 attribution. A detached baseline worktree at `C:/Users/ADMIN/AppData/Local/Temp/LIVORA-sprint2-baseline-8ae55fd` was created solely for read-only tests, with Admin `node_modules` linked to the feature installation; the two Admin lockfiles have the same SHA-256.

The current baseline is the latest available integration commit, not a claim that every pre-existing module is healthy. This audit did not modify application code, test code, shared MongoDB, or Git history.

## 4. Complete changed-file inventory

Legend: A/B/C/D/E/F are the scope classes in the request; `M +x/-y` means modified tracked file and diff line counts; `U` means untracked added file, whose line counts are not provided by Git diff. `KEEP`, `KEEP — TEAM REVIEW`, `REVERT CANDIDATE`, and `FIX BEFORE COMMIT` are recommendations. A mixed class identifies a particular hunk, not the whole file. The table also notes necessity, unrelated changes, and main risk. **The full inventory table follows at the end of this report.**

## 5. File and hunk-level scope conclusions

1. **Profile chain (A/C):** `customerProfileController.js` allows only full name, phone, birth date, gender; uses `req.customer` set from a verified Customer JWT and returns the same MongoDB `_id`. `customer.ts` re-fetches the Admin detail. `module-5.ts/html` binds editable profile fields. The same two module-5 files also add a separate order-history feature and replace ~217 lines of existing history markup: **D/F hunk, not justified by Task 1**.
2. **Checkout chain (B/C):** `checkoutPricing.js` reloads Product price and stock, active Shipping, Voucher dates/quantity/per-customer use; computes product subtotal discount and adds shipping. `checkoutController.js` rejects client totals, writes Order plus stock/voucher/customer counters in a MongoDB transaction, and records a request hash. Order schema snapshots are additive. These are proportionate dependencies of Task 2. The rollback on checkout-order cancellation helps maintain voucher and stock consistency but changes shared Order behavior and needs review.
3. **Authentication (C/F):** Removing known demo/master-password bypasses, requiring configured JWT secret, and guarding Customer/Voucher/Shipping/Order routes were previously explicitly authorized in the conversation. These are necessary security integration changes, even though they affect teammates. Registration validation and making previously inert Customer sign-up functional are separate **D** hunks. Disabling fake OTP recovery is an appropriate security measure, but availability impact requires an owner decision and real recovery plan.
4. **Payment (B/F/D):** The checkout UI needed real Shipping/Voucher selection and server quote. The same diff deletes the prior QR modal/timer/confirmation path and now creates a `pending` bank-transfer Order with a statement that payment details will be provided later. This is a payment workflow change outside Sprint 2; obtain payment owner approval or separate it safely from the required checkout work. COD E2E passed; bank transfer settlement was not verified.
5. **Admin Order service (C/F/D):** Bearer headers and Shipping mapping are needed after route protection. Replacing `backendOrders + localOrders` merge with `backendOrders` only is an independent behavior change: unsynchronized local POS orders can disappear from the Admin list after refresh. Preserve/reconcile that behavior or obtain explicit Order owner approval with a migration path. A failed status/cancel `fetch` is still ignored by legacy code; this audit does not attribute that pre-existing behavior to Sprint 2.

## 6. Necessary cross-module changes and proposed split

Keep the Task 1 profile controller/route, Customer auth adapter and Admin refresh; keep Task 2 checkout service/controller/routes, server price calculation, Order voucher/shipping snapshots, Cart quote hookup, and targeted Admin token transport. Retain secure auth guards and no demo bypass. Review shared startup/seed/auth recovery and cancellation as one coherent change with relevant owners. Split the independent registration and history features from the profile changes at hunk level. In payment files, keep quote/order binding while the payment owner decides the bank-specific UI and status flow. Do not use a whole-file revert on mixed files.

## 7. Out-of-scope candidates and verified discrepancies

| Finding | Evidence | Decision |
|---|---|---|
| Customer order-history rewrite | `module-5.html` replaces the static history and action buttons with a new real-order list; `module-5.ts`, `auth.service.ts`, `customerProfileController.js`, and auth route add history retrieval. Task 1 only needs profile. | **REVERT CANDIDATE** as a coordinated set of hunks; retain profile hunks. If the owner wants it, move to a separate reviewed change. |
| Broken Vietnamese UI text | New `module-5.html` history strings literally contain `T?t c?`, `??n`, `T?ng ??n h?ng`, etc. This is source text, independent of shell encoding. | **FIX BEFORE COMMIT** if history UI remains; otherwise separate/revert that hunk. |
| Customer sign-up activation | `login.html/ts`, `auth.service.ts`, backend registration validation now make formerly inert sign-up operational. | **REVERT CANDIDATE** after isolating necessary real login/profile work; review existing users' registration expectations. |
| Bank payment flow replacement | QR modal/timer and confirmation removed in `payment.html/ts`; bank orders remain pending, with no verified settlement/receipt path. | **KEEP — TEAM REVIEW** only with payment owner approval; otherwise restore or separately implement agreed payment behavior without compromising authoritative checkout. |
| Admin local-order merge removal | `order.service.ts` `syncFromBackend` no longer retains local-only Orders. | **FIX BEFORE COMMIT** or obtain explicit Order owner decision and prove no required local-only records. |
| Broad server/startup changes | `server.js` removes automatic Staff drop and known-password admin provisioning; DB connection now precedes listen. `seed.js` changes seed credentials. | **KEEP — TEAM REVIEW** for operations and shared auth; the removal of unsafe automatic behavior is desirable, but existing setup instructions/accounts must be updated by their owner. |
| `.gitignore` virtualenv entry | Adds `.venv/`, useful for local tooling but not required by A/B. | **REVERT CANDIDATE** for minimal product commit; retain only if team wants the repository policy. |

## 8. Authentication compatibility review

Admin tokens are verified against a real Employee document; Customer tokens against a real active Customer. No client-supplied Customer ID is accepted for profile changes. A short/fallback JWT secret is rejected. Existing demo users or employees that relied on hardcoded fallback passwords, auto-created Admin accounts, or simulated reset will no longer log in; this was deliberately approved earlier, but the team must ensure actual accounts and a secure reset channel exist. `requireAdmin` checks a valid Employee `_id` and excludes `customer` role, but does not inspect an Employee active/disabled flag or role privilege; existing scope guards grant all persisted employees Admin route access. That is a security/authorization policy limitation requiring team review, not proof of a newly exploitable bypass. The login UI and API now need the same real credential path. The UI still describes customer email/phone login while the backend `customerLogin` looks up email only; verify expected customer-login contract before release.

## 9. Checkout and Order dependency review

The pricing formula implements `max(0, product subtotal - discount) + shipping fee` for valid nonnegative discounts; discounts are applied before shipping and `Math.round` handles percentages. Product sale price is required to be a safe integer; subtotal is checked. A Voucher is checked for activity, date, minimum subtotal, global quantity and per-customer use; stock and global Voucher count are reserved in the same transaction as Order creation. The request key and deterministic order code prevent duplicate accepted Orders on retries, though a simultaneous duplicate may return 409 rather than the already-created Order; test that retry UX if required.

**Integer VND gap:** existing Admin Shipping/Voucher models and write controllers accept decimal `fee`, fixed `discountValue`, and caps. `checkoutPricing.js` does not reject or round those stored values; a decimal total can therefore be written despite the approved integer-VND contract. Add validation at the checkout boundary and review how to handle already-persisted records, without silently converting USD or other records. The prior read-only Atlas sample found VND-sized integer values, not proof every record is valid.

**Shipping discoverability:** `/api/checkout/regions` removes nationwide-only configurations from its list. The UI accepts an arbitrary province via datalist, and the quote can match `Toàn quốc`, so checkout can still work; a fresh customer may not know which region to enter when only a nationwide configuration exists. Clarify the intended region source and test nationwide-only setup.

**Cart integration:** checkout requires real MongoDB Product ObjectIds; existing mock/catalog cart entries may not map to Product documents. The recorded E2E used seeded real IDs. Validate a normal product-card-to-cart path with real products before release, without weakening server price verification. This is an integration acceptance gap, not a proven newly introduced Admin test failure.

**Cancellation:** the new transactional rollback is limited to Orders marked with `checkoutRequestHash`; legacy/POS cancellation remains its prior path. On cancellation, updates to Product, Voucher, Customer do not check `matchedCount`, so a deleted referenced record can leave counters unadjusted while marking the Order cancelled. Review with Order/inventory owners; add an explicit behavior decision for deleted products/customers and repeated/concurrent cancellation. The separate pre-existing `updateOrderStatus` path can mark a delivered Order as paid; payment status policy deserves payment-owner review.

## 10. Database and API compatibility

Order fields `voucherId`, `shippingConfigId`, `shippingMethod`, `shippingProvince`, `checkoutRequestHash` are optional/additive, so existing Orders read with empty/null defaults. No Product, Customer, Voucher, Shipping, or Employee schema was modified in this Sprint 2 diff; existing collection data was not migrated. Existing Order list response gains Shipping fields. Admin CRUD settings and Order APIs now require an Admin JWT, so direct clients must supply a real token. `GET /api/checkout/regions`, shipping-options, quote and order creation are new endpoints; only profile endpoints require Customer JWT. The backend now requires MongoDB at startup and a configured JWT secret, which changes local setup. Transactional checkout requires a replica-set capable MongoDB, confirmed in the isolated local test; a standalone database will not satisfy this path. No shared database write was performed in the audit.

## 11. Admin test regression investigation

The baseline worktree at `8ae55fd` and the feature worktree ran the same `npm test -- --watch=false --reporters=json`, using the same lockfile and linked dependency installation. Results: **baseline 79 passed / 125 failed / 204 total; feature 79 passed / 125 failed / 204 total**. The 204 test identities match exactly, and a status-by-status comparison found **zero new failures and zero resolved failures**. The earlier 83/121 figure came from a different prior run and must not be used as the like-for-like regression delta.

| Affected baseline module | Failed tests | Main cause visible in first failures |
|---|---:|---|
| App shell, Homepage | 4 | Obsolete title/seed-count expectations. |
| Customer Management | 18 | Specs assume 125 seeded customers/10 first-page items; real HTTP service has no mocked response in unit context. |
| Contact and Review | 26 | Specs expect 48 contacts/342 reviews and service responses without HTTP mocks. |
| Category and Product | 30 | Specs expect 14 categories/348 products and seeded metrics; HTTP-backed services reject in unit context. |
| Room, Inspiration, Space | 21 | Specs expect demo rooms/inspirations/spaces or configured backend responses. |
| Shipping and Voucher | 26 | Specs expect 54 shipping/36 voucher fixtures; HTTP-backed services reject or components start empty. |
| **Total** | **125** | All were present at baseline with identical named-test status. |

These failures are a mixture of outdated demo-data expectations and missing HTTP test fixtures/environment. They do **not** establish working production behavior, and their baseline presence does not waive acceptance testing. No actual new Admin application regression was established by these tests. The previous production Admin CSS budgets also fail on unchanged Login, DataTable, and Homepage CSS; neither those styles nor `angular.json` changed in this Sprint 2 worktree. Do not silently raise global budgets.

## 12. Security findings

- **KEEP:** Reject fallback JWT secrets and known master/demo passwords, require persisted Employee/Customer identities, and guard Sprint 2 Admin configuration endpoints. Prior user authorization explicitly covered these changes. Never restore the bypass to make tests pass.
- **REVIEW:** Admin guard checks Employee existence but not a documented role or enabled state. Decide whether all employees should manage Voucher/Shipping/Orders/Customers; the current code grants them that authority.
- **REVIEW:** Fake OTP recovery has been disabled with HTTP 501; this closes an insecure reset path but leaves no self-service recovery. Coordinate a supported recovery process.
- **FIX:** Enforce integer VND and safe total bounds at server checkout even if Admin settings contain decimals or abnormal legacy values.
- **VERIFY:** The test fixture seed script contains `dropDatabase()` and a local-URI guard. Keep it as local-only evidence, never point it at shared Atlas or include it in deployment procedures.

## 13. KEEP / REVIEW / REVERT / FIX decisions

**KEEP:** Task 1 profile API/UI/Admin refresh; Task 2 checkout quote, shipping/voucher integration and additive Order snapshots; required Admin bearer-token forwarding; focused integration tests. **KEEP — TEAM REVIEW:** shared authentication/startup/seed behavior, route protection policy, checkout cancellation rollback, payment flow. **REVERT CANDIDATE:** unrelated registration activation, order-history feature and `.gitignore` tooling entry unless separately approved. **FIX BEFORE COMMIT:** corrupted history text if retained, local-only Admin Order merge loss or documented owner-approved alternative, integer VND checkout validation. Verify normal product-card cart and nationwide-only shipping path before calling the full customer flow accepted.

## 14. Proposed final commit file list

This is a **proposal after fixes/approvals**, not a staged list. Stage specific hunks in mixed files; do not use `git add .`.

**Core product files:** `livora_admin/src/app/app.config.ts`, `livora_admin/src/app/core/sprint2-admin-auth.interceptor.ts`, `livora_admin/src/app/customer_management/customer/customer.ts`, `livora_admin/src/app/login/login.html`, `livora_admin/src/app/login/login.ts`, `livora_admin/src/app/order_management/models/order.model.ts`, `livora_admin/src/app/order_management/order/order.html`, `livora_admin/src/app/order_management/order/order.ts`, `livora_admin/src/app/order_management/services/order.service.ts`; `livora_backend/server.js`, `.env.example`, `src/config/db.js`, `src/config/seed.js`, `src/controllers/authController.js`, `src/controllers/checkoutController.js`, `src/controllers/customerProfileController.js`, `src/controllers/orderController.js`, `src/models/Order.js`, `src/middleware/requireAdmin.js`, `src/middleware/requireCustomer.js`, `src/routes/authRoutes.js`, `src/routes/customerRoutes.js`, `src/routes/checkoutRoutes.js`, `src/routes/orderRoutes.js`, `src/routes/shippingRoutes.js`, `src/routes/voucherRoutes.js`, `src/services/checkoutPricing.js`; `livora_user/src/app/features/login/login.html`, `login.ts`, `features/module-3/cart/cart.html`, `cart.ts`, `features/module-3/payment/payment.html`, `payment.ts`, `features/module-5/module-5.html`, `module-5.ts`, `services/auth.service.ts`, `services/cart.service.ts`, `services/checkout.service.ts`.

**Tests and documents:** `livora_backend/test/checkout.integration.test.js`, `livora_backend/test/customerProfile.test.js`, `artifact/CUSTOMER_MANAGEMENT_DESIGN.md`, `artifact/SYSTEM_DESIGN.md`, `artifact/CUSTOMER_PROFILE_INTEGRATION_DESIGN.md`, `artifact/SETTINGS_CHECKOUT_INTEGRATION_DESIGN.md`, `artifact/SPRINT_2_IMPLEMENTATION_PLAN.md`, `artifact/SPRINT_2_IMPLEMENTATION_REPORT.md`, `artifact/SPRINT_2_IMPLEMENTATION_REPORT.docx`, and this audit. Evidence JSON, scripts and images can be included only after team decides repository retention; they are not necessary for runtime. Review `.gitignore` separately. Exclude all other worktree changes.

This list includes mixed files **only for their approved hunks** and does not override the fixes above. Because registration/history are entangled with some proposed files, stage only the resulting reviewed diff. The report and DOCX should be reconciled to actual final code and test counts before they are committed.

## 15. Items requiring teammate approval

1. **Payment/Order owner:** QR removal, bank-transfer pending workflow, success messaging, payment status expectations, and the local-order merge behavior.
2. **Order/inventory owner:** checkout-specific cancellation rollback, missing referenced records, counter semantics, and legacy POS compatibility.
3. **Backend/security/operations owner:** real Employee provisioning, route roles, disabled account behavior, disabled fake recovery, required JWT secret, startup DB requirement and seed changes.
4. **Customer experience owner:** whether the independent registration and order-history features may ship now; if yes, review their UI and restore readable text and expected actions.
5. **Team/data owner:** integer VND handling for any noninteger or USD historical records and normal catalog-to-checkout Product mapping. Do not silently reinterpret persisted money.

## 16. Original pre-commit recommendation (superseded by Section 17)

**CONDITIONAL GO — specific fixes and approvals required.** The like-for-like Admin suite has **0 new failing tests**, and focused local E2E supports the approved data flows. Yet the current diff has a visible broken order-history UI, an unreviewed payment workflow change, possible loss of local-only Orders, and a real integer-VND validation gap. Fix or split those hunks; obtain the listed owner decisions; then rerun the focused affected checks and update final evidence. Stop before commit or push. This audit has made no application changes.

## Appendix A. Per-file inventory

The table below is the authoritative 84-file inventory; each entry states the change, scope/necessity, unrelated behavior and risk, and disposition. For screenshots, the file itself is evidence only: an annotated derivative is not independent proof beyond its raw capture and run record.

| File | Type | Class | Actual change; necessity; unrelated behavior / compatibility risk | Decision |
|---|---|---|---|---|
| `.gitignore` | M +2/-1 | D/E | Ignore virtualenv; unrelated repo policy | REVERT CANDIDATE |
| `artifact/CUSTOMER_MANAGEMENT_DESIGN.md` | M +5/-0 | A/E | Document profile integration; shared doc only | KEEP — TEAM REVIEW |
| `artifact/CUSTOMER_PROFILE_INTEGRATION_DESIGN.md` | U (new; Git has no numstat) | A/E | Task 1 design; documentation only | KEEP |
| `artifact/SETTINGS_CHECKOUT_INTEGRATION_DESIGN.md` | U (new; Git has no numstat) | B/E | Task 2 design; reconcile integer-VND gap | KEEP |
| `artifact/SPRINT_2_IMPLEMENTATION_PLAN.md` | U (new; Git has no numstat) | E | Sprint plan; documentation only | KEEP |
| `artifact/SPRINT_2_IMPLEMENTATION_REPORT.docx` | U (new; Git has no numstat) | E | Generated report/images; update after final fixes | KEEP |
| `artifact/SPRINT_2_IMPLEMENTATION_REPORT.md` | U (new; Git has no numstat) | E | Report; prior Admin test count differs from controlled rerun | KEEP |
| `artifact/SYSTEM_DESIGN.md` | M +26/-0 | A/B/E/F | Document Sprint 2 architecture; shared contract | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser-results.json` | U (new; Git has no numstat) | E | Local browser run results; evidence only | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/admin-customer-detail-annotated.png` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/admin-customer-detail-annotations.txt` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/admin-customer-detail.png` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/admin-customers-annotated.png` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/admin-customers-annotations.txt` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/admin-customers.png` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/admin-orders-annotated.png` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/admin-orders-annotations.txt` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/admin-orders.png` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/customer-checkout-annotated.png` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/customer-checkout-annotations.txt` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/customer-checkout.png` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/customer-order-annotated.png` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/customer-order-annotations.txt` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/customer-order.png` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/customer-profile-annotated.png` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/customer-profile-annotations.txt` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/customer-profile.png` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/shipping-create-annotated.png` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/shipping-create-annotations.txt` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/shipping-create.png` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/shipping-list-annotated.png` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/shipping-list-annotations.txt` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/shipping-list.png` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/voucher-create-annotated.png` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/voucher-create-annotations.txt` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/voucher-create.png` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/voucher-list-annotated.png` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/voucher-list-annotations.txt` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/browser/voucher-list.png` | U (new; Git has no numstat) | E | Raw/annotated screenshot or annotation note from local browser run; evidence only, no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/database-and-security-results.json` | U (new; Git has no numstat) | E | Local DB/security and read-only Atlas results; evidence only | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/run_e2e.py` | U (new; Git has no numstat) | E | Local browser harness; no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/seed_local_e2e.js` | U (new; Git has no numstat) | E/F | Local-only fixture seeder with guarded dropDatabase; never use on shared DB | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/evidence/verify_local_e2e.js` | U (new; Git has no numstat) | E | Local DB verification harness; no runtime dependency | KEEP — TEAM REVIEW |
| `artifact/reports/sprint-2/make_docx.py` | U (new; Git has no numstat) | E | Report generator; no runtime dependency | KEEP — TEAM REVIEW |
| `livora_admin/src/app/app.config.ts` | M +3/-2 | A/B/C | Register scoped Admin token interceptor; required by API guards | KEEP |
| `livora_admin/src/app/core/sprint2-admin-auth.interceptor.ts` | U (new; Git has no numstat) | A/B/C | Attach Admin token only to scoped API routes | KEEP |
| `livora_admin/src/app/customer_management/customer/customer.ts` | M +10/-0 | A | Re-fetch detail from same Customer API; necessary profile synchronization | KEEP |
| `livora_admin/src/app/login/login.html` | M +2/-2 | C/F | Remove demo credential hint; real-account setup impact | KEEP — TEAM REVIEW |
| `livora_admin/src/app/login/login.ts` | M +2/-12 | C/F | Remove demo prefill; real-account setup impact | KEEP — TEAM REVIEW |
| `livora_admin/src/app/order_management/models/order.model.ts` | M +2/-0 | B/C | Add Shipping fields to Admin view model; additive | KEEP |
| `livora_admin/src/app/order_management/order/order.html` | M +4/-0 | B/C | Show Shipping snapshot; additive Order UI | KEEP |
| `livora_admin/src/app/order_management/order/order.ts` | M +3/-2 | B/C | Refresh detail after API load; necessary display integration | KEEP |
| `livora_admin/src/app/order_management/services/order.service.ts` | M +9/-10 | B/C/D/F | Add JWT and Shipping mapping; unrelated merge removal can hide local Orders | FIX BEFORE COMMIT |
| `livora_backend/.env.example` | M +1/-1 | C/F | Update JWT example; deployment setup impact | KEEP — TEAM REVIEW |
| `livora_backend/server.js` | M +14/-51 | B/C/F | Mount checkout and protect unsafe DB tools; remove auto admin/Staff drop; startup change | KEEP — TEAM REVIEW |
| `livora_backend/src/config/db.js` | M +2/-2 | C/F | Add DB-name test override; deployment configuration impact | KEEP — TEAM REVIEW |
| `livora_backend/src/config/seed.js` | M +5/-5 | C/F | Use environment seed passwords; teammate setup impact | KEEP — TEAM REVIEW |
| `livora_backend/src/controllers/authController.js` | M +11/-147 | A/C/D/F | Remove demo/master/fake OTP; registration validation is separate scope | KEEP — TEAM REVIEW |
| `livora_backend/src/controllers/checkoutController.js` | U (new; Git has no numstat) | B/C | Server quote/order transaction; validate integer money | FIX BEFORE COMMIT |
| `livora_backend/src/controllers/customerProfileController.js` | U (new; Git has no numstat) | A/D | Allowlisted profile CRUD; extra history endpoint separate | REVERT CANDIDATE |
| `livora_backend/src/controllers/orderController.js` | M +37/-3 | B/C/F | Add Shipping response and checkout cancellation rollback; shared counter risk | KEEP — TEAM REVIEW |
| `livora_backend/src/middleware/requireAdmin.js` | U (new; Git has no numstat) | A/B/C/F | Verify Employee JWT; role/disabled policy unresolved | KEEP — TEAM REVIEW |
| `livora_backend/src/middleware/requireCustomer.js` | U (new; Git has no numstat) | A/C | Verify active Customer JWT; required for profile | KEEP |
| `livora_backend/src/models/Order.js` | M +5/-0 | B/C/F | Add optional Voucher/Shipping/request fields; backward compatible | KEEP — TEAM REVIEW |
| `livora_backend/src/routes/authRoutes.js` | M +5/-0 | A/C/D | Wire profile routes; unrelated own-order history route | REVERT CANDIDATE |
| `livora_backend/src/routes/checkoutRoutes.js` | U (new; Git has no numstat) | B | Wire new Shipping/quote/order API routes | KEEP |
| `livora_backend/src/routes/customerRoutes.js` | M +1/-0 | A/C | Guard Admin Customer route; existing clients need JWT | KEEP — TEAM REVIEW |
| `livora_backend/src/routes/orderRoutes.js` | M +2/-0 | B/C/F | Guard legacy Admin Order route; existing clients need JWT | KEEP — TEAM REVIEW |
| `livora_backend/src/routes/shippingRoutes.js` | M +1/-0 | B/C | Guard Admin Shipping CRUD; checkout uses separate API | KEEP |
| `livora_backend/src/routes/voucherRoutes.js` | M +1/-0 | B/C | Guard Admin Voucher CRUD; checkout uses separate API | KEEP |
| `livora_backend/src/services/checkoutPricing.js` | U (new; Git has no numstat) | B/C | Compute Mongo-backed prices; integer-VND validation gap | FIX BEFORE COMMIT |
| `livora_backend/test/checkout.integration.test.js` | U (new; Git has no numstat) | B/E | Focused checkout integration tests | KEEP |
| `livora_backend/test/customerProfile.test.js` | U (new; Git has no numstat) | A/E | Focused profile tests | KEEP |
| `livora_user/src/app/features/login/login.html` | M +14/-5 | A/C/D | Add functioning signup fields; only real login is required | REVERT CANDIDATE |
| `livora_user/src/app/features/login/login.ts` | M +43/-11 | A/C/D/F | Use async real login; add independent signup/recovery change | KEEP — TEAM REVIEW |
| `livora_user/src/app/features/module-3/cart/cart.html` | M +4/-9 | B | Show server quote instead of fake local voucher/shipping amounts | KEEP |
| `livora_user/src/app/features/module-3/cart/cart.ts` | M +2/-2 | B | Bind cart voucher to quote; necessary checkout integration | KEEP |
| `livora_user/src/app/features/module-3/payment/payment.html` | M +23/-60 | B/D/F | Show real Shipping/VND; remove bank QR UI, payment risk | KEEP — TEAM REVIEW |
| `livora_user/src/app/features/module-3/payment/payment.ts` | M +132/-161 | B/C/D/F | Quote/place server Order; bank path altered and unverified | KEEP — TEAM REVIEW |
| `livora_user/src/app/features/module-5/module-5.html` | M +32/-217 | A/D/F | Bind profile; unrelated history rewrite has garbled text/actions lost | FIX BEFORE COMMIT |
| `livora_user/src/app/features/module-5/module-5.ts` | M +93/-5 | A/D | Persist profile; add independent history fetching/filtering | REVERT CANDIDATE |
| `livora_user/src/app/services/auth.service.ts` | M +117/-97 | A/C/D | Real Customer JWT/profile; extra registration/history methods | KEEP — TEAM REVIEW |
| `livora_user/src/app/services/cart.service.ts` | M +12/-14 | B | Use authoritative quote for totals; old shipping signal unused | KEEP |
| `livora_user/src/app/services/checkout.service.ts` | U (new; Git has no numstat) | B | Typed checkout API adapter | KEEP |

## 17. Scope cleanup outcome and final assessment

### Changes made after the audit

| Decision | Exact result |
|---|---|
| **Retained** | Customer profile save/load and Admin revalidation; configured Voucher/Shipping quote and transactional checkout; additive Order snapshots; JWT guards, real-account login, removal of demo/master-password bypasses and fake OTP reset; checkout-specific cancellation rollback. The `.venv/` ignore entry is retained because the isolated QA environment stores generated credentials there. |
| **Separated** | Removed new Customer Order History DTO, fetch, route and controller; restored the original history markup and actions while keeping editable profile fields. Removed newly active signup UI and frontend register method while keeping real login/profile integration. The pre-existing backend registration endpoint retains stronger validation as a security measure. |
| **Fixed** | Admin Order sync now retains only locally generated, unsynced POS Orders, excludes bundled demo Orders after backend load, and deduplicates by order code with backend confirmation taking precedence. Failed POS writes explicitly say “browser only”; no MongoDB persistence is claimed. Added Admin regression tests. |
| **Fixed** | Admin Voucher/Shipping writes reject fractional or unsafe VND monetary fields. Checkout independently rejects malformed persisted fees, free-ship thresholds, Voucher fixed discounts/caps/minimums, line subtotals and total values. No automatic USD reinterpretation or migration. Added backend regression assertions. |
| **Retained pending owner decision** | Bank-transfer UI creates a `pending` Order and states that transfer details need an official channel. The old QR modal could not be restored safely because it provided no verified settlement; no fake payment confirmation was reintroduced. COD remains operational. |
| **Reviewed and retained** | Shared startup changes remove unsafe default-account creation and automatic Staff collection deletion; backend waits for MongoDB. Checkout cancellation now aborts its transaction if a referenced Product, Voucher or Customer cannot be restored, rather than silently marking a partially reconciled Order cancelled. Ownership and recovery procedure remain open. |

### Repeat verification

- **Backend:** 6/6 focused tests passed on an isolated local MongoDB replica set. The checkout test now covers fractional Admin input, malformed persisted VND settings, idempotency, tampered totals, cancellation rollback and bank-transfer `pending` status.
- **Customer:** 19/19 tests passed after history/signup separation.
- **Admin:** Order service 14/14 passed, including two new local-order tests. The full suite with backend stopped: **206 total, 81 passed, 125 failed**. Against the clean baseline's 204 total, 79 passed, 125 failed, all 204 existing test identities retained exactly the same status; **0 newly introduced failures**. The two added tests passed. The Customer/Voucher/Shipping focused group had the same 44 failing baseline expectations and 8 passes.
- **Browser and DB:** A fresh Edge run passed 8/8 steps: Admin Voucher creation, Admin Shipping creation, Customer profile save/reload, Admin read of the same Customer, configured checkout and Admin Order read, with both real logins. Direct local MongoDB read confirmed matching Customer ID, Voucher code and Shipping config, exactly one Order and integer **2,570,000 VND** total. A separate bank browser run plus DB read found one bank Order with `paymentStatus=pending`; no settlement was claimed. The repeat run used a disposable local database. New browser output was kept in isolated temporary storage; the seven previously reported annotated screenshots and their raw files were not overwritten.
- **Harness notes:** Initial browser navigation timed out waiting for full `load`; a subsequent run stopped on Windows console encoding after Shipping creation. DOM-ready navigation and UTF-8 output yielded the final 8/8 pass. An initial DB check used the wrong expected fixture name; the corrected exact-name/ID/order assertion passed. These were harness issues, not application regressions.

### Remaining teammate approvals and limits

1. **Payment owner:** Decide bank transfer instructions, settlement/reconciliation and legacy POS's existing bank status behavior. The current Customer bank path is verified only through pending Order creation.
2. **Order/inventory owner:** Decide recovery when a Product, Voucher or Customer referenced by a checkout Order has been deleted, and the longer-term legacy POS pricing contract. The current rollback fails closed on missing references.
3. **Backend/security/operations owner:** Confirm Employee privilege/disabled-account policy, secure account recovery, required JWT secret, and revised startup/seed procedures.
4. **Data/catalog owner:** Audit any historical non-integer or USD monetary records before remediation; connect ordinary Customer product cards to Mongo Product IDs. No shared Atlas write or migration was performed.
5. **Environment owner:** Accept the two flows against a team-managed shared dev/test database when available. The isolated local E2E does not establish shared-environment acceptance.

**Final pre-commit assessment: CONDITIONAL GO.** The approved flows pass local end-to-end verification and no Admin test regression is newly introduced. Payment settlement, shared operational policy, historical data/catalog mapping and shared-database acceptance remain explicit conditions. No commit, push or merge was performed during cleanup.

**Index state at final inspection:** HEAD remained `8ae55fd`, but 86 paths were staged by an action outside this cleanup session while nine paths had newer unstaged changes and the cleanup summary remained untracked. The active index therefore does **not** contain the final verified working tree. Do not commit the current staged snapshot. Reconcile/stage the reviewed final diff and regenerate the commit file list after the teammate decisions; this cleanup did not modify the index.
