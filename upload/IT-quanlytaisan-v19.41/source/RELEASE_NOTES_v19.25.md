# IT-quanlytaisan v19.25

## Quản lý cấp phát & thu hồi
- Bổ sung Chỉnh sửa và Xóa cho toàn bộ bảng Cấp phát/Thu hồi.
- Phiếu cấp phát đang chờ hoặc đang sử dụng có thể chỉnh sửa người sử dụng, bộ phận, địa điểm, ghi chú và bản quyền phần mềm đi kèm.
- Phiếu thu hồi có thể chỉnh sửa kho nhận và ghi chú; phiếu đã thu hồi có thể cập nhật kho lưu và ghi chú.
- Xóa phiếu cấp phát đang sử dụng sẽ hoàn tác bản quyền đi kèm và đưa tài sản về trạng thái sẵn sàng cấp phát.
- Xóa phiếu đã thu hồi chỉ xóa hồ sơ workflow/lịch sử liên quan, không cộng lại số lượng bản quyền đã hoàn trả.
- Lịch sử biên bản có thêm Chỉnh sửa và Xóa.

## Database legacy
- Chuẩn hóa bộ phận legacy bằng cả tên và mã, sau đó chuyển toàn bộ tham chiếu sang bộ phận canonical trước khi xóa alias.
- Chỉ người sử dụng còn gắn với tài sản đang hoạt động hoặc phiếu cấp phát/thu hồi đang hoạt động mới tiếp tục ở trạng thái active; người chỉ còn trong lịch sử được giữ lại nhưng inactive.
- API danh sách người sử dụng chỉ trả về người đang active.
- Dọn liên kết bản quyền và thông số kỹ thuật mồ côi.

## Clean database
- Loại bỏ seed dữ liệu tài sản/nhân sự/ticket/hồ sơ lịch sử cũ khỏi source.
- `pnpm db:setup` chỉ bootstrap schema, tài khoản quản trị, quyền và cấu hình hệ thống; không tự nạp dữ liệu nghiệp vụ cũ.
- Bổ sung `pnpm db:reset-empty` để tạo lại database nghiệp vụ rỗng một cách có chủ đích; lệnh yêu cầu `--confirm=EMPTY` và giữ lại systemUsers, permissionRules, systemSettings.
- Không sửa trực tiếp `dist/`.
