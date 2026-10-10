# IT-quanlytaisan v19.16

- Fixed inventory summary click-through: Pie Chart/cards now filter the table by the selected status while summary counts remain based on the full filtered warehouse/category/search dataset.
- Fixed allocation/return workflow robustness and fresh asset candidate loading. Return can reuse an existing active/pending-return allocation; duplicate pending allocation requests are rejected with a clear message.
- Added explicit client-side error handling for allocation/return creation.
- Removed the role-permission matrix from the administrator UI. Module permissions are managed only through custom groups.
- Backend permission checks for non-admin users now use custom group permissions only; role remains for account hierarchy/administrative control.
- Added v19.16 idempotent migration to create/seed management groups and automatically assign existing users to a custom group when they have none.
- Source changes are in client/server/scripts/drizzle only. Existing dist/ is not used as the source of truth and is excluded from this release package.
