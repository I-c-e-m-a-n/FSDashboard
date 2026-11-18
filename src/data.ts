import { locations, teams } from "./referenceData";
export { locations, teams, organisations } from "./referenceData";
import { reportingDate, inReportingWindow } from "./reporting";
import {
  categories,
  sectors,
  type Category,
  type Sector,
  type Location,
  type Team,
  type Operation,
  type RecordItem,
  type RecordLink,
} from "./model";
export { categories, sectors } from "./model";
export type {
  Category,
  Sector,
  Location,
  Team,
  Operation,
  RecordItem,
  RecordLink,
} from "./model";
// Entirely fictional operations. Coordinates are approximate, not official boundaries or addresses.
const rows: [
  Category,
  string,
  string,
  string,
  string,
  string,
  RecordItem["status"],
  RecordItem["priority"],
  number,
  string,
][] = [
  [
    "Infrastructure",
    "Lift landing lighting",
    "LOC-001",
    "TEAM-NORTH",
    "2026-11-15",
    "2026-11-16",
    "Open",
    "Urgent",
    1,
    "Inspect the landing lights and coordinate a repair. Confirm safe access after the work.",
  ],
  [
    "Case management",
    "Assistance follow-up",
    "LOC-002",
    "TEAM-CENTRAL",
    "2026-11-14",
    "2026-11-15",
    "In progress",
    "Urgent",
    1,
    "Coordinate the next support appointment and confirm the referral outcome. No resident information is stored in this demonstration.",
  ],
  [
    "Infrastructure",
    "Covered walkway inspection",
    "LOC-003",
    "TEAM-CENTRAL",
    "2026-11-13",
    "2026-11-15",
    "In progress",
    "Routine",
    1,
    "Review drainage along the covered walkway after rainfall and record the maintenance response.",
  ],
  [
    "House visits",
    "Neighbourhood listening round",
    "LOC-004",
    "TEAM-NORTH",
    "2026-11-15",
    "2026-11-18",
    "In progress",
    "Routine",
    24,
    "Twenty-four households contacted. Consolidate shared feedback and arrange return visits where requested.",
  ],
  [
    "House visits",
    "Weekend doorstep visits",
    "LOC-005",
    "TEAM-CENTRAL",
    "2026-11-14",
    "2026-11-14",
    "Completed",
    "Routine",
    32,
    "Thirty-two households contacted. Common themes were estate upkeep and community activities.",
  ],
  [
    "Engagements",
    "Neighbourhood coffee morning",
    "LOC-006",
    "TEAM-CENTRAL",
    "2026-11-12",
    "2026-11-12",
    "Completed",
    "Routine",
    46,
    "Forty-six participants joined a neighbourhood conversation. Capture suggestions for the next session.",
  ],
  [
    "Infrastructure",
    "Playground surface review",
    "LOC-007",
    "TEAM-SOUTH",
    "2026-11-11",
    "2026-11-19",
    "Open",
    "Routine",
    1,
    "Arrange an inspection of the play surface and review maintenance options.",
  ],
  [
    "Case management",
    "Community referral check-in",
    "LOC-008",
    "TEAM-SOUTH",
    "2026-11-10",
    "2026-11-17",
    "In progress",
    "Routine",
    1,
    "Check the status of a community service referral with the coordinating team.",
  ],
  [
    "House visits",
    "Evening outreach round",
    "LOC-009",
    "TEAM-SOUTH",
    "2026-11-09",
    "2026-11-09",
    "Completed",
    "Routine",
    28,
    "Twenty-eight households contacted during the evening outreach round.",
  ],
  [
    "Case management",
    "Service guidance follow-up",
    "LOC-010",
    "TEAM-NORTH",
    "2026-11-07",
    "2026-11-09",
    "Completed",
    "Routine",
    1,
    "The fictional service enquiry was resolved and guidance shared.",
  ],
  [
    "Engagements",
    "Community gardening session",
    "LOC-011",
    "TEAM-NORTH",
    "2026-11-05",
    "2026-11-05",
    "Completed",
    "Routine",
    35,
    "Thirty-five participants took part in a community gardening session.",
  ],
  [
    "House visits",
    "Central neighbourhood outreach",
    "LOC-012",
    "TEAM-CENTRAL",
    "2026-11-03",
    "2026-11-03",
    "Completed",
    "Routine",
    42,
    "Forty-two households contacted. Feedback was consolidated for the coordinating team.",
  ],
  [
    "Infrastructure",
    "Wayfinding sign replacement",
    "LOC-013",
    "TEAM-SOUTH",
    "2026-10-29",
    "2026-11-02",
    "Completed",
    "Routine",
    1,
    "The sample sign replacement was completed and checked.",
  ],
  [
    "Case management",
    "Support service enquiry",
    "LOC-014",
    "TEAM-CENTRAL",
    "2026-10-25",
    "2026-10-29",
    "Completed",
    "Routine",
    1,
    "The sample enquiry was closed after service information was provided.",
  ],
  [
    "House visits",
    "North outreach round",
    "LOC-015",
    "TEAM-NORTH",
    "2026-10-21",
    "2026-10-21",
    "Completed",
    "Routine",
    20,
    "Twenty households contacted during the sample outreach round.",
  ],
  [
    "Engagements",
    "Active ageing workshop",
    "LOC-016",
    "TEAM-SOUTH",
    "2026-10-19",
    "2026-10-19",
    "Completed",
    "Routine",
    38,
    "Thirty-eight participants attended the sample community workshop.",
  ],
];
export const operations: Operation[] = rows.map((r, i) => {
  const base = {
    id: `FS-${String(i + 1).padStart(3, "0")}`,
    title: r[1],
    locationId: r[2],
    teamId: r[3],
    date: r[4],
    due: r[5],
    status: r[6],
    priority: r[7],
    detail: r[9],
  };
  if (r[0] === "House visits")
    return {
      ...base,
      category: r[0],
      measure: { kind: "householdContacts", count: r[8] },
    };
  if (r[0] === "Engagements")
    return {
      ...base,
      category: r[0],
      measure: { kind: "participations", count: r[8] },
    };
  return { ...base, category: r[0], measure: null };
});
export const links: RecordLink[] = [
  {
    id: "LINK-01",
    fromId: "FS-012",
    toId: "FS-002",
    kind: "Support referral",
    note: "Support follow-up identified during the central outreach round.",
  },
  {
    id: "LINK-02",
    fromId: "FS-005",
    toId: "FS-001",
    kind: "Raised matter",
    note: "Estate feedback from the weekend round was referred to the north team.",
  },
  {
    id: "LINK-03",
    fromId: "FS-009",
    toId: "FS-007",
    kind: "Raised matter",
    note: "Playground upkeep feedback recorded during evening outreach.",
  },
  {
    id: "LINK-04",
    fromId: "FS-011",
    toId: "FS-008",
    kind: "Support referral",
    note: "A community referral originated from the gardening session.",
  },
  {
    id: "LINK-05",
    fromId: "FS-015",
    toId: "FS-010",
    kind: "Support referral",
    note: "Service guidance followed a request from the north outreach round.",
  },
  {
    id: "LINK-06",
    fromId: "FS-016",
    toId: "FS-014",
    kind: "Support referral",
    note: "A support enquiry followed the active ageing workshop.",
  },
  {
    id: "LINK-07",
    fromId: "FS-006",
    toId: "FS-003",
    kind: "Raised matter",
    note: "Walkway drainage feedback was shared at the coffee morning.",
  },
];
export const records: RecordItem[] = operations.map((operation) => {
  const location = locations.find((l) => l.id === operation.locationId)!;
  const team = teams.find((t) => t.id === operation.teamId)!;
  return {
    ...operation,
    location: location.label,
    sector: location.sector,
    lat: location.lat,
    lng: location.lng,
    owner: team.name,
    units: operation.measure?.count ?? 1,
  };
});
export const snapshot = reportingDate;
export const colors: Record<Category, string> = {
  "House visits": "#356DB5",
  "Case management": "#8b61ac",
  Infrastructure: "#99602f",
  Engagements: "#28866A",
};
export interface Filters {
  sector: string;
  days: number;
  query: string;
  categories: Category[];
}
export function filterRecords(filters: Filters) {
  return records.filter(
    (r) =>
      (filters.sector === "All areas" || r.sector === filters.sector) &&
      inReportingWindow(r.date, filters.days) &&
      filters.categories.includes(r.category) &&
      `${r.title} ${r.location} ${r.id}`
        .toLowerCase()
        .includes(filters.query.trim().toLowerCase()),
  );
}
export const isOutstanding = (r: RecordItem) =>
  r.status !== "Completed" && r.status !== "Cancelled";
export const isOverdue = (r: RecordItem) =>
  isOutstanding(r) && r.due < snapshot;
export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Singapore",
  }).format(new Date(`${date}T00:00:00Z`));

/** Single write boundary for domain projections. All display fields are derived here. */
export function upsertOperation(operation: Operation) {
  const location = locations.find((l) => l.id === operation.locationId);
  const team = teams.find((t) => t.id === operation.teamId);
  if (!location || !team)
    throw Error("Invalid operational location or team reference.");
  const joined: RecordItem = {
    ...operation,
    location: location.label,
    sector: location.sector,
    lat: location.lat,
    lng: location.lng,
    owner: team.name,
    units: operation.measure?.count ?? 1,
  };
  const i = operations.findIndex((o) => o.id === operation.id);
  if (i < 0) operations.push(operation);
  else operations[i] = operation;
  const j = records.findIndex((r) => r.id === operation.id);
  if (j < 0) records.push(joined);
  else records[j] = joined;
}
