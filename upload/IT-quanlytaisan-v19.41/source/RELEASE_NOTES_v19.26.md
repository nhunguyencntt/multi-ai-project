# IT-quanlytaisan v19.26

## Fix: badge Quản lý cấp phát hiển thị sai

- Không còn lấy số lượng tài sản có trạng thái `in_use` làm badge cho menu **Quản lý cấp phát**.
- Badge được tính trực tiếp từ `/api/asset/allocations`.
- Chỉ tính các phiếu đang có ý nghĩa vận hành: `pending_allocation`, `active`, `pending_return`.
- Các phiếu `returned`/`cancelled` không làm tăng badge.
- Đồng bộ badge ngay sau khi trang Quản lý cấp phát tải lại dữ liệu, tạo, sửa hoặc xóa phiếu.
- Dashboard và badge menu sử dụng cùng nguồn dữ liệu nghiệp vụ cấp phát, tránh tình trạng Dashboard = 0 nhưng menu vẫn hiển thị số lượng tài sản `in_use`.
- Không thay đổi dữ liệu MySQL và không chỉnh trực tiếp `dist/`.
