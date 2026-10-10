# IT-quanlytaisan v16 - Upgrade

This package is an upgrade of the supplied production/server v15 snapshot.

1. Keep the existing MySQL database and existing backup.
2. Copy the package to `/opt/it-quanlytaisan`.
3. Preserve the production `.env` from the existing installation; the package intentionally does not include secrets.
4. Run `pnpm install --frozen-lockfile`.
5. Run `pnpm db:upgrade` (do not run `pnpm db:seed`).
6. Run `pnpm build`.
7. Restart `it-quanlytaisan.service`.

The v16 database migration is additive and is in `drizzle/0013_allocation_workflow.sql`.
