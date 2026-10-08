# LIVORA — Admin Room Management Module Design

> **Status:** Team-approved module design; implementation is authorized by the current `APPROVED IMPLEMENTATION` brief.  
> **Assigned developer:** Tong Phuoc Hung.  
> **Primary coding scope (2026-10-08 correction):** the complete Admin `room_management` group: Room, Inspiration, Space, and the read-only Design List.

## Scope Correction / Architecture Change Log — 2026-10-08

The latest approved assignment explicitly includes all seven local Figma exports and the three existing routes. Sections below that describe Inspiration and Space as another owner's future work record the earlier Room-only phase and are superseded by this correction. The verified Room page, its tests, and its QA evidence remain the implementation baseline. No backend, customer editor, Product CRUD, or new sidebar route is authorized.

| Admin view | Route | Distinct domain and actions |
|---|---|---|
| Room catalog | `/rooms/list` | Room categories; existing verified list/create/edit/view/status behavior. |
| Inspiration catalog | `/rooms/inspirations` | Editorial concepts with one Room and many eligible Products; list/create/edit/view/hide. A tagged Product can belong to many Inspirations. |
| Space List | `/rooms/spaces` (Space tab) | Reusable 3D space templates with one Room, metric dimensions, a `.glb` model reference, and active state; list/create/edit/view/status. |
| Design List | `/rooms/spaces` (Design tab) | Customer-created RoomDesign records referencing Space and Room; list/filter/page/view details only. |

The source `REPORT.docx` sections 3.3.2.4–3.3.2.5 and Tables 20–21 distinguish Inspiration editorial content, Space templates, and saved customer designs. Table 21's `RoomDesigns` collection combines templates (`isTemplate=true`) and customer designs; the Admin view separates them. The Figma-specific Inspiration `code`/`version`, Space `code`/`dimensions`/`version`/status, and direct `spaceId` association for a saved design are **provisional frontend mock fields**, not approved database fields. `slug` is not silently treated as `code`. The final API owner must reconcile these fields, indexes, migrations, and relationship shape.

Inspiration publication requires an existing active Room and Products that exist and are currently eligible for sale. Tagged Products carry `productId`, `xPercent`, and `yPercent` in the REPORT schema; percentages stay in `[0,100]`. Hiding a referenced Inspiration is blocked in the mock; deleting is not offered. Space dimensions are positive finite length/width/height values in **metres**; area is derived in square metres. A Space requires an existing active Room and `.glb` model selection for creation. The mock stores file metadata only and never claims a server upload. Active Spaces are eligible for the Room Designer; customer designs are read-only and are not deleted when a Space changes state. The exact production file-size/storage/security contract and live dependency semantics remain pending team/API approval.

The following Room-only planning sections are retained as a historical record of the approved first phase; their previous scope exclusions and placeholder descriptions do not describe the expanded implementation.

## 1. Goal and Scope

Design the room-list and create/update forms in `livora_admin`, following business rules in `artifact/REPORT.docx` and the existing route/shell. The module must share one canonical Room catalog with Product, Inspiration, Space, and the Customer frontend through a team-approved API contract.

### Proposed in-scope work

- List page at the existing `/rooms/list` route.
- Display, search/filter, pagination, and loading/empty/error states.
- Open create/update forms; validate; display save success/failure.
- View details if confirmed as an acceptance requirement.
- Change active state (hide/deactivate) only after the dependency rule and action confirmation are approved.
- Reuse the Admin shell/sidebar and suitable shared components.

### Out of scope for this coding task

- Inspiration CRUD/editor and hotspot pinning.
- Space 3D management, GLB upload, versioning, and Design/customer list.
- Customer Room Designer/AI, Product CRUD, backend/database implementation, and auth/role implementation.
- Excel import/export. These buttons appear in the Room list reference, but no business rule/API/export contract is documented; the team must decide whether to include them.
- Hard deletion of Rooms. The default proposal is not to hard-delete, to avoid broken references; this requires team approval.

## 2. Requirement Sources and Business Rules

