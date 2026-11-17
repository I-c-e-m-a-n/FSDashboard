# Engagement Management MVP

## Model and integration

An engagement is a one-to-one scheduling extension of a shared operation. Existing house-visit and engagement IDs are retained. Other operation categories remain independently maintained and may be linked by ID. Locations and teams reuse reference entities; three explicitly fictional coordinator roles reference existing teams. Festivals, family distributions, GRC walks and other activities are subtypes of Engagements; house visits remain House visits. Actual contacts/participations feed shared metrics; planned counts never inflate operational totals.

The browser-local store uses a versioned, validated JSON snapshot with an observable revision. After a successful storage write it projects updates into the existing operation/read-model collections and explicit links; all tabs subscribe to the same revision. Cancelled is distinct from Completed and is excluded from outstanding counts. Related cases are associations and need not originate from the event. Historical fixture relationships retain their original meaning until edited.

The fixed historical overview remains 16 November 2026. All dates on Overview/Data Explorer includes scheduled events beyond that snapshot; snapshot-week charts are labelled explicitly. Engagement schedules use date-only values and same-day 24-hour Singapore times without UTC conversion. Overnight/multiday events are outside this MVP.

## Workflow

Create a draft, schedule it, mark it in progress, document actual counts/outcomes and images, and complete or cancel it. The stage field deliberately allows corrections in either direction for this synthetic MVP. Cancel retains the record and its links; destructive deletion is not offered. Schedule, board and interactive map share type/stage/area/month/search filters. Map and schedule selections open the same editor. Editors support existing case/infrastructure associations.

Up to three JPEG/PNG/WebP images per event, each input up to 2 MB. Browser decoding and canvas re-encoding resize to a maximum dimension of 1200 pixels and strip metadata. SVG/executable formats are rejected. Image removal is persisted only on Save. All text is rendered through React rather than interpreted as HTML.

## Persistence and limitations

Public static demo, synthetic data only. Changes and attachments are stored in this browser's localStorage, never uploaded or shared. They can be lost when browser data is cleared. This is not secure storage, collaboration, a backup system or an audit trail. Multiple simultaneous browser tabs are not synchronized; avoid concurrent editing. Storage failures leave the current in-memory collection unchanged and expose a retryable error. Invalid saved snapshots fall back to sample data with a visible warning. Maximum 100 events; storage quotas may impose a lower image limit.

No authentication, resident portal, real personnel records, remote media storage or service backend is included. Future integration needs an authenticated repository/service layer, concurrency control, authorization, audit history and secure object storage; localStorage is an MVP adapter, not the production architecture.

## Verification

Existing overview/Data Explorer tests remain in the pipeline. New desktop/mobile tests cover create/schedule/progress/complete/cancel, reload persistence, cross-tab record identity, actual counts, case linking, input validation, attachment rejection/addition/removal, map markers, accessibility and viewport overflow. GitHub Actions builds, tests, deploys compiled dist assets and reruns the suite against the public URL. Each test context has isolated browser storage and cannot write to a shared server dataset.
