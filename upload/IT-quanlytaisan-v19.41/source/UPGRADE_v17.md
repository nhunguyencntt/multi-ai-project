# Nâng cấp IT-quanlytaisan v17

Thực hiện trên server đang chạy v16:

```bash
cd /opt/it-quanlytaisan
cp -a . ../it-quanlytaisan-backup-v16
pnpm install --frozen-lockfile
pnpm db:upgrade
pnpm build
sudo systemctl restart it-quanlytaisan
sudo systemctl status it-quanlytaisan --no-pager
journalctl -u it-quanlytaisan -n 100 --no-pager
```

Không chạy `pnpm db:seed` trong quá trình nâng cấp database hiện tại.

Sau khi đăng nhập bằng `administrator` hoặc `admin`, menu `Quản trị tài khoản` sẽ xuất hiện. Tài khoản manager/operator/viewer không nhìn thấy menu này và backend cũng chặn truy cập trực tiếp.
