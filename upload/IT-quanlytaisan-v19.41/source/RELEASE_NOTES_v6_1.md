# IT-quanlytaisan v6.1

## Cập nhật

### 1. Bộ thông số kỹ thuật theo loại tài sản
- Khi chọn loại tài sản trong form tài sản, hệ thống tự tải bộ trường kỹ thuật đang hoạt động của loại đó và các trường dùng chung.
- Có thể thêm trường kỹ thuật mới trực tiếp trong form tài sản; trường mới được gắn với loại tài sản đang chọn.
- Có thể loại bỏ trường thuộc riêng loại tài sản khỏi bộ thông số bằng `Xóa trường`. Dữ liệu đã lưu của tài sản không bị xóa; trường được chuyển sang trạng thái không hoạt động.
- Trường `Dùng chung` không bị xóa riêng cho một loại tại form tài sản; quản trị viên xử lý trường dùng chung tại `Hệ thống > Cấu hình thông số kỹ thuật`.
- Kiểm tra bắt buộc và kiểu dữ liệu vẫn được thực hiện phía server.

### 2. Loại bỏ trạng thái `Mất`
- Xóa `lost` khỏi schema và giao diện.
- Migration `0007_remove_lost_asset_status.sql` chuyển các bản ghi cũ có trạng thái `lost` sang `retired` và ghi chú nguồn trạng thái cũ để không làm mất dữ liệu.
- Các trạng thái tài sản còn lại:
  - `Đang sử dụng`
  - `Sẵn sàng cấp phát`
  - `Đang sửa chữa`
  - `Hư hỏng - chờ thanh lý`
  - `Đã thanh lý`

## Nâng cấp database

Với hệ thống đang chạy v6, chỉ cần chạy migration mới:

```bash
pnpm db:migrate
```

Không chạy lại `pnpm db:seed` cho bản nâng cấp dữ liệu hiện hữu.
