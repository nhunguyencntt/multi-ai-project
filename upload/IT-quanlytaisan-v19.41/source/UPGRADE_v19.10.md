# IT-quanlytaisan v19.10 – Upgrade

V19.10 giữ nguyên dữ liệu và cấu trúc hiện có, chỉ bổ sung cột audit `ticketUpdates.assetStatusAfter` để lưu trạng thái tài sản thực tế sau mỗi lần cập nhật Helpdesk.

Trên Ubuntu, sau khi sao lưu database:

```bash
cd /opt/it-quanlytaisan
pnpm install --frozen-lockfile
pnpm db:upgrade
pnpm check
pnpm test
pnpm build
sudo systemctl restart it-quanlytaisan
```

`pnpm db:upgrade` là bước bắt buộc vì v19.10 có extension SQL idempotent được áp dụng qua `scripts/setup-db.mjs`.

Không chạy lại seed dữ liệu nếu mục tiêu chỉ là nâng cấp source đang vận hành; `db:upgrade` không xóa dữ liệu nghiệp vụ.
