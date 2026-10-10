# IT-quanlytaisan — triển khai production trên Ubuntu

## Kiến trúc

- Source: `/opt/it-quanlytaisan`
- MySQL database: `it_quanlytaisan`
- MySQL user: `itqlts`
- Upload runtime: `/var/lib/it-quanlytaisan/uploads`
- Node application: `127.0.0.1:3000`
- Nginx: `80/443` reverse proxy
- systemd service: `it-quanlytaisan.service`

Database và file upload không nằm trong source.

## 1. Cài Ubuntu packages

```bash
sudo apt update
sudo apt install -y nginx mysql-server unzip curl build-essential
```

Cài Node.js 22:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Cài pnpm:

```bash
sudo corepack enable
sudo corepack prepare pnpm@10.4.1 --activate
```

## 2. Tạo MySQL database

```bash
sudo mysql
```

```sql
CREATE DATABASE it_quanlytaisan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'itqlts'@'127.0.0.1' IDENTIFIED BY 'CHANGE_THIS_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON it_quanlytaisan.* TO 'itqlts'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

Không dùng tài khoản MySQL root cho ứng dụng production.

## 3. Cài source

```bash
sudo mkdir -p /opt/it-quanlytaisan
sudo unzip IT-quanlytaisan-ubuntu-v5.zip -d /opt/
```

Đảm bảo source thực tế nằm tại:

```text
/opt/it-quanlytaisan
```

## 4. Tạo thư mục upload

```bash
sudo mkdir -p /var/lib/it-quanlytaisan/uploads
sudo useradd --system --home /opt/it-quanlytaisan --shell /usr/sbin/nologin itqlts || true
sudo chown -R root:itqlts /opt/it-quanlytaisan
sudo chown -R itqlts:itqlts /var/lib/it-quanlytaisan
```

## 5. Cấu hình `.env`

```bash
cd /opt/it-quanlytaisan
sudo cp .env.example .env
sudo nano .env
```

Ví dụ:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://itqlts:CHANGE_THIS_STRONG_PASSWORD@127.0.0.1:3306/it_quanlytaisan
UPLOAD_DIR=/var/lib/it-quanlytaisan/uploads
JWT_SECRET=USE_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_PASSWORD=CHANGE_THIS_STRONG_PASSWORD
```

Tạo JWT secret:

```bash
openssl rand -hex 48
```

Sau khi sửa `.env`:

```bash
sudo chown root:itqlts .env
sudo chmod 640 .env
```

## 6. Cài dependency và kiểm tra

```bash
sudo -u itqlts pnpm install --frozen-lockfile
sudo -u itqlts pnpm check
sudo -u itqlts pnpm test
```

## 7. Khởi tạo / nâng cấp database

```bash
sudo -u itqlts pnpm db:setup
sudo -u itqlts pnpm db:verify
```

Kết quả seed chuẩn phải giữ dữ liệu gốc:

```text
assets: 104
assetUsers: 64
handoverDocuments: 22
handoverRecords: 6
```

Có thể có thêm dữ liệu do người dùng vận hành sau này.

## 8. Build production

```bash
sudo -u itqlts env NODE_ENV=production pnpm build
```

Kiểm tra:

```bash
echo $?
ls -lah dist
```

Kết quả exit code phải là `0`.

## 9. Test trực tiếp Node

```bash
sudo -u itqlts env NODE_ENV=production pnpm start
```

Terminal khác:

```bash
curl -I http://127.0.0.1:3000
```

Sau khi kiểm tra:

```text
Ctrl+C
```

## 10. systemd

```bash
sudo cp deploy/systemd/it-quanlytaisan.service /etc/systemd/system/it-quanlytaisan.service
sudo systemctl daemon-reload
sudo systemctl enable --now it-quanlytaisan
sudo systemctl status it-quanlytaisan
```

Xem log:

```bash
sudo journalctl -u it-quanlytaisan -n 200 --no-pager
sudo journalctl -u it-quanlytaisan -f
```

## 11. Nginx

