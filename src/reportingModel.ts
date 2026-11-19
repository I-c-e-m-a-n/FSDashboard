import { records, links, type RecordItem } from "./data";
import { locations, teams, organisations } from "./referenceData";
import { people, type Person } from "./personnelStore";
import {
  blocks,
  useCases,
  type ResidentCase,
  type Household,
  type VisitContact,
} from "./caseStore";
import {
  useInfrastructure,
  type InfrastructureMatter,
} from "./infrastructureStore";
import { useEngagementStore, type Engagement } from "./engagementStore";
import { inReportingWindow, reportingDate, reportingLabel } from "./reporting";
export type ReportRow = {
  id: string;
  operationId?: string;
  href?: string;
  values: Record<string, string | number>;
};
export type ReportDataset = {
  key: string;
  label: string;
  basis: string;
  columns: string[];
  rows: ReportRow[];
};
export type ReportScope = { area: string; days: number };
export type ReportingSources = {
  records: RecordItem[];
  cases: ResidentCase[];
  households: Household[];
  contacts: VisitContact[];
  people: Person[];
  infrastructure: InfrastructureMatter[];
  engagements: Engagement[];
  links: typeof links;
};
const active = (stage: string) =>
  !["Resolved", "Closed", "Completed", "Cancelled"].includes(stage);
const org = (id: string) =>
  organisations.find((o) => o.id === id)?.name ?? "Unassigned";
const locArea = (id: string) =>
  locations.find((l) => l.id === id)?.sector ?? "";
