# IT-quanlytaisan v13

## Fix lỗi trang Hệ thống và cấu hình thông số kỹ thuật

- Sửa lỗi nghiêm trọng trong `server/api.ts`: `assetSpecificationFieldCategories` được sử dụng ở nhiều API nhưng bị thiếu trong danh sách import từ `drizzle/schema.ts`. Đây là nguyên nhân trực tiếp của lỗi runtime `ReferenceError: assetSpecificationFieldCategories is not defined` khi mở Hệ thống.
- Sửa cấu trúc mã bị lệch: một khối route inventory/network/helpdesk/report trước đây bị đặt nhầm bên trong `validateSpecificationValues()`, khiến các route đó không được đăng ký. Khối code chết này đã được loại bỏ; các route chính được đăng ký tại `registerAssetApi()`.
- Bảo vệ API đọc thông số kỹ thuật bằng `try/catch`, trả lỗi HTTP an toàn thay vì tạo unhandled rejection.
- Bảo vệ API nhật ký hoạt động `/api/system/activity/logs`.
- Giữ cơ chế ghi nhật ký `/api/system/activity/page` không được phép làm dừng Express process.
- Bổ sung migration/repair `0011_v13_system_hardening.sql`, idempotent, để bảo đảm các bảng `assetSpecificationFieldCategories`, `systemUserSessions`, `systemActivityLogs`, `reportTemplates` tồn tại và backfill liên kết thông số kỹ thuật nhiều loại tài sản.
- `pnpm db:upgrade` luôn chạy repair pass v9-v13; không seed lại dữ liệu sản xuất.

## Kiểm tra trước đóng gói

- Đã kiểm tra cú pháp/transpile toàn bộ 107 file `.ts/.tsx` trong source: OK.
- Đã kiểm tra cú pháp các script Node `seed-db.mjs`, `setup-db.mjs`, `verify-db.mjs`: OK.
- Đã kiểm tra tính nhất quán import schema: không còn schema symbol nào được import nhưng không tồn tại.
- Không thể chạy production build/khởi động MySQL thật trong môi trường đóng gói hiện tại vì môi trường này không có `node_modules` runtime đầy đủ và không thể thực hiện npm registry install. Vì vậy trên Ubuntu cần chạy `pnpm build` trước `pnpm start`.
