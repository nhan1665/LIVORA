# LIVORA Sprint 2 Implementation Plan

> Status: Implemented; final validation and reporting in progress. Baseline: `origin/main` at `8ae55fd` (2026-10-25).
> Working branch: `feature/customer-settings-integration` in an isolated worktree.

## Repository safety and scope

The original checkout is on `hung-room-management` and has two uncommitted backend dependency changes (`dotenv` version in `package.json` and its lockfile). Those files remain untouched. The Sprint 2 branch was created from the fetched `origin/main` in `.worktrees/customer-settings-integration`; no commit, push, reset, stash, or force operation is planned.

Scope: Customer Website profile update and Admin refresh from the same MongoDB Customer record; Admin Voucher and Shipping configuration consumed by Customer checkout; server-authoritative totals and order snapshots. Existing Room Management and unrelated modules remain outside the change scope.

## Verified current state

- Express/Mongoose backend, MongoDB models, and REST routes now exist. Admin Customer, Voucher, and Shipping services already call those routes. The older module reports describe earlier mock-service baselines and are not evidence of current persistence.
- Customer login accepts local demo credentials and even arbitrary six-character passwords before an asynchronous API result. Profile fields are display-only; Save does not send an update. Backend customer login also has a demo fallback and a universal test password.
- Admin Customer list calls the backend on navigation/filtering, but the modal initially uses the list projection; profile updates need a canonical self-service endpoint and detail revalidation.
- Checkout accepts two hard-coded voucher codes and two hard-coded shipping methods. It sends a client-computed shipping fee to `POST /api/orders`. The backend accepts that fee, increments voucher usage before order save, and allows product price/ID fallbacks. This is not a trustworthy integrated checkout.
- The original checkout contains an Atlas `.env`; the Sprint 2 worktree does not copy it. Atlas was audited read-only: 10 Products, 2 Vouchers, 5 Shipping configurations, and 2 Orders. Inspected monetary fields were integer VND-sized values; no migration or write was performed there. An isolated local MongoDB replica set on `127.0.0.1:27019` supplies disposable fixtures and transaction-capable integration tests.

## Implementation sequence

1. Reconcile currency, voucher base/rounding, shipping region rules, and authentication policy with the business source and team. Record unresolved shared-contract decisions explicitly.
2. Add authenticated customer `me` read/update endpoints with allowlisted fields, validation, unique-field conflict handling, and sanitized responses. Connect real Customer login and profile form to them. Revalidate Admin Customer detail/list after navigation or refresh.
3. Add public checkout quote endpoints that return eligible shipping methods and a server-calculated voucher/total quote from actual product prices. Keep Admin configuration routes protected by an approved admin token policy.
4. Make order placement validate the same references and prices server-side, persist voucher/shipping snapshots, and prevent duplicate submissions. Preserve existing payment flow and Admin Order response compatibility.
5. Add focused backend/frontend tests; run builds and applicable suites; perform browser and database checks only against a confirmed safe environment.
6. Write English design/report documents with exact test and database evidence, limitations, and an acceptance checklist. Generate DOCX and genuine screenshots if supported.

## Resolved contracts and remaining decisions

- Approved monetary contract: integer VND; voucher discount applies to eligible product subtotal only; final payable total is `max(0, subtotal - discount) + shipping fee`. No USD reinterpretation or conversion is authorized.
- Approved authentication change: remove demo/master password paths and require JWT plus persisted Employee identity for Admin Customer, Voucher, Shipping, and Order APIs. Customer profile uses its own JWT guard.
- The local test database is sufficient for development evidence. Access to an approved shared MongoDB dev/test environment remains unconfirmed, so shared-database acceptance remains open.
- The legacy Admin POS endpoint `POST /api/orders` remains for compatibility but now requires Admin authentication. It still uses a separate, historical POS pricing contract; unifying POS pricing and role-specific permissions requires team agreement.
- A verified payment account/provider and delivery channel for password recovery/confirmation email are not available. Bank transfer orders remain pending; the UI must not claim payment or email delivery.

## Acceptance evidence required

- Real profile save/reload and subsequent Admin API read show the same Customer ID and updated fields.
- Voucher and shipping options come from Admin-managed MongoDB records, are revalidated on order creation, and yield matching backend quote and persisted order totals.
- Negative/security cases reject unauthorized profile/admin changes, invalid products, expired/exhausted voucher, inactive/ineligible shipping, tampered totals, and duplicate submissions.
- Database and browser evidence is collected from an identified safe test environment; otherwise results are reported as unverified.
