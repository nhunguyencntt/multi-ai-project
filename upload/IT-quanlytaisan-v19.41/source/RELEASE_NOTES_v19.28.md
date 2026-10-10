# IT-quanlytaisan v19.28

## Sửa giao diện và bảo trì
- Thêm hiệu ứng ánh sáng tương tác theo vị trí con trỏ trên màn hình đăng nhập và Dashboard; có hỗ trợ `prefers-reduced-motion`.
- Sắp xếp nhóm HỆ THỐNG theo thứ tự: Cấu hình danh mục & thông số, Quản trị tài khoản, Hệ thống.
- Trang Bảo trì & Sửa chữa tải từng nguồn dữ liệu độc lập để lỗi quyền/dữ liệu của một API không làm trống toàn bộ bảng.
- Bộ lọc Hạ tầng & Mạng hiển thị toàn bộ thiết bị hạ tầng, kể cả thiết bị chưa có hồ sơ bảo trì; thiết bị đã có hồ sơ sẽ hiển thị dữ liệu hồ sơ và ticket liên quan.
- Sửa giá trị ticket trong biểu mẫu bảo trì: ưu tiên mã ticket, tương thích mã dạng số/ID; API tìm ticket theo mã và dùng ID làm phương án dự phòng.

## Triển khai
Không có migration cơ sở dữ liệu mới. Sao lưu source và database trước khi triển khai; chạy `pnpm install`, `pnpm check`, `pnpm test`, `pnpm build` trong môi trường Node/pnpm của máy chủ.
