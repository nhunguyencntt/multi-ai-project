# IT-quanlytaisan v19.21

## UI / module cleanup
- Added delete action to Bản quyền phần mềm & Dịch vụ, Bảo trì & Sửa chữa, Tài sản thanh lý and Helpdesk Ticket.
- Removed the Người dùng phần mềm page from the application navigation/source while retaining asset-user data for allocation and asset workflows.
- Removed the Kiểm kê tab from the Báo cáo page.

## Technical specifications
- Removed the Dùng chung/global technical-specification section from the configuration UI.
- New and edited specification fields must be associated with at least one asset category.
- Existing global specification values are removed from assetSpecificationValues; the legacy assets.specifications text remains preserved.
- Added MySQL migration `0020_v19_21_remove_global_specifications.sql` and setup-db integration.
