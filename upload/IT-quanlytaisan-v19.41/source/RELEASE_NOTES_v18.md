# IT-quanlytaisan v18

## Phạm vi

V18 phát triển trực tiếp trên source v17 và giữ nguyên database production hiện tại. Không có seed/reset database.

## 1. Cấp phát / thu hồi và Helpdesk

- Tạo yêu cầu cấp phát/thu hồi không còn bắt buộc chọn một ticket có sẵn.
- Người vận hành chỉ cần bật `Liên kết Helpdesk Ticket` và lưu yêu cầu.
- Backend tự tạo ticket mới, gắn tài sản, phòng ban, địa điểm và workflow cấp phát/thu hồi.
- Cấp phát: tài sản chuyển `Chờ cấp phát`; ticket mới xuất hiện trên Helpdesk. Khi ticket `Đã hoàn tất`, tài sản chuyển `Đang sử dụng` và tạo biên bản bàn giao.
- Thu hồi: tài sản chuyển `Chờ thu hồi`; ticket mới xuất hiện trên Helpdesk. Khi ticket `Đã hoàn tất`, tài sản chuyển `Sẵn sàng cấp phát`, cập nhật kho và tạo biên bản thu hồi.

## 2. Phân trang

Các danh sách vận hành/hệ thống chính hiển thị 12 hàng mỗi trang, có điều hướng trang và tự về trang 1 khi thay đổi bộ lọc.

## 3. Dashboard

Thay khu vực `Vận hành tập trung` bằng danh sách Helpdesk ticket mới/đang xử lý.

## 4. Cấu hình thông số kỹ thuật

- Tách thành trang `Cấu hình thông số kỹ thuật`.
- Chỉ `administrator` và `admin` được nhìn thấy trên menu và truy cập.
- Backend cũng kiểm tra quyền admin cho đọc/quản trị/copy/xóa cấu hình.

## 5. Helpdesk

- Sửa bộ lọc phòng ban bị khung trắng: dùng đúng `departmentOptions` dạng object `{id,name}`.
- Bổ sung fallback địa điểm từ dữ liệu ticket nếu metadata chưa có.

## 6. Responsive

- Siết `min-width: 0` cho grid/section/panel.
- Không để bảng hoặc panel bên phải làm tràn layout.
- Bổ sung xử lý responsive cho màn hình nhỏ.

## Database

Không thêm migration bắt buộc trong V18. Các thay đổi workflow sử dụng cấu trúc đã có từ V13-V17.
