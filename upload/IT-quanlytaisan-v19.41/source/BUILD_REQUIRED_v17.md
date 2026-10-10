# IT-quanlytaisan v17 - Production build

Gói v17 giữ source đã sửa và không đóng gói `dist/` cũ để tránh máy chủ chạy nhầm bundle v16.

Sau khi chép source lên `/opt/it-quanlytaisan`, chạy:

```bash
pnpm install --frozen-lockfile
pnpm db:upgrade
pnpm build
sudo systemctl restart it-quanlytaisan
sudo systemctl status it-quanlytaisan --no-pager
```

Kiểm tra đặc biệt:

```bash
curl -I http://127.0.0.1:3000
journalctl -u it-quanlytaisan -n 100 --no-pager
```
