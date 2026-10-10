# IT-quanlytaisan v19.31

## Fix: thông số kỹ thuật không hiển thị sau lần lưu đầu tiên
- Ghi tài sản và các thông số kỹ thuật trong cùng một transaction khi tạo mới.
- Chuẩn hóa cách lấy insertId từ các dạng kết quả của MySQL/Drizzle; có phương án truy vấn lại theo mã tài sản nếu driver không trả insertId trực tiếp.
- Xác minh số bản ghi thông số kỹ thuật đã lưu trước khi API trả thành công; nếu thiếu, transaction rollback và trả lỗi rõ ràng.
- Cập nhật thông số khi chỉnh sửa trong transaction để tránh xóa dữ liệu cũ nhưng ghi dữ liệu mới không đầy đủ.
- Frontend chỉ thông báo thành công sau khi đọc lại chi tiết tài sản từ API và xác nhận các thông số đã nhập có mặt.

## Lưu ý
- Không chạy migration xóa dữ liệu và không reset database.
- Cần chạy `pnpm check`, `pnpm test`, `pnpm build` trên môi trường triển khai có đủ dependencies trước khi thay bản đang sử dụng.
