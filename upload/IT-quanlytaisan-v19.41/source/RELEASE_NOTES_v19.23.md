# IT-quanlytaisan v19.23

## Helpdesk – đồng bộ số lượng ticket trên menu

- Sửa lỗi badge số lượng **Helpdesk Ticket** ở thanh menu không cập nhật ngay sau khi xóa toàn bộ ticket trong trang Helpdesk.
- `HelpdeskPage` phát sự kiện cập nhật số lượng ticket lên `Home` sau khi tải, tạo, cập nhật, xóa hoặc chỉnh sửa lịch sử ticket.
- Khi API trả về `0` ticket, badge bên trái được cập nhật ngay về `0`, không phải chờ chu kỳ refresh 15 giây.
- Không thay đổi dữ liệu ticket, API hoặc cấu trúc database.
- Không chỉnh trực tiếp trên `dist/`.
