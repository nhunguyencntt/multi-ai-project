# IT-quanlytaisan v19

## Báo cáo
- Fix trang Báo cáo không hiển thị do thiếu API `/api/reports/templates` và dữ liệu template không được chuẩn hóa kiểu mảng.
- Thêm API tải danh sách, tạo, xóa mềm và tải file biểu mẫu báo cáo.
- Giữ phân trang 12 dòng/tab và bộ lọc hiện có.

## Phân quyền
- Trang Quản trị tài khoản > Vai trò & quyền có bộ lọc theo vai trò.
- Chọn Administrator/Admin/Quản lý/Vận hành/Chỉ xem để chỉ hiển thị module của vai trò đó.

## Hạ tầng & Mạng
- Khi thêm/sửa thiết bị hạ tầng, dữ liệu được đồng bộ sang `Thiết bị & tài sản`.
- Đồng bộ: mã, tên, loại, trạng thái, địa điểm, thông số kỹ thuật và ghi chú.
- Bảo trì/Offline/Retired được ánh xạ sang trạng thái tài sản tương ứng.

## Bản quyền & Dịch vụ
- Bổ sung `Lưu tại kho`.
- Hiển thị số lượng chưa sử dụng.
- Tự động đồng bộ bản quyền sang `Thiết bị & tài sản` và `Kho thiết bị - vật tư`.
- Số lượng kho được tính bằng `số lượng - đã sử dụng`.

## Kho thiết bị - vật tư
- Bổ sung bộ lọc trạng thái: Chờ cấp phát, Chưa sử dụng, Thu hồi, Lưu tại kho.
- Danh sách tổng hợp dữ liệu từ vật tư kho, thiết bị tài sản và bản quyền chưa sử dụng.
- Dữ liệu nguồn liên kết được bảo vệ, chỉ bản ghi vật tư kho mới có thao tác sửa/xóa trực tiếp tại trang Kho.

## Database
- Không reset hoặc seed lại dữ liệu hiện hữu.
- Migration v19 chỉ bổ sung `licenses.warehouseId` và `networkDevices.specifications`.
