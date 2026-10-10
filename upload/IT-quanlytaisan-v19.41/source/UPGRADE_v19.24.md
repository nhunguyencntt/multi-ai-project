# Upgrade v19.24

1. Sao lưu database MySQL hiện tại trước khi nâng cấp.
2. Chép source v19.24 lên server.
3. Chạy `pnpm install`.
4. Chạy `pnpm db:upgrade` để áp dụng toàn bộ migration và cleanup dữ liệu cũ.
5. Chạy `pnpm db:verify` để kiểm tra database không còn danh mục Hạ tầng & Mạng/Bản quyền & Dịch vụ trong `assetCategories`, không còn thông số dùng chung/legacy và không còn alias bộ phận đã chuẩn hóa.
6. Chạy `pnpm build` rồi restart service.

Migration không xóa module `networkDevices` hoặc `licenses`, không xóa cột `assets.specifications`, và không xóa tài sản/người dùng/ticket.
