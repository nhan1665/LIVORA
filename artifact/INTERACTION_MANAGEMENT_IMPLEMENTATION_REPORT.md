# LIVORA — Interaction Management Module Implementation Report

> **Module:** Quản lý tương tác (Interaction Management) — Admin
> **Scope delivered:** `/interactions/contact`, `/interactions/reviews`, `/settings/vouchers`, `/settings/shipping` (matching the six design references in `artifact/design-reference/Quản lý tương tác/`)
> **Documentation language:** Technical English.
> **No commit or push was performed.** All changes remain on branch `dat` as working-tree modifications for team review.

---

## 1. Deliverables

| File | Change |
|---|---|
| `livora_admin/src/app/interaction_management/contact/contact.model.ts` | New — typed Contact contracts (Table 28 alignment) |
| `livora_admin/src/app/interaction_management/contact/contact.service.ts` | New — session-only typed service, 48 demo contacts, resolve workflow |
| `livora_admin/src/app/interaction_management/contact/contact.ts` / `.html` / `.spec.ts` / `.service.spec.ts` | Reworked from placeholder into full list page, detail dialog, resolve confirmation, toast, 8 + 8 tests |
| `livora_admin/src/app/interaction_management/review/review.model.ts` | New — typed Review contracts (Table 26 alignment) |
| `livora_admin/src/app/interaction_management/review/review.service.ts` | New — session-only typed service, 342 demo reviews, hide workflow |
| `livora_admin/src/app/interaction_management/review/review.ts` / `.html` / `.spec.ts` / `.service.spec.ts` | Reworked placeholder into list page, detail dialog, hide dialog, 7 + 8 tests |
| `livora_admin/src/app/interaction_management/interaction.css` | New — host-scoped styles for contact/review plus shared page-shell rules |
| `livora_admin/src/app/settings/voucher/voucher.model.ts` | New — typed Voucher contracts (Table 27 alignment) |
| `livora_admin/src/app/settings/voucher/voucher.service.ts` | New — session-only typed service, 36 demo vouchers, create/update/toggle + validation |
| `livora_admin/src/app/settings/voucher/voucher.ts` / `.html` / `.spec.ts` / `.service.spec.ts` | Reworked placeholder into list page, detail dialog, create/edit dialog, 8 + 9 tests |
| `livora_admin/src/app/settings/shipping/shipping.model.ts` | New — typed Shipping contracts (Table 29 alignment) |
| `livora_admin/src/app/settings/shipping/shipping.service.ts` | New — session-only typed service, 54 demo configurations, create/update/toggle + validation |
| `livora_admin/src/app/settings/shipping/shipping.ts` / `.html` / `.spec.ts` / `.service.spec.ts` | Reworked placeholder into list page, create/edit dialog, 7 + 8 tests |
| `livora_admin/src/app/settings/settings.css` | New — host-scoped voucher/shipping styles and dialog form system |
| `livora_admin/src/styles.css` | +2 import lines only (`interaction.css`, `settings.css`) |
| Deleted `contact.css`, `review.css`, `voucher.css`, `shipping.css` | Empty placeholder component stylesheets no longer referenced (budget convention) |
| `artifact/reports/interaction-management/evidence/implementation/` | Browser QA script, results JSON, 10 screenshots (8 desktop + 2 mobile) |

Unchanged: `app.routes.ts`, `sidebar`, app shell, shared components, and all other members' modules. `git diff --stat` shows only the files above.

## 2. Implemented Behavior per Screen

**Contact (`/interactions/contact`)** — title, search (code/name/phone/email), status filter, 7/30-day time filter, "Đặt lại"/"Lọc", table card header with record badge and priority note, columns per reference, "Chi tiết" dialog, "Xử lý" confirmation → status "Đã xử lý" with toast, "Hoàn tất" indicator for resolved rows, numbered pagination with range footer.

