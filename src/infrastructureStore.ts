import { replaceOperationalLinks } from "./operationalStore";
import {
  records,
  operations,
  links,
  locations,
  teams,
  type RecordItem,
} from "./data";
import { notifyOperations, useOperationalRevision } from "./operationalStore";
export const infrastructureTypes = [
  "Repairs & maintenance",
  "Waste disposal",
  "Town Council matters",
  "Parks, playgrounds & courts",
  "Public equipment & infrastructure",
  "Vegetation & landscaping",
  "NEA · animals & birds",
  "LTA · parking & transport",
] as const;
export const organisations = [
  {
    id: "ORG-TC",
    name: "Town Council",
    scope: "Estate upkeep and common property",
  },
  {
    id: "ORG-NEA",
    name: "NEA",
    scope: "Environmental and animal/bird-related matters",
  },
  { id: "ORG-LTA", name: "LTA", scope: "Transport infrastructure and parking" },
  {
    id: "ORG-PARKS",
    name: "Parks / landscape team",
    scope: "Green spaces, play areas and vegetation",
  },
  {
    id: "ORG-UNASSIGNED",
    name: "Unassigned",
    scope: "Responsibility to be confirmed",
  },
];
export const stages = [
  "Reported",
  "Assigned",
  "In progress",
  "Awaiting response",
  "Resolved",
  "Closed",
  "Cancelled",
] as const;
export type InfrastructureStage = (typeof stages)[number];
export interface ProgressUpdate {
  id: string;
  at: string;
  stage: InfrastructureStage;
  progress: number;
  note: string;
}
export interface InfrastructureMatter {
  id: string;
  title: string;
  type: string;
  locationId: string;
  organisationId: string;
  teamId: string;
  reportedOn: string;
  dueOn: string;
  priority: "Routine" | "Urgent";
  stage: InfrastructureStage;
  progress: number;
  description: string;
  relatedIds: string[];
  history: ProgressUpdate[];
}
const baseRecords = records
  .filter((r) => r.category === "Infrastructure")
  .map((r) => ({ ...r }));
