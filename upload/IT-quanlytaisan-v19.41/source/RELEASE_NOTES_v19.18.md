# IT-quanlytaisan v19.18

## Quản lý cấp phát & thu hồi
- Bổ sung nút **Chỉnh sửa** và **Xóa** trực tiếp tại cột Thao tác của danh sách cấp phát/thu hồi; bỏ chữ “Thu hồi” dạng nút ở từng dòng, giữ giao diện thao tác gọn bằng biểu tượng.
- Cho phép chỉnh sửa phiếu đang chờ xử lý: phiếu cấp phát có thể sửa người sử dụng, bộ phận, địa điểm, kho xuất và ghi chú; phiếu thu hồi có thể sửa kho nhận và ghi chú. Phiếu đã hoàn tất Ticket được khóa chỉnh sửa.
- Cho phép xóa phiếu vừa tạo ở trạng thái chờ cấp phát/chờ thu hồi và tự hoàn tác trạng thái tài sản về trạng thái trước khi lập phiếu. Trường hợp phiếu thu hồi dùng lại bản ghi cấp phát đang hoạt động, hệ thống khôi phục bản ghi về `active` thay vì làm mất lịch sử cấp phát.
- Nếu phiếu bị xóa là yêu cầu có Ticket được hệ thống tự động tạo và không còn phiếu nào khác sử dụng Ticket đó, Ticket và lịch sử cập nhật tự động được dọn theo.
- Khi thu hồi hoàn tất, hệ thống tự động bổ sung vào **Ghi chú** của tài sản thông tin: `Người sử dụng trước khi thu hồi: <họ tên>`, đồng thời xóa người sử dụng hiện tại và chuyển tài sản về kho theo workflow hiện hành. Không ghi trùng dòng nếu thông tin đã tồn tại.

## Nguyên tắc build
- Chỉ sửa mã nguồn trong `client/src`, `server` và metadata phiên bản/release notes.
- Không sửa trực tiếp thư mục/file `dist/`. Khi triển khai Ubuntu, chạy lại `pnpm build` để tạo `dist/` mới từ source.
