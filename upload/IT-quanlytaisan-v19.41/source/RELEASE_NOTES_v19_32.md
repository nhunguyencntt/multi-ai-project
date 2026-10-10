# IT-quanlytaisan v19.32

## Sửa lỗi Bảo trì & Sửa chữa
- Danh sách chọn thiết bị hạ tầng hiển thị đúng `Mã thiết bị · Tên thiết bị`, không thêm dấu gạch ngang khi không có địa chỉ IP.
- Bổ sung checkbox “Liên kết Helpdesk Ticket” trong biểu mẫu bảo trì tài sản và hạ tầng.
- Khi checkbox được chọn và không chọn ticket có sẵn, hệ thống tự tạo ticket Helpdesk từ yêu cầu bảo trì, ghi rõ thiết bị, mã thiết bị, nội dung sự cố và ghi chú; hồ sơ bảo trì lưu liên kết đến ticket mới.
- Nếu người dùng chọn ticket hiện có, hồ sơ liên kết đến ticket đó và không tạo ticket trùng.

## Hiệu ứng giao diện
- Phân bố các chấm màu trên toàn bộ khung nhìn, chuyển động mượt và phản hồi theo vị trí con trỏ.
- Dùng các hạt dạng nét ngắn nhiều màu thay vì chỉ tạo vệt sáng kết nối.

## Lưu ý triển khai
- Không thay đổi cấu trúc bảng hoặc yêu cầu reset database.
- Cần chạy kiểm tra TypeScript, test và build trong môi trường triển khai trước khi đưa lên production.