const seed: InfrastructureMatter[] = baseRecords.map((r, i) => ({
  id: r.id,
  title: r.title,
  type:
    i === 2
      ? "Parks, playgrounds & courts"
      : i === 3
        ? "Public equipment & infrastructure"
        : "Repairs & maintenance",
  locationId: r.locationId,
  organisationId: i === 2 ? "ORG-PARKS" : "ORG-TC",
  teamId: r.teamId,
  reportedOn: r.date,
  dueOn: r.due,
  priority: r.priority,
  stage:
    r.status === "Completed"
      ? "Closed"
      : r.status === "In progress"
        ? "In progress"
        : "Reported",
  progress:
    r.status === "Completed" ? 100 : r.status === "In progress" ? 35 : 0,
  description: r.detail,
  relatedIds: [],
  history: [
    {
      id: `${r.id}-INITIAL`,
      at: `${r.date}T09:00:00+08:00`,
      stage:
        r.status === "Completed"
          ? "Closed"
          : r.status === "In progress"
            ? "In progress"
            : "Reported",
      progress:
        r.status === "Completed" ? 100 : r.status === "In progress" ? 35 : 0,
      note: "Imported synthetic snapshot; prior intermediate updates are not represented.",
    },
  ],
}));
const KEY = "fengshan.infrastructure.v1";
let matters = structuredClone(seed);
export let infrastructureWarning = "";
const dateValid = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;
export function validateMatter(
  m: InfrastructureMatter,
  checkReferences = true,
) {
  if (typeof m.title !== "string" || !m.title.trim() || m.title.length > 120)
    throw Error("Enter a title of 1–120 characters.");
  if (
    !infrastructureTypes.includes(
      m.type as (typeof infrastructureTypes)[number],
    ) ||
    !stages.includes(m.stage)
  )
    throw Error("Choose a supported category and stage.");
  if (
    !locations.some((l) => l.id === m.locationId) ||
    !organisations.some((o) => o.id === m.organisationId) ||
    !teams.some((t) => t.id === m.teamId)
  )
    throw Error("Choose a valid location, organisation and branch team.");
  if (!dateValid(m.reportedOn) || !dateValid(m.dueOn) || m.dueOn < m.reportedOn)
    throw Error("Target date must be on or after the reported date.");
  if (
    !["Routine", "Urgent"].includes(m.priority) ||
    !Number.isInteger(m.progress) ||
    m.progress < 0 ||
    m.progress > 100
  )
    throw Error("Progress must be a whole number from 0 to 100.");
  if (["Resolved", "Closed"].includes(m.stage) && m.progress !== 100)
    throw Error("Resolved and closed matters must have 100% progress.");
  if (
    !["Resolved", "Closed", "Cancelled"].includes(m.stage) &&
    m.progress === 100
  )
    throw Error("Use Resolved or Closed for completed work.");
  if (
    !["Reported", "Cancelled"].includes(m.stage) &&
    m.organisationId === "ORG-UNASSIGNED"
  )
    throw Error(
      "Assign a responsible organisation before progressing this matter.",
    );
  if (
    typeof m.description !== "string" ||
    m.description.length > 3000 ||
    !Array.isArray(m.relatedIds) ||
    new Set(m.relatedIds).size !== m.relatedIds.length ||
    m.relatedIds.some(
      (id) =>
        typeof id !== "string" ||
        id === m.id ||
        (checkReferences &&
          !records.some((r) => r.id === id && r.category !== "Infrastructure")),
    )
  )
    throw Error("Check the description and related operational records.");
  if (
    !Array.isArray(m.history) ||
    m.history.length > 200 ||
    m.history.some(
      (h) =>
        typeof h.id !== "string" ||
        !Number.isFinite(Date.parse(h.at)) ||
        !stages.includes(h.stage) ||
        !Number.isInteger(h.progress) ||
        h.progress < 0 ||
        h.progress > 100 ||
        typeof h.note !== "string" ||
        h.note.length > 1500,
    )
  )
    throw Error("Invalid progress history.");
}
function project() {
  for (const m of matters) {
    const l = locations.find((l) => l.id === m.locationId)!,
      t = teams.find((t) => t.id === m.teamId)!;
    const record: RecordItem = {
      id: m.id,
      title: m.title,
      category: "Infrastructure",
      locationId: l.id,
      location: l.label,
      sector: l.sector,
      lat: l.lat,
      lng: l.lng,
      teamId: t.id,
      owner: t.name,
      date: m.reportedOn,
      due: m.dueOn,
      status:
        m.stage === "Cancelled"
          ? "Cancelled"
          : ["Resolved", "Closed"].includes(m.stage)
            ? "Completed"
            : ["In progress", "Awaiting response"].includes(m.stage)
              ? "In progress"
              : "Open",
      priority: m.priority,
      units: 1,
      detail: m.description,
    };
    const i = records.findIndex((r) => r.id === m.id);
    if (i < 0) records.push(record);
    else records[i] = record;
    const { location, sector, lat, lng, owner, units, ...core } = record;
    const oi = operations.findIndex((r) => r.id === m.id);
    const op = { ...core, category: "Infrastructure" as const, measure: null };
    if (oi < 0) operations.push(op);
    else operations[oi] = op;
  }
  replaceOperationalLinks(
    "infrastructure",
    matters.map((m) => m.id),
    matters.flatMap((m) =>
      m.relatedIds.map((id, n) => ({
        id: `${m.id}-INFRA-${n}`,
        fromId: m.id,
        toId: id,
        kind: "Associated record",
        note: "Associated with this synthetic infrastructure matter; not a claim of causation.",
      })),
    ),
  );
}

