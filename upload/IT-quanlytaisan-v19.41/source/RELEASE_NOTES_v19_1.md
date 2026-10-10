# IT-quanlytaisan v19.1

## Hotfix build V19

Fixed the production build failure reported during `pnpm build`.

### Root cause

`server/api.ts` contained a duplicate block-scoped declaration in the unified inventory API:

- The `Promise.all()` destructuring declared `licenseRows`.
- A few lines later the mapped license result was also declared as `const licenseRows`.
- esbuild correctly stopped with `ERROR: The symbol "licenseRows" has already been declared`.

### Fix

The raw database result is now named `rawLicenseRows` and the mapped result remains `licenseRows`.

This changes only the variable naming/scope issue and does not alter the database structure or business logic.

### Validation

- Source ZIP integrity checked with `unzip -t`.
- The reported esbuild duplicate-symbol condition is removed.
- Full `pnpm build` cannot be executed in this packaging environment because `node_modules` is not installed here. Run the build on the Ubuntu server after replacing the source.

## Deployment

Do not run database seed on production.

```bash
cd /opt/it-quanlytaisan
pnpm install --frozen-lockfile
pnpm build
sudo systemctl restart it-quanlytaisan
sudo systemctl status it-quanlytaisan --no-pager
```
