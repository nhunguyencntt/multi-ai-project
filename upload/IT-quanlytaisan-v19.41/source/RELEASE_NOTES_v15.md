# IT-quanlytaisan v15

## Kho thiết bị - vật tư
- Giữ nguyên database và toàn bộ module hiện có.
- Bổ sung quản lý kho lưu trữ dùng chung cho inventory.
- Thêm trường `warehouseId` vào `inventoryItems`.
- Form thêm/sửa có `Lưu tại kho`.
- Bảng ngoài hiển thị Kho lưu, Tồn kho và Ghi chú; bỏ hiển thị Tồn tối thiểu/Đủ tồn.
- Bộ lọc: tìm theo mã/tên/ghi chú, theo kho, theo loại vật tư/thiết bị.
- Bổ sung quản lý kho: thêm/sửa/xóa; không cho xóa kho đang có vật tư.
- Các loại vật tư/thiết bị vẫn lấy từ `assetCategories` dùng chung với Thiết bị & tài sản.
- Không seed lại dữ liệu hiện hữu.
