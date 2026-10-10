# IT-quanlytaisan v17

v17 tiếp tục từ snapshot IT-quanlytaisan v16 và giữ nguyên database/dữ liệu hiện tại. Không chạy seed lại trong quá trình nâng cấp.

## 1. Helpdesk Ticket
- Bổ sung liên kết phòng ban và địa điểm vào ticket.
- Khi tạo ticket có thể chọn tài sản liên quan; hệ thống tự lấy phòng ban/địa điểm của tài sản nếu người dùng chưa chọn.
- Hiển thị phòng ban và địa điểm trong chi tiết ticket.
- Bổ sung lọc ticket theo địa điểm.
- Backend lưu `departmentId` và `locationId` trực tiếp trên bảng `tickets`.
- Giữ nguyên workflow ticket và liên kết cấp phát/thu hồi của v16.

## 2. Trang Quản trị tài khoản
- Tách riêng thành menu `Quản trị tài khoản`.
- Chỉ `administrator` và `admin` được nhìn thấy/truy cập.
- CRUD tài khoản đăng nhập.
- Vai trò: administrator, admin, manager, operator, viewer.
- Có kiểm tra cấp quyền theo thứ bậc, không cho tài khoản cấp thấp tạo/sửa/xóa tài khoản ngang hoặc cao hơn.
- CRUD nhóm người sử dụng.
- Gán nhiều nhóm cho một user.
- Phân quyền theo vai trò và theo nhóm.
- Quyền gồm: xem, thêm, sửa, xóa.
- Các module chính được đưa vào ma trận quyền: Helpdesk, tài sản, người dùng, kho, cấp phát, bảo trì, bản quyền, hạ tầng mạng, báo cáo, hệ thống.
- Administrator có toàn quyền; Admin được truy cập console quản trị nhưng không được vượt quyền Administrator.

## 3. Database
Migration mới:
- `drizzle/0014_admin_groups_ticket_location.sql`

Bổ sung:
- `tickets.locationId`
- role `admin` cho `systemUsers`
- `systemGroups`
- `systemUserGroups`
- `systemGroupPermissions`

`pnpm db:upgrade` áp dụng migration v17 theo cơ chế idempotent và không seed lại dữ liệu.