export function hydrateInfrastructure() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      const data = JSON.parse(saved);
      if (
        data.version !== 1 ||
        !Array.isArray(data.matters) ||
        data.matters.length > 100
      )
        throw Error();
      data.matters.forEach((m: InfrastructureMatter) =>
        validateMatter(m, false),
      );
      if (
        new Set(data.matters.map((m: InfrastructureMatter) => m.id)).size !==
          data.matters.length ||
        seed.some(
          (s) => !data.matters.some((m: InfrastructureMatter) => m.id === s.id),
        ) ||
        data.matters.some(
          (m: InfrastructureMatter) =>
            !seed.some((s) => s.id === m.id) && !/^INF-[a-f0-9-]+$/.test(m.id),
        )
      )
        throw Error();
      matters = data.matters;
      project();
    }
  } catch {
    infrastructureWarning =
      "Saved infrastructure data could not be loaded. Original samples are shown; saving replaces the invalid local snapshot.";
  }
}
export function reconcileInfrastructure() {
  for (const m of matters) {
    const valid = m.relatedIds.filter((id) =>
      records.some((r) => r.id === id && r.category !== "Infrastructure"),
    );
    if (valid.length !== m.relatedIds.length) {
      infrastructureWarning =
        "Unavailable related records were omitted from the local snapshot.";
      m.relatedIds = valid;
    }
  }
  project();
}
export function useInfrastructure() {
  useOperationalRevision();
  return matters;
}
export function saveMatter(input: InfrastructureMatter, note: string) {
  validateMatter(input);
  const existing = matters.find((m) => m.id === input.id);
  if (!existing && !/^INF-[a-f0-9-]+$/.test(input.id))
    throw Error("Invalid infrastructure identifier.");
  if (!note.trim() || note.length > 1500)
    throw Error(
      "Add an update note (1–1,500 characters) explaining the report or change.",
    );
  if (existing && input.reportedOn !== existing.reportedOn)
    throw Error("The original reported date is retained after creation.");
  if (existing?.history.length === 200)
    throw Error("This demo supports 200 updates per matter.");
  const entry: ProgressUpdate = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    stage: input.stage,
    progress: input.progress,
    note: note.trim(),
  };
  const saved = {
    ...input,
    title: input.title.trim(),
    history: [...(existing?.history ?? []), entry],
  };
  const next = existing
    ? matters.map((m) => (m.id === saved.id ? saved : m))
    : [...matters, saved];
  if (next.length > 100) throw Error("This demo supports up to 100 matters.");
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, matters: next }));
  } catch {
    throw Error(
      "Browser storage is full or unavailable. Nothing was saved; your edits are still in this form.",
    );
  }
  matters = next;
  project();
  notifyOperations();
}
export function freshMatter(): InfrastructureMatter {
  return {
    id: `INF-${crypto.randomUUID()}`,
    title: "",
    type: infrastructureTypes[0],
    locationId: locations[0].id,
    organisationId: "ORG-UNASSIGNED",
    teamId: teams[0].id,
    reportedOn: "2026-11-17",
    dueOn: "2026-11-24",
    priority: "Routine",
    stage: "Reported",
    progress: 0,
    description: "",
    relatedIds: [],
    history: [],
  };
}
export const isActive = (m: InfrastructureMatter) =>
  !["Resolved", "Closed", "Cancelled"].includes(m.stage);
export const isMatterOverdue = (m: InfrastructureMatter) =>
  isActive(m) && m.dueOn < "2026-11-17";
export function infrastructureReport(items: InfrastructureMatter[]) {
  const cell = (s: unknown) =>
    `"${String(s)
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""')}"`;
  return [
    ["Synthetic infrastructure report — as of 17 Nov 2026 SGT"],
    [
      "ID",
      "Title",
      "Category",
      "Organisation",
      "Branch team",
      "Location",
      "Reported",
      "Target",
      "Stage",
      "Progress %",
      "Priority",
      "Overdue",
      "Latest update",
    ],
    ...items.map((m) => [
      m.id,
      m.title,
      m.type,
      organisations.find((o) => o.id === m.organisationId)!.name,
      teams.find((t) => t.id === m.teamId)!.name,
      locations.find((l) => l.id === m.locationId)!.label,
      m.reportedOn,
      m.dueOn,
      m.stage,
      m.progress,
      m.priority,
      isMatterOverdue(m) ? "Yes" : "No",
      m.history.at(-1)?.note ?? "",
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
}
