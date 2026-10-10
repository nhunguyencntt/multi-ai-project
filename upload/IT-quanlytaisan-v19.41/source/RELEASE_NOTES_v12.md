# IT-quanlytaisan v12

## Fixes
- Modal của toàn bộ module được đưa ra `document.body` bằng React Portal, không còn bị cắt bởi `overflow-x-hidden` của layout Dashboard.
- Modal sử dụng layout flex với header cố định và vùng nội dung cuộn độc lập, responsive theo `100dvh`.
- Modal Kho thiết bị - vật tư được mở rộng như các module Hạ tầng & Mạng/Bản quyền.
- Hệ thống được harden để lỗi ghi nhật ký hoạt động hoặc đọc cấu hình thông số không làm dừng Express process.
- `/api/system/activity/page` có try/catch và trả 503 an toàn nếu bảng nhật ký chưa sẵn sàng.
- `/api/asset/specification-fields/admin` có xử lý lỗi riêng, không làm process chết khi database chưa đồng bộ.
- `setup-db.mjs` có repair pass idempotent cho migration v9-v11, xử lý trường hợp bảng/index thực tế thiếu dù marker version đã tồn tại.
- Thêm `unhandledRejection` logger ở process level như lớp bảo vệ cuối cho các request async không được bắt.

## Database
Không có migration schema mới trong v12. Có cơ chế repair lại các extension v9-v11 bằng `pnpm db:upgrade`.

## Upgrade
```bash
cd /opt/IT-quanlytaisan
sudo cp -a . /opt/IT-quanlytaisan-backup-v11
pnpm check
pnpm db:upgrade
pnpm build
sudo systemctl restart it-quanlytaisan
sudo systemctl status it-quanlytaisan --no-pager
```

Không chạy `pnpm db:seed` trên database production đang có dữ liệu.