**Review (`/interactions/reviews`)** — search (customer/product), star filter, visibility filter, product thumbnails/SKU, star rendering with "n/5 sao", flagged-account line, red italic comment for hidden reviews, eye action → detail dialog, eye-off action → hide dialog with reason → toast, disabled hide for already hidden rows.

**Voucher (`/settings/vouchers`)** — "+ Thêm voucher" button, search + type/status/time filters, two-line code badges, program title/description, discount pills, discount value with cap subtitle, minimum order, usage progress bar (`used/quantity`), date range, status pill, eye (detail) and pencil (edit) actions, on/off switch; create/edit dialog with code, title, discount-type radio cards, value/cap/min-order/quantity fields, validity date-time card, per-customer limit, release-status switch, inline validation banner, footer policy note. Voucher codes are validated as unique uppercase.

**Shipping (`/settings/shipping`)** — "+ Thêm cấu hình" button, province search + method/status filters, method pills with icons, province/hub, fee + note, ETA with clock icon, status pill, updated date, pencil + apply/pause switch; create/edit dialog with method selection cards, province select, standard fee, free-shipping toggle + threshold, ETA, committed time slot, White-Glove checkbox with price badge, inline validation banner, footer note.

## 3. Deviations from the Design References (recorded)

1. **App shell differs from the references.** The screenshots show a newer shell (breadcrumb "LIVORA > …", global search box, different user block). The shared shell (`app.html`, sidebar) is owned by the team and was intentionally left unchanged, so captures show the current shell navigation ("Dashboard > …").
2. **Pagination footer figures.** Reference screenshots are internally inconsistent (e.g. contact shows "1-5 of 48" with only five page buttons while 48/5 = 10 pages). The implementation favors consistent values (10 pages, "1 2 3 4 … 10") — see design doc §8.7.
3. **Generated fixture ordering.** Rows are sorted newest-first by their seeded timestamps; generated rows may appear above the five rows shown in the reference screenshots (e.g. shipping list starts with Thanh Hoá/Nam Định because their seeded `updatedAt` is later on the same day). All reference rows exist in the fixtures.
4. **Native form controls.** `datetime-local` inputs display in the browser locale (AM/PM in Edge en-US) instead of the reference's `dd/mm/yyyy HH:mm`; number inputs show raw digits without thousand separators. Both are native control behaviors; custom masking would be a shared-UI decision.
5. **Demo assets.** Review product thumbnails reuse the local `public/images/rooms/*` assets because the repository contains no product image set; contact/review/voucher time filtering is anchored to the seeded 2025-10-24 timeline (documented in the design doc).
6. **Voucher title split.** The reference renders program name and description as two lines ("Program — description"). The mock stores a single `title` and splits on "—" for display.

## 4. Verification Evidence

### 4.1 Development build
`npx ng build --configuration development` → **passed** (5.5 s), initial dev bundle 3.16 MB, no warnings related to the new code.

### 4.2 Automated tests (Vitest via `ng test`)
Final full-suite run: **202/204 tests passed; 32/34 files passed.**

- All 8 new/interaction-management spec files pass: **63 focused tests** across contact, review, voucher and shipping (services: fixture counts, search, filters, pagination, status transitions and error flows; components: initial load, filtering, reset, pagination, dialogs, create/edit/toggle flows).
- The 2 remaining failures are the **pre-existing, untouched** specs documented in `SYSTEM_DESIGN.md` §22:
  - `src/app/app.spec.ts > App > should render title` (`undefined` assertion mismatch);
  - `src/app/homepage/homepage.spec.ts > Homepage > should toggle item status…`.
  No interaction-management spec fails.

### 4.3 Browser verification (Microsoft Edge, Playwright, development build)
Script: `artifact/reports/interaction-management/evidence/implementation/run_interaction_qa.py` (isolated Python venv; Edge `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`, headless, 1317×982 + 390×844 checks). Results: **34/34 checks passed, 0 page errors** — see `interaction-browser-interaction-results.json`.

