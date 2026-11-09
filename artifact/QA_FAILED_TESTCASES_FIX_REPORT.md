# Báo cáo sửa lỗi các test case FAILED – LIVORA

- **Ngày:** 09/11/2026
- **Branch:** `fix/qa-failed-testcases` (tách từ `main` @ `71f2a65`)
- **Phạm vi:** 10 test case FAILED trong đợt QA (TC002, TC003, TC010, TC015, TC020, TC021, TC023, TC024, TC026, TC027). Các TC đã PASS không bị thay đổi hành vi, trừ những chỗ ghi rõ ở mục 3.

## 1. Tóm tắt

| TC | Lỗi QA báo | Nguyên nhân gốc | Trạng thái |
|---|---|---|---|
| TC002 | Đăng ký không thấy loading/thành công; không có nút quay về web; icon form lỗi; đăng nhập sai không báo | Nút Đăng nhập không có trạng thái loading; lỗi chỉ là dòng chữ đỏ nhỏ trên nền mờ; icon ổ khóa và icon con mắt cùng nằm ở mép phải ô mật khẩu nên chồng lên nhau; trang login ẩn header nhưng không có link quay về | Đã sửa |
| TC003 | Phông chữ lỗi ở hồ sơ khách hàng | CSS global gán mọi `h1–h6` font serif *Playfair Display*, còn trang hồ sơ dùng *Inter* → tên khách, tiêu đề mục, tên sản phẩm bị lẫn 2 font | Đã sửa |
| TC010 | Không thấy chỗ nhập số lượng / hình; thêm SP bên admin không hiện bên user | Form **có** ô tồn kho (tab 1) và ảnh (tab 3, ghi "Tùy chọn") nhưng không có validate, tồn kho mặc định `null`. Nghiêm trọng hơn: trang phòng bên user gọi `GET /api/products/seed-mock-products` (public, `force=true`) **mỗi lần mở trang**, ghi đè dữ liệu 5 phòng mặc định và các SP mẫu (random tồn kho, reset phòng/ảnh), gán lại thiết kế khách hàng; admin cũng tự seed khi < 50 SP | Đã sửa |
| TC015 | Duyệt hoàn tiền báo "Đơn hàng liên kết không tồn tại" | BUG-01/02/03 đúng như QA mô tả, thêm: số tiền hoàn đọc `order.finalAmount` (không tồn tại → `undefined`), API hoàn tiền không có xác thực admin | Đã sửa |
| TC020 | Click "Liên hệ chúng tôi" page bị mất | Link footer là `href="#"` → trình duyệt điều hướng tới `/#`, tải lại toàn trang | Đã sửa |
| TC021 | Chưa đăng nhập vẫn thêm được vào giỏ | `CartService.addToCart` không kiểm tra đăng nhập | Đã sửa |
| TC023 | Cảm hứng mới chỉ xem | Modal chỉ có 1 icon giỏ hàng nhỏ, không có "Mua ngay"; `redirectToProduct` xóa `selectedRoom` trước khi đọc nên luôn mở sai phòng | Đã sửa |
| TC024 | Nút "Đặt mua" trong danh sách thiết kế không hoạt động | Nút chỉ âm thầm thêm vào giỏ + toast, không đưa sang thanh toán | Đã sửa |
| TC026 | Voucher khi chưa đăng nhập không phản hồi; đăng xuất vẫn còn giỏ của tài khoản cũ; chính sách mua hàng là file CV; "Mua ngay" chuyển sang giỏ thay vì thanh toán | API trả 401 nhưng `refreshQuote()` nuốt lỗi; giỏ hàng lưu chung 1 key `livora_cart` cho mọi tài khoản; file "chính sách" được upload nhầm là CV cá nhân và **đã bị commit vào repo**; `buyNow()` điều hướng `/cart` | Đã sửa (file chính sách cần admin upload lại – xem mục 4) |
| TC027 | Hủy đơn ở tra cứu không cập nhật bên admin | Trang tra cứu **không kiểm tra kết quả API** (`apiSuccess` không được dùng): luôn báo "hủy thành công", ghi `cancelled` vào localStorage dù backend lỗi. Ngoài ra trang thanh toán tự **bịa mã đơn** `ORD-LIV-xxxxxx` khi backend từ chối tạo đơn → đơn "ma" chỉ có ở trình duyệt, admin không bao giờ thấy | Đã sửa |

