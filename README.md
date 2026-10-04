# LIVORA

Website quản lý và bán sản phẩm của LIVORA.

## 1. Clone project

Mỗi thành viên clone repository về máy:

```bash
git clone https://github.com/nhan1665/LIVORA.git
```

Di chuyển vào thư mục project:

```bash
cd LIVORA
```

---

## 2. Kiểm tra branch

Sau khi clone, kiểm tra branch hiện tại:

```bash
git branch
```

Branch chính của project là:

```text
main
```

**Không code trực tiếp trên `main`.**

---

## 3. Cập nhật code mới nhất từ `main`

Trước khi bắt đầu làm việc, luôn cập nhật `main`:

```bash
git switch main
git pull origin main
```

---

## 4. Tạo branch cá nhân

Mỗi thành viên tạo **một branch riêng theo tên của mình**.

Ví dụ:

```bash
git switch -c ten-cua-ban
```

Ví dụ:

```bash
git switch -c nhan
```

Kiểm tra branch:

```bash
git branch
```

Nếu thấy:

```text
* nhan
  main
```

thì bạn đang làm việc trên branch `nhan`.

---

## 5. Push branch lần đầu lên GitHub

Sau khi tạo branch:

```bash
git push -u origin ten-branch
```

Ví dụ:

```bash
git push -u origin nhan
```

Sau lần push đầu tiên, những lần sau chỉ cần:

```bash
git push
```

---

## 6. Quy trình code hằng ngày

Sau khi đã ở branch cá nhân:

```bash
git status
```

Code và chỉnh sửa project bình thường.

Sau khi hoàn thành một phần công việc:

```bash
git add .
git commit -m "Mô tả thay đổi"
git push
```

Ví dụ:

```bash
git add .
git commit -m "Add customer management"
git push
```

---

## 7. Đưa code vào `main`

Sau khi hoàn thành phần code muốn đưa vào project chính:

1. Push code lên branch cá nhân.
2. Vào GitHub repository.
3. Tạo **Pull Request**.
4. Chọn:

```text
base: main
compare: branch-cua-ban
```

Ví dụ:

```text
main ← nhan
```

5. Kiểm tra code.
6. Nếu không có conflict, tiến hành **Merge Pull Request**.

### Không tự ý push trực tiếp vào `main`

Không sử dụng:

```bash
git push origin main
```

trừ khi team thống nhất cho phép.

---

## 8. Sau khi Pull Request được merge

Sau khi branch cá nhân đã được merge vào `main`, cập nhật `main` trên máy:

```bash
git switch main
git pull origin main
```

Sau đó quay lại branch cá nhân:

```bash
git switch ten-branch
```

Cập nhật branch cá nhân theo `main`:

```bash
git merge main
```

Nếu hiện:

```text
Already up to date.
```

thì branch đã đồng bộ.

Nếu có conflict, **không tự ý xóa hoặc ghi đè code của người khác**. Hãy báo cho team để cùng xử lý.

---

# 9. Quy trình chuẩn của team

```text
                 GitHub
                    │
                  main
                    │
          ┌─────────┼─────────┐
          ↓         ↓         ↓
        nhan       tan      thuan
          │         │         │
        code      code      code
          │         │         │
        push      push      push
          │         │         │
          └──── Pull Request ──┘
                    │
                    ↓
                  main
```

### Thành viên làm việc theo quy trình:

```text
1. git switch main
2. git pull origin main
3. git switch <branch-cá-nhân>
4. git merge main
5. Code
6. git add .
7. git commit -m "..."
8. git push
9. Tạo Pull Request
10. Merge vào main
```

---

# 10. Lưu ý quan trọng

### Không code trực tiếp trên `main`

`main` là branch chính dùng để chứa code đã được team thống nhất.

### Mỗi người chỉ code trên branch của mình

Ví dụ:

```text
nhan  → branch nhan
tan   → branch tan
thuan → branch thuan
van   → branch van
```

### Trước khi bắt đầu code

Luôn lấy code mới nhất:

```bash
git switch main
git pull origin main
git switch <branch-cá-nhân>
git merge main
```

### Trước khi tạo Pull Request

Đảm bảo code của branch cá nhân đã cập nhật với `main`:

```bash
git switch main
git pull origin main
git switch <branch-cá-nhân>
git merge main
git push
```

Sau đó mới tạo Pull Request.

---

# 11. Các lệnh Git thường dùng

### Xem branch hiện tại

```bash
git branch
```

### Xem trạng thái code

```bash
git status
```

### Tạo branch mới

```bash
git switch -c ten-branch
```

### Chuyển branch

```bash
git switch ten-branch
```

### Lấy code mới từ GitHub

```bash
git pull origin main
```

### Thêm code vào commit

```bash
git add .
```

### Commit

```bash
git commit -m "Mô tả thay đổi"
```

### Push

```bash
git push
```

### Cập nhật branch hiện tại theo `main`

```bash
git merge main
```

---

# 12. Cấu trúc project

```text
LIVORA/
│
├── livora_user/
│   └── ...
│
├── livora_admin/
│   └── ...
│
└── README.md
```

Repository sử dụng **một Git repository duy nhất** cho toàn bộ project LIVORA.

Các thư mục `livora_user` và `livora_admin` thuộc cùng một repository và sử dụng chung workflow Git.

---

## Quy tắc chung

> **Không push trực tiếp vào `main`.**
>
> **Mỗi thành viên code trên branch riêng.**
>
> **Code → Commit → Push → Pull Request → Merge vào `main`.**
>
> **Luôn Pull code mới nhất từ `main` trước khi bắt đầu công việc.**