Covered: page titles, row counts, record badges and footers (48/342/36/54), contact status filter + reset + page 2 navigation + detail dialog + resolve confirmation → toast → row now "Đã xử lý"; review 5-star filter, hidden filter, reset, detail dialog, hide with reason → toast; voucher create dialog → create → total 36→37 → toggle → toast; shipping create dialog → create → total 54→55 → toggle → toast.

Screenshots (1317×982 unless noted): `contact-list`, `contact-detail`, `review-list`, `review-detail`, `voucher-list`, `voucher-create`, `shipping-list`, `shipping-create`, plus mobile checks `contact-list-mobile-390x844` and `voucher-create-mobile-390x844`.

Visual comparison result: layout, typography, badges, pills, switches, progress bars and dialog structures match the references. Differences are limited to the recorded deviations in §3. The mobile contact capture shows the existing Admin shell's horizontal document width (sidebar 262 px + content) — a pre-existing shared-shell behavior also recorded for the Room module, outside this feature's scope; the voucher dialog itself reflows correctly to one column at 390 px.

### 4.4 Production build (budget gate)
`npm run build` **fails at budgets**, with:

- Pre-existing failures (unchanged files): `src/app/shared/data-table/data-table.css` 9.15 kB vs 8 kB error, `src/app/homepage/homepage.css` 27.35 kB vs 8 kB error — identical to the values recorded in `SYSTEM_DESIGN.md` / Room report.
- **Newly crossed threshold:** initial bundle 1.04 MB vs the 1 MB error budget. Baseline measured on the same machine with this module's changes stashed: **888.88 kB** (already 388 kB over the 500 kB warning). This module adds ~151 kB raw initial payload (four pages, services, fixtures and 35 kB CSS), which pushes the cumulative bundle past the error line.
- No budget was changed and no shared CSS was edited to hide the failure. A route-level lazy-loading decision and/or budget review belongs to the team (proposal recorded below).

## 5. Remaining Issues & Verification Limits

1. **No backend.** All data is session-only demo data; create/edit/toggle/hide actions reset on reload. No HTTP contract, upload, or persistence is claimed.
2. **Fixture fidelity.** Names, messages and comments are demo content seeded from the references plus deterministic generation; they are not real customer data. Review images are empty by design (no upload contract) and product thumbnails reuse Room assets.
3. **Timezone/locale.** Date-time inputs and rendering follow the browser locale; a future API contract must define timezone handling.
4. **Mobile shell overflow.** The shared shell overflows at 390 px (pre-existing); feature pages themselves stack correctly (verified for the voucher dialog and contact list).
5. **No route guards.** Recorded in the design doc §7; permission enforcement is a team/back-end decision.

## 6. Proposals for Team Decision (not implemented)

- Extract a common Admin page-shell stylesheet (filter card, table card, pagination, status pills) instead of the current per-module duplication, with an owner and review.
- Lazy-load routes (or split the bundle) to address the initial-bundle error budget; keep the two pre-existing component-CSS budget items on the shared-UI owner's list as recorded earlier.
- Confirm the provisional fields listed in the design doc §8 before any API/DB work, so the mock models can be mapped or trimmed.
- Consider a shared confirm dialog variant with an optional reason input so other modules can reuse the review-hide pattern.

## 7. Status Checklist

- [x] Contact list, detail, resolve workflow implemented and verified (browser + tests).
- [x] Review list, detail, hide workflow implemented and verified.
- [x] Voucher list, create/edit, toggle implemented and verified.
- [x] Shipping list, create/edit, apply/pause implemented and verified.
- [x] Development build passes; no interaction-management test failures.
- [x] Browser QA 34/34 with zero page errors; screenshots compared with references.
- [x] Technical documentation written in English (`INTERACTION_MANAGEMENT_DESIGN.md` + this report).
- [ ] Production build budget gate (pre-existing component budgets + cumulative initial bundle) — team decision needed.
- [ ] API/DB contract for provisional fields — pending.
- [ ] Commit/push/PR — not performed; awaiting assignment.
