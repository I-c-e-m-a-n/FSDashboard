> Current shared-data architecture and reporting semantics: [Architecture review](ARCHITECTURE_REVIEW.md). Earlier release details below are historical where they differ.

# Engineering handover

## Delivered

React 19, TypeScript and Vite static homepage with Leaflet/OpenStreetMap. Responsive navy navigation, four operational summaries, interactive map, category/area/period/search filters, urgent and overdue list, record details, weekly activity chart, computed insight, filtered CSV export and public-demo disclosure. Self-hosted fonts. No real personal data, resident portal or authentication façade.

Data and selection logic are isolated in `src/data.ts`; map lifecycle is isolated in `src/MapView.tsx`. `README.md` documents development, semantics, integration boundaries and deployment.

## Validation on 16 November 2026

- `npm run build`: passed strict TypeScript and production build.
- `npm test`: 12 passed across desktop Chromium and mobile Chromium emulation (10 browser checks and 2 executions of data consistency checks).
- Automated axe WCAG A/AA checks passed for the homepage and record dialog in both viewports.
- `npm audit`: zero known vulnerabilities, including development dependencies.
- Desktop and mobile screenshots reviewed; corrected chart scale, map extent, short-window sidebar overflow and secondary text contrast.
- Map-tile error behavior validated locally; live street tiles subsequently verified against the published site in GitHub Actions.

## Deployment status

**Published and verified on 16 November 2026.** [Successful deployment and public verification](https://github.com/I-c-e-m-a-n/FSDashboard/actions/runs/43832590313), application/workflow commit `3ddacdd`.

The reported blank page was caused by GitHub Pages publishing the raw repository through its default branch-based builder. The deployed entry point referenced `/src/main.tsx`; this is a Vite development entry, not executable production JavaScript. The workflow captured that exact script path in its public annotations before replacing the site.

The fix switches Pages to workflow publishing, builds and deploys only `dist`, and checks that generated HTML references existing compiled JavaScript under `/FSDashboard/assets/`. A failure to change repository settings is reported separately rather than preventing an otherwise authorized artifact deployment.

The successful run completed all three jobs: build (36 seconds), deploy (31 seconds), and verify-publication (56 seconds). Verification reran all 12 test checks against https://i-c-e-m-a-n.github.io/FSDashboard/, then verified HTTP 200, the rendered homepage, and successfully loaded live map tiles. Desktop/mobile screenshots are retained in the `published-verification` workflow artifact.

The managed local environment still blocks direct access to the Pages domain; published verification was executed by GitHub Actions against the actual public URL. The earlier network draft remains available if direct local browsing is wanted. No publication claim relies solely on the local preview or artifact upload.

## Remaining limitations

Fixed synthetic snapshot (16 November 2026); approximate illustrative sectors and coordinates; no live synchronization or authenticated backend. Street tiles depend on a third-party public service. Production internal use requires appropriate secured hosting, authorization, data governance and a map-provider service agreement. Keyboard/screen-reader alternatives are provided through the records list; automated checks are not an accessibility certification.
