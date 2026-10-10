# IT-quanlytaisan v19.35

## Thay đổi
- Helpdesk: số trên menu bên trái phản ánh số ticket ở trạng thái **Mới**; các thẻ tổng quan tiếp tục lọc theo từng trạng thái.
- Quản lý cấp phát: khi ticket liên kết được chuyển sang **Đã hoàn tất**, phiếu cấp phát được xác nhận, tài sản chuyển sang **Đang sử dụng** và biên bản bàn giao được tạo trong **Lịch sử biên bản**. Kiểm tra biên bản hiện có để tránh tạo trùng khi cập nhật lại ticket.
- Kho thiết bị - vật tư: thay nhóm tổng quan **Chờ cấp phát** bằng **Sẵn sàng cấp phát**. Nhóm này lọc theo trạng thái tài sản `available`; các nhóm Lưu tại kho, Đang sửa chữa, Chờ thanh lý và Chưa sử dụng vẫn được giữ.

## Lưu ý kiểm thử
Cần chạy `pnpm check`, `pnpm build` và kiểm tra luồng thực tế với bản sao database trước khi đưa lên máy chủ production.
