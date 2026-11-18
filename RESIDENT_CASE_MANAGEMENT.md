# Residents & Cases — engineering handover

## Scope and assumptions

The sixth primary tab provides synthetic resident/household administration, family relationships, house-visit case management and MPS case tracking. The supplied Google Doc export remains inaccessible from the execution environment (proxy CONNECT 403). Implementation follows the user's explicit requirements; exact conformance to unseen specification details is not claimed.

The resident portal remains excluded. No names, contact details, actual unit addresses, identity numbers or live records are collected. The shared reporting date remains **17 November 2026 SGT**, a reproducible demonstration context rather than the computer's current date. Date inputs and analytics use that context.

## Shared architecture

`caseStore.ts` owns a versioned aggregate containing households, resident members, family links, visit outcomes and case records. Resident IDs are stable within households; cases reference those IDs rather than copying profiles. Sixteen synthetic blocks reference the existing sixteen geographical locations. These are illustrative block groups, not official block/address mappings.

The initial roster contains 48 households and 96 residents, with parent/child, spouse and sibling examples. Ten household visit outcomes demonstrate successful contact, no answer, declined and revisit requested. The four existing cases retain their IDs, locations and summary statistics, and gain detailed case data. Two are house-visit cases and two are MPS cases. Existing operational totals therefore remain consistent.

Cases reference shared personnel, coordination teams and organisations. Added Social Service Office, HDB and a community health service to the shared organisation directory for illustrative referrals. Individual case ownership and responsible branch team are explicit, separate assignments. Source visit rounds and optional engagements, infrastructure matters and other cases link through operational IDs. Incoming links remain owned by their originating module.

Domain saves call the existing canonical operation projection and observable revision mechanism. Overview, Data Explorer, engagement links, infrastructure links and personnel deployment selectors see the same cases. Global case details provide a direct route into the case editor. The new interface loads on demand; the shared store hydrates at application startup so other modules always see restored cases.

Hydration restores existing domains and cases before reconciling cross-domain references. Storage writes precede in-memory mutation. Invalid snapshots show a warning without overwriting storage automatically. Missing operational references are reconciled with a visible warning. This release adds a new storage key without changing existing keys.

## Lifecycle and integrity

Cases support Open, Referred, Awaiting response, Follow-up, Resolved, Closed and Cancelled, including reopening with a required action note. Routine/Urgent/Critical classifications are retained in the case domain; Critical maps to Urgent in existing global summaries. Referrals require an organisation. Active cases use their next follow-up date for the shared overdue calculation. Resolution and closure require a resolution note and a date between opening and the reporting date. Prior resolution details remain in the journal when a case reopens.

Every save appends a dated action recording stage, organisation and next follow-up; resolution actions also retain their outcome/date. Case identity, original opening date and resident association are immutable after creation. A case may be resolved directly after an initial enquiry; mandatory artificial intermediate transitions are not imposed.

Households support adding/editing residents and adding/removing family relationships. Links must join distinct residents within the household; symmetric duplicates are rejected and a parent must be older than the child. Residents referenced by cases cannot be removed. Households with operational history retain their block to prevent retroactively moving coverage or cases; relocation history is outside this MVP.

Each household/visit-round/date combination has one outcome. Existing outcomes can be corrected. Round and household identity remain fixed when correcting an outcome. Visit personnel reference the shared directory. Visit dates cannot precede the source round or exceed the reporting date. Source house-visit cases cannot predate their originating round. A round can cover more than one block; its map marker represents the operational anchor, not a route boundary.

## Interface and analytics

- **Cases:** priority, channel, stage, block, search and opened-date filters; owner/organisation/next action; CSV export; linked records; journal and lifecycle editor.
- **Households:** synthetic profiles, ages, family links, linked cases and visit histories; record visits and raise a case directly from a visit outcome.
- **Coverage:** distinct households successfully contacted divided by roster households in each block. Repeat successful contacts count once. Other outcomes count as attempts, not contact. Cancelled rounds are excluded. Period/block filters apply; case filters and search do not redefine the roster denominator.
- **MPS:** meeting-date groups derived from MPS cases, with active/resolved/overdue totals and direct case access. This is case tracking, not appointment scheduling or a meeting-attendance register.
- **Outcomes:** resolution rate and mean duration by intake channel, active-case age bands and organisation workload/overdue reporting. The opened-date cohort follows case filters. Resolved/Closed count once; cancelled cases remain in the rate denominator. Mean duration uses opening to the latest resolution date, not an SLA/business-day calculation.
- **Map:** shared case locations and editor, with the existing overlapping-marker handling.

Legacy aggregate household-contact totals remain unchanged. They represent visit-round totals without household identity and cannot be used to infer unique coverage. The new outcome register is a deliberately small linked synthetic sample, not an exhaustive reconstruction of those totals. Coverage denominators are the current synthetic roster, not the actual population of Fengshan.

## Verification and MVP limits

The production build and initial 50-test desktop/mobile regression suite pass. Playwright covers MPS referral/resolution/reopening, cross-module persistence and links, household edits, family/date validation, case creation from visits, duplicate outcomes, repeat-contact coverage, accessible views/dialogs, mobile overflow and storage failure. Existing regression tests cover all previous modules. The published verification script captures the new tab on desktop/mobile, and the workflow reruns browser tests against GitHub Pages before publication is declared verified.

Browser-local limits: 120 households, eight residents per household, 200 cases, 100 actions per case and 500 visit outcomes. No server, multi-user synchronization, email/agency submissions, attachments for cases, tamper-proof audit trail or production access control is included. Family links are within a household; cross-household genealogy and relocation history are not implemented. Do not enter real information.

## Recovery ledger

The interrupted work left only `caseStore.ts` written and unintegrated. Recovery inspected that file and repository state, then completed the interface, hydration, shared detail navigation, validations, analytics, tests and deployment verification. Existing case IDs and other domain stores were preserved; no duplicate case population was inserted.
