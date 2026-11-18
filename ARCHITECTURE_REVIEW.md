> Subsequent extension: [Residents & Cases](RESIDENT_CASE_MANAGEMENT.md) adds household-level data and case lifecycles. The shared organisation directory now contains eight entries.

# Shared architecture review and remediation

## Scope and review baseline

Reviewed all five modules, domain stores, the operational model, analytics, filtering, storage hydration and deployment verification. The Google specification export was blocked by the workspace network proxy (HTTP CONNECT 403); repository behaviour and the user's architectural requirements are the baseline. This remains a synthetic, browser-local MVP, without a resident portal or production services.

## Findings and decisions

| Finding | Remediation |
| --- | --- |
| Engagement coordinators were a separate three-person directory | One observable personnel store now backs profile editing, coordinator selection and operational detail. Legacy P-01/P-02/P-03 identifiers migrate to SYN-004/SYN-005/SYN-003. |
| Locations were generated one-for-one from operational rows | Independent stable location, team and organisation reference directories. Fixtures now reference IDs rather than duplicate coordinates/names. New activities reuse existing locations. |
| Each domain rebuilt location/team joins and mutated two read collections independently | `upsertOperation` is the shared write boundary for canonical operations and their joined UI projection. Domain stores retain lifecycle-specific fields; summary records are derived, not separately persisted. |
| Organisation responsibility was hidden inside infrastructure | Shared organisation directory and organisationId in the common operation model, exposed alongside coordinator and deployment information in record detail. |
| Personnel was component-local with partial storage validation | Observable store, validated nested records, atomic persistence, v1 migration, and two-phase restoration before resolving deployment references. Team changes refresh engagement projections. |
| Reporting used 16 and 17 November simultaneously | `reporting.ts` defines the reproducible date-only reporting context: 17 November 2026 SGT. This is fixture context, not the computer's current date. Seven days includes 11–17 November; 30 days includes 19 October–17 November. |
| Weekly chart omitted snapshot-day records and fixed dates ignored All dates | Bounded date buckets cover every selected record exactly once; wide selections use larger intervals, capped at twelve buckets. |
| Cancelled activity could inflate contact totals | Cancelled operations remain in record totals but not contact/participation measures or outstanding/overdue counts. Draft/scheduled engagements project zero actual participation. Completion rate remains completed / all selected records, explicitly including cancelled records in the denominator. |
| Overview CSV differed from Explorer and lacked formula escaping | Both use the same export/measure implementation and reporting date. |
| Team directory drilldown filtered geography rather than ownership | Explicit team ID filtering, including activities deployed outside the owner's home sector. Directory drilldown uses all dates and resets other filters. |
| Relationship deduplication collapsed directional types | Directional typed relationships retain their direction/type; only generic associations deduplicate reciprocal endpoints. |

## Data ownership and dependencies

`referenceData.ts` owns immutable locations, teams and organisations. `data.ts` owns the common operation projection and initial case records. Engagement and infrastructure stores own their lifecycle aggregates, and write canonical operations through `upsertOperation`. `personnelStore.ts` owns personnel profiles and nested attendance, learning and recognition records; those are bounded aggregate values, not separately editable duplicate entities. A person's team ID is canonical; display names are synthetic and derived.

An operation references one location and team, and optionally an organisation and coordinator. A person can deploy to many operations; the (person ID, operation ID) pair is unique. Coordinator responsibility does not imply attendance. Resident contacts, community participations and personnel attendance are distinct measures and are never added together. Typed operation links reference IDs rather than embedding records.

Hydration restores personnel first (including legacy identity mapping), restores domain records, projects both operational collections, then reconciles cross-domain and personnel references. Saves persist before publishing observable changes. Domain stores own their own associations; updating one module does not reset the others. Existing storage keys remain supported. New sample records merge by stable ID into old snapshots without replacing existing edits. At the 100-record domain capacity, existing saved records take priority over additional samples.

## Expanded fixture coverage

The workspace now contains 28 operational records: 15 visits/engagements, 9 infrastructure matters and 4 cases; 18 synthetic personnel; 16 reusable locations; 3 teams; and 5 organisation entries including Unassigned. Added all six festive/family distribution types and a scheduled GRC walk. Infrastructure covers all eight categories and agency responsibility across Town Council, NEA, LTA and parks/landscape. Added Assigned, Awaiting response, Resolved and Cancelled examples. Relationships connect historical outreach, current matters and planned follow-up work.

Seasonal examples intentionally sit outside the default recent reporting window; choose All dates to explore the full collection. The recent overview retains 16 records and now correctly reports 3 overdue records at the common reporting date. Fixture activity dates are illustrative, not an authoritative holiday calendar.

Shared-coordinate markers are visually spread in pixel space to remain selectable; canonical location coordinates are unchanged.

## Validation and remaining boundaries

The final local production build and all 42 desktop/mobile tests pass. Regression tests cover the five existing modules. Added invariants for date boundaries, chart conservation, cancelled measures, invalid foreign keys, shared personnel/team changes after reload and migration of legacy personnel/coordinator storage. Existing infrastructure and engagement tests continue to cover cross-domain persistence and storage failures. Build checks TypeScript and deployed asset paths. Actions reruns browser tests against the public site and verifies rendering/map tiles.

Remaining MVP boundaries: browser-local stores do not provide cross-tab concurrency, shared persistence or authenticated authorization. Corrupt snapshots produce a visible warning and retain the original storage until a subsequent save. Learning and awards retain their existing bounded string representations; a future dedicated qualification/award catalogue requires a separate migration. No deletion/cascade workflow is introduced. These boundaries are explicit and are not presented as production architecture.

## Recovery ledger

- Original objective: architectural consolidation, representative synthetic workflows, testing and verified deployment.
- Destination inspected: repository working tree and build after interruption.
- Already written: partial shared references/personnel/projection/reporting refactor; no architecture release was committed.
- Partial before recovery: fixture coverage, migration/regression tests, UI date labels and review documentation.
- Completed during recovery: canonical fixture references, shared projections/identity, expanded records, reporting fixes, tests and this review.
- Duplication avoided: existing operation/personnel IDs and saved-record keys retained; new fixtures merge by ID.
- Verification evidence: test suite, build and final GitHub Actions run linked in the delivery handover.
