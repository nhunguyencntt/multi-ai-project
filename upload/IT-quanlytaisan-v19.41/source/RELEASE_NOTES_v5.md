# IT-quanlytaisan v1.2.0

Bản này lấy source gốc `qlts-web` làm baseline chức năng và hợp nhất các phần phát triển trước đó, thay vì cắt lại giao diện thành prototype mới.

## Dữ liệu gốc được giữ

- 104 tài sản.
- 64 nhân sự.
- 22 hồ sơ tài liệu bàn giao/thu hồi.
- 6 bản ghi lịch sử điều chuyển.
- Các danh mục tài sản, bộ phận, địa điểm và dữ liệu Helpdesk khởi tạo.

## Chức năng chính

- Dashboard có các KPI click để mở module liên quan.
- Helpdesk Ticket: tìm kiếm, lọc, timeline, cập nhật trạng thái, kéo thả tệp.
- Thiết bị & tài sản: CRUD, bộ phận, địa điểm, loại tài sản, serial, chú thích, upload.
- Thông số kỹ thuật: CPU, RAM, ổ cứng, màn hình, GPU, mainboard, hãng, model và trường tùy biến.
- Cấu hình thông số tập trung trong Hệ thống, lưu MySQL.
- Người dùng tài sản: thêm/sửa/xóa.
- Cấp phát: tạo phiếu và trạng thái.
- Biên bản: tạo bàn giao/thu hồi với tài sản, bên giao, bên nhận và ghi chú.
- Kho tài liệu: giữ 22 hồ sơ gốc.
- Kho thiết bị - vật tư: CRUD.
- Bảo trì & sửa chữa.
- Kiểm kê: tạo phiên kiểm kê và lưu chi tiết MySQL.
- Bản quyền & Dịch vụ: dữ liệu MySQL.
- Hạ tầng & Mạng: dữ liệu MySQL.
- Báo cáo.
- Cấu hình hệ thống.
- Tài khoản quản trị vận hành và RBAC backend.
- Đăng nhập JWT cookie, đổi mật khẩu bắt buộc ở lần đăng nhập đầu.
- Upload ngoài source tại `/var/lib/it-quanlytaisan/uploads`.
- Backup database và upload.

## Quy ước tên

- Application: `IT-quanlytaisan`
- Source directory: `/opt/it-quanlytaisan`
- Database: `it_quanlytaisan`
- MySQL user: `itqlts`
- Upload directory: `/var/lib/it-quanlytaisan/uploads`

## Lưu ý kiểm thử

Môi trường đóng gói hiện tại không có kết nối npm registry nên không thể chạy dependency installation/build production cuối cùng. Source đã được kiểm tra syntax TS/TSX bằng TypeScript transpiler và các script `.mjs` bằng Node syntax check.

Trên Ubuntu phải chạy `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test`, `pnpm db:setup`, `pnpm db:verify` và `NODE_ENV=production pnpm build` trước khi bật systemd.
