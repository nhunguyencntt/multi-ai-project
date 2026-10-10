# IT-quanlytaisan V19.11

## Thay đổi
- Helpdesk: đổi thẻ “Tất cả trạng thái” thành “Trạng thái tài sản sau ticket”; hiển thị theo kết quả phân loại sau ticket, ưu tiên trạng thái đã lưu trong lịch sử xử lý và fallback về trạng thái thực tế của tài sản.
- Quản lý cấp phát & thu hồi: thay cụm thẻ thống kê đầu trang bằng Pie Chart; click lát biểu đồ hoặc nhóm bên phải để lọc danh sách theo trạng thái.
- Bảo trì & Sửa chữa: thay cụm thẻ thống kê đầu trang bằng Pie Chart; click lát biểu đồ hoặc nhóm bên phải để lọc theo phạm vi hồ sơ tương ứng.
- Dashboard: đổi tiêu đề “Biểu đồ tổng quan trạng thái” thành “Biểu đồ tổng quan”.
- Không thay đổi schema/database trong bản này.

## Kiểm tra
- TS/TSX transpile syntax: PASS cho Home.tsx, HelpdeskPage.tsx, ticketFilters.ts, server/api.ts, drizzle/schema.ts.
- ZIP integrity: kiểm tra sau khi đóng gói.
- Chưa chạy production build trong môi trường đóng gói vì không có node_modules đầy đủ.