1. `REPORT.docx` section 3.2.2.6 (Table 12): manage the room list by adding, editing, and deleting room categories used to classify/tag products by room.
2. Section 3.3.2.4 (Figure 27 and accompanying description/rules): view list, add/update, hide; enter code, name, description, image, and status; room code is unique; name is required; validate before saving; do not hide data in use by related system information; report save errors.
3. Section 3.4.2.4 (Table 19): `Rooms` collection has `_id`, `name`, `slug`, `description`, `thumbnail`, `displayOrder`, and `isActive`.
4. Local Figma screenshots: the list has code/image/name/category/description/status/actions/toggle/pagination; the modal has code, operational status, name, description up to 400 characters, and representative image.

### Status rules

- `isActive=true` is the current DB proposal; confirm the mapping to the UI label “Hoạt động” (“Active”).
- `isActive=false` is proposed to mean “Ngừng hoạt động” (“Inactive”)/unavailable for new use on the website. Do not automatically interpret it as deleted or hidden from Admin.
- Delete and hide/deactivate are different operations. `REPORT.docx` uses “delete” in the use case and “hide” in the BPMN; the BPMN describes hiding by changing status to “Ngừng hoạt động”. The team must approve the canonical behavior.
- A Room may be referenced by Product (`roomIds`), Inspiration (`roomId`), or RoomDesign (`roomId`). REPORT says not to hide data in use; define “in use” and the action when references exist. Proposed behavior: API checks dependencies and returns a conflict; UI explains the reason and does not remove relationships automatically.

## 3. Room Model and UI Mapping

### Current schema in the specification (no schema source in the repository)

```ts
interface Room {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  displayOrder: number;
  isActive: boolean;
}
```

This illustrates the projection in Table 19; it is not an existing code or API file. Optionality of `description`/`thumbnail` needs confirmation from the backend owner. The table does not describe `createdAt`, `updatedAt`, `code`, `dimensions`, or audit fields.

| UI field in reference | Mapping currently identifiable | Limitation/decision needed |
|---|---|---|
| Room code (for example, `RM-LIV-01`) | No field in schema; `slug` is the closest URL field, but is not equivalent to a business identifier. | Decide on a separate immutable, unique `code` or use `slug`. This blocks the contract. |
| Room name | `name` | Required by business rules. |
| Representative image | `thumbnail` | Needs an API upload/storage URL and accepted format/size/dimensions. |
| Architectural description | `description` may map to the UI description | The list screenshot labels it “Mô tả kiến trúc & phong cách” (“Architectural style description”); confirm that this is `Room.description` and whether 400 characters is the limit (shown in the modal). |
| Room category/group under the name | No dedicated field; it might be part of description, but do not infer its meaning. | Confirm the label/source field. |
| Area (`68 m²`) | No field in the Room schema. | Do not derive it from RoomDesign dimensions unless agreed; confirm removal or the field/source. |
| Status | `isActive` boolean | Confirm label/semantics; it is not soft delete. |
| Display order | `displayOrder` | Could control public sorting; screenshot does not show an order editor. Agree on default/sort behavior. |
| `_id` | ObjectId serialized as a string | API/frontend identity; do not show it instead of the business code without approval. |

### Relationships

- Product schema has `roomIds: ObjectId[]`; one Product may be associated with multiple Rooms.
- Inspiration schema has `roomId`; each Inspiration links to one Room according to the specification.
- RoomDesign schema has `roomId`; a template/customer design links to a Room.
- The Room list should not embed full Product/RoomDesign aggregates; the API may return counts if approved.

## 4. Planned Components and Routes

### Routes

- Keep the current navigation route `/rooms/list` in `livora_admin/src/app/app.routes.ts`.
- Do not add a separate detail/edit route if modal CRUD is the chosen UI; modal state stays in the page.
- Do not change Sidebar. It already has `/rooms/list`, `/rooms/inspirations`, and `/rooms/spaces`.
- Do not introduce lazy loading for this small task without a shared architecture decision.

### Planned components

