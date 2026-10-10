# IT-quanlytaisan v9

## Mục tiêu
v9 tiếp tục từ baseline v8, tập trung vào ổn định màn hình đăng nhập, chống sập khi mở module Hệ thống, và chuẩn hóa lớp dữ liệu/phục vụ bộ lọc.

## Thay đổi chính
- Tách hoàn toàn layout đăng nhập khỏi `.itq-shell` bằng `.itq-auth-shell` và CSS desktop/tablet/mobile riêng.
- Thêm Error Boundary cho vùng nội dung module để lỗi UI không làm mất toàn bộ ứng dụng.
- Module Hệ thống: API settings, permission, system users và licenses/network có xử lý lỗi thay vì để exception async làm process chết.
- Thêm `db:upgrade` để cập nhật database không seed lại dữ liệu.
- Migration `0008_v9_filter_indexes.sql` bổ sung index cho các trường lọc: phòng ban, địa điểm, loại tài sản, trạng thái, serial, người sử dụng, ticket-tài sản, maintenance-tài sản/ticket/trạng thái, inventory-location.
- API danh sách tài sản hỗ trợ q/departmentId/locationId/categoryId/status/user.
- API Helpdesk hỗ trợ q/status/priority.
- API licenses/network hỗ trợ q/status.
- Thêm thanh lọc thống nhất cho Người dùng phần mềm, Bản quyền/Dịch vụ và Hạ tầng/Mạng; Thiết bị & tài sản và Helpdesk giữ bộ lọc chuyên biệt đầy đủ.
- Hệ thống cấu hình dùng Promise.allSettled để một bảng lỗi không làm mất toàn bộ trang.
- Không thay đổi dữ liệu hiện có và không có migration destructive.

## Nâng cấp
Trên server production, backup source trước. Sau khi thay source v9:

```bash
cd /opt/IT-quanlytaisan
pnpm check
pnpm db:upgrade
pnpm build
sudo systemctl restart it-quanlytaisan
sudo systemctl status it-quanlytaisan --no-pager
```

Không chạy `pnpm db:seed` trên database production hiện tại.
