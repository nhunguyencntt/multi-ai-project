# Upgrade v19.25

1. Sao lưu database MySQL hiện tại trước khi nâng cấp.
2. Chép source v19.25 lên server.
3. Chạy `pnpm install`.
4. Chạy `pnpm db:upgrade` để áp dụng migration v19.25 và chuẩn hóa dữ liệu legacy.
5. Chạy `pnpm db:verify`. Phải nhận được `v19.25 database integrity checks: OK`.
6. Nếu muốn tạo một database nghiệp vụ hoàn toàn rỗng để nhập dữ liệu mới, chỉ sau khi đã backup mới chạy `pnpm db:reset-empty`.
7. Chạy `pnpm build` và restart service.

Lưu ý: `pnpm db:upgrade` không xóa tài sản, allocation đang hoạt động hoặc lịch sử biên bản. `pnpm db:reset-empty` là thao tác phá dữ liệu nghiệp vụ và chỉ dùng khi chủ động chuyển sang bộ dữ liệu mới.
