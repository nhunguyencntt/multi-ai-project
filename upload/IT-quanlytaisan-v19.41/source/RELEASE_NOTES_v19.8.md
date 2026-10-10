# IT-quanlytaisan v19.8

## Dashboard
- Đưa biểu đồ donut/Pie tổng quan trạng thái lên vị trí đầu tiên của nội dung Dashboard, ngay sau tiêu đề.
- Loại bỏ cụm thẻ số liệu phía trên Dashboard để tránh lặp thông tin.
- Pie/Donut kế thừa liên kết điều hướng: Tổng tài sản → Thiết bị & tài sản; Đang sử dụng → Thiết bị & tài sản (lọc trạng thái); Sẵn sàng cấp phát → Quản lý cấp phát; Hỏng/chờ sửa → Bảo trì & Sửa chữa; Hư hỏng/chờ thanh lý → Tài sản thanh lý; Helpdesk mới/đang xử lý → Helpdesk Ticket.
- Tâm biểu đồ là tổng tài sản và có thể bấm để mở Thiết bị & tài sản.
- Giữ khu vực Helpdesk mới & đang xử lý bên dưới để tiếp tục theo dõi công việc.
- Loại bỏ biểu đồ thanh trạng thái cũ trên Dashboard vì đã được thay thế bằng Pie/Donut tương tác.

## CSS
- Sửa thứ tự `@import` trong `client/src/index.css`: Google Fonts được đưa lên trước các rule CSS, tránh việc `@import` xuất hiện sau các rule khác.
- Kiểm tra cân bằng dấu `{}` và các rule responsive hiện hữu. Không thay đổi database/schema.

## Kiểm tra
- TS/TSX transpile syntax: PASS.
- CSS structural check: PASS.
- Database/migration files: không thay đổi trong bản phát hành này.
- Full `tsc --noEmit` và production build không thực hiện được trong môi trường đóng gói do workspace không có đầy đủ type definitions/dependency binaries; cần chạy `pnpm install --frozen-lockfile && pnpm check && pnpm test && pnpm build` trên Ubuntu/server có registry/dependencies đầy đủ trước khi triển khai.