| Component | Responsibility | Reuse |
|---|---|---|
| Existing `Room`/Room list page | Page container, query/filter/page state, modal state, Service orchestration | Keep route and shell; current Component is only a placeholder. |
| Room list/table view (initially inline, or split if needed) | Code, image, name, description, status, actions | Use `DataTable` if layout, slot/template, responsive table, and action semantics fit. |
| Search/status filters | Code/name search and active filter | Use `FilterBar` if its number of filters and reset behavior fit; otherwise review before modifying a shared Component. |
| Room form | Add/edit draft, field validation, image-selection state | Use `FormModal` if form layout/size/focus fit; Room owns the form body. |
| Deactivation confirmation | Explain action and dependency conflict | Use `ConfirmDialog` if content can be configured; do not use generic “delete” for deactivation. |
| Pagination | Page/pageSize/total | Use either `Pagination` or `DataTable` pagination; select one controller to avoid double pagination. |

Avoid many wrapper layers for a single screen. Split feature subcomponents when that improves clarity/reuse. No shared UI changes are proposed initially.

## 5. Service/API Dependencies

No Room API is present in the repository. None of the endpoint shapes below has been verified to exist.

### Required contract capabilities (proposal)

- List Rooms with `search`, active-state filter, sort, `page`, `pageSize`, and total record count.
- Get a Room detail if the edit modal needs fresh data.
- Create Room; update Room; update active state with dependency validation.
- Upload/register the thumbnail; define stable URL, file/type/size limits, retry/cancel behavior.
- Enforce unique code/slug on the backend; return field-specific conflict errors.
- Define caller permissions (role/content permission), concurrency/version checks, audit logs, and behavior when a Room has references.

### Proposed Service interface (not an implementation)

```ts
interface RoomService {
  listRooms(query: RoomListQuery): Observable<RoomListResponse>;
  getRoom(id: string): Observable<Room>;
  createRoom(request: CreateRoomRequest): Observable<Room>;
  updateRoom(id: string, request: UpdateRoomRequest): Observable<Room>;
  setRoomActive(id: string, isActive: boolean): Observable<Room>;
}
```

Apply this only after team/backend-owner approval. Do not add fake URLs or `of(mockRooms)` to a Component to imply production behavior. If a mock prototype is required, put it behind the same Service interface and label it clearly as a demo.

### Proposed query/result for review

```ts
interface RoomListQuery {
  search?: string;
  isActive?: boolean;
  page: number;
  pageSize: number;
  sortBy?: 'name' | 'displayOrder' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}

interface RoomListResponse {
  items: Room[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
```

`createdAt` is absent from Room Table 19, so do not use it as a sort field until the API confirms it. If the backend uses different query/pagination shapes, convert them in the Service mapper.

## 6. Proposed Validation

Rules supported by sources and rules requiring clarification are separated:

| Field/rule | Basis | Proposed handling |
|---|---|---|
| Room name | REPORT: required | Trim whitespace; show an inline error and focus the field on submit. Backend/team must confirm a length limit. |
| Room code | REPORT: required/unique in BPMN and screenshot; no schema field | Do not implement until the field/canonical format is approved. If `RM-XXX` is approved, validate only the agreed grammar; uniqueness is checked on the server and conflicts attach to the field. |
| Description | REPORT includes it as input; screenshot marks it optional and 400 chars | Confirm optionality/max 400. If approved, enforce the same limit in frontend and server contract. |
| Thumbnail | REPORT requires an image in the workflow; screenshot requires it | Confirm required/optional. Check MIME, size/dimensions server-side; a client preview does not mean upload succeeded. |
| `isActive` | Boolean in schema; operational status in screenshot | Approve create default (for example, require an explicit active choice). Do not replace with an invented enum. |
| `displayOrder` | Number Int32 in schema | If absent from the form, backend supplies an agreed default; avoid sending a fake `0` indistinguishable from a real value. |
| Trim/duplicates | Text data | Normalize whitespace client-side; do not derive slug/code without an agreed rule; backend remains authoritative for uniqueness. |

