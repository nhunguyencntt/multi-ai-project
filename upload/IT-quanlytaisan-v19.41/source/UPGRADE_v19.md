# Upgrade IT-quanlytaisan v19

1. Backup database và thư mục uploads trước khi nâng cấp.
2. Copy source v19 vào `/opt/it-quanlytaisan`.
3. Cài dependency: `pnpm install --frozen-lockfile`.
4. Chạy migration/repair: `pnpm db:upgrade`. Lệnh này không chạy seed.
5. Build: `pnpm build`.
6. Restart: `sudo systemctl restart it-quanlytaisan`.
7. Kiểm tra: `sudo systemctl status it-quanlytaisan --no-pager`.
8. Kiểm tra log: `journalctl -u it-quanlytaisan -n 100 --no-pager`.

Lưu ý: không chạy `pnpm db:seed` trên database production đang có dữ liệu.
