# IT-quanlytaisan v19.33

## Sửa lỗi Kho thiết bị - vật tư
- Các dòng vật tư/phần mềm/linh kiện thuộc nhóm RAM, CPU, HDD/SSD/NVMe, phần mềm và bản quyền được phân loại “Chưa sử dụng” theo yêu cầu nghiệp vụ, kể cả khi đã xác định kho lưu.
- Giữ thống kê theo số lượng tồn thực tế; nhấp vào nhóm trạng thái sẽ lọc danh sách tương ứng.

## Sửa lỗi Quản lý cấp phát & thu hồi
- Tổng quan chỉ hiển thị ba trạng thái nghiệp vụ: Chờ cấp phát, Chờ thu hồi và Đã thu hồi.
- Nhấp trạng thái tự chuyển sang tab Cấp phát hoặc Thu hồi phù hợp và lọc bảng bên dưới.
- Khi hoàn tất ticket, API chấp nhận cả hai tên trường trạng thái tài sản `assetStatus` và `assetStatusAfter` để đồng bộ trạng thái phiếu.
- Với yêu cầu nhiều tài sản, ticket không còn bị ghi đè tài sản liên quan theo từng dòng; chỉ gắn trực tiếp một tài sản khi yêu cầu có đúng một tài sản.
- Tránh tạo ticket trùng khi cùng yêu cầu được gửi lại trong khoảng 90 giây với tiêu đề, nội dung và trạng thái mới giống hệt nhau.

## Triển khai
- Không xóa hoặc reset dữ liệu database.
- Chạy `pnpm check` và `pnpm build` trong môi trường đã cài đầy đủ dependencies trước khi triển khai production.