export function buildReports(scope: ReportScope, source: ReportingSources) {
  const area = (value: string) =>
    scope.area === "All areas" || value === scope.area;
  const dated = (date: string) => inReportingWindow(date, scope.days);
  const operation = (id: string) => source.records.find((r) => r.id === id);
  const householdLocation = (id: string) =>
    blocks.find(
      (b) => b.id === source.households.find((h) => h.id === id)?.blockId,
    )?.locationId ?? "";
  const datasets: ReportDataset[] = [];
  const add = (
    key: string,
    label: string,
    basis: string,
    columns: string[],
    rows: ReportRow[],
  ) => {
    datasets.push({ key, label, basis, columns, rows });
    return rows;
  };
  const ops = source.records.filter((r) => area(r.sector) && dated(r.date));
  const operationRows = add(
    "operations",
    "Operations",
    "Operational recorded/activity date. Mixed units are never summed.",
    [
      "ID",
      "Title",
      "Dataset",
      "Area",
      "Date",
      "Status",
      "Organisation",
      "Organisation ID",
      "Workload record",
      "Active",
      "Units",
      "Measure",
    ],
    ops.map((r) => ({
      id: r.id,
      operationId: r.id,
      values: {
        ID: r.id,
        Title: r.title,
        Dataset: r.category,
        Area: r.sector,
        Date: r.date,
        Status: r.status,
        Organisation: org(r.organisationId ?? ""),
        "Organisation ID": r.organisationId ?? "ORG-UNASSIGNED",
        "Workload record": ["Case management", "Infrastructure"].includes(
          r.category,
        )
          ? "Yes"
          : "No",
        Active: active(r.status) ? "Yes" : "No",
        Units: r.units,
        Measure:
          r.category === "House visits"
            ? "Household contacts"
            : r.category === "Engagements"
              ? "Participations"
              : "Record",
      },
    })),
  );
  const selectedCases = source.cases.filter(
    (c) => area(locArea(householdLocation(c.householdId))) && dated(c.openedOn),
  );
  const caseRow = (c: ResidentCase): ReportRow => ({
    id: c.id,
    operationId: c.id,
    href: `#residents/${c.id}`,
    values: {
      ID: c.id,
      Title: c.title,
      Household: c.householdId,
      Resident: c.residentId,
      Channel: c.channel,
      "MPS date": c.mpsDate,
      "Source visit": c.sourceId,
      Team: c.teamId,
      Description: c.description,
      Resolution: c.resolution,
      Opened: c.openedOn,
      Stage: c.stage,
      Urgency: c.urgency,
      Organisation: org(c.organisationId),
      "Organisation ID": c.organisationId,
      Owner: c.ownerId,
      "Next follow-up": c.followUp,
      Resolved: c.resolvedOn,
      Active: active(c.stage) ? "Yes" : "No",
      Overdue: active(c.stage) && c.followUp < reportingDate ? "Yes" : "No",
      "Resolution days": c.resolvedOn
        ? Math.round(
            (Date.parse(c.resolvedOn) - Date.parse(c.openedOn)) / 86400000,
          )
        : "",
    },
  });
  const caseColumns = [
    "ID",
    "Title",
    "Household",
    "Resident",
    "Channel",
    "Opened",
    "Stage",
    "Urgency",
    "Organisation",
    "Organisation ID",
    "Owner",
    "Next follow-up",
    "Resolved",
    "Active",
    "Overdue",
    "Resolution days",
    "MPS date",
    "Source visit",
    "Team",
    "Description",
    "Resolution",
  ];
  add(
    "cases",
    "Cases",
    "Case opened date; current lifecycle state. This is an intake cohort, not resolution flow.",
    caseColumns,
    selectedCases.map(caseRow),
  );
  const resolutions = source.cases.filter(
    (c) =>
      ["Resolved", "Closed"].includes(c.stage) &&
      area(locArea(householdLocation(c.householdId))) &&
      dated(c.resolvedOn),
  );
  add(
    "resolutions",
    "Case resolutions",
    "Latest resolution date for currently Resolved/Closed cases. Reopened cases are excluded. Closed and Resolved are shown separately; journal actions retain earlier outcomes.",
    caseColumns,
    resolutions.map(caseRow),
  );
  add(
    "case-actions",
    "Case actions",
    "Action date. Multiple actions can belong to one case; action totals are not unique cases.",
    [
      "ID",
      "Case",
      "Date",
      "Stage",
      "Organisation",
      "Follow-up",
      "Note",
      "Resolution",
    ],
    source.cases
      .filter((c) => area(locArea(householdLocation(c.householdId))))
      .flatMap((c) =>
        c.history
          .filter((h) => dated(h.date))
          .map((h) => ({
            id: h.id,
            operationId: c.id,
            values: {
              ID: h.id,
              Case: c.id,
              Date: h.date,
              Stage: h.stage,
              Organisation: org(h.organisationId),
              "Follow-up": h.followUp,
              Note: h.note,
              Resolution: h.resolution ?? "",
            },
          })),
      ),
  );
  const infra = source.infrastructure.filter(
    (m) => area(locArea(m.locationId)) && dated(m.reportedOn),
  );
  add(
    "infrastructure",
    "Infrastructure",
    "Reported date; progress is manually estimated. Active mean excludes Resolved, Closed and Cancelled.",
    [
      "ID",
      "Title",
      "Category",
      "Reported",
      "Target",
      "Stage",
      "Progress %",
      "Organisation",
      "Organisation ID",
      "Active",
      "Overdue",
    ],
    infra.map((m) => ({
      id: m.id,
      operationId: m.id,
      values: {
        ID: m.id,
        Title: m.title,
        Category: m.type,
        Reported: m.reportedOn,
        Target: m.dueOn,
        Stage: m.stage,
        "Progress %": m.progress,
        Organisation: org(m.organisationId),
        "Organisation ID": m.organisationId,
        Active: active(m.stage) ? "Yes" : "No",
        Overdue: active(m.stage) && m.dueOn < reportingDate ? "Yes" : "No",
      },
    })),
  );
  add(
    "infrastructure-updates",
    "Infrastructure updates",
    "Progress-update date (SGT), independent of original reported date.",
    ["ID", "Matter", "Date", "Stage", "Progress %", "Note"],
    source.infrastructure
      .filter((m) => area(locArea(m.locationId)))
      .flatMap((m) =>
        m.history
          .filter((h) =>
            dated(
              new Date(Date.parse(h.at) + 8 * 3600000)
                .toISOString()
                .slice(0, 10),
            ),
          )
          .map((h) => ({
            id: h.id,
            operationId: m.id,
            values: {
              ID: h.id,
              Matter: m.id,
              Date: new Date(Date.parse(h.at) + 8 * 3600000)
                .toISOString()
                .slice(0, 10),
              Stage: h.stage,
              "Progress %": h.progress,
              Note: h.note,
            },
          })),
      ),
  );
  const events = source.engagements.filter(
    (e) => area(locArea(e.locationId)) && dated(e.date),
  );
  add(
    "engagements",
    "Engagements & visit rounds",
    "Activity date. Planned counts are separate from actuals. Only In progress/Completed contribute actual measures.",
    [
      "ID",
      "Title",
      "Type",
      "Date",
      "Stage",
      "Coordinator",
      "Expected",
      "Actual",
      "Measure",
    ],
    events.map((e) => ({
      id: e.id,
      operationId: e.id,
      values: {
        ID: e.id,
        Title: e.title,
        Type: e.type,
        Date: e.date,
        Stage: e.stage,
        Coordinator: e.personId,
        Expected: e.expected,
        Actual: ["In progress", "Completed"].includes(e.stage) ? e.actual : 0,
        Measure:
          e.type === "House visit" ? "Household contacts" : "Participations",
      },
    })),
  );
  add(
    "media",
    "Engagement media metadata",
    "Parent activity date. Exports contain attachment metadata, never embedded image content.",
    ["ID", "Activity", "Name"],
    events.flatMap((e) =>
      e.media.map((m) => ({
        id: m.id,
        operationId: e.id,
        values: { ID: m.id, Activity: e.id, Name: m.name },
      })),
    ),
  );
  const contacts = source.contacts.filter(
    (v) => area(locArea(householdLocation(v.householdId))) && dated(v.date),
  );
  const validContact = (v: VisitContact) =>
    operation(v.operationId)?.status !== "Cancelled" &&
    !!operation(v.operationId);
  const reached = new Set(
    contacts
      .filter((v) => v.outcome === "Contacted" && validContact(v))
      .map((v) => v.householdId),
  );
  add(
    "visits",
    "Household visit outcomes",
    "Contact date and household geography. Cancelled rounds remain visible but do not count toward coverage.",
    [
      "ID",
      "Household",
      "Block",
      "Round",
      "Date",
      "Personnel",
      "Outcome",
      "Eligible",
    ],
    contacts.map((v) => ({
      id: v.id,
      operationId: v.operationId,
      values: {
        ID: v.id,
        Household: v.householdId,
        Block:
          source.households.find((h) => h.id === v.householdId)?.blockId ?? "",
        Round: v.operationId,
        Date: v.date,
        Personnel: v.personId,
        Outcome: v.outcome,
        Eligible: validContact(v) ? "Yes" : "No",
      },
    })),
  );
  const roster = source.households.filter((h) =>
    area(locArea(householdLocation(h.id))),
  );
  add(
    "households",
    "Households",
    "Current roster; not date-filtered. Reached is derived from eligible Contacted outcomes within the report period.",
    ["ID", "Block", "Area", "Residents", "Reached"],
    roster.map((h) => ({
      id: h.id,
      href: "#residents",
      values: {
        ID: h.id,
        Block: h.blockId,
        Area: locArea(householdLocation(h.id)),
        Residents: h.members.length,
        Reached: reached.has(h.id) ? "Yes" : "No",
      },
    })),
  );
  add(
    "residents",
    "Residents",
    "Current roster, filtered by household geography; ages are synthetic at the reporting snapshot.",
    ["ID", "Household", "Block", "Age"],
    roster.flatMap((h) =>
      h.members.map((m) => ({
        id: m.id,
        href: "#residents",
        values: { ID: m.id, Household: h.id, Block: h.blockId, Age: m.age },
      })),
    ),
  );
  add(
    "family",
    "Family relationships",
    "Current household relationships; no activity date. Parent links are directional.",
    ["ID", "Household", "From", "Relationship", "To"],
    roster.flatMap((h) =>
      h.relationships.map((r, i) => ({
        id: `${h.id}-${i}`,
        href: "#residents",
        values: {
          ID: `${h.id}-${i}`,
          Household: h.id,
          From: r.fromId,
          Relationship: r.kind,
          To: r.toId,
        },
      })),
    ),
  );
  const coverage = add(
    "coverage",
    "Block coverage",
    "Distinct reached households / current roster households. Attempts include unsuccessful outcomes.",
    [
      "ID",
      "Block",
      "Households",
      "Contacted",
      "Not contacted",
      "Attempts",
      "Coverage %",
    ],
    blocks
      .filter((b) => area(locArea(b.locationId)))
      .map((b) => {
        const homes = roster.filter((h) => h.blockId === b.id);
        const hit = homes.filter((h) => reached.has(h.id)).length;
        return {
          id: b.id,
          href: "#residents",
          values: {
            ID: b.id,
            Block: b.label,
            Households: homes.length,
            Contacted: hit,
            "Not contacted": homes.length - hit,
            Attempts: contacts.filter(
              (v) =>
                homes.some((h) => h.id === v.householdId) && validContact(v),
            ).length,
            "Coverage %": homes.length
              ? Math.round((hit / homes.length) * 100)
              : 0,
          },
        };
      }),
  );
  const personnel = source.people.filter((p) =>
    area(teams.find((t) => t.id === p.teamId)?.sector ?? ""),
  );
  add(
    "personnel",
    "Personnel directory",
    "Current membership roster by home-team area; period does not filter profiles. Deployment geography is the activity area, not home team.",
    [
      "ID",
      "Name",
      "Team",
      "Classification",
      "Membership",
      "Age",
      "Sex",
      "Race",
    ],
    personnel.map((p) => ({
      id: p.id,
      href: "#personnel",
      values: {
        ID: p.id,
        Name: p.name,
        Team: p.teamId,
        Classification: p.kind,
        Membership: p.stage,
        Age: p.age,
        Sex: p.sex,
        Race: p.race,
      },
    })),
  );
  const deployments = source.people.flatMap((p) =>
    p.deployments
      .filter((d) => {
        const r = operation(d.recordId);
        return r && area(r.sector) && dated(r.date);
      })
      .map((d) => {
        const r = operation(d.recordId)!;
        return {
          id: `${p.id}/${r.id}`,
          operationId: r.id,
          values: {
            ID: `${p.id}/${r.id}`,
            Person: p.id,
            Name: p.name,
            Activity: r.id,
            Title: r.title,
            Date: r.date,
            Attendance: d.status,
            "Counted attendance":
              d.status === "Attended" &&
              r.status !== "Cancelled" &&
              r.date <= reportingDate
                ? "Yes"
                : "No",
          },
        };
      }),
  );
  add(
    "deployments",
    "Personnel deployments",
    "Activity date and activity geography. One person/activity pair per record. Counted attendance requires Attended, a non-cancelled activity and a date on/before the snapshot.",
    [
      "ID",
      "Person",
      "Name",
      "Activity",
      "Title",
      "Date",
      "Attendance",
      "Counted attendance",
    ],
    deployments,
  );
  add(
    "awards",
    "Personnel awards",
    "Current stored recognition records by personnel home area. Dates are not inferred from free-text award descriptions.",
    ["ID", "Person", "Award"],
    personnel.flatMap((p) =>
      p.awards.map((a, i) => ({
        id: `${p.id}-AWARD-${i}`,
        href: "#personnel",
        values: { ID: `${p.id}-AWARD-${i}`, Person: p.id, Award: a },
      })),
    ),
  );
  add(
    "training",
    "Personnel learning",
    "Current stored learning records by personnel home area; no reliable event-date field is available.",
    ["ID", "Person", "Learning record"],
    personnel.flatMap((p) =>
      p.training.map((a, i) => ({
        id: `${p.id}-LEARNING-${i}`,
        href: "#personnel",
        values: {
          ID: `${p.id}-LEARNING-${i}`,
          Person: p.id,
          "Learning record": a,
        },
      })),
    ),
  );
  add(
    "organisations",
    "Organisation directory",
    "Shared reference directory; organisation responsibility is distinct from branch-team ownership. Not filtered by period or area.",
    ["ID", "Name", "Scope"],
    organisations.map((o) => ({
      id: o.id,
      values: { ID: o.id, Name: o.name, Scope: o.scope },
    })),
  );
  add(
    "locations",
    "Location directory",
    "Shared geographical references, filtered by area; no activity date.",
    ["ID", "Label", "Area", "Latitude", "Longitude"],
    locations
      .filter((l) => area(l.sector))
      .map((l) => ({
        id: l.id,
        values: {
          ID: l.id,
          Label: l.label,
          Area: l.sector,
          Latitude: l.lat,
          Longitude: l.lng,
        },
      })),
  );
  add(
    "teams",
    "Team directory",
    "Shared coordination teams by home area; no activity date.",
    ["ID", "Name", "Area"],
    teams
      .filter((t) => area(t.sector))
      .map((t) => ({
        id: t.id,
        values: { ID: t.id, Name: t.name, Area: t.sector },
      })),
  );
  const opIds = new Set(ops.map((r) => r.id));
  add(
    "links",
    "Operational relationships",
    "Both endpoints must be in the selected operational recorded-date/area scope.",
    ["ID", "From", "To", "Relationship", "Note"],
    source.links
      .filter((l) => opIds.has(l.fromId) && opIds.has(l.toId))
      .map((l) => ({
        id: l.id,
        operationId: l.fromId,
        values: {
          ID: l.id,
          From: l.fromId,
          To: l.toId,
          Relationship: l.kind,
          Note: l.note,
        },
      })),
  );
  const counted = deployments.filter(
    (d) => d.values["Counted attendance"] === "Yes",
  );
  const activeInfra = infra.filter((m) => active(m.stage));
  const metrics = {
    resolutions: resolutions.length,
    closed: resolutions.filter((c) => c.stage === "Closed").length,
    attendances: counted.length,
    participants: new Set(counted.map((d) => d.values.Person)).size,
    reached: reached.size,
    households: roster.length,
    activeInfrastructure: activeInfra.length,
    meanProgress: activeInfra.length
      ? Math.round(
          activeInfra.reduce((n, m) => n + m.progress, 0) / activeInfra.length,
        )
      : null,
    engagements: events.filter((e) => e.type !== "House visit").length,
    actualParticipations: events
      .filter(
        (e) =>
          e.type !== "House visit" &&
          ["In progress", "Completed"].includes(e.stage),
      )
      .reduce((n, e) => n + e.actual, 0),
  };
  const definitions: Record<string, string> = {
    resolutions: "Currently Resolved/Closed by latest resolution date",
    closed: "Closed subset of resolution cohort",
    attendances: "Eligible Attended deployment rows by activity date",
    participants: "Distinct personnel among counted attendance rows",
    reached: "Distinct successfully contacted households by contact date",
    households: "Current household roster in selected area",
    activeInfrastructure: "Active infrastructure in reported-date cohort",
    meanProgress:
      "Unweighted mean manual progress for active infrastructure only",
    engagements:
      "Engagement activities excluding visit rounds, by activity date",
    actualParticipations:
      "Actual participations in In progress/Completed engagements; repeats possible",
  };
  add(
    "summary",
    "Consolidated summary",
    "Area/period scope with dataset-specific date bases; never sum these different measures.",
    ["Metric", "Value", "Definition"],
    Object.entries(metrics).map(([key, value]) => ({
      id: key,
      values: {
        Metric: key,
        Value: value ?? "—",
        Definition: definitions[key],
      },
    })),
  );
  add(
    "organisation-workload",
    "Organisation workload",
    "Active case and infrastructure records by opened/reported date; not a count of unique issues.",
    [
      "ID",
      "Organisation",
      "Active cases",
      "Active infrastructure",
      "Total active",
    ],
    organisations.map((o) => {
      const cases = selectedCases.filter(
          (c) => c.organisationId === o.id && active(c.stage),
        ).length,
        matters = activeInfra.filter((m) => m.organisationId === o.id).length;
      return {
        id: o.id,
        values: {
          ID: o.id,
          Organisation: o.name,
          "Active cases": cases,
          "Active infrastructure": matters,
          "Total active": cases + matters,
        },
      };
    }),
  );
  return {
    datasets,
    scope,
    metrics,
    organisationWorkload: organisations.map((o) => ({
      id: o.id,
      name: o.name,
      cases: selectedCases.filter(
        (c) => c.organisationId === o.id && active(c.stage),
      ).length,
      infrastructure: activeInfra.filter((m) => m.organisationId === o.id)
        .length,
    })),
    coverage,
    operationRows,
  };
}
export function useReporting(scope: ReportScope) {
  const workspace = useCases(),
    infrastructure = useInfrastructure(),
    engagements = useEngagementStore();
  return buildReports(scope, {
    records,
    links,
    people,
    cases: workspace.cases,
    households: workspace.households,
    contacts: workspace.contacts,
    infrastructure,
    engagements,
  });
}
export function reportCSV(
  dataset: ReportDataset,
  rows: ReportRow[],
  scope: ReportScope,
) {
  const cell = (v: unknown) =>
    `"${String(v ?? "")
      .replace(/^[\s]*[=+@-]/, "'$&")
      .replaceAll('"', '""')}"`;
  return [
    [
      "Synthetic report",
      dataset.label,
      reportingLabel,
      scope.area,
      scope.days ? `Last ${scope.days} days` : "All dates",
    ],
    ["Date basis", dataset.basis],
    dataset.columns,
    ...rows.map((r) => dataset.columns.map((c) => r.values[c])),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
}
export function downloadReport(
  dataset: ReportDataset,
  rows: ReportRow[],
  scope: ReportScope,
) {
  const url = URL.createObjectURL(
    new Blob([reportCSV(dataset, rows, scope)], {
      type: "text/csv;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `fengshan-${dataset.key}-${reportingDate}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
