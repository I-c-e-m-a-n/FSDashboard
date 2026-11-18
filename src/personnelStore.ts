import { records, teams } from "./data";
import {
  notifyOperations,
  useOperationalRevision,
  refreshOperationalProjections,
} from "./operationalStore";
export type Person = {
  id: string;
  age: number;
  sex: string;
  race: string;
  kind: string;
  stage: string;
  name: string;
  teamId: string;
  awards: string[];
  training: string[];
  deployments: { recordId: string; status: string }[];
};
const key = "fengshan.personnel.v1";
export const stages = ["Prospect", "Onboarding", "Active", "Inactive"];
export const seed: Person[] = Array.from({ length: 18 }, (_, i) => ({
  id: `SYN-${String(i + 1).padStart(3, "0")}`,
  name: `Synthetic member ${String(i + 1).padStart(3, "0")}`,
  teamId: teams[i % teams.length].id,
  age: 22 + ((i * 7) % 53),
  sex: ["Female", "Male", "Not stated"][i % 3],
  race: ["Chinese", "Malay", "Indian", "Other", "Not stated"][i % 5],
  kind: i % 3 ? "Regular" : "Ad-hoc",
  stage: stages[i % 7 === 0 ? 0 : i % 7 === 1 ? 1 : 2],
  awards: i % 5 === 0 ? ["Party Award · 2026"] : [],
  training: i % 2 ? ["Community first aid · Completed · 2026"] : [],
  deployments:
    i % 7 > 1
      ? [
          {
            recordId: records[i % records.length].id,
            status: i % 2 ? "Attended" : "Assigned",
          },
        ]
      : [],
}));
export const people: Person[] = structuredClone(seed);
export let personnelWarning = "";
export const legacyCoordinatorIds: Record<string, string> = {
  "P-01": "SYN-004",
  "P-02": "SYN-005",
  "P-03": "SYN-003",
};
export function validatePerson(p: Person, references = true) {
  if (
    !p ||
    !/^SYN-[\w-]+$/.test(p.id) ||
    !Number.isInteger(p.age) ||
    p.age < 18 ||
    p.age > 100 ||
    !stages.includes(p.stage) ||
    !["Regular", "Ad-hoc"].includes(p.kind) ||
    !["Female", "Male", "Not stated"].includes(p.sex) ||
    !["Chinese", "Malay", "Indian", "Other", "Not stated"].includes(p.race) ||
    !teams.some((t) => t.id === p.teamId)
  )
    throw Error("Invalid personnel profile.");
  for (const items of [p.awards, p.training])
    if (
      !Array.isArray(items) ||
      items.length > 100 ||
      items.some((x) => typeof x !== "string" || x.length > 200) ||
      new Set(items).size !== items.length
    )
      throw Error("Invalid recognition or learning records.");
  if (
    !Array.isArray(p.deployments) ||
    p.deployments.length > 300 ||
    new Set(p.deployments.map((d) => d.recordId)).size !==
      p.deployments.length ||
    p.deployments.some(
      (d) =>
        !d ||
        typeof d.recordId !== "string" ||
        !["Assigned", "Attended", "Absent", "Excused"].includes(d.status) ||
        (references && !records.some((r) => r.id === d.recordId)),
    )
  )
    throw Error("Invalid deployment reference or attendance state.");
}
function canonical(p: Person): Person {
  return { ...p, name: `Synthetic member ${p.id.slice(4)}`, teamId: p.teamId };
}
export function hydratePersonnel() {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const saved = JSON.parse(raw);
    const rows = Array.isArray(saved)
      ? saved
      : saved.version === 2
        ? saved.people
        : null;
    if (
      !Array.isArray(rows) ||
      rows.length > 200 ||
      new Set(rows.map((p) => p.id)).size !== rows.length
    )
      throw Error();
    rows.forEach((p) => {
      p.teamId = p.teamId ?? p.team;
      delete p.team;
      validatePerson(p, false);
    });
    // Preserve v1 edits; restore required baseline identities if missing.
    const merged = [
      ...rows,
      ...seed.filter((p) => !rows.some((r) => r.id === p.id)),
    ];
    people.splice(0, people.length, ...merged.map(canonical));
  } catch {
    personnelWarning =
      "Saved personnel data is invalid or unavailable. Synthetic samples are shown; the original saved data is retained until you save.";
  }
}
export function reconcilePersonnel() {
  for (const person of people) {
    const valid = person.deployments.filter((d) =>
      records.some((r) => r.id === d.recordId),
    );
    if (valid.length !== person.deployments.length)
      personnelWarning =
        "Unavailable deployment references were omitted. Other personnel data was retained.";
    person.deployments = valid;
  }
}
export function usePersonnel() {
  useOperationalRevision();
  return people;
}
export function savePerson(person: Person) {
  validatePerson(person);
  const next = people.some((p) => p.id === person.id)
    ? people.map((p) => (p.id === person.id ? canonical(person) : p))
    : [...people, canonical(person)];
  if (next.length > 200) throw Error("Maximum 200 synthetic profiles.");
  localStorage.setItem(key, JSON.stringify({ version: 2, people: next }));
  people.splice(0, people.length, ...structuredClone(next));
  refreshOperationalProjections();
  notifyOperations();
}
export function personnelForOperation(id: string) {
  return people.flatMap((p) =>
    p.deployments
      .filter((d) => d.recordId === id)
      .map((d) => ({ personId: p.id, name: p.name, status: d.status })),
  );
}
