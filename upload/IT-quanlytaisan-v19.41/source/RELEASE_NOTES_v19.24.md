# IT-quanlytaisan v19.24

## Database cleanup and specification integrity

- Loại bỏ hoàn toàn **Bản quyền & Dịch vụ** khỏi `assetCategories`; module bản quyền tiếp tục hoạt động độc lập.
- Loại bỏ hoàn toàn **Hạ tầng & Mạng** khỏi `assetCategories`; module hạ tầng tiếp tục hoạt động độc lập.
- Bỏ cơ chế tự sinh thông số kỹ thuật theo template khi mở form tài sản hoặc tạo loại tài sản mới.
- Chỉ hiển thị thông số đã được cấu hình và gắn với đúng loại tài sản.
- Xóa toàn bộ thông số `categoryId IS NULL` và các trường legacy `manufacturer/model/brand` được sinh từ các phiên bản cũ.
- Dọn giá trị thông số chéo loại, liên kết mồ côi và dữ liệu thông số của danh mục nghiệp vụ đã loại khỏi danh mục tài sản.
- Chuẩn hóa các bộ phận alias được seed từ sổ dữ liệu cũ về mã bộ phận canonical trước khi xóa bản ghi alias, không xóa tài sản/người dùng/ticket.
- Bổ sung kiểm tra integrity vào `scripts/verify-db.mjs`.

## MySQL migration

`drizzle/0022_v19_24_database_cleanup.sql` được chạy bởi `scripts/setup-db.mjs`.
