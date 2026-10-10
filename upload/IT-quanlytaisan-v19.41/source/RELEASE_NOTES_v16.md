# IT-quanlytaisan v16

## Baseline

v16 is built directly from the production/server backup of IT-quanlytaisan v15 supplied for this release. Existing source structure and database model are preserved. The database upgrade is additive and does not reseed or delete existing business data.

## 1. Địa điểm

- Replaced the generic location CRUD endpoint with explicit create/update/delete handlers.
- Added validation for empty names and duplicate names.
- Added clear conflict responses when a location is already referenced by assets or network devices.
- Location creation/update errors are handled as API errors instead of allowing an unhandled server exception.

## 2. Cấp phát / thu hồi theo workflow ticket

New workflow states:

- Chờ cấp phát (`pending_allocation`)
- Đang sử dụng (`active`)
- Chờ thu hồi (`pending_return`)
- Đã thu hồi (`returned`)
- Đã hủy (`cancelled`)

Behavior:

- Creating a handover request changes the asset to `Chờ cấp phát`.
- Creating a return request changes the asset to `Chờ thu hồi`.
- A related Helpdesk ticket is linked to the workflow.
- When the related ticket changes to `Đã hoàn tất`, the backend automatically finalizes the workflow.
- Handover completion changes the asset to `Đang sử dụng`, updates người sử dụng/bộ phận/địa điểm, and creates a handover record.
- Return completion changes the asset to `Sẵn sàng cấp phát`, clears the text user, assigns the selected warehouse, and creates a return record.
- A manual `Hoàn tất` action is available for exceptional cases where a workflow has no usable ticket.

## 3. Kho lưu của tài sản

- Added `assets.warehouseId`.
- Returned assets display their storage warehouse.
- The allocation page allows an administrator/operator to edit the storage warehouse after return.

## 4. Biên bản

- Handover/return records now retain allocation and ticket references.
- Added editable templates for handover and return documents.
- Templates support placeholders such as `{{assetCode}}`, `{{assetName}}`, `{{userName}}`, `{{department}}`, `{{location}}`, `{{warehouse}}`, `{{serial}}`, `{{date}}`, and `{{note}}`.
- Documents can be printed after the workflow is finalized.

## 5. Quản lý cấp phát UI

Added:

- Chờ cấp phát
- Đang sử dụng
- Chờ thu hồi
- Đã thu hồi
- Ticket liên quan
- Kho lưu
- Search/filter by workflow status and text
- Separate Cấp phát / Thu hồi / Lịch sử biên bản / Biểu mẫu tabs
- Warehouse edit action for returned assets

## 6. Database migration

New migration:

`drizzle/0013_allocation_workflow.sql`

`db:upgrade` now applies the v16 migration after the existing v15 warehouse migration.

No `db:seed` is required for an existing production database.

## 7. Validation

Validated on the supplied source snapshot:

- `npm run build` — PASS
- `npm test` — PASS (3 test files, 7 tests)
- Production frontend/backend bundle generated successfully.

Build warnings remain for an existing CSS `@import` ordering issue and bundle size; they do not prevent the production build.
