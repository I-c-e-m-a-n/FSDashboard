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
- Map-tile error behavior validated. External street tiles remain unverified because the managed environment's outbound policy blocks the provider.

## Deployment status

GitHub Actions workflow prepared in `.github/workflows/deploy.yml`: lockfile installation → build → browser tests → Pages artifact → deployment on `main`. Public release verification is **pending**. The running environment returns proxy HTTP 403 for `api.github.com` and `i-c-e-m-a-n.github.io`; these are network failures, not evidence of application or GitHub authentication failure.

Network additions have been saved to the environment configuration draft for `api.github.com`, `i-c-e-m-a-n.github.io`, and `tile.openstreetmap.org`. Reusable installation and startup instructions have also been saved. Draft saves do not apply or publish environment settings.

After these changes are applied, confirm Pages uses GitHub Actions, inspect the workflow result, then run the documented published-URL browser suite and confirm real street tiles load. Do not treat an uploaded workflow or artifact as a verified publication.

## Remaining limitations

Fixed synthetic snapshot (16 November 2026); approximate illustrative sectors and coordinates; no live synchronization or authenticated backend. Street tiles depend on a third-party public service. Production internal use requires appropriate secured hosting, authorization, data governance and a map-provider service agreement. Keyboard/screen-reader alternatives are provided through the records list; automated checks are not an accessibility certification.
