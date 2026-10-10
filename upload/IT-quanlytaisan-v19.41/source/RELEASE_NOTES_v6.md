# IT-quanlytaisan v6

## Mục tiêu
Bản v6 giữ nền tảng v5 và bổ sung workflow tài sản - Helpdesk - bảo trì - cấp phát, quản lý danh mục tại chỗ, responsive layout và báo cáo Excel.

## Thay đổi chính
- Layout shell chuyển sang grid/flex ổn định, không còn khoảng trắng lớn phía trên và có responsive theo viewport.
- Quản lý Bộ phận / Địa điểm / Loại tài sản thao tác ngay trong modal, không reload Dashboard.
- Tài sản có trường `Người sử dụng` dạng text; Serial Number trở thành tùy chọn.
- Thêm trạng thái `Hư hỏng - chờ thanh lý` (`damaged`).
- Helpdesk ticket có thể gắn với tài sản.
- Hồ sơ bảo trì có thể liên kết Helpdesk ticket; hoàn tất sửa chữa tự chuyển tài sản về `Sẵn sàng cấp phát`.
- Quản lý cấp phát có biên bản bàn giao và thu hồi, có chức năng in biên bản.
- Báo cáo gồm: tổng tài sản; theo phòng ban; phòng ban đang hư hỏng/sửa chữa; xuất Excel `.xls`.
- Database migration 0006 bổ sung userText, asset status damaged, ticket-asset relation và maintenance-ticket relation.

## Migration
Chạy `pnpm db:setup` một lần trên database hiện hữu để áp dụng migration v6. Script có bảng `itq_schema_versions` để tránh áp dụng 0006 nhiều lần. Không chạy seed lại nếu chỉ nâng cấp database hiện hữu.

## Lưu ý
Bản v6 được kiểm tra syntax/TypeScript và package integrity trong môi trường đóng gói. Build production cuối cùng nên chạy trên Ubuntu server có registry npm/pnpm hoạt động.