## 2. Chi tiết từng lỗi và cách sửa

### TC015 – Hoàn tiền (BUG-01, BUG-02, BUG-03)

**Backend – `livora_backend/src/controllers/refundController.js`**
- BUG-02: gọi `sendPaginated(res, { items, page, pageSize, totalItems, totalPages, stats })` đúng chữ ký helper. Response giờ có `data` + `pagination` + `stats`.
- BUG-01: so khớp SĐT qua `order.customerInfo.phone`, tên khách qua `order.customerInfo.fullName`.
- Số tiền hoàn tính từ `order.totalAmount` (trước đây `finalAmount` không tồn tại trên model).
- Phê duyệt: chỉ xử lý hồ sơ `pending` (409 nếu đã xử lý), kiểm tra đơn liên kết tồn tại (404 với đúng câu "Đơn hàng liên kết không tồn tại trong hệ thống."), không cho hoàn vượt giá trị đơn, cập nhật `paymentStatus = 'refunded'`. Từ chối bắt buộc lý do ở cả backend.
- Danh sách trả thêm `orderTotalAmount` của đơn thật.

**Backend – `routes/refundRoutes.js`**: `GET /api/refunds`, `PATCH /api/refunds/:id/status`, `POST /api/refunds/policy` yêu cầu token admin. `POST /api/refunds` (khách gửi yêu cầu) và `GET /api/refunds/policy` vẫn public.

**Admin – `order_management/services/refund.service.ts`** (viết lại): bỏ dữ liệu mock cứng (`ord-004`, `REF-260302-02`…) và cache localStorage; danh sách, thống kê, duyệt/từ chối đều gọi backend kèm token admin; hiển thị đúng thông báo lỗi từ backend. Key cũ `livora_admin_refunds` được xóa khi mở trang. Component `refund.ts` chuyển sang async.

> Lưu ý cho QA: hồ sơ `REF-260302-02` / `LIV-260301-889` là dữ liệu giả và sẽ **không còn xuất hiện**. Để test TC015 cần tạo yêu cầu hoàn tiền thật qua `POST /api/refunds` với mã đơn + SĐT của một đơn `confirmed/processing/delivered`.

### TC027 – Hủy đơn từ trang tra cứu

**User – `features/module-6/module-6.ts`**: chỉ báo "hủy thành công" khi backend trả `success`; nếu lỗi thì hiện đúng thông báo của backend trong modal. Gửi kèm token khách (nếu đã đăng nhập) và SĐT của đơn (khách vãng lai).

**Backend – `orderController.cancelOrder`**: trước đây ai biết `_id` đơn cũng hủy được (không xác thực). Giờ chấp nhận một trong ba: token admin; token khách sở hữu đơn; hoặc SĐT trùng SĐT đặt hàng. Khách chỉ được tự hủy khi đơn đang `pending/confirmed/processing`. Nhật ký hoạt động ghi đúng người hủy (trước đây luôn ghi "Quản trị viên (Admin)"). Endpoint nhận cả `_id` lẫn mã đơn.

**User – `payment.ts`**: khi backend từ chối tạo đơn, hiển thị lỗi thay vì bịa mã `ORD-LIV-xxxxxx` và hiện popup thành công.

### TC021 / TC026 – Giỏ hàng, Mua ngay, Voucher

**User – `services/cart.service.ts`** (viết lại):
- Giỏ hàng lưu theo tài khoản (`livora_cart:<customerId>`). Đăng xuất / đổi tài khoản → giỏ, địa chỉ, voucher của phiên trước bị xóa khỏi màn hình; đăng nhập lại thì giỏ cũ của đúng tài khoản đó quay lại. Key chung cũ `livora_cart` bị xóa.
- `addToCart()` yêu cầu đăng nhập: khách chưa đăng nhập được chuyển tới `/login?returnUrl=<trang hiện tại>&reason=cart`, trang login hiện thông báo "Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng…", đăng nhập xong quay về đúng trang.
- "Mua ngay" (`buyNow()`): mở thẳng **trang thanh toán** chỉ với sản phẩm đó, không đụng tới giỏ đã lưu. Khách vãng lai vẫn dùng được (đúng TC026 mục 2: điền thông tin hoặc đăng nhập ngay tại trang thanh toán).

