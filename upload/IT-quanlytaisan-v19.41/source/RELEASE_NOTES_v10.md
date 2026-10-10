# IT-quanlytaisan v10

## Changes
- Fixed the production crash when selecting an asset category caused by an INSERT with 7 values for 8 columns in `assetSpecificationFields`.
- Specification fields now support many-to-many assignment to multiple asset categories.
- Global fields can be reused across all categories.
- Category-specific fields are automatically loaded when an asset category is selected.
- Added copy specification field workflow for fast creation/editing.
- Existing category assignments are migrated into the new junction table.
- Added system user sessions and activity logs: online/offline status, last activity, IP, user agent, activity windows of 1h/24h/7d, and page access log.
- Added frontend page activity tracking.
- Login branding `IT-quanlytaisan` is kept on one horizontal line.
- No asset records are reseeded or deleted by the v10 upgrade.

## Database upgrade
Run:
```bash
pnpm db:upgrade
```
This applies `drizzle/0009_v10_sessions_spec_categories.sql` through the versioned setup script. Do not run `pnpm db:seed` on an existing production database.
