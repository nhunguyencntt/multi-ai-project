# IT-quanlytaisan v19.10

## Fixes
- Dashboard refreshes asset/helpdesk data on entry and every 15 seconds while open, preventing stale Helpdesk status cards/lists.
- Helpdesk completion requires a non-empty processing note. Completed tickets are locked for normal users; only `admin`/`administrator` can edit historical notes. Historical notes are never deletable.
- Helpdesk records the effective asset status after each update in `ticketUpdates.assetStatusAfter` and displays the actual current asset status alongside the classification.
- Asset edit/copy fetches a fresh MySQL asset detail record before opening the form, including persisted technical specifications.
- Asset specification value matching is normalized by numeric asset id.
- Added `Xem chi tiết` to Thiết bị & tài sản, showing core fields, technical specifications, notes, and stored attachments.
- Added idempotent v19.10 database extension `0016_ticket_asset_status_audit.sql`. Existing data is preserved.
