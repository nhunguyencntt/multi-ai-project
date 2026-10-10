# IT-quanlytaisan v19.27

## Changes
- Asset user/assignee is entered as free text in asset and allocation workflows.
- Allocation records store `userText`; legacy `userId` is nullable to support migrated assets that never had an `assetUsers` record.
- Return workflow resolves the previous user from allocation `userText` or asset `userText`, rather than requiring a matching legacy user record.
- Removed the dedicated Hạ tầng & Mạng page from the navigation. Network data and related maintenance integrations are retained to protect existing records.
- Asset specification fields refresh while the asset form is open, and are re-fetched when the category is selected; newly configured fields appear without restarting the application.

## Database migration
Run `pnpm db:upgrade` to add `assetAllocations.userText` and make `assetAllocations.userId` nullable. Historical `assetUsers` rows are retained for audit/history compatibility; the allocation form no longer presents them as a selectable directory.

## Deploy
`pnpm install && pnpm db:upgrade && pnpm check && pnpm build`
