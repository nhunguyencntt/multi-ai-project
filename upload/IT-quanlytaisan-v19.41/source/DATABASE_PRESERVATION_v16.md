# Database preservation - v16

This release is intended as an upgrade to an existing running IT-quanlytaisan database.

Do NOT run `pnpm db:seed` on the production database during the upgrade.

Run:

```bash
cd /opt/it-quanlytaisan
pnpm db:upgrade
pnpm build
sudo systemctl restart it-quanlytaisan
```

`pnpm db:upgrade` applies the existing migration chain and the new v16 additive migration. It does not reset business tables or reload the original seed dataset.

Before upgrading, keep the existing database backup supplied with the server snapshot.
