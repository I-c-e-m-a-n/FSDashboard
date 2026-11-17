import { useSyncExternalStore } from "react";
import {
  records,
  operations,
  links,
  locations,
  teams,
  type RecordItem,
} from "./data";
export const engagementTypes = [
  "Raya distribution",
  "Diwali distribution",
  "Chinese New Year distribution",
  "Mother’s Day distribution",
  "Father’s Day distribution",
  "Children’s Day distribution",
  "GRC walk",
  "House visit",
  "Other engagement",
] as const;
export const personnel = [
  { id: "P-01", name: "Demo coordinator A", teamId: "TEAM-NORTH" },
  { id: "P-02", name: "Demo coordinator B", teamId: "TEAM-CENTRAL" },
  { id: "P-03", name: "Demo coordinator C", teamId: "TEAM-SOUTH" },
];
export type EngagementStage =
  "Draft" | "Scheduled" | "In progress" | "Completed" | "Cancelled";
export interface Attachment {
  id: string;
  name: string;
  data: string;
}
export interface Engagement {
  id: string;
  title: string;
  type: string;
  date: string;
  start: string;
  end: string;
  locationId: string;
  personId: string;
  stage: EngagementStage;
  expected: number;
  actual: number;
  notes: string;
  relatedIds: string[];
  media: Attachment[];
}
const originals = records.map((r) => ({ ...r }));
const originalOperations = operations.map((r) => ({ ...r }));
const originalLinks = links.map((l) => ({ ...l }));
const seeds: Engagement[] = records
  .filter((r) => ["House visits", "Engagements"].includes(r.category))
  .map((r) => ({
    id: r.id,
    title: r.title,
    type: r.category === "House visits" ? "House visit" : "Other engagement",
    date: r.date,
    start: "09:00",
    end: "11:00",
    locationId: r.locationId,
    personId: personnel.find((p) => p.teamId === r.teamId)!.id,
    stage: r.status === "Completed" ? "Completed" : "In progress",
    expected: r.units,
    actual: r.units,
    notes: r.detail,
    relatedIds: links.filter((l) => l.fromId === r.id).map((l) => l.toId),
    media: [],
  }));
