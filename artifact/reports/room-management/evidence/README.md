# Room Management QA Evidence Index

## Reference frames

- `references/Danh sách phòng - LIVORA Admin.png` — exported Room list frame.
- `references/popup thêm mới phòng.png` — exported create-room frame.

## Actual browser captures

Captured from the running Admin app at `http://127.0.0.1:4200/rooms/list` using Microsoft Edge with cached Playwright 1.64.0. Desktop viewport: 1317 × 982. Mobile viewport: 390 × 844.

- `implementation/room-list-1317x982.png` — actual initial list, seeded eight-room dataset.
- `implementation/room-create-1317x982.png` — actual empty create modal.
- `implementation/room-edit-1317x982.png` — actual edit modal before saving a QA description.
- `implementation/room-view-1317x982.png` — actual read-only details modal.
- `implementation/room-mobile-390x844.png` — actual mobile viewport capture.
- `implementation/room-create-mobile-390x844.png` — actual create modal at mobile viewport.
- `implementation/browser-interaction-results.json` — browser run summary.

The create interaction used a temporary 1920 × 1080 PNG rendered in-browser from an existing local Room thumbnail to exercise the actual upload validation. It was test input only; it is not presented as product imagery or screenshot evidence. Session data resets on reload.

## Annotated captures

The `*-annotated.png` images are the actual captures above with numbered visual markers drawn over them. The full-size original captures are retained separately.

- List: 1 title/actions, 2 filters, 3 table, 4 row status/actions, 5 pagination.
- Create: 1 title, 2 code/status row, 3 name, 4 description, 5 image upload, 6 footer actions.
- View: numbered markers identify the corresponding read-only field groups.
- Mobile: marker 4 identifies the clipped right edge at 390 px.

## Verified results and comparison notes

- Browser interaction run passed list, create, edit-save, view, case-insensitive search, active/inactive filtering, next/previous pagination, unreferenced reactivation, and referenced-Room deactivation protection. No page errors were reported.
- The empty create modal was compared with the exported frame. The Room-only banner was removed and the modal width was constrained to 680 px; both are visible differences that are now corrected.
- The list was compared with the exported frame. The list layout aligns. The existing Admin shell branding/top bar differs; it was preserved. The exported frame includes area/category data absent from the approved schema; no substitute field was invented. Excel actions remain disabled pending an approved workflow.
- At 390 px, browser measurements are `innerWidth=390`, `document/body scrollWidth=1208`, sidebar width 260 px, main width 948 px, and `app-room` width 892 px. The shared Admin shell clips the Room view; no shell changes were made in this Room-scoped pass.

For another manual capture, start `npm start` from `livora_admin/`, open `/rooms/list`, use the viewport sizes above, and save screenshots beside the files in `implementation/`. Do not overwrite the reference screenshots.

## Complete module extension (2026-10-08)

The original Room evidence above remains intact. The five additional exported frames are in `references/`: `Danh sách cảm hứng - LIVORA Admin.png`, `popup thêm mới cảm hứng.png`, `Quản lý không gian - Danh sách không gian - LIVORA Admin.png`, `Quản lý không gian - Danh sách thiết kế - LIVORA Admin.png`, and `popup thêm mới không gian.png`.

Genuine Edge captures corresponding to these references are `implementation/inspiration-list-1317x982.png`, `inspiration-create-populated-1317x982.png`, `space-list-1317x982.png`, `design-list-1317x982.png`, and `space-create-populated-1317x1200.png`. Each has a numbered `-annotated.png` companion created by `implementation/annotate-module-evidence.py`. The original captures are preserved. The populated Inspiration modal uses one Product hotspot entered in the browser; the populated Space modal uses a valid minimal 24-byte GLB test input. Neither is presented as backend persistence or an uploaded asset.

The earlier `space-create-populated-1317x982-annotated.png` is retained as intermediate evidence; the final report uses the 1317 × 1200 version because that viewport shows the full status and footer controls.

`implementation/module-browser-qa.js` drives the complete interaction pass. `implementation/module-browser-interaction-results.json` records **24 passing checks and zero page errors** from the final run. It also records 390 × 844 responsive checks for the Inspiration and Space modals, each of which fits the viewport. Additional viewport captures (`inspiration-mobile-390x844.png`, `inspiration-create-mobile-390x844.png`, `space-mobile-390x844.png`, `space-create-mobile-390x844.png`, `design-mobile-390x844.png`) show the existing Admin shell's 1,228 px horizontal document width on Design List. This shell overflow remains outside the feature-local changes.

The complete Markdown report and DOCX contain all seven visual comparisons. The Word-rendered PDF and selected page previews under `artifact/reports/room-management/` are report-layout QA evidence, not replacements for the original browser captures.
