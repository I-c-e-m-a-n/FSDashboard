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
  Sector,
  number,
  number,
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
    "Bedok North Road · Zone N1",
    "North",
    1.3359,
    103.9324,
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
    "Bedok North Street 4 · Zone C2",
    "Central",
    1.3317,
    103.9367,
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
    "Bedok North Avenue 4 · Zone C1",
    "Central",
    1.3338,
    103.9345,
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
    "Bedok North Road · Zone N2",
    "North",
    1.3374,
    103.9352,
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
    "Bedok North Street 4 · Zone C3",
    "Central",
    1.3301,
    103.9391,
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
    "Fengshan community area · Zone C4",
    "Central",
    1.3314,
    103.9343,
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
    "Bedok North Avenue 2 · Zone S1",
    "South",
    1.3276,
    103.9359,
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
    "Bedok North Street 3 · Zone S2",
    "South",
    1.3294,
    103.9325,
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
    "Bedok North Avenue 2 · Zone S3",
    "South",
    1.3267,
    103.9384,
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
    "Bedok North Road · Zone N3",
    "North",
    1.3366,
    103.9306,
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
    "Bedok North Road · Zone N4",
    "North",
    1.3383,
    103.9371,
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
    "Bedok North Street 4 · Zone C5",
    "Central",
    1.3326,
    103.9389,
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
    "Bedok North Avenue 2 · Zone S4",
    "South",
    1.3281,
    103.9396,
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
    "Bedok North Street 4 · Zone C6",
    "Central",
    1.3305,
    103.936,
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
    "Bedok North Road · Zone N5",
    "North",
    1.3355,
    103.9377,
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
    "Bedok North Avenue 2 · Zone S5",
    "South",
    1.3272,
    103.9336,
    "2026-10-19",
    "2026-10-19",
    "Completed",
    "Routine",
    38,
    "Thirty-eight participants attended the sample community workshop.",
  ],
];
// Fixture inputs are converted once into normalized entities. Display fields are joined below.
export const locations: Location[] = rows.map((r, i) => ({
  id: `LOC-${String(i + 1).padStart(3, "0")}`,
  label: r[2],
  sector: r[3],
  lat: r[4],
  lng: r[5],
}));
export const teams: Team[] = sectors.map((sector) => ({
  id: `TEAM-${sector.toUpperCase()}`,
  name: `${sector} coordination team`,
  sector,
}));
export const operations: Operation[] = rows.map((r, i) => {
  const base = {
    id: `FS-${String(i + 1).padStart(3, "0")}`,
    title: r[1],
    locationId: locations[i].id,
    teamId: `TEAM-${r[3].toUpperCase()}`,
    date: r[6],
    due: r[7],
    status: r[8],
    priority: r[9],
    detail: r[11],
  };
  if (r[0] === "House visits")
    return {
      ...base,
      category: r[0],
      measure: { kind: "householdContacts", count: r[10] },
    };
  if (r[0] === "Engagements")
    return {
      ...base,
      category: r[0],
      measure: { kind: "participations", count: r[10] },
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
export const snapshot = "2026-11-16";
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
  const cutoff = new Date(`${snapshot}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - filters.days + 1);
  return records.filter(
    (r) =>
      (filters.sector === "All areas" || r.sector === filters.sector) &&
      r.date >= cutoff.toISOString().slice(0, 10) &&
      r.date <= snapshot &&
      filters.categories.includes(r.category) &&
      `${r.title} ${r.location} ${r.id}`
        .toLowerCase()
        .includes(filters.query.trim().toLowerCase()),
  );
}
export const isOutstanding = (r: RecordItem) => r.status !== "Completed";
export const isOverdue = (r: RecordItem) =>
  isOutstanding(r) && r.due < snapshot;
export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Singapore",
  }).format(new Date(`${date}T00:00:00Z`));
