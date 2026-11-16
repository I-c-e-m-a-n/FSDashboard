# Data Explorer handover

## Architecture and scope

The linked Google Doc could not be retrieved: the managed network proxy returned HTTP 403. No claim is made to have reviewed its contents. Implementation follows the supplied task and existing operational domains. Reconcile specification-specific entities when the document becomes accessible. No resident portal, personal records or authentication façade is included.

`model.ts` defines independently maintained locations and teams, typed operations referencing those entities, and directional many-to-many record links. `data.ts` seeds 16 fictional operations, 16 approximate locations, three teams and seven explicit referrals/raised matters. Existing homepage totals are preserved. The joined RecordItem read model provides backwards-compatible map/UI fields without independently maintained totals. Household contacts and participations are distinct measures; cases and infrastructure are counted as records. Shared selectors and date rules live in `analytics.ts` and `data.ts`.

Relations are explicit fictional provenance, not inferred from co-location. Links can cross areas and are date-consistent. Each record has one responsible team and one location; the schema supports many operations per reference entity. The fixture currently assigns one location per operation and one team per demo area. Household/person identity is deliberately absent; contacts and attendance are not distinct-person counts. No speculative service backend or unrelated datasets are introduced.

## Capabilities

Hash-based `#explorer` navigation works on static Pages without routing rewrites. Existing overview, map and dialogs remain available. Area, period, search and dataset filters are shared; Explorer status/priority refinements reset when leaving the tab and do not silently filter the homepage.

Explorer offers dataset selection, text/geographic/date/status/priority filters, sortable and paginated records, filtered CSV export, linked-record traversal, a geographical cross-tab with drill-down, weekly activity, separate volume measures, explicit connection cards and a reference-model/dictionary view. The model directory uses collection-wide counts and labels this explicitly. Connection cards require both endpoints in the current selection; record details show complete relationship context even outside filters. Exports contain all matching rows, not just the visible page, with separate unit columns and CSV escaping.

## Validation and deployment

The existing homepage regression suite is retained. Additional desktop/mobile tests exercise pagination, refinement, connections, linked dialogs, export, shared navigation, empty states, accessible views and referential integrity. The production build checks compiled Pages asset paths. Existing GitHub Actions runs the full suite before deployment and repeats it against the public URL after deployment. Public screenshot evidence remains in the workflow artifacts.

## Limitations

Read-only synthetic snapshot (16 November 2026); approximate geography; no authenticated APIs or real operational records. No assertions of unique residents, demographic analytics, or official area boundaries. For real integration, replace fixtures with validated service adapters and enforce authorization server-side. Specification reconciliation remains outstanding because its contents were inaccessible.
