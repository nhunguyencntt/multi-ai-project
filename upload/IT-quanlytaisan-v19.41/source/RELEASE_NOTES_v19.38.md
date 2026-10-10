# IT-quanlytaisan v19.38

## Chuẩn hóa trạng thái hiển thị và bộ lọc

- Trang Thiết bị & tài sản: bỏ trạng thái riêng “Đang sử dụng” khỏi bộ lọc; hợp nhất `available` và `pending_allocation` trong bộ lọc “Sẵn sàng cấp phát”.
- Trang Kho thiết bị - vật tư: hợp nhất tài sản có trạng thái `available` và `pending_allocation` vào nhóm “Sẵn sàng cấp phát”, thống nhất bộ lọc, nhãn bảng và tổng quan.
- Trang Quản lý cấp phát: đổi nhãn trạng thái phiếu chờ cấp phát thành “Sẵn sàng cấp phát”; giữ nguyên mã trạng thái nội bộ để không phá vỡ luồng xử lý.
- Trang Helpdesk Ticket và các màn hình có hiển thị trạng thái ticket: đổi nhãn “Đã hoàn tất” thành “Đã hoàn thành”. API vẫn chấp nhận các nhãn cũ để tương thích dữ liệu và client cũ.
- Trang Bảo trì & Sửa chữa: thống nhất nhãn trạng thái hoàn thành thành “Đã hoàn thành”.

## Ghi chú tương thích

Các giá trị enum nội bộ trong cơ sở dữ liệu (ví dụ `completed`, `available`, `pending_allocation`) được giữ nguyên. Việc gộp được thực hiện ở lớp hiển thị và lọc, tránh thay đổi trực tiếp dữ liệu nghiệp vụ hiện có.
