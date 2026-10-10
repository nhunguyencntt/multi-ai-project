# IT-quanlytaisan V19.12

## Fix: Quản trị tài khoản – Quyền theo vai trò

- Sửa lỗi checkbox quyền theo vai trò không thể bật/tắt ở một số module.
- Khi thay đổi quyền, giao diện cập nhật ngay và đồng bộ lại với API/database.
- API cập nhật quyền theo vai trò xử lý cả trường hợp dữ liệu permissionRules có bản ghi trùng role/module, tránh cập nhật nhầm một bản ghi.
- Bổ sung kiểm tra cấp quyền ở backend: tài khoản không được sửa vai trò ngang/cao hơn; Administrator vẫn có toàn quyền.
- Bổ sung khu vực `Quyền theo nhóm tùy chỉnh` để cấu hình trực tiếp quyền Xem/Thêm/Sửa/Xóa cho từng nhóm người sử dụng.
- Không thay đổi schema database trong bản này.
