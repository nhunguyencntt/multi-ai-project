# IT-quanlytaisan v19.29

- Added cursor-following particle dots, glowing points, and short connecting filaments to Login and Dashboard, in addition to pointer-reactive lighting.
- Maintenance & Repair: maintenance users can load network devices and Helpdesk tickets without separate network/helpdesk view permissions; ticket selector includes all tickets and passes the ticket database ID; API resolves explicit ticketId first.
- No database schema migration. Existing records are preserved.

Validation: source edits only. Run `pnpm check`, `pnpm test`, and `pnpm build` in the deployment environment before rollout.
