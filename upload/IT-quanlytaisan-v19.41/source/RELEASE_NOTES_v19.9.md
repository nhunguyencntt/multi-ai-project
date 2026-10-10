# IT-quanlytaisan V19.9

## Phạm vi phát triển

V19.9 phát triển trên nền V19.8, giữ nguyên schema/database và các module hiện có.

### 1. Thiết bị & tài sản
- Bổ sung thao tác **Sao chép tài sản** tại từng dòng.
- Sao chép toàn bộ thông tin nghiệp vụ và bộ thông số kỹ thuật của tài sản nguồn.
- Bản sao được mở ngay trong form chỉnh sửa để người dùng cập nhật trước khi lưu.
- Mã tài sản bản sao được khởi tạo với hậu tố `-COPY` để tránh nhầm lẫn; người dùng có thể sửa mã trước khi lưu.
- Bản sao mặc định ở trạng thái **Sẵn sàng cấp phát**, không gán người sử dụng và không sao chép serial.
- Khi lưu bản sao, hệ thống tạo bản ghi mới qua API/MySQL, không ghi đè tài sản nguồn.

### 2. Quản trị tài khoản
- Mở rộng modal Tạo/Sửa user lên bố cục responsive 3 cột ở màn hình lớn.
- Tăng chiều rộng modal và xử lý overflow theo chiều dọc để không cắt phần nội dung bên phải.
- Nhóm người sử dụng được bố trí riêng, responsive 3 cột.
- Footer thao tác được giữ ở cuối vùng nội dung để nút lưu luôn dễ tiếp cận.

### 3. Báo cáo
- Khối **Thiết bị tài sản theo phòng ban** được kéo dài theo chiều cao khu vực biểu mẫu xuất Excel.
- Bảng sử dụng vùng cuộn nội bộ thay vì giới hạn 520px, giúp hiển thị nhiều phòng ban hơn và đồng bộ chiều cao hai cột.
- Giữ nguyên phân trang và xuất Excel.

### 4. Helpdesk Ticket
- Thay ba thẻ trạng thái **Mới / Đang xử lý / Đã hoàn tất** bằng biểu đồ donut/Pie Chart.
- Biểu đồ vẫn giữ chức năng lọc: click vào lát biểu đồ hoặc nhóm trạng thái sẽ lọc ticket tương ứng.
- Có danh sách trạng thái bên cạnh biểu đồ để dễ đọc số lượng chính xác.
- Hai panel danh sách và chi tiết được căn cùng chiều cao, tránh lệch đáy giao diện.
- Modal tạo ticket được mở rộng để sử dụng tốt hơn trên màn hình desktop.

## Kiểm tra
- TS/TSX syntax transpile đối với các file đã chỉnh sửa: PASS.
- JSON package.json: PASS.
- CSS brace/structure check: PASS.
- Không thay đổi migration/schema/database trong release này.
- Môi trường đóng gói hiện tại không có `pnpm` và không có đầy đủ `node_modules`, vì vậy không ghi nhận giả tạo kết quả `pnpm check`/`pnpm build`.
- Trên Ubuntu production cần chạy:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```
