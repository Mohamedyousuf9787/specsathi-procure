# Changelog

## Unreleased

### Foundation

- Initialized the React/Vite static project.
- Adopted the Calm operational paper design system from the uploaded design specification.
- Selected local fixtures and deterministic logic as the P0 architecture.
- Disabled all optional providers by default.

### Domain and controls

- Added typed local Vendor A and Vendor B offers for the golden and edge-case flows.
- Added deterministic hard-constraint checks, weighted offer scoring, authorization routing, confirmation re-checks, mock orders, and audit events.
- Added unit coverage for automatic purchase, approval, rejection, unavailable vendor, no-match, and changed vendor terms.
- Built the initial intake, constraint-preview, procurement workspace, approval, confirmation, comparison, and audit experience.

### Release verification

- Added explicit workflow transition guards and a test that blocks a direct approval-to-purchase shortcut.
- Added editable policy fields and procurement-scope feedback for non-procurement intake text.
- Rehearsed the deterministic suite five consecutive times.
- Verified TypeScript, the production build, refined credential scan, and desktop/mobile workspace renders.
