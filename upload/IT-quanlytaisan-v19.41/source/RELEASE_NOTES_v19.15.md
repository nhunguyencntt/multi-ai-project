# IT-quanlytaisan v19.15

## Sửa lỗi chính

### 1. Quản lý cấp phát & thu hồi
- Sửa lỗi runtime `allocationLicenses is not defined` bằng cách bổ sung import schema đúng cho API.
- Sửa luồng tạo cấp phát/thu hồi để danh sách cấp phát không còn lỗi sau khi server khởi động.
- Khi thu hồi một tài sản đang `in_use` nhưng dữ liệu cũ chưa có bản ghi `assetAllocations` active, hệ thống tự dựng phiếu cấp phát hiệu lực từ `assignedUserId`/`userText` để cho phép tạo phiếu thu hồi.
- Giữ nguyên workflow nhiều tài sản.
- Bản quyền đi kèm được tiêu thụ/hoàn trả theo từng tài sản trong phiếu.

### 2. Bảo trì & Sửa chữa
- Khi trạng thái tài sản là `Đang sửa chữa` hoặc `Hư hỏng - chờ thanh lý` nhưng chưa có bản ghi `maintenanceRecords`, giao diện vẫn tạo dòng dữ liệu tổng hợp tương ứng khi bấm biểu đồ.
- Vì vậy số lượng trên biểu đồ và danh sách phía dưới không còn tình trạng biểu đồ có 1 nhưng bảng báo `Chưa có hồ sơ`.
- Các dòng tổng hợp từ trạng thái tài sản được đánh dấu là dữ liệu tổng hợp và không gửi thao tác PATCH vào `maintenanceRecords` không tồn tại.

### 3. Kho thiết bị - vật tư
- Thêm biểu đồ Pie tổng quan số lượng theo trạng thái, tính từ số lượng thực tế của các dòng dữ liệu sau bộ lọc.
- Không còn hiển thị cột số lượng rời rạc như 6, 6, 12, 24, 50 ở bảng chính; số lượng tổng quan được đưa lên biểu đồ.
- Giữ số lượng chi tiết trong cửa sổ Xem chi tiết.
- Tên vật tư/thiết bị có thể bấm để xem chi tiết.
- Dữ liệu asset khi xem chi tiết gọi trực tiếp API `/api/asset/assets/:id` để lấy thông số kỹ thuật cấu trúc, serial, người sử dụng và ghi chú.
- Bổ sung tên địa điểm cho dữ liệu asset trong API kho.

### 4. Tài sản thanh lý
- Tên tài sản có thể bấm để mở chi tiết.
- Cửa sổ chi tiết hiển thị mã, tên, loại, phòng ban, địa điểm, người sử dụng, serial, trạng thái, thông số kỹ thuật và ghi chú.

### 5. Bản quyền phần mềm & Dịch vụ
- Tên sản phẩm/bản quyền có thể bấm để xem chi tiết.
- Cửa sổ chi tiết hiển thị mã bản quyền, sản phẩm, nhà cung cấp, loại, số lượng tổng, đã dùng, chưa dùng, kho, trạng thái và ghi chú.

## Database
- Không thêm migration mới trong v19.15.
- Migration `0017_allocation_license_links.sql` của v19.14 tiếp tục được sử dụng.
- Chạy nâng cấp hiện hữu bằng:

```bash
pnpm db:upgrade
```

## Kiểm tra
- TypeScript transpile kiểm tra `Home.tsx`, `server/api.ts`, `drizzle/schema.ts`: OK.
- Chưa chạy production build trong môi trường đóng gói vì môi trường hiện tại không có `node_modules` đầy đủ/không có registry npm.
- Trên Ubuntu của người dùng cần chạy lại `pnpm build` trước khi restart production service.
