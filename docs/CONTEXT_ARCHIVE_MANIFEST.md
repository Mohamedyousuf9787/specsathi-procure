# Specanic Complete Context Archive

## Purpose

This archive is the safe, reviewable handoff for the final project state. It contains the full tracked implementation context required to inspect, test, and rebuild Specanic without including environment credentials or machine-specific runtime output.

## Included Roots

| Root | Contents |
| --- | --- |
| `client/` | React application, domain logic, component tests, interaction tests, and styles. |
| `server/` | tRPC routers, provider adapters, database helpers, audit persistence, and server tests. |
| `shared/` and `drizzle/` | Shared contracts, database schema, migrations, and configuration. |
| `docs/` | Product requirements, QA evidence, compliance assessment, urgent repair findings, and this manifest. |
| `rockathon_final_round_deck/` | Editable judge-presentation source. |
| Project root | Build, TypeScript, test, Vite, package, lint-ignore, and project checklist files. |

## Explicit Exclusions

The archive excludes `node_modules`, `dist`, `.git`, `.env` files, runtime logs, screenshots, temporary files, and any generated local build output. These exclusions avoid leaking credentials, hosting state, browser traces, or unnecessarily large dependency artifacts.

## Urgent Repair Evidence

The archive includes the tyre/model parsing, deterministic Vendor A/B comparison, policy-hold, all-candidates evidence, marketplace fallback, audit-trail, and timeout corrections described in [`URGENT_FLOW_REPAIR_FINDINGS.md`](./URGENT_FLOW_REPAIR_FINDINGS.md). The recorded verification outcome is 81 passing tests across 27 files, TypeScript validation, a production build, a direct live tyre marketplace procedure check, and a desktop review of the tyre confirmation screen.
