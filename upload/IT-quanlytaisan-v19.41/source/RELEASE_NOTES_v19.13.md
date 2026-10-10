# IT-quanlytaisan v19.13

## Phân quyền theo vai trò và nhóm tùy chỉnh

- Sửa lỗi quyền theo vai trò gửi payload sai khi bật/tắt checkbox; từng quyền Xem/Thêm/Sửa/Xóa giờ độc lập và có thể chọn đồng thời nhiều quyền trên cùng một module.
- Sửa API cập nhật quyền nhóm tùy chỉnh: khi thay đổi một quyền sẽ giữ nguyên 3 quyền còn lại, không reset về 0.
- Bổ sung bộ lọc nhóm tương tự bộ lọc vai trò: chọn một nhóm (ví dụ Vận hành IT) để chỉ hiển thị các module của nhóm đó.
- Quyền theo nhóm tùy chỉnh hiển thị và lưu độc lập Xem/Thêm/Sửa/Xóa trên từng dòng.
- Giữ nguyên cơ chế phân cấp: tài khoản hiện tại chỉ được thay đổi các vai trò thấp hơn theo cấp quyền; Administrator có thể cấu hình toàn bộ.
- Không thay đổi schema/database, không yêu cầu seed/reset dữ liệu.

## Kiểm tra

- Đã kiểm tra syntax TypeScript/TSX của source bằng TypeScript compiler transpile.
- Đã kiểm tra syntax Node.js của `server/api.ts` sau chỉnh sửa.
- Đã kiểm tra cấu trúc ZIP sau đóng gói.
- Production build phụ thuộc vào việc cài dependencies trên Ubuntu; bản source không kèm `node_modules`.
