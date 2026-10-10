# IT-quanlytaisan v19.22

## Cấu hình danh mục & thông số

- Loại bỏ hoàn toàn danh mục **Hạ tầng & Mạng** khỏi bảng **Loại tài sản**.
- Không cho giao diện danh mục hiển thị lại mục **Hạ tầng & Mạng**, kể cả khi database cũ còn dữ liệu chưa được migration.
- Dữ liệu Hạ tầng & Mạng tiếp tục được quản lý tại module riêng; không làm mất bảng `networkDevices`.
- Các tài sản đồng bộ kỹ thuật có mã `NET-*` được giữ lại để bảo toàn lịch sử nhưng được tách khỏi `assetCategories`.
- Sửa cơ chế đồng bộ Hạ tầng & Mạng để không tự tạo lại danh mục **Hạ tầng & Mạng**.

## Thông số kỹ thuật

- Tiếp tục loại bỏ toàn bộ trường thông số **Dùng chung** / `categoryId IS NULL`.
- Xóa các giá trị thông số có liên quan và các liên kết danh mục mồ côi.
- API quản trị và API lấy thông số chỉ làm việc với thông số gắn với loại tài sản cụ thể.

## MySQL

Migration mới:

`drizzle/0021_v19_22_remove_network_asset_category_and_global_specs.sql`

Migration được tích hợp vào `scripts/setup-db.mjs` và chạy idempotent.

## Nguyên tắc bảo toàn dữ liệu

- Không xóa `networkDevices`.
- Không xóa tài sản thông thường.
- Không xóa cột `assets.specifications`.
- Chỉ loại bỏ danh mục Hạ tầng & Mạng khỏi `assetCategories` và làm sạch thông số dùng chung.
