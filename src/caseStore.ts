import { records, links, upsertOperation, type Operation } from "./data";
import { locations, teams, organisations } from "./referenceData";
import { people } from "./personnelStore";
import { reportingDate, inReportingWindow } from "./reporting";
import {
  notifyOperations,
  useOperationalRevision,
  replaceOperationalLinks,
  registerOperationalProjection,
} from "./operationalStore";
export const blocks = locations.map((l, i) => ({
  id: `BLOCK-${String(i + 1).padStart(2, "0")}`,
  label: `Demo block ${String(i + 1).padStart(2, "0")}`,
  locationId: l.id,
}));
export interface Household {
  id: string;
  blockId: string;
  members: Resident[];
  relationships: FamilyLink[];
}
export interface Resident {
  id: string;
  age: number;
}
export interface FamilyLink {
  fromId: string;
  toId: string;
  kind: "Parent of" | "Spouse of" | "Sibling of";
}
export const caseStages = [
  "Open",
  "Referred",
  "Awaiting response",
  "Follow-up",
  "Resolved",
  "Closed",
  "Cancelled",
] as const;
export type CaseStage = (typeof caseStages)[number];
export const caseChannels = ["House visit", "MPS", "Community"] as const;
export interface CaseUpdate {
  id: string;
  date: string;
  stage: CaseStage;
  organisationId: string;
  followUp: string;
  note: string;
  resolution?: string;
  resolvedOn?: string;
}
export interface ResidentCase {
  id: string;
  title: string;
  householdId: string;
  residentId: string;
  channel: (typeof caseChannels)[number];
  mpsDate: string;
  sourceId: string;
  ownerId: string;
  teamId: string;
  organisationId: string;
  urgency: "Routine" | "Urgent" | "Critical";
  stage: CaseStage;
  openedOn: string;
  followUp: string;
  resolvedOn: string;
  resolution: string;
  description: string;
  relatedIds: string[];
  history: CaseUpdate[];
}
export const visitOutcomes = [
  "Contacted",
  "No answer",
  "Declined",
  "Revisit requested",
] as const;
export interface VisitContact {
  id: string;
  householdId: string;
  operationId: string;
  personId: string;
  date: string;
  outcome: (typeof visitOutcomes)[number];
}
interface Workspace {
  version: 1;
  households: Household[];
  cases: ResidentCase[];
  contacts: VisitContact[];
}
const originalCases = records
  .filter((r) => r.category === "Case management")
  .map((r) => ({ ...r }));
const originalLinks = links.map((l) => ({ ...l }));
const households: Household[] = blocks.flatMap((block, i) =>
  Array.from({ length: 3 }, (_, j) => {
    const id = `HH-${String(i * 3 + j + 1).padStart(3, "0")}`;
    return {
      id,
      blockId: block.id,
      members: [
        { id: `${id}-A`, age: 35 + j * 8 },
        { id: `${id}-B`, age: j === 0 ? 8 : 33 + j * 7 },
      ],
      relationships: [
        {
          fromId: `${id}-A`,
          toId: `${id}-B`,
          kind: (["Parent of", "Spouse of", "Sibling of"] as const)[j],
        },
      ],
    };
  }),
);
const seeds: ResidentCase[] = originalCases.map((r, i) => {
  const household = households.find(
    (h) => blocks.find((b) => b.id === h.blockId)?.locationId === r.locationId,
  )!;
  return {
    id: r.id,
    title: r.title,
    householdId: household.id,
    residentId: household.members[0].id,
    channel: i % 2 ? "MPS" : "House visit",
    mpsDate: i % 2 ? r.date : "",
    sourceId:
      i % 2 ? "" : (originalLinks.find((l) => l.toId === r.id)?.fromId ?? ""),
    ownerId: people.find((p) => p.teamId === r.teamId)!.id,
    teamId: r.teamId,
    organisationId: "ORG-UNASSIGNED",
    urgency: r.priority,
    stage:
      r.status === "Completed"
        ? "Closed"
        : r.status === "In progress"
          ? "Follow-up"
          : "Open",
    openedOn: r.date,
    followUp: r.due,
    resolvedOn: r.status === "Completed" ? r.due : "",
    resolution:
      r.status === "Completed"
        ? "Synthetic service guidance provided; sample matter closed."
        : "",
    description: r.detail,
    relatedIds: [],
    history: [
      {
        id: `${r.id}-INITIAL`,
        date: r.date,
        stage:
          r.status === "Completed"
            ? "Closed"
            : r.status === "In progress"
              ? "Follow-up"
              : "Open",
        organisationId: "ORG-UNASSIGNED",
        followUp: r.due,
        note: "Imported synthetic snapshot; earlier case actions are not represented.",
      },
    ],
  };
});
const contacts: VisitContact[] = records
  .filter((r) => r.category === "House visits")
  .flatMap((r, i) => {
    const household = households.find(
      (h) =>
        blocks.find((b) => b.id === h.blockId)?.locationId === r.locationId,
    )!;
    return [
      {
        id: `CONTACT-${i + 1}`,
        householdId: household.id,
        operationId: r.id,
        personId: people.find((p) => p.teamId === r.teamId)!.id,
        date: r.date,
        outcome: "Contacted" as const,
      },
    ];
  });
