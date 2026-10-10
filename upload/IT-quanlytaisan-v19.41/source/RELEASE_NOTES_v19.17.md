# IT-quanlytaisan v19.17

## Fix lần này

### Quản lý cấp phát & thu hồi
- Khi tạo phiếu cấp phát, nếu không chỉ định kho xuất, hệ thống tự lấy `warehouseId` trực tiếp từ vị trí lưu kho hiện tại của từng tài sản được chọn. Hỗ trợ chọn nhiều tài sản kể cả khi các tài sản nằm ở các kho khác nhau.
- Bỏ thao tác thủ công “Hoàn tất” khỏi giao diện cấp phát/thu hồi. Trạng thái hoàn thành được xác định theo Helpdesk Ticket liên kết; khi ticket hoàn tất, workflow cấp phát/thu hồi được đồng bộ theo trạng thái tài sản sau ticket.
- Bổ sung nút xóa phiếu ở cột Thao tác. Chỉ cho phép xóa khi Helpdesk Ticket liên kết đã ở trạng thái `completed`; việc xóa không đảo ngược trạng thái tài sản hiện tại.

### Quản trị tài khoản
- Khắc phục lỗi runtime `groupPerm is not defined` trên trang Quản trị tài khoản.
- Quyền theo nhóm tùy chỉnh tiếp tục hỗ trợ độc lập Xem / Thêm / Sửa / Xóa và có thể bật đồng thời nhiều quyền trên cùng một module.

## Nguyên tắc build
- Chỉ sửa mã nguồn trong `client/src` và `server`.
- Không sửa trực tiếp thư mục/file `dist/` đã build.
- Khi triển khai Ubuntu, chạy lại `pnpm build` để tạo `dist/` mới từ mã nguồn.
