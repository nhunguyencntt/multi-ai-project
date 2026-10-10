# IT-quanlytaisan v19.36

## Điều chỉnh bộ lọc Kho thiết bị - vật tư
- Bộ lọc trạng thái chỉ còn 5 nhóm đồng nhất với tổng quan và dữ liệu bảng: Lưu tại kho, Chờ cấp phát, Đang sửa chữa, Chờ thanh lý, Chưa sử dụng.
- Loại vật tư/thiết bị tiếp tục lấy từ danh mục Loại tài sản dùng chung (`meta.categories`) và lọc theo `categoryId` trên API cho cả vật tư trong kho và tài sản.
- API chỉ áp dụng các trạng thái hợp lệ của Kho thiết bị - vật tư; loại bỏ các giá trị trạng thái cũ không còn thuộc nhóm tổng quan.
