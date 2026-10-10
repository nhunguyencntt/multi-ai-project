# IT-quanlytaisan V19.5

## Sửa lỗi
- Sửa lỗi tạo/sửa/xóa Bộ phận trong Cấu hình danh mục & thông số.
- API Bộ phận kiểm tra mã trùng rõ ràng, không làm crash request.
- Khi sửa tên bộ phận mà không đổi mã, frontend không gửi lại mã cũ; tránh lỗi unique `departments_code_unique` do dữ liệu biểu mẫu cũ.
- Xóa Bộ phận đang được tài sản/người dùng sử dụng bị chặn với thông báo rõ ràng.
- Hiển thị trạng thái bảo trì `liquidation` thành `Chờ thanh lý` thay vì tiếng Anh.
- Gia cố CSS modal quản trị tài khoản để nội dung bên phải không bị cắt trên màn hình hẹp.

## Dashboard
- Thêm Pie Chart tổng quan.
- Trung tâm biểu đồ hiển thị tổng tài sản.
- Các nhóm: Đang sử dụng, Sẵn sàng cấp phát, Hỏng/chờ sửa, Hư hỏng/chờ thanh lý, Helpdesk mới, Helpdesk đang xử lý.
- Click nhóm trên biểu đồ hoặc danh sách bên phải sẽ mở module liên quan.

## Database
- Không thêm bảng.
- Không thêm migration.
- Giữ nguyên database `it_quanlytaisan` và toàn bộ dữ liệu hiện hữu.

## Kiểm tra
- TS/TSX transpile: PASS — 101 files (excluding `.d.ts`).
- JS/MJS/CJS syntax: PASS.
- CSS brace balance: PASS.
- Production dependency/build chưa chạy được trong môi trường đóng gói nếu thiếu registry/dependency đầy đủ.
