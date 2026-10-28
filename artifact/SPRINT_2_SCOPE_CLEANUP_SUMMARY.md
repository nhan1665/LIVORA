# LIVORA Sprint 2 Scope Cleanup Summary

**Branch:** `feature/customer-settings-integration`

**Assessment at cleanup verification:** **CONDITIONAL GO**. No commit, push, merge or shared Atlas write had been performed at that point.

**Git state:** HEAD remains `8ae55fd`. At final inspection, 86 paths were staged outside this cleanup session, nine had newer unstaged edits, and this summary was untracked. Do not commit the current index; stage the reviewed final content after owner decisions.

## Retained, separated and fixed

| Outcome | Change |
|---|---|
| Retained | Customer profile persistence and Admin refresh; real Customer/Admin authentication; Admin Voucher and Shipping checkout integration; server-authoritative VND quote and transactional Order creation; checkout-specific cancellation rollback. `.venv/` remains ignored to keep generated local QA credentials out of Git. |
| Separated | New Customer Order History API/UI and newly active signup UI were removed from Sprint 2. The prior history markup was restored. The pre-existing backend registration endpoint and stronger input validation remain. |
| Fixed | Admin Order sync retains unsynced local POS Orders without duplicating backend-confirmed Orders or reloading demo Orders. Failed POS writes explicitly say “browser only.” |
| Fixed | Admin settings writes and checkout reject fractional/unsafe VND amounts. Existing MongoDB values are not silently converted or migrated. |
| Pending | Prior bank QR confirmation cannot be restored safely without verified settlement. Customer bank Orders remain `pending`; COD continues to work. |

## Verification

- Backend focused tests: **6/6 passed**, including VND validation, idempotency, rollback and pending bank status.
- Customer suite: **19/19 passed**.
- Admin Order service: **14/14 passed**. Admin full suite after cleanup: **81 passed / 125 failed / 206 total**. The clean integration baseline was **79 passed / 125 failed / 204 total**; all original 204 test outcomes are unchanged, and the two new tests pass. Newly introduced test failures: **0**.
- Fresh Edge run on disposable local MongoDB: **8/8 steps passed**, including Customer Profile to Admin and Admin Voucher/Shipping to Customer checkout and Order. Direct MongoDB read confirmed the same Customer ID, configured Voucher and Shipping, one Order and integer **2,570,000 VND** total. A separate bank browser/DB check confirmed one `pending` Order.
- The seven original annotated browser screenshots and their raw evidence remain unchanged. The implementation DOCX was regenerated from the updated English Markdown and contains seven genuine annotated screenshots.

## Remaining teammate approvals

1. **Payment owner:** Bank-transfer instructions, settlement/reconciliation, and legacy POS bank payment status.
2. **Order and inventory owner:** Recovery when a referenced Product, Voucher or Customer is missing during cancellation, and legacy POS pricing behavior.
3. **Backend and operations owner:** Employee privilege policy, secure password recovery, JWT/startup/seed procedures.
4. **Data and catalog owner:** Review any historical USD or noninteger records before remediation and map ordinary Customer catalog cards to persisted Product IDs.
5. **Environment owner:** Accept both integrations against a shared team dev/test MongoDB when available. Verification to date used only an isolated local replica set; no shared Atlas write occurred.

The detailed findings and per-file inventory are in `SPRINT_2_PRE_COMMIT_AUDIT.md`; implementation behavior, tests and screenshots are in `SPRINT_2_IMPLEMENTATION_REPORT.md` and `.docx`.
