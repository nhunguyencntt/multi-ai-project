# IT-quanlytaisan v1.1.0

## Quản trị cấu hình thông số kỹ thuật

- Thêm module `Hệ thống -> Cấu hình thông số kỹ thuật`.
- Xem toàn bộ trường kỹ thuật từ MySQL.
- Tạo trường mới và gán cho `Dùng chung` hoặc một `Loại tài sản` cụ thể.
- Sửa tên, đơn vị, kiểu dữ liệu, thứ tự và trạng thái.
- Bật/tắt trường mà không mất dữ liệu.
- Xóa trường có xác nhận; các giá trị của trường bị xóa theo.
- Hỗ trợ kiểu `text`, `number`, `textarea`.
- Có cờ `Bắt buộc`; API cũng kiểm tra bắt buộc để không thể bỏ qua validation bằng request trực tiếp.
- Trường số được kiểm tra dữ liệu dạng số ở API.
- `legacy_specifications` được giữ dữ liệu để tương thích nhưng tắt khỏi giao diện cấu hình mới.

## Tài sản

- Form tài sản tiếp tục tải trường kỹ thuật theo loại tài sản.
- Trường dùng chung xuất hiện cho mọi loại tài sản.
- Trường riêng chỉ xuất hiện cho đúng loại tài sản.
- `Chú thích` vẫn là trường ghi chú nghiệp vụ riêng.

## Triển khai

- Thêm systemd service mẫu.
- Thêm Nginx config mẫu.
- Thêm health check.
- Thêm backup MySQL + upload.
- Cập nhật DEPLOYMENT.md với quy trình production.