## 7. Permissions, Status, and Confirmation

- REPORT assigns room catalog management to `super_admin` and `content_staff`; this is a proposed business mapping and is not enforced in source. Confirm the role/permission matrix before enabling actions.
- Backend must enforce permission for list/read/create/update/deactivate; hiding/disabling buttons is UX only.
- Deactivation needs a confirmation explaining that a Room may disappear from public/selection options. If the API returns a dependency conflict, the modal explains which entities use it and state remains unchanged.
- Hard delete is not part of the proposed list/form. If the team needs deletion, separately define soft delete/reference retention, restore, and audit behavior.
- On successful status change, refresh the list; on failure, retain the previous state. Do not optimistically update before retry/rollback behavior is contracted.

## 8. Loading, Empty, Error, Success, and Unsaved States

- **Initial loading:** show a skeleton/indicator in the table area; do not show “0 rooms” as empty before a response.
- **Empty:** explain there are no Rooms and show an add-room CTA if the caller has permission.
- **No search results:** say no results were found and provide a filter-reset button.
- **Load error:** concise message and retry button; preserve query/page when possible.
- **Save:** disable submit, show loading, and prevent double submission.
- **Validation error:** show near the field; retain the form/draft for server uniqueness/conflict errors.
- **Save success:** close the modal or show success according to the approved Admin pattern; reload/merge the server response.
- **Close with changes:** ask for confirmation before discarding unsaved changes.
- **Image upload:** make selected/uploading/error/preview/remove states clear; do not submit a placeholder URL.
- **Deactivate:** confirm before the request; dependency/API errors must not appear as success.

## 9. Design Reference Mapping

| Local image | Meaning for this module | Notes |
|---|---|---|
| `Danh sách phòng - LIVORA Admin.png` | **In scope:** layout, toolbar, search/status filters, table, state badge, actions, toggle, page summary. | The screenshot includes Excel import/export, area, and architectural description; there is no API/schema contract for these, so functionality is not promised. |
| `popup thêm mới phòng.png` | **In scope:** modal fields for code/status/name/description/image, validation hints, cancel/save. | Code and dimensions do not align with schema; confirm the 400-character description limit and file spec. |
| `Danh sách cảm hứng - LIVORA Admin.png` | Inspiration catalog, Room lookup, status, linked Product counts. | Implemented in the expanded scope with session data. |
| `popup thêm mới cảm hứng.png` | Inspiration editor, image preview, Room, Product hotspots and coordinates. | Implemented; image selection is session-only. |
| `Quản lý không gian - Danh sách không gian - LIVORA Admin.png` | Space template list, metric dimensions, GLB metadata, Room and status. | Implemented in the expanded scope. |
| `Quản lý không gian - Danh sách thiết kế - LIVORA Admin.png` | Read-only customer design list and details in the Space route. | Implemented with representative mock records. |
| `popup thêm mới không gian.png` | Space form, Room lookup, dimensions and validated GLB selection. | Implemented; no server upload exists. |

Images show a brown sidebar, ivory background, serif heading, brown CTA, light table, pill badges, and a wide desktop Admin canvas. Exact font/spacing/breakpoint measurements are not confirmed from live Figma; local screenshots provide visual references only.

## 10. Post-Approval Implementation Plan

1. Finalize `code`/`slug`, model, Room visibility/reference rule, permissions, image upload, and API pagination.
2. Confirm shared components and UI tokens with their maintainers; avoid global style changes if Room-local CSS is sufficient.
3. Add typed Room DTO/query/response and mapper/Service based on the supplied API.
4. Build the list/filter/status/pagination and integrate loading/empty/error states.
5. Build add/edit form/image behavior, inline validation, API conflict handling, and dirty-form confirmation.
6. Build deactivation confirmation according to approved semantics; do not implement hard delete by default.
7. Run build/tests, route/navigation, permission UX, and valid/invalid/error/loading form cases.
8. Run the real app, capture actual output screenshots, compare each in-scope screen with the Figma export, and create the report/evidence in later authorized phases.

