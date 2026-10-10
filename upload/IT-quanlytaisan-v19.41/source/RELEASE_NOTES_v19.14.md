# IT-quanlytaisan v19.14

## Mục tiêu
Sửa luồng Kho thiết bị - vật tư và Quản lý cấp phát/thu hồi; đồng bộ trạng thái theo ticket; bổ sung bản quyền phần mềm đi kèm; sửa các lỗi dữ liệu hiển thị phía dưới bảng.

## Thay đổi chính

### Kho thiết bị - vật tư
- Hiển thị dữ liệu trực tiếp theo `inventoryItems`, tài sản và bản quyền hiện có; không còn hiển thị nhãn "Nguồn liên kết".
- Bộ lọc kho áp dụng cho tất cả kho, không chỉ Kho IT.
- Tài sản có trạng thái đang sử dụng, sẵn sàng cấp phát, chờ cấp phát, chờ thu hồi, đang sửa chữa và hư hỏng/chờ thanh lý được phản ánh đúng vào bảng kho.
- Loại bỏ các dòng tổng hợp bản quyền/tài sản sinh tự động bị trùng với bản ghi bản quyền.
- Chuẩn hóa nhãn trạng thái tiếng Việt, kho lưu và số lượng.
- Bổ sung xem chi tiết từng dòng kho.

### Quản lý cấp phát & thu hồi
- Có thể chọn nhiều tài sản/thiết bị trong một yêu cầu.
- Có nút Xem chi tiết cho cấp phát, thu hồi và xem/in lịch sử biên bản.
- Bổ sung bản quyền phần mềm đi kèm khi cấp phát.
- Khi cấp phát có bản quyền đi kèm, `usedQuantity` của bản quyền tăng và số lượng chưa dùng giảm.
- Khi thu hồi, bản quyền đã gắn với phiếu cấp phát tự động được hoàn trả về số lượng chưa dùng.
- Cấp phát/thu hồi có thể tự tạo một ticket Helpdesk cho toàn bộ yêu cầu.
- Khi ticket hoàn tất, trạng thái cấp phát/thu hồi được cập nhật theo trạng thái tài sản sau ticket; không còn ép mọi trường hợp về "Đang sử dụng" hoặc "Sẵn sàng cấp phát".
- Sửa lỗi luồng thu hồi do code cũ tham chiếu các trường không tồn tại như `startedAt` và `toUserId` trên `assetAllocations`.

### Helpdesk
- Luồng hoàn tất ticket với phiếu cấp phát/thu hồi đồng bộ theo `Trạng thái tài sản sau ticket`.
- Nếu ticket cấp phát hoàn tất với trạng thái khác `Đang sử dụng`, phiếu cấp phát được hủy và bản quyền đi kèm được hoàn trả.
- Nếu ticket thu hồi hoàn tất, bản quyền đi kèm được hoàn trả và tài sản nhận trạng thái sau ticket.

### Database
- Thêm bảng `allocationLicenses` để lưu quan hệ giữa phiếu cấp phát và bản quyền phần mềm.
- Thêm migration `0017_allocation_license_links.sql`.
- `scripts/setup-db.mjs` áp dụng migration v19.14 theo cơ chế idempotent.
- `scripts/verify-db.mjs` bổ sung kiểm tra `allocationLicenses` và `inventoryWarehouses`.

## Kiểm tra
- Đã kiểm tra syntax/transpile TS/TSX cho `Home.tsx`, `HelpdeskPage.tsx`, `server/api.ts`, `drizzle/schema.ts`.
- Cần chạy trên Ubuntu có dependency đầy đủ: `pnpm check`, `pnpm test`, `pnpm build`, sau đó `pnpm db:upgrade`.
