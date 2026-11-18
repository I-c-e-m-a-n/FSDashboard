> Current shared-data architecture and reporting semantics: [Architecture review](ARCHITECTURE_REVIEW.md). Earlier release details below are historical where they differ.

# Infrastructure Tracking handover

## Architecture and relationships

The fourth primary tab uses the existing React/TypeScript, Leaflet and GitHub Pages stack with no new dependencies. Infrastructure matters extend the four existing operational records by ID, rather than creating copies. Each matter references one shared location, one branch coordination team and one responsible organisation. Organisation responsibility is distinct from internal ownership. Optional record associations connect matters with cases, house visits and engagements.

`infrastructureStore.ts` owns the infrastructure lifecycle and local persistence. `operationalStore.ts` provides a shared revision signal and deduplicated relationship projection. Each domain updates only its own operational records, preserving other modules' edits. Two-phase workspace hydration restores both domains before reconciling foreign references, including links between newly created engagements and matters. Existing engagement storage remains compatible.

Overview and Data Explorer derive their counts and status from the same projected records. Resolved and Closed map to Completed; In progress and Awaiting response map to In progress; Reported and Assigned map to Open. Cancelled remains Cancelled. Infrastructure detail retains the finer lifecycle stages. Historical Overview remains anchored to 16 November 2026; Infrastructure explicitly reports against 17 November. Select All dates to include newly reported records in the historical views.

## Capabilities

- Eight categories cover maintenance, waste, Town Council, parks/playgrounds/courts, equipment, vegetation, NEA and LTA matters.
- Create and edit reports, assign organisations and teams, set priorities and target dates, record progress, resolve, close, cancel or reopen matters.
- Every saved update requires a note and appends a timestamped progress entry. Resolved/Closed require 100%; active stages require less than 100%; progressed matters require an organisation. Original reporting dates cannot be edited after creation.
- Filtered register, interactive map, organisation workload reports, lifecycle distribution and CSV export share one selection. Search, area, priority, overdue, category, stage and organisation filters compose.
- Keyboard-accessible editor, responsive mobile presentation, validation and recoverable storage errors. Incoming associations remain visible and are maintained by their originating module.

## Verification

The 28-test Playwright suite passes on desktop and mobile, including all existing module tests. Infrastructure tests exercise creation, assignment validation, links to new engagements, reload persistence, progress, resolution/closure, cross-module consistency, reporting/export, maps, empty states, storage failure, overflow and automated accessibility checks. TypeScript and the production asset-path check pass. Desktop and mobile screenshots were visually reviewed.

The existing Actions workflow runs the suite before deployment and again against the published site. Published verification additionally checks HTTP 200, homepage rendering, live map tiles, and captures all four modules on desktop and mobile. The workflow result is the release evidence; publication is not inferred from a push.

## MVP assumptions and limits

All data is synthetic; organisation names indicate illustrative responsibility, not agency routing or actual submissions. The four baseline matters are retained to preserve existing dashboard totals; all categories are available for new reports. Seed progress histories represent the imported snapshot, not invented prior updates. Percentages are manually estimated, not independently measured.

Edits persist only in this browser's localStorage. There is no shared backend, authentication, agency integration or resident portal. Storage is capped at 100 matters and 200 updates per matter; a failed write leaves saved state unchanged. Clearing site data removes edits. The journal is editable browser data, not a tamper-proof audit log. A future authenticated service should enforce relationships, permissions, concurrency and audit history server-side. Do not enter real operational or personal information.
