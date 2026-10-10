# IT-quanlytaisan v8

## Login / authentication layout fix
- Fixed the login and first-login password-change screens being affected by `.itq-shell` desktop grid rules.
- Added dedicated `.itq-auth-shell` wrapper so authentication pages no longer inherit the 310px sidebar grid.
- Login card now renders as a proper two-column responsive layout on desktop and a single-column layout on mobile.
- Uses `100dvh` to avoid viewport-height/blank-space issues.
- Preserves application shell, database, API, and business modules from v7.
