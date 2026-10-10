# Nâng cấp IT-quanlytaisan v18

```bash
cd /opt/it-quanlytaisan
sudo cp -a /opt/it-quanlytaisan /opt/it-quanlytaisan-backup-v17
pnpm install --frozen-lockfile
pnpm build
sudo systemctl restart it-quanlytaisan
sudo systemctl status it-quanlytaisan --no-pager
journalctl -u it-quanlytaisan -n 100 --no-pager
curl -I http://127.0.0.1:3000
```

V18 không yêu cầu `pnpm db:seed`. Không reset hoặc xóa database production.