const KEY = "fengshan.engagements.v1";
let revision = 0;
const listeners = new Set<() => void>();
let events = structuredClone(seeds);
export let storageWarning = "";
export function validateEvent(e: Engagement) {
  if (!e.title.trim() || e.title.length > 120)
    throw Error("Enter a title of 1–120 characters.");
  if (
    !engagementTypes.includes(e.type as (typeof engagementTypes)[number]) ||
    !["Draft", "Scheduled", "In progress", "Completed", "Cancelled"].includes(
      e.stage,
    )
  )
    throw Error("Invalid event type or status.");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(e.date) ||
    new Date(e.date).toISOString().slice(0, 10) !== e.date ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(e.start) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(e.end) ||
    e.end <= e.start ||
    e.end > "23:59"
  )
    throw Error(
      "Choose a valid date and an end time after the start time (same day, SGT).",
    );
  if (
    !locations.some((l) => l.id === e.locationId) ||
    !personnel.some((p) => p.id === e.personId)
  )
    throw Error("Select a location and coordinator.");
  if (
    !Number.isInteger(e.expected) ||
    !Number.isInteger(e.actual) ||
    e.expected < 0 ||
    e.actual < 0 ||
    e.expected > 10000 ||
    e.actual > 10000
  )
    throw Error("Counts must be whole numbers between 0 and 10,000.");
  if (
    e.notes.length > 3000 ||
    e.media.length > 3 ||
    e.media.some(
      (m) =>
        !/^data:image\/(png|jpeg|webp);base64,/.test(m.data) ||
        m.data.length > 1500000,
    )
  )
    throw Error("Use up to three supported images.");
  if (
    new Set(e.relatedIds).size !== e.relatedIds.length ||
    e.relatedIds.some(
      (id) =>
        id === e.id ||
        !originals.some(
          (r) =>
            r.id === id &&
            ["Case management", "Infrastructure"].includes(r.category),
        ),
    )
  )
    throw Error("Invalid linked operational record.");
}
function project() {
  records.splice(0, records.length, ...originals.map((r) => ({ ...r })));
  operations.splice(
    0,
    operations.length,
    ...originalOperations.map((r) => ({ ...r })),
  );
  links.splice(0, links.length, ...originalLinks.map((l) => ({ ...l })));
  for (const e of events) {
    const l = locations.find((l) => l.id === e.locationId)!,
      p = personnel.find((p) => p.id === e.personId)!,
      team = teams.find((t) => t.id === p.teamId)!;
    const base = originals.find((r) => r.id === e.id);
    const r: RecordItem = {
      id: e.id,
      title: e.title,
      category: e.type === "House visit" ? "House visits" : "Engagements",
      locationId: l.id,
      location: l.label,
      sector: l.sector,
      lat: l.lat,
      lng: l.lng,
      teamId: team.id,
      owner: team.name,
      date: e.date,
      due: base && e.date === base.date ? base.due : e.date,
      status:
        e.stage === "Cancelled"
          ? "Cancelled"
          : e.stage === "Completed"
            ? "Completed"
            : e.stage === "In progress"
              ? "In progress"
              : "Open",
      priority: base?.priority ?? "Routine",
      units: e.actual,
      detail: e.notes,
    };
    const i = records.findIndex((x) => x.id === e.id);
    if (i < 0) records.push(r);
    else records[i] = r;
    const { location, sector, lat, lng, owner, units, ...core } = r;
    const op = {
      ...core,
      category: r.category as "House visits" | "Engagements",
      measure: {
        kind:
          r.category === "House visits"
            ? ("householdContacts" as const)
            : ("participations" as const),
        count: e.actual,
      },
    };
    const oi = operations.findIndex((x) => x.id === e.id);
    if (oi >= 0) operations.splice(oi, 1);
    operations.push(op as (typeof operations)[number]);
    for (let n = links.length - 1; n >= 0; n--)
      if (links[n].fromId === e.id) links.splice(n, 1);
    e.relatedIds.forEach((id, n) =>
      links.push({
        id: `${e.id}-REL-${n}`,
        fromId: e.id,
        toId: id,
        kind:
          originalLinks.find((l) => l.fromId === e.id && l.toId === id)?.kind ??
          "Associated record",
        note: "Linked in the synthetic engagement workspace.",
      }),
    );
  }
}
try {
  const saved = localStorage.getItem(KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (
      parsed.version !== 1 ||
      !Array.isArray(parsed.events) ||
      parsed.events.length > 100
    )
      throw Error();
    parsed.events.forEach(validateEvent);
    if (
      new Set(parsed.events.map((e: Engagement) => e.id)).size !==
        parsed.events.length ||
      seeds.some(
        (s) => !parsed.events.some((e: Engagement) => e.id === s.id),
      ) ||
      parsed.events.some(
        (e: Engagement) =>
          !seeds.some((s) => s.id === e.id) && !/^ENG-[a-f0-9-]+$/.test(e.id),
      )
    )
      throw Error();
    events = parsed.events;
    project();
  }
} catch {
  storageWarning =
    "Saved demo data could not be loaded. The original sample is shown; saving replaces the invalid local snapshot.";
}
export function useEngagementStore() {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => revision,
  );
  return events;
}
export function useOperationalRevision() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => revision,
  );
}
export function saveEngagement(e: Engagement) {
  validateEvent(e);
  const next = events.some((x) => x.id === e.id)
    ? events.map((x) => (x.id === e.id ? e : x))
    : [...events, e];
  if (next.length > 100)
    throw Error("This demo supports up to 100 engagements.");
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, events: next }));
  } catch {
    throw Error(
      "Browser storage is full or unavailable. Remove images or enable local storage, then retry. Your changes have not been saved.",
    );
  }
  events = next;
  project();
  revision++;
  listeners.forEach((l) => l());
}
export function freshEngagement(): Engagement {
  return {
    id: `ENG-${crypto.randomUUID()}`,
    title: "",
    type: "Other engagement",
    date: "2026-11-17",
    start: "09:00",
    end: "11:00",
    locationId: locations[0].id,
    personId: personnel[0].id,
    stage: "Draft",
    expected: 0,
    actual: 0,
    notes: "",
    relatedIds: [],
    media: [],
  };
}
