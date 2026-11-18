> Current shared-data architecture and reporting semantics: [Architecture review](ARCHITECTURE_REVIEW.md). Earlier release details below are historical where they differ.

# Personnel Management MVP

Personnel Management adds a synthetic directory, individual profiles, regular/ad-hoc classification, recruitment stages, team membership, awards, learning progression and deployment/attendance records. Charts show age bands, sex and race for the filtered directory; no demographic field is used to rank or assign people.

Profiles use synthetic identifiers, age rather than date of birth, and no names or contact details. Demographics and recognition examples are entirely fictional. The reporting reference is 17 November 2026. Recognition and learning currently use the 2026 demonstration year and a small fixed programme catalogue.

Team membership references the shared team directory. Deployments reference existing operational IDs and resolve current titles from the shared record collection, including engagements, visits, infrastructure and cases. Each person has at most one attendance state per activity; updating a deployment replaces that person's previous state. Attendance is not added to resident contact totals. Operational records are not duplicated or modified by personnel edits.

The module uses React/TypeScript and the existing Pages hash navigation. Profiles persist in browser-local storage under a versioned key, capped at 200 profiles. Save is atomic for each profile and storage failure retains the open editor. Recruitment progresses through Prospect, Onboarding, Active and Inactive by administrator selection. Awards can be added/removed and learning states updated.

Limits: no backend, multi-user synchronisation, access control, audit log, certification expiry, agency submission or resident portal. Existing team ownership in other modules remains team-level; individual deployments are administered in Personnel Management. Corrupt local snapshots fall back to synthetic samples. Never enter real personnel data. A future authenticated service should normalize learning and award records into dated entities and enforce foreign keys, authorization and audit history server-side.

Verification: production TypeScript/asset checks and desktop/mobile Playwright coverage for profile edits, attendance, recognition, learning, reload persistence, empty results and overflow. The existing regression suite covers the other four modules. Publication is confirmed only after the deployment workflow and public-site tests succeed.
