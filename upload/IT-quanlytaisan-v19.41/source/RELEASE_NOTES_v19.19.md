# IT-quanlytaisan v19.19

## Quản lý cấp phát – lịch sử biên bản
- Bổ sung nút Xóa tại tab **Lịch sử biên bản**.
- Xóa lịch sử chỉ xóa bản ghi `handoverRecords`, không xóa phiếu cấp phát/thu hồi và không thay đổi trạng thái tài sản.
- Kiểm tra quyền `allocation.canDelete` trước khi xóa.

## Biểu mẫu bàn giao / thu hồi
- Biểu mẫu được chuẩn hóa theo bố cục gần với biểu mẫu báo cáo: Đơn vị, Địa điểm, tiêu đề, số biên bản, nội dung căn cứ, bảng thông tin tài sản và khu vực ký.
- Khi Xem / In, hệ thống tự điền phòng ban, địa điểm, người sử dụng, kho lưu, mã tài sản, tên tài sản, serial, ngày và ghi chú từ dữ liệu cấp phát/thu hồi.
- Bổ sung biến `{{documentCode}}` cho số biên bản.
- Cập nhật biểu mẫu mặc định bàn giao và thu hồi trong migration `0019_v19_19_allocation_history_templates.sql`.

## Source
- Tiếp tục trực tiếp từ source **v19.18**, không chỉnh sửa `dist/`.