## 11. Proposed Acceptance Criteria

- `/rooms/list` opens from Sidebar inside the existing Admin shell; page has a title and accessible controls.
- The list uses typed Service data; search/status/page reset and total records match the query contract.
- Display thumbnail/name/description/status and the approved canonical business identifier; do not infer area from Space.
- Add/edit sends only request DTO fields; required/length/file errors appear at their fields; server conflicts do not discard the draft.
- Loading/empty/no-results/error/retry/success/unsaved-close states are handled separately.
- Status deactivation has confirmation; dependency errors preserve state; there is no hard delete unless approved.
- UI follows approved patterns/tokens, works at acceptance viewports, and has basic keyboard/focus/alt-text support.
- No changes to Inspiration/Space/Product/customer modules or shared API types outside reviewed scope.
- Build/test/screenshot outcomes are reported only when commands/capture actually ran; do not claim pixel-perfect matching without comparison.

## 12. Uncertainties/Blockers Before Implementation

1. Canonical key: a new `code` or `slug`? Need field, uniqueness/index, and format.
2. Does Room have dimensions/area? The Room list screenshot has area, absent from Table 19.
3. Is “Architectural description” the same as `Room.description`? Is the 400-character limit approved?
4. Is the thumbnail required or optional; what storage/upload/API contract applies?
5. Is real Excel import/export required? Where are its columns, access rules, bulk validation, and error report specified?
6. What is the rule when a Room is referenced by Product/Inspiration/RoomDesign, and how is “in use” defined?
7. What are the exact roles/permissions? There is currently no backend auth guard/Admin session.
8. What are the API base URL, endpoints, response envelope, server/client pagination, sort, error shape, and version?
9. What are the approved design tokens, icon source, font assets, and responsive viewport?
10. Live Figma frame inspection has not been performed; local references are the available visual source.

## 13. Team Review Checklist

- [ ] Room fields and canonical ID/code/slug are approved.
- [ ] Status, deactivate/hide/delete, and dependency rule are finalized.
- [ ] API, upload, permission, and pagination contract are confirmed.
- [ ] Area/dimensions are confirmed for the Room list or removed from it.
- [ ] Excel import/export scope is decided.
- [ ] Shared components/tokens and responsive expectations are approved.
- [ ] Dependencies with Inspiration, Space, Product, and Customer consumers are reviewed.
- [x] This document is approved; the current brief records the `APPROVED IMPLEMENTATION` authorization.

## 14. Verified Implementation Snapshot

The current Admin Room page is implemented at the existing `/rooms/list` route. The implementation contains:

- A standalone page Component with search/status filtering, seven-row pagination, loading skeleton, empty/no-result/error/retry states, and save feedback.
- Create, edit, and read-only view modes using the existing shared `FormModal`, plus a shared `ConfirmDialog` for deactivation.
- A feature-local typed model and `RoomService` backed by in-memory demo fixtures. No API/database persistence exists; demo changes reset when the app reloads.
- Room code stored as a provisional feature/mock field and validated against `RM-...`; no API DTO or database mapping is asserted. `code` versus `slug` remains an integration decision.
- Demo-only relationship snapshots that block deactivation when a Room is referenced. Real use/dependency checks require a backend contract.
- Image selection preview and validation for type, maximum size, dimensions, and 16:9 ratio; no real upload endpoint.
- Room-specific CSS is imported from Admin `src/styles.css`, with all selectors scoped beneath the `app-room` host. This avoids the existing per-component style-size budget while isolating Room presentation.

Excel import/export remains disabled. The Area column is omitted from Room because it is absent from the approved Room schema. Inspiration and Space are implemented in the expanded assignment described below.

## 15. Expanded Module Implementation (2026-10-08)