**User – `payment.ts/html` + `checkout.service.ts`**: khi áp mã mà API từ chối, hiện lý do dưới ô voucher; nếu là 401 thì hiện "Mã … chỉ áp dụng cho khách hàng đã đăng nhập" kèm link **Đăng nhập ngay** (quay về `/payment`). Mã bị gỡ và tổng tiền được tính lại không kèm voucher, để số trên màn hình khớp số sẽ trả.

**Chính sách mua hàng là file CV**: hai file `CV-BUSINESS_ANALYST-DUONG_TRONG_NHAN.pdf` trong `livora_backend/public/uploads/policy/` đã bị xóa khỏi repo, thư mục `public/uploads/` được thêm vào `.gitignore`. Xem mục 4 về việc upload lại.

### TC023 – Module cảm hứng
Modal không gian giờ có: nút **Thêm vào giỏ** (có chữ), nút **Mua ngay** cho từng sản phẩm, nút **Thêm tất cả vào giỏ**, và các điểm đánh số trên ảnh phòng (click để xem sản phẩm). Sửa `redirectToProduct` đọc phòng trước khi đóng modal. Sản phẩm không có ID thật/giá bị khóa nút mua.

### TC024 – Danh sách thiết kế
"Đặt mua" trên thiết kế đã lưu và nút "Tổng kết" trong planner giờ mở trang thanh toán với toàn bộ sản phẩm của thiết kế (qua `buyNow`). Thiết kế rỗng hiện thông báo.

### TC010 – Sản phẩm admin → user
- Bỏ lời gọi `seed-mock-products` ở trang phòng (user) và tự seed khi < 50 SP (admin). Endpoint này giờ trả 404 trừ khi `ENABLE_UNSAFE_DB_TOOLS=true` và có token admin. Seed khi khởi động server (không `force`) vẫn giữ nguyên.
- Form thêm/sửa sản phẩm validate: tồn kho là số nguyên ≥ 0, phải chọn ít nhất 1 phòng, phải có ảnh đại diện; lỗi tự chuyển sang đúng tab. Tab 3 đổi tên thành "Hình ảnh (bắt buộc) & Mô hình 3D".
- Storefront chỉ lấy sản phẩm "Đang kinh doanh" (`status=active`).
- Trang chủ chỉ hiện **sản phẩm bán chạy nhất**: theo đặc tả TC010, sản phẩm mới tạo (đã bán 0) sẽ không lên trang chủ cho tới khi có đơn hàng. Đây là hành vi đúng, không phải lỗi.

### TC002 – Đăng nhập / Đăng ký
Thêm link "Quay về trang chủ LIVORA"; nút Đăng nhập/Đăng ký có spinner và bị khóa khi đang gửi; thông báo lỗi/thành công dạng hộp màu có icon; bỏ icon ổ khóa đè lên icon con mắt ở 3 ô mật khẩu; ô tài khoản dùng icon người. `returnUrl` chỉ nhận đường dẫn nội bộ (chặn open-redirect `//evil.com`).

### TC003 – Phông chữ hồ sơ
Ép toàn bộ heading/legend/input trong trang hồ sơ dùng Inter; tên khách dài (email) tự xuống dòng; cỡ tiêu đề mục hợp lý hơn.

### TC020 – Liên hệ
"Liên hệ chúng tôi" → `routerLink="/home"` + `fragment="contact-section"` (bật `anchorScrolling`, có `scroll-margin-top` để không bị header che). "Theo dõi đơn hàng" ở footer → `/order-tracking`.

## 3. Thay đổi hành vi cần lưu ý

| Thay đổi | Ảnh hưởng |
|---|---|
| `GET/PATCH /api/refunds`, `POST /api/refunds/policy` cần token admin | Client nào gọi không kèm `Authorization: Bearer <livora_admin_token>` sẽ nhận 401 |
| `PATCH /api/orders/:id/cancel` cần token admin / token chủ đơn / SĐT đặt hàng | Admin web đã gửi token sẵn; tra cứu đơn đã gửi SĐT |
| `GET /api/products/seed-mock-products` mặc định 404 | Chỉ dùng như công cụ bảo trì |
| Khách chưa đăng nhập không thêm vào giỏ được, chỉ "Mua ngay" | Đúng TC021 |
| Giỏ hàng cũ trong localStorage (`livora_cart`) bị bỏ | Người dùng đang có giỏ sẽ thấy giỏ trống một lần |

