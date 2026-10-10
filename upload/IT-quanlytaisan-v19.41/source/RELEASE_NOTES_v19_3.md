# IT-quanlytaisan v19.3 — Cấu hình danh mục

## Nội dung thay đổi

- Tách hoàn toàn quản lý **Bộ phận**, **Địa điểm** và **Loại tài sản** khỏi trang **Thiết bị & tài sản** thành trang riêng: **Hệ thống → Cấu hình danh mục**.
- Trang **Cấu hình danh mục** dùng chung chính các bảng MySQL hiện có: `departments`, `locations`, `assetCategories`; không tạo database/bảng mới.
- Bổ sung giao diện tab/chọn nhóm danh mục, tìm kiếm, phân trang 12 dòng/trang, thêm, sửa, xóa.
- Giữ nguyên các trường Bộ phận/Địa điểm/Loại tài sản trong form tài sản để gán dữ liệu cho từng tài sản; chỉ tách phần quản trị danh mục khỏi màn hình chính.
- Các filter Bộ phận, Địa điểm và Loại tài sản trên Thiết bị & tài sản tiếp tục đọc cùng nguồn `/api/asset/meta`, nên không phát sinh dữ liệu trùng.
- Các API CRUD danh mục được chuẩn hóa quyền theo module `assets` (`canCreate`, `canEdit`, `canDelete`).
- Loại bỏ phần card quản lý danh mục cũ khỏi trang Thiết bị & tài sản.
- Giữ nguyên database và toàn bộ migration hiện có; **không cần migration mới** cho thay đổi này.
- Sửa một đoạn logic thừa trong trang Quản lý cấp phát để không tham chiếu biến `focus` của trang Bảo trì.

## Kiểm tra sau chỉnh sửa

- TS/TSX syntax/transpile: PASS — 109 file.
- JS/MJS/CJS syntax: PASS — 3 file.
- Kiểm tra symbol `MasterBox`: đã loại khỏi trang Thiết bị & tài sản.
- Kiểm tra route `catalog-settings`: có trong navigation và render trong `Home`.
- Kiểm tra API danh mục: `departments`, `locations`, `categories` dùng chung database hiện tại.
- Full `pnpm check/test/build` chưa thể chạy trong môi trường đóng gói vì thư mục `node_modules` hiện chỉ có TypeScript, không có dependency runtime/build của project.

## Database

Không thay đổi schema. Database production hiện tại tiếp tục sử dụng `it_quanlytaisan`.

## Khuyến nghị trước khi triển khai production

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm db:upgrade
sudo systemctl restart it-quanlytaisan
```
