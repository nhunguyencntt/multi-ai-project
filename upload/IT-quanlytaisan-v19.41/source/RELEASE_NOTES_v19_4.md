# IT-quanlytaisan V19.4

## Giao diện và điều hướng
- Đưa **Bản quyền phần mềm & Dịch vụ**, **Hạ tầng & Mạng** và **Báo cáo** từ nhóm **HỆ THỐNG** sang nhóm **VẬN HÀNH**.
- Gộp **Cấu hình danh mục** và **Cấu hình thông số kỹ thuật** thành một trang duy nhất: **Cấu hình danh mục & thông số**.
- Trong trang hợp nhất, administrator/admin có thêm tab **Thông số kỹ thuật**; các vai trò khác chỉ sử dụng phần danh mục theo quyền hiện có.
- Giữ nguyên các API, bảng MySQL và dữ liệu hiện hữu; không tạo migration/database mới cho thay đổi này.

## Kiểm tra trước đóng gói
- TS/TSX: đã kiểm tra transpile cú pháp toàn bộ source bằng TypeScript compiler API.
- JS/MJS/CJS: đã kiểm tra cú pháp toàn bộ file JavaScript.
- CSS: kiểm tra cân bằng block `{}` và các file CSS hiện hữu; không thay đổi CSS nền tảng ngoài giao diện điều hướng mới dùng utility class có sẵn.
- Database: không sửa `drizzle/schema.ts`, các migration hoặc API database.
- Ngôn ngữ/UI: rà soát các nhãn điều hướng và tiêu đề, thống nhất tiếng Việt; giữ `IT-quanlytaisan`, `Helpdesk Ticket`, `MySQL connected` theo nhận diện hệ thống.
- Production build chưa thể chạy bằng `pnpm build` trong môi trường kiểm tra này vì package manager/dependencies đầy đủ không có sẵn trong runtime; vì vậy không ghi nhận giả là build production đã PASS.

Version: 1.19.4