## 4. Việc cần làm thủ công

1. **Upload lại file Chính sách mua hàng** (Admin → Đơn hàng → Hoàn tiền → Chính sách). DB đang trỏ tới file CV đã xóa nên link chính sách sẽ 404 cho tới khi upload file đúng.
2. **File CV vẫn còn trong lịch sử git** (commit `d3dc425` và các commit sau). Xóa khỏi working tree không xóa khỏi lịch sử; nếu cần gỡ hẳn dữ liệu cá nhân phải rewrite history (`git filter-repo`) – việc này ảnh hưởng mọi thành viên nên team cần thống nhất trước.

## 5. Kiểm thử đã thực hiện

Backend chạy trên MongoDB replica set riêng (container tạm, DB `livora_qa`), không đụng Atlas.

| Kiểm tra | Kết quả |
|---|---|
| `POST /api/refunds` với mã đơn + SĐT đúng (BUG-01) | 201, `amount` = tổng tiền đơn |
| `GET /api/refunds` không token / có token admin (BUG-02) | 401 / `data` + `pagination` + `stats` đầy đủ |
| Duyệt hoàn tiền (BUG-03) | `completed`, đơn chuyển `paymentStatus: refunded`; duyệt lần 2 → 409 |
| Hủy đơn: không chứng thực / SĐT sai / khách khác | 403, đơn giữ nguyên |
| Hủy đơn: SĐT đúng (theo mã đơn), chủ đơn, admin | 200, admin thấy `cancelled`; activity log ghi đúng người hủy |
| Quote voucher khi chưa đăng nhập | 401 "Vui lòng đăng nhập để sử dụng voucher." (UI đã xử lý nhánh này) |
| `seed-mock-products` | 404 |
| `ng build` admin + user | Thành công |
| Unit test `refund.service.spec.ts` (viết lại, mock `fetch`) | 4/4 pass |

**Chưa kiểm tra được:** giao diện chưa được click thử trên trình duyệt (máy không có Chrome để chạy tự động) – QA cần chạy lại TC002, TC003, TC020, TC021, TC023, TC024, TC026, TC027 trên UI.

**Test có sẵn đang fail từ trước (không do đợt sửa này):** chạy trên `main` cho kết quả giống hệt:
- `livora_backend/test/checkout.integration.test.js` – fail ở dòng 59 (`Missing expected rejection (CheckoutError)`), trước đoạn hủy đơn. Đã cập nhật 3 lời gọi `cancelOrder` trong test để truyền token chủ đơn và thêm case "người lạ hủy → 403", nhưng do lỗi ở dòng 59 nên đoạn này chưa chạy tới.
- `livora_backend/test/customerProfile.test.js` – "profile rejects administrative fields".
- Unit test admin: môi trường test không có `localStorage` nên mọi spec dùng localStorage đều lỗi; `voucher.service.spec.ts` có lỗi TypeScript chặn cả bộ test – đã sửa kiểu dữ liệu (1 dòng) để bộ test build được.

## 6. Danh sách file thay đổi

- Backend: `controllers/refundController.js`, `controllers/orderController.js`, `routes/refundRoutes.js`, `routes/productRoutes.js`, `test/checkout.integration.test.js`, xóa `public/uploads/policy/*.pdf`
- Admin: `order_management/services/refund.service.ts` (+ spec), `order_management/refund/refund.ts`, `product_management/product/product.ts|html|service.ts`, `settings/voucher/voucher.service.spec.ts`
- User: `services/cart.service.ts`, `services/checkout.service.ts`, `services/product.service.ts`, `features/login/*`, `features/module-3/*` (cảm hứng, giỏ hàng, thanh toán), `features/module-4/module-4.ts`, `features/module-5/module-5.css`, `features/module-6/module-6.ts`, `features/rooms/*`, `features/home/home.ts|css`, `layouts/footer/*`, `app.config.ts`
- Khác: `.gitignore`
