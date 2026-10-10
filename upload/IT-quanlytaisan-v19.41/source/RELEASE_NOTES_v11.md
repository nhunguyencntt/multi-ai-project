# IT-quanlytaisan v11

- Fixed Hạ tầng & Mạng and Bản Quyền và Dịch Vụ modal sizing and CRUD UI.
- Hạ tầng & Mạng now uses Ghi chú instead of MAC in the UI and supports edit/delete.
- Added network device linkage to maintenance records and Helpdesk tickets; maintenance status is shown in the network table.
- Completed maintenance returns assets to available and network devices to active; linked tickets are completed.
- Merged Kiểm kê into Báo cáo as a report tab.
- Reports now have tabs, filters, preview tables, Excel export, report title/department/location metadata, and company template upload/storage/download/delete.
- Added reportTemplates table and maintenanceRecords.networkDeviceId.
- No seed operation is required for existing production data; run `pnpm db:upgrade` once, then build/restart.
