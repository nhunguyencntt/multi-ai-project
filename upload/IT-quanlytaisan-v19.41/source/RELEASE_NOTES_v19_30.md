# IT-quanlytaisan v19.30

## Cursor particle effect
- Replaced short-lived mouse-trail-only particles with a full-viewport animated particle field inspired by the provided Antigravity clip.
- The field uses radial/concentric dot placement, multiple blue/purple/red/teal colors, gentle ambient motion, pointer repulsion, and short connecting filaments near the cursor.
- Mounted on both Login and Dashboard; pointer-events are disabled so buttons and inputs remain interactive.

## Maintenance & Repair — Hạ tầng & Mạng
- The maintenance form requests legacy infrastructure devices from `/api/asset/network?includeLegacy=1`.
- If older data has infrastructure equipment stored only in `assets` (e.g. categories/names matching switch, router, firewall, Wi-Fi, Synology/NAS, server, rack, Cisco, UniFi, UPS), those records are exposed as selectable maintenance targets without inserting duplicate records into MySQL.
- Legacy equipment is saved as a maintenance record linked to its existing asset ID and a negative networkDeviceId marker; ticket association is resolved and persisted through the existing ticketCode path.
- On completion/cancellation/deletion, legacy infrastructure asset status returns to `in_use`; native network-device records return to `active`.
- The Hạ tầng & Mạng management page continues to return only native `networkDevices` records unless `includeLegacy=1` is requested, avoiding unsupported edit/delete actions for legacy asset rows.

## Database safety
- No migration or destructive cleanup was added. Existing MySQL records are preserved.

## Validation
- Source changes reviewed. Build/test could not be run in this environment because `pnpm` and project dependencies are not installed. Run `pnpm check`, `pnpm test`, and `pnpm build` on the deployment workstation before rollout.
