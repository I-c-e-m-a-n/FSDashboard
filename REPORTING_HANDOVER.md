# Consolidated reporting

The Data Explorer's **Reports** view and homepage's **Across the workspace** section share `reportingModel.ts`. The pure `buildReports` function derives reports from the existing hydrated domain stores and reference registries. No second operational database or copied reporting totals are maintained. Store revisions refresh both surfaces after edits.

## Capabilities and relationships

Twenty-three datasets cover operations, case intake, resolutions, case actions, infrastructure and updates, engagements and attachment metadata, visit outcomes, households, residents, family relationships, block coverage, personnel, deployments, awards, training, organisations, locations, teams, operational links, consolidated metrics and organisation workload. Stable identifiers connect records to their source workspaces and related datasets. Geographic relationships resolve through the shared locations and household references; organisational workload references the common organisation registry.

Summary cards, organisation bars, resolution months, infrastructure stages and block coverage drill into matching rows. Search and drill-down criteria combine within the selected dataset; pagination does not limit exports. Record inspection displays every field and links to related records where available in the reporting scope. CSV downloads include scope/date metadata, all matching rows and spreadsheet-formula protection. Attachment exports contain metadata only, never embedded media.

## Metric and scope decisions

- All periods use the established synthetic reporting snapshot, **17 November 2026 SGT**. Area and period apply independently of the operational explorer's map layers, status and search; the interface states this explicitly. Table search and drill-down do not change the summary cards.
- Intake uses opening dates; resolutions use the latest resolution date of cases currently Resolved or Closed. A case opened before the period can therefore appear in resolutions without appearing in intake. Reopened cases leave that cohort; their earlier actions remain in the journal dataset. This is not a historical state reconstruction or an intake-cohort closure rate.
- Infrastructure cohorts use reporting dates, with stage and estimated progress taken from current records. Mean progress is an unweighted mean across active matters. Journal timestamps are converted to Singapore dates.
- Engagements and deployments use activity dates. Counted personnel attendance excludes cancelled and future activities. Attendance instances, distinct personnel and community participations are separate measures.
- Coverage is distinct households successfully contacted through eligible, non-cancelled visits divided by the current synthetic household roster. Unsuccessful attempts remain visible. This denominator is not an estimate of all actual homes or a historical population snapshot.
- Current directories, demographic data, awards and training are not falsely date-filtered where no event date exists. Each dataset describes its own date basis. Organisations remain a global reference directory.
- Organisation workload counts active case and infrastructure records within their intake/reporting cohorts, not unique neighbourhood issues. Related case and infrastructure records remain distinct. Unassigned workload excludes unrelated engagements and visits.

## Verification and publication

The strict TypeScript production build and compiled-asset checks pass. All **56 Playwright tests** pass locally across desktop and mobile, including the existing workflows. New coverage verifies resolution-date cohorts, reopened cases, cancelled deployments, organisation drill-downs, foreign-key navigation, complete filtered CSV exports and formula escaping, homepage scope propagation, household coverage, empty results, accessibility and responsive overflow. Desktop visual inspection confirms the established design language.

The existing deployment workflow reruns the entire suite against the published GitHub Pages URL after deployment, verifies HTTP 200 and live map tiles, and saves desktop/mobile screenshots including the Reports view in `published-verification`. Consult the release's Actions run for publication status; a local build alone does not establish publication.

## MVP limitations

All data is synthetic; edits remain browser-local. Reports reflect current records, not a versioned analytical warehouse. Training and award history lacks dates. Live map tiles require network access. The existing single application bundle now exceeds Vite's advisory 500 kB threshold; route-level code splitting is a reasonable future performance improvement. No production services, authentication or resident portal were introduced.
