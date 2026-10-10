# IT-quanlytaisan v14

## Mục tiêu
- Đồng bộ một nguồn danh mục `assetCategories` cho cả Thiết bị & tài sản và Kho thiết bị - vật tư.
- Cho phép sửa nhanh Bộ phận, Địa điểm và Loại tài sản ngay tại các thẻ danh mục trên trang Thiết bị & tài sản.
- Thêm chọn Loại tài sản / vật tư cho Kho thiết bị - vật tư, hiển thị loại trong bảng và lọc theo loại.
- Giữ trang Hệ thống hoạt động an toàn khi database cũ chưa có bảng liên kết nhiều loại tài sản.

## Thay đổi
### Danh mục dùng chung
`assetCategories` là nguồn dữ liệu duy nhất. Kho thiết bị - vật tư sử dụng trực tiếp `inventoryItems.categoryId` trỏ đến cùng danh mục này. Không tạo một bảng loại tài sản thứ hai.

### Thiết bị & tài sản
- Thẻ Bộ phận / Địa điểm / Loại tài sản có nút sửa nhanh khi rê chuột vào từng dòng.
- Quản lý danh mục có thêm/sửa/xóa.

### Kho thiết bị - vật tư
- Thêm trường Loại tài sản / vật tư trong form.
- Hiển thị Loại trong bảng.
- Lọc vật tư theo loại.
- Có khu vực quản lý danh mục dùng chung.
- Tạo/sửa loại tại đây cập nhật ngay `/api/asset/meta`, do đó Thiết bị & tài sản thấy cùng dữ liệu.

### Hệ thống
- `/api/asset/specification-fields/admin` có fallback về `categoryId` nếu bảng liên kết nhiều loại tài sản chưa tồn tại.
- Không để lỗi đọc bảng liên kết làm hỏng trang Hệ thống.

## Nâng cấp
Không cần migration mới cho chức năng danh mục vì schema hiện tại đã có `inventoryItems.categoryId` và `assetCategories`. Khuyến nghị vẫn chạy `pnpm db:upgrade` để đảm bảo toàn bộ schema v13 đã được áp dụng.