// Seed unsuccessful attempts separately from successful contacts.
contacts.push(
  ...contacts.map((v, i) => ({
    ...v,
    id: `CONTACT-${i + 6}`,
    householdId:
      households[households.findIndex((h) => h.id === v.householdId) + 1].id,
    outcome: (["No answer", "Declined", "Revisit requested"] as const)[i % 3],
  })),
);
let workspace: Workspace = {
  version: 1,
  households: structuredClone(households),
  cases: structuredClone(seeds),
  contacts: structuredClone(contacts),
};
export let caseWarning = "";
const KEY = "fengshan.residents-cases.v1";
const dateValid = (s: string) =>
  typeof s === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  Number.isFinite(Date.parse(s)) &&
  new Date(s).toISOString().slice(0, 10) === s;
const unique = (ids: string[]) => new Set(ids).size === ids.length;
export const activeCase = (c: ResidentCase) =>
  !["Resolved", "Closed", "Cancelled"].includes(c.stage);
export function validateHousehold(h: Household) {
  if (
    !h ||
    !/^HH-[\w-]+$/.test(h.id) ||
    !blocks.some((b) => b.id === h.blockId) ||
    !Array.isArray(h.members) ||
    h.members.length < 1 ||
    h.members.length > 8 ||
    !unique(h.members.map((m) => m.id)) ||
    h.members.some(
      (m) =>
        !m.id.startsWith(h.id + "-") ||
        !Number.isInteger(m.age) ||
        m.age < 0 ||
        m.age > 110,
    )
  )
    throw Error(
      "Choose a block and 1–8 synthetic residents with ages from 0 to 110.",
    );
  if (!Array.isArray(h.relationships) || h.relationships.length > 28)
    throw Error("Invalid family relationships.");
  const edges = new Set<string>();
  for (const link of h.relationships) {
    if (
      !["Parent of", "Spouse of", "Sibling of"].includes(link.kind) ||
      link.fromId === link.toId ||
      ![link.fromId, link.toId].every((id) =>
        h.members.some((m) => m.id === id),
      )
    )
      throw Error(
        "Family links must connect two different residents in this household.",
      );
    const key =
      link.kind +
      "|" +
      (link.kind === "Parent of"
        ? [link.fromId, link.toId]
        : [link.fromId, link.toId].sort()
      ).join("|");
    if (edges.has(key)) throw Error("This family relationship already exists.");
    edges.add(key);
    if (
      link.kind === "Parent of" &&
      h.members.find((m) => m.id === link.fromId)!.age <=
        h.members.find((m) => m.id === link.toId)!.age
    )
      throw Error(
        "A parent must be older than the child in this synthetic roster.",
      );
  }
}
export function validateCase(
  c: ResidentCase,
  rows = workspace.households,
  checkOperations = true,
) {
  const household = rows.find((h) => h.id === c.householdId);
  if (
    !c ||
    !(
      originalCases.some((r) => r.id === c.id) || /^CASE-[a-f0-9-]+$/.test(c.id)
    ) ||
    typeof c.title !== "string" ||
    !c.title.trim() ||
    c.title.length > 120 ||
    !household ||
    !household.members.some((m) => m.id === c.residentId)
  )
    throw Error(
      "Enter a title and select a resident belonging to the household.",
    );
  if (
    !caseChannels.includes(c.channel) ||
    !caseStages.includes(c.stage) ||
    !["Routine", "Urgent", "Critical"].includes(c.urgency) ||
    !people.some((p) => p.id === c.ownerId) ||
    !teams.some((t) => t.id === c.teamId) ||
    !organisations.some((o) => o.id === c.organisationId)
  )
    throw Error(
      "Choose valid case classification, ownership and referral values.",
    );
  if (
    !dateValid(c.openedOn) ||
    c.openedOn > reportingDate ||
    !dateValid(c.followUp) ||
    c.followUp < c.openedOn
  )
    throw Error(
      "Use a valid opened date on/before the reporting date, and a follow-up on/after opening.",
    );
  if (c.channel === "MPS" && (!dateValid(c.mpsDate) || c.mpsDate > c.openedOn))
    throw Error("MPS meeting date must be valid and on/before case opening.");
  if (
    c.channel === "House visit" &&
    (!c.sourceId ||
      (checkOperations &&
        !records.some(
          (r) =>
            r.id === c.sourceId &&
            r.category === "House visits" &&
            r.date <= c.openedOn,
        )))
  )
    throw Error(
      "House-visit cases require a visit round dated on/before case opening.",
    );
  if (
    ["Referred", "Awaiting response"].includes(c.stage) &&
    c.organisationId === "ORG-UNASSIGNED"
  )
    throw Error("Choose a responsible organisation before referral.");
  if (
    ["Resolved", "Closed"].includes(c.stage) &&
    (!dateValid(c.resolvedOn) ||
      c.resolvedOn < c.openedOn ||
      c.resolvedOn > reportingDate ||
      !c.resolution.trim())
  )
    throw Error(
      "Resolved and closed cases require a resolution note and date between opening and the reporting date.",
    );
  if (
    typeof c.description !== "string" ||
    c.description.length > 3000 ||
    typeof c.resolution !== "string" ||
    c.resolution.length > 1500 ||
    !Array.isArray(c.relatedIds) ||
    !unique(c.relatedIds) ||
    c.relatedIds.some(
      (id) =>
        id === c.id || (checkOperations && !records.some((r) => r.id === id)),
    ) ||
    !Array.isArray(c.history) ||
    c.history.length > 100 ||
    c.history.some(
      (h) =>
        typeof h.id !== "string" ||
        (h.resolution !== undefined &&
          (typeof h.resolution !== "string" || h.resolution.length > 1500)) ||
        (h.resolvedOn !== undefined &&
          h.resolvedOn !== "" &&
          !dateValid(h.resolvedOn)) ||
        !dateValid(h.date) ||
        !caseStages.includes(h.stage) ||
        typeof h.note !== "string" ||
        h.note.length > 1500 ||
        !organisations.some((o) => o.id === h.organisationId) ||
        !dateValid(h.followUp),
    )
  )
    throw Error("Invalid description, relationships or case journal.");
}
function project() {
  for (const c of workspace.cases) {
    const household = workspace.households.find((h) => h.id === c.householdId)!;
    const locationId = blocks.find(
      (b) => b.id === household.blockId,
    )!.locationId;
    const operation: Operation = {
      id: c.id,
      title: c.title,
      category: "Case management",
      locationId,
      teamId: c.teamId,
      coordinatorId: c.ownerId,
      organisationId: c.organisationId,
      date: c.openedOn,
      due: c.followUp,
      status:
        c.stage === "Cancelled"
          ? "Cancelled"
          : ["Resolved", "Closed"].includes(c.stage)
            ? "Completed"
            : c.stage === "Open"
              ? "Open"
              : "In progress",
      priority: c.urgency === "Routine" ? "Routine" : "Urgent",
      detail: c.description,
      measure: null,
    };
    upsertOperation(operation);
  }
  replaceOperationalLinks(
    "cases",
    workspace.cases.map((c) => c.id),
    workspace.cases.flatMap((c) =>
      [...new Set([...c.relatedIds, ...(c.sourceId ? [c.sourceId] : [])])]
        .filter(
          (id) =>
            !originalLinks.some((l) => l.fromId === id && l.toId === c.id),
        )
        .map((id) => ({
          id: `${c.id}-CASE-${id}`,
          fromId: c.id,
          toId: id,
          kind: "Associated record" as const,
          note: "Synthetic case association; detailed actions are in Residents & Cases.",
        })),
    ),
  );
}
registerOperationalProjection("cases", project);
export function hydrateCases() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Workspace;
      if (
        saved.version !== 1 ||
        !Array.isArray(saved.households) ||
        saved.households.length > 120 ||
        !Array.isArray(saved.cases) ||
        saved.cases.length > 200 ||
        !Array.isArray(saved.contacts) ||
        saved.contacts.length > 500 ||
        !unique(saved.households.map((h) => h.id)) ||
        !unique(saved.cases.map((c) => c.id)) ||
        !unique(saved.contacts.map((c) => c.id)) ||
        seeds.some((s) => !saved.cases.some((c) => c.id === s.id))
      )
        throw Error();
      saved.households.forEach(validateHousehold);
      saved.cases.forEach((c) => validateCase(c, saved.households, false));
      if (
        !unique(
          saved.contacts.map(
            (c) => `${c.householdId}|${c.operationId}|${c.date}`,
          ),
        )
      )
        throw Error();
      saved.contacts.forEach((c) =>
        validateContact(c, saved.households, false),
      );
      workspace = saved;
    }
  } catch {
    caseWarning =
      "Saved resident/case data could not be loaded. Synthetic samples are shown; saving replaces the invalid local snapshot.";
  }
  project();
}
export function reconcileCases() {
  for (const c of workspace.cases) {
    const valid = c.relatedIds.filter((id) => records.some((r) => r.id === id));
    if (valid.length !== c.relatedIds.length)
      caseWarning =
        "Unavailable operational links were omitted from the restored snapshot.";
    c.relatedIds = valid;
    if (
      c.sourceId &&
      !records.some((r) => r.id === c.sourceId && r.category === "House visits")
    ) {
      c.sourceId = "";
      c.channel = "Community";
      caseWarning =
        "A missing visit reference was removed; the case is retained as a community case.";
    }
  }
  const valid = workspace.contacts.filter((c) =>
    records.some(
      (r) => r.id === c.operationId && r.category === "House visits",
    ),
  );
  if (valid.length !== workspace.contacts.length)
    caseWarning =
      "Unavailable visit-round references were omitted from the restored snapshot.";
  workspace.contacts = valid;
  project();
}
function persist(next: Workspace) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    throw Error(
      "Browser storage is full or unavailable. Nothing was saved; your edits remain open.",
    );
  }
  workspace = next;
  project();
  notifyOperations();
}
export function useCases() {
  useOperationalRevision();
  return workspace;
}
export function freshHousehold(): Household {
  const id = `HH-${crypto.randomUUID()}`;
  return {
    id,
    blockId: blocks[0].id,
    members: [{ id: `${id}-A`, age: 35 }],
    relationships: [],
  };
}
export function saveHousehold(h: Household) {
  validateHousehold(h);
  const old = workspace.households.find((x) => x.id === h.id);
  if (
    old &&
    workspace.cases.some(
      (c) =>
        c.householdId === h.id && !h.members.some((m) => m.id === c.residentId),
    )
  )
    throw Error("A resident referenced by a case cannot be removed.");
  if (
    old &&
    old.blockId !== h.blockId &&
    (workspace.cases.some((c) => c.householdId === h.id) ||
      workspace.contacts.some((c) => c.householdId === h.id))
  )
    throw Error(
      "Households with operational history retain their block. Create a new household for a relocation in this demo.",
    );
  const next = old
    ? workspace.households.map((x) => (x.id === h.id ? structuredClone(h) : x))
    : [...workspace.households, structuredClone(h)];
  if (next.length > 120) throw Error("This demo supports 120 households.");
  persist({ ...workspace, households: next });
}
export function freshCase(h = workspace.households[0]): ResidentCase {
  return {
    id: `CASE-${crypto.randomUUID()}`,
    title: "",
    householdId: h.id,
    residentId: h.members[0].id,
    channel: "Community",
    mpsDate: reportingDate,
    sourceId: "",
    ownerId: people[0].id,
    teamId: people[0].teamId,
    organisationId: "ORG-UNASSIGNED",
    urgency: "Routine",
    stage: "Open",
    openedOn: reportingDate,
    followUp: reportingDate,
    resolvedOn: "",
    resolution: "",
    description: "",
    relatedIds: [],
    history: [],
  };
}
export function saveCase(input: ResidentCase, note: string) {
  validateCase(input);
  if (!note.trim() || note.length > 1500)
    throw Error("Add an action note of 1–1,500 characters.");
  const old = workspace.cases.find((c) => c.id === input.id);
  if (!old && !/^CASE-[a-f0-9-]+$/.test(input.id))
    throw Error("Invalid new case identifier.");
  if (
    old &&
    (old.openedOn !== input.openedOn ||
      old.householdId !== input.householdId ||
      old.residentId !== input.residentId)
  )
    throw Error("Existing case opening and resident identity are retained.");
  if (old?.history.length === 100)
    throw Error("This demo supports 100 case actions.");
  const saved = {
    ...structuredClone(input),
    title: input.title.trim(),
    sourceId: input.channel === "House visit" ? input.sourceId : "",
    mpsDate: input.channel === "MPS" ? input.mpsDate : "",
    resolvedOn: ["Resolved", "Closed"].includes(input.stage)
      ? input.resolvedOn
      : "",
    history: [
      ...(old?.history ?? []),
      {
        id: crypto.randomUUID(),
        date: reportingDate,
        stage: input.stage,
        organisationId: input.organisationId,
        followUp: input.followUp,
        note: note.trim(),
        resolution: ["Resolved", "Closed"].includes(input.stage)
          ? input.resolution
          : "",
        resolvedOn: ["Resolved", "Closed"].includes(input.stage)
          ? input.resolvedOn
          : "",
      },
    ],
  };
  const next = old
    ? workspace.cases.map((c) => (c.id === saved.id ? saved : c))
    : [...workspace.cases, saved];
  if (next.length > 200) throw Error("This demo supports 200 cases.");
  persist({ ...workspace, cases: next });
}
export function validateContact(
  c: VisitContact,
  rows = workspace.households,
  checkOperations = true,
) {
  if (
    !c ||
    !/^(CONTACT-\d+|VISIT-[a-f0-9-]+)$/.test(c.id) ||
    !rows.some((h) => h.id === c.householdId) ||
    !people.some((p) => p.id === c.personId) ||
    !visitOutcomes.includes(c.outcome) ||
    !dateValid(c.date) ||
    c.date > reportingDate ||
    (checkOperations &&
      !records.some(
        (r) =>
          r.id === c.operationId &&
          r.category === "House visits" &&
          r.status !== "Cancelled" &&
          r.date <= c.date,
      ))
  )
    throw Error(
      "Choose a household, visit round, personnel, valid outcome and date on/before the reporting date.",
    );
}
export function saveContact(c: VisitContact) {
  validateContact(c);
  if (
    workspace.contacts.some(
      (v) =>
        v.householdId === c.householdId &&
        v.operationId === c.operationId &&
        v.date === c.date,
    )
  )
    throw Error(
      "This household already has an outcome for that round and date. Edit the existing visit outcome.",
    );
  if (workspace.contacts.length >= 500)
    throw Error("This demo supports 500 visit outcomes.");
  persist({
    ...workspace,
    contacts: [...workspace.contacts, structuredClone(c)],
  });
}
export function updateContact(c: VisitContact) {
  validateContact(c);
  const old = workspace.contacts.find((v) => v.id === c.id);
  if (!old) throw Error("Visit outcome not found.");
  if (
    old.householdId !== c.householdId ||
    old.operationId !== c.operationId ||
    old.date !== c.date
  )
    throw Error("The original visit identity is retained.");
  persist({
    ...workspace,
    contacts: workspace.contacts.map((v) =>
      v.id === c.id ? structuredClone(c) : v,
    ),
  });
}
export function blockCoverage(blockId: string, days: number) {
  const roster = workspace.households.filter((h) => h.blockId === blockId);
  const ids = new Set(roster.map((h) => h.id));
  const visits = workspace.contacts.filter(
    (v) =>
      ids.has(v.householdId) &&
      inReportingWindow(v.date, days) &&
      records.some((r) => r.id === v.operationId && r.status !== "Cancelled"),
  );
  const reached = new Set(
    visits.filter((v) => v.outcome === "Contacted").map((v) => v.householdId),
  );
  return {
    total: roster.length,
    contacted: reached.size,
    attempts: visits.length,
    remaining: roster.length - reached.size,
    percent: roster.length
      ? Math.round((reached.size / roster.length) * 100)
      : 0,
  };
}
export function caseMetrics(items: ResidentCase[]) {
  const resolved = items.filter((c) =>
    ["Resolved", "Closed"].includes(c.stage),
  );
  const durations = resolved.map(
    (c) => (Date.parse(c.resolvedOn) - Date.parse(c.openedOn)) / 86400000,
  );
  return {
    active: items.filter(activeCase).length,
    overdue: items.filter((c) => activeCase(c) && c.followUp < reportingDate)
      .length,
    resolved: resolved.length,
    rate: items.length ? Math.round((resolved.length / items.length) * 100) : 0,
    meanDays: durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null,
  };
}
