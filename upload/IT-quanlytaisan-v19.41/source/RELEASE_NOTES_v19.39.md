# IT-quanlytaisan v19.39

## Điều chỉnh
- Khôi phục trạng thái riêng “Đang sử dụng” trong bộ lọc của trang Thiết bị & tài sản.
- Khi ticket liên kết với hồ sơ Bảo trì & Sửa chữa được đánh dấu “Đã hoàn thành”, đồng bộ trạng thái tài sản theo trường “Trạng thái tài sản sau ticket”; nếu không chọn trạng thái cụ thể, tài sản được chuyển về “Sẵn sàng cấp phát”.
- Cập nhật trạng thái hồ sơ bảo trì liên kết thành hoàn thành và đồng bộ trạng thái thiết bị hạ tầng liên quan.

## Kiểm thử
Cần chạy `pnpm check` và `pnpm build` trong môi trường đã cài đủ dependencies; sau đó kiểm thử thực tế với ticket bảo trì có liên kết tài sản và ticket có liên kết thiết bị hạ tầng.
