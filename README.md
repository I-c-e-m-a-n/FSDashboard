> Current shared-data architecture and reporting semantics: [Architecture review](ARCHITECTURE_REVIEW.md). Earlier release details below are historical where they differ.

# Fengshan Community Intelligence

A responsive, map-led **public demonstration** of a community operations homepage. All 16 operational records are fictional. No resident portal, authentication, personal data, or live operational service is included.

## Develop

Use Node.js 24 and npm. Work in the existing checkout; no additional worktree is required.

```sh
npm ci
npm run dev
```

Vite serves the application at `/FSDashboard/`. `npm run build` runs strict TypeScript checking and generates `dist/`. `npm run preview` serves that production build locally.

## Architecture

- React + TypeScript, built with Vite. Static assets use the GitHub Pages `/FSDashboard/` base path.
- `src/data.ts`: typed synthetic records, date semantics and the shared filtering function. Replace this boundary with an authenticated API adapter in a future, separately secured application.
- `src/main.tsx`: homepage, filters, summaries, weekly chart, priority list, accessible native dialogs and filtered CSV export.
- `src/MapView.tsx`: Leaflet lifecycle and geographic marker rendering. The equivalent records list provides a non-map route to every item.
- `src/style.css`: responsive design using the selected palette. DM Sans and Manrope are self-hosted via Fontsource.

Area, period, search and category filters apply to all data views and exports. Summary cards isolate categories. Marker and list selections open the same detail dialog. Reset restores all filters. Map controls pan, zoom and restore the full demonstration extent.

## Data semantics

Snapshot: **16 November 2026, Asia/Singapore**. The 30-day period is 18 October–16 November inclusive; seven days is 10–16 November inclusive. Dates are date-only values. An outstanding record is overdue when its due date precedes the snapshot. Weekly chart bars count records, while visits count households contacted and engagement details count participants. Counts are derived rather than independently hard-coded.

Baseline: 146 household contacts across five rounds; four cases; four infrastructure matters; three engagements with 119 participants. Ten of sixteen records are completed; six are outstanding, including two urgent and two overdue (these categories can overlap). Sectors and coordinates are approximate and are not official boundaries or verified addresses. Contact totals count recorded contacts, not distinct residents.

## Tests

```sh
npx playwright install --with-deps chromium
npm test
```

On this managed environment the test configuration uses `/usr/bin/chromium`; CI uses Playwright's installed Chromium. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use another local browser. Desktop and mobile projects cover filters, summary consistency, dialogs, map markers, export, empty states, map-tile failure, overflow and automated WCAG checks. Automated accessibility checks supplement manual keyboard and visual review; they are not a conformance certification.

To verify a published release with the same browser tests:

```sh
PLAYWRIGHT_BASE_URL=https://i-c-e-m-a-n.github.io/FSDashboard/ npm test
```

## Deployment

`.github/workflows/deploy.yml` installs the lockfile, type-checks, builds, runs browser tests, and uploads the static artifact. Successful pushes to `main` deploy with `actions/deploy-pages`, then rerun the browser suite against the public URL and verify HTTP 200, rendering and live map tiles, saving screenshots as workflow artifacts; pull requests validate without deploying. The deployment job sets Pages to **GitHub Actions** when permitted. Keep **Settings → Pages → Source** set to **GitHub Actions**: branch publishing serves the uncompiled development entry and produces a blank page. The build checks compiled script paths before uploading `dist`. Deployment needs repository Pages enablement and the workflow's `pages: write` and `id-token: write` permissions. No application secrets are needed.

Expected site: https://i-c-e-m-a-n.github.io/FSDashboard/

A committed workflow is not proof of publication. Confirm a successful Actions deployment and test the public URL before calling a release published. See `HANDOVER.md` for the last verified status.

## External services and limitations

OpenStreetMap raster tiles require `tile.openstreetmap.org`. Attribution remains visible. Tile failures display a notice while markers, filters and the record list remain usable. Standard OSM tiles are suitable for this small demonstration; production deployment should choose a tile provider with an appropriate service agreement and review its usage policy. Loading tiles exposes visitor IP addresses and tile coordinates to the provider. There is no analytics or superficial login. Engagement and infrastructure demo edits persist in browser-local storage only.

A future internal platform requires authenticated hosting, server-side authorization and privacy controls before connecting operational datasets. Never add real records or credentials to this public repository or Pages bundle.

## Infrastructure Tracking

The fourth primary tab adds a connected infrastructure register, lifecycle editor, map and workload reports. See [Infrastructure Tracking handover](INFRASTRUCTURE_TRACKING.md) for architecture, validation, testing and MVP limitations.

## Residents & Cases

The sixth tab adds synthetic households and family links, house-visit outcomes, MPS and community case lifecycles, referrals, follow-ups, coverage and resolution reporting. See [Residents & Cases handover](RESIDENT_CASE_MANAGEMENT.md) for data semantics, validation and limitations.