The existing `/rooms/list` page and eleven Room tests remain the verified baseline. `/rooms/inspirations` now has a typed `InspirationService`, `InspirationRecord`/`InspirationDraft`, and a separate `EligibleProductService` fixture boundary. The screen supports code/title/style/description search, Room/status filters, five-row pagination, create/edit/read-only view, visibility confirmation, image preview, and editable Product hotspots with X/Y percentages. `published` maps to visible; `hidden` maps to unavailable on the public side. The mock blocks hiding one fixture that is marked as referenced. This is an illustrative guard, not a live relationship query. The `INS-...` code, version, and hotspot note are provisional UI fields; Table 20 provides `slug`, `viewsCount`, `taggedProducts`, and `status` but no code/version/note.

`/rooms/spaces` now hosts the Space List and read-only Design List as two tabs. `SpaceService` and `DesignService` keep distinct typed data. A Space template records a provisional `KG-...` code, one Room, name/description, positive length/width/height in metres, derived area/volume, active state, version, and session-only GLB file metadata. The file picker checks extension, size (demo cap 50 MB), GLB magic, version 2, and declared byte length. It does not upload the file or store its bytes. The mock prevents activation without a model and allows deactivation without deleting customer designs. The precise production GLB cap, content scan, storage URL, and version contract still need backend approval.

`DesignRecord` is a read-only Admin projection of customer RoomDesigns with provisional `spaceId` linking it to the Space template, plus design/customer codes, product codes, and creation time for the exported list. The Admin does not create, edit, delete, or publish customer designs. The REPORT `RoomDesigns` collection lists `roomId`, `customerId`, `file3DUrl`, `layoutData`, `suggestedProducts`, `isTemplate`, and `createdAt`; the relationship between the template and saved design, authorization for customer data, and list DTO must be finalized by the API owner. Mock records demonstrate list/search/filter/page/detail only.

All new mutations reset on reload. No API endpoint, database collection, or Product catalog mutation was introduced. The existing Admin sidebar and three route definitions are unchanged. `catalog.css` is imported from Admin `styles.css` and scoped under `app-inspiration`/`app-space`; Room CSS remains under `app-room`. A session-only `RoomUsageService` now registers newly saved Inspiration and Space references before Room deactivation, without replacing the preserved Room fixture snapshot. The final development build and focused 28-test suite passed. Production build still fails in unchanged Homepage and shared DataTable component CSS budgets; the same three unrelated Admin specs fail as previously replayed against clean HEAD. Edge interaction verification and visual evidence are recorded in the expanded implementation report.

### Verified outcomes

- `npm run build -- --configuration development`: passed.
- `npm test -- --watch=false --include=src/app/room_management/room/**/*.spec.ts`: 2 spec files passed; 11 tests passed.
- `npm run build`: application bundle generation completed, then the command failed on existing production budgets in untouched `shared/data-table/data-table.css` and `homepage/homepage.css`.
- `npm test -- --watch=false`: 48 passed, 3 failed in untouched App, Sidebar, and Homepage specs.
- No browser automation/screenshot capture was available. Actual UI screenshots and visual/responsive comparison remain outstanding; manual evidence steps are in `artifact/reports/room-management/evidence/README.md`.

## 15. Architecture Change Log

| Date | Change | Rationale/compatibility impact | Status |
|---|---|---|---|
| 2026-10-08 | Added a feature-local typed in-memory `RoomService`. | Keeps Components independent of mock details and leaves a Service boundary for later API integration. State is session-only and is not database persistence. | Implemented; API contract still required. |
| 2026-10-08 | Added provisional Admin mock `code` and `RM-...` input validation. | The current workflow/UI requires a unique room identifier while Table 19 does not include `code`. No shared DTO/DB schema changed. Backend mapping to `code` or `slug` remains unresolved. | Reversible; team/backend contract decision remains required. |
| 2026-10-08 | Scoped `room.css` selectors under `app-room` and imported the file from Admin global styles. | Avoids the current 8 kB per-component style budget and avoids affecting other Admin routes; adds a feature stylesheet import to `src/styles.css`. | Development-build verified. |
| 2026-10-08 | Used local feature table/filter/pagination markup while reusing `FormModal` and `ConfirmDialog`. | Fits the visual reference without changing shared widget behavior. | Implemented; screenshot comparison is documented in the full module report. |