```bash
sudo cp deploy/nginx/it-quanlytaisan.conf.example /etc/nginx/sites-available/it-quanlytaisan
sudo nano /etc/nginx/sites-available/it-quanlytaisan
```

Đổi `server_name` thành domain thực tế.

```bash
sudo ln -s /etc/nginx/sites-available/it-quanlytaisan /etc/nginx/sites-enabled/it-quanlytaisan
sudo nginx -t
sudo systemctl reload nginx
```

Không mở port 3000 hoặc 3306 ra Internet.

## 12. Đăng nhập lần đầu

Tài khoản quản trị ban đầu được tạo từ:

```env
INITIAL_ADMIN_USERNAME
INITIAL_ADMIN_PASSWORD
```

Không hiển thị tài khoản mẫu trên giao diện. Tài khoản mới có `mustChangePassword=1` và phải đổi mật khẩu sau lần đăng nhập đầu tiên.

## 13. Backup

```bash
sudo /opt/it-quanlytaisan/scripts/backup-itqlts.sh
```

Backup gồm MySQL và thư mục upload.

Có thể đặt cron:

```cron
0 2 * * * /opt/it-quanlytaisan/scripts/backup-itqlts.sh >> /var/log/it-quanlytaisan-backup.log 2>&1
```

## 14. Nâng cấp release

Luôn backup trước:

```bash
mysqldump -u itqlts -p it_quanlytaisan | gzip > /root/itqlts-before-update.sql.gz
sudo tar -czf /root/itqlts-uploads-before-update.tar.gz /var/lib/it-quanlytaisan/uploads
```

Sau đó:

```bash
sudo systemctl stop it-quanlytaisan
cd /opt/it-quanlytaisan
sudo -u itqlts pnpm install --frozen-lockfile
sudo -u itqlts pnpm db:setup
sudo -u itqlts pnpm check
sudo -u itqlts pnpm test
sudo -u itqlts env NODE_ENV=production pnpm build
sudo systemctl start it-quanlytaisan
sudo systemctl status it-quanlytaisan
```

## 15. Kiểm tra sau reboot

```bash
sudo reboot
```

Sau khi server lên:

```bash
systemctl status mysql
systemctl status it-quanlytaisan
systemctl status nginx
```

Website phải hoạt động mà không cần chạy `pnpm dev` trong terminal.

## Nâng cấp v19.10

Sau khi sao lưu, chạy `pnpm db:upgrade` để áp dụng extension v19.10 trước khi `pnpm build` và restart service. Không chạy seed lại trên database đang vận hành nếu không có yêu cầu phục hồi dữ liệu.

## Nâng cấp lên v6

Nếu đang có database v5 và muốn giữ nguyên dữ liệu, sau khi thay source v6 chạy:

```bash
pnpm install
pnpm db:setup
pnpm check
pnpm build
sudo systemctl restart it-quanlytaisan
```

`db:setup` của v6 áp dụng migration 0006 một lần và tự đánh dấu trong bảng `itq_schema_versions`. Không chạy `pnpm db:seed` khi nâng cấp database đang có dữ liệu, trừ khi bạn thực sự muốn seed lại theo quy trình riêng.

## Quy trình cập nhật bắt buộc từ v12 lên v13

Không chạy `pnpm start` ngay sau khi chép source. `pnpm start` chạy file đã build tại `dist/index.js`; nếu chưa build, Ubuntu có thể tiếp tục chạy bundle cũ và vẫn xuất hiện lỗi `assetSpecificationFieldCategories is not defined`.

```bash
cd /opt/IT-quanlytaisan
pnpm check
pnpm db:upgrade
pnpm build
sudo systemctl restart it-quanlytaisan
sudo systemctl status it-quanlytaisan --no-pager
```

Sau đó kiểm tra API khi đã đăng nhập:

```bash
curl -s http://127.0.0.1:3000/api/asset/specification-fields/admin
curl -s http://127.0.0.1:3000/api/system/activity/overview
```

Hai API phải trả JSON; không được trả `ReferenceError` và process `it-quanlytaisan` phải giữ trạng thái `active (running)`.
