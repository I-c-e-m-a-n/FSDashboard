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

Implementation and automation pushed to `main` (application commit `b1b2cc7`, publication-verification commit `f48d416`). GitHub Actions workflow in `.github/workflows/deploy.yml`: lockfile installation → build → browser tests → Pages artifact → deployment → public-URL browser suite and live-tile screenshot checks.

[Actions run #1](https://github.com/I-c-e-m-a-n/FSDashboard/actions/runs/43829407413) successfully completed the build/test job and uploaded the Pages artifact. Deployment failed at `actions/configure-pages`: **Get Pages site failed / Not Found**. GitHub Pages must be enabled and configured to use GitHub Actions. The action documentation confirms its automatic enablement requires a token other than `GITHUB_TOKEN`; no additional credential has been requested or fabricated.

Public release verification is **pending**, and no successful publication is claimed. The running environment returns proxy HTTP 403 for `api.github.com` and `i-c-e-m-a-n.github.io`; these are network failures, not evidence of application or GitHub authentication failure.

Network additions have been saved to the environment configuration draft for `api.github.com`, `i-c-e-m-a-n.github.io`, and `tile.openstreetmap.org`. Reusable installation and startup instructions have also been saved. Draft saves do not apply or publish environment settings.

Required external action: in repository Settings → Pages → Build and deployment → Source, select **GitHub Actions**. Apply the saved cloud network additions to allow this agent to manage and verify publication. Then rerun the latest failed workflow (or dispatch it); the new `verify-publication` job exercises the public URL and live tiles and saves screenshot evidence. Do not treat an uploaded workflow or artifact as a verified publication.

## Remaining limitations

Fixed synthetic snapshot (16 November 2026); approximate illustrative sectors and coordinates; no live synchronization or authenticated backend. Street tiles depend on a third-party public service. Production internal use requires appropriate secured hosting, authorization, data governance and a map-provider service agreement. Keyboard/screen-reader alternatives are provided through the records list; automated checks are not an accessibility certification.
