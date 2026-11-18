import { reportingDate, reportingLabel, shiftDate } from "./reporting";
import {
  categories,
  isOutstanding,
  isOverdue,
  links,
  type RecordItem,
} from "./data";
export function summarize(items: RecordItem[]) {
  const completed = items.filter((r) => r.status === "Completed").length;
  return {
    total: items.length,
    completed,
    outstanding: items.filter(isOutstanding).length,
    urgent: items.filter((r) => isOutstanding(r) && r.priority === "Urgent")
      .length,
    overdue: items.filter(isOverdue).length,
    completionRate: items.length
      ? Math.round((completed / items.length) * 100)
      : 0,
    householdContacts: items
      .filter((r) => r.category === "House visits" && r.status !== "Cancelled")
      .reduce((sum, r) => sum + r.units, 0),
    participations: items
      .filter((r) => r.category === "Engagements" && r.status !== "Cancelled")
      .reduce((sum, r) => sum + r.units, 0),
  };
}
export function weeklyActivity(items: RecordItem[]) {
  const end = items.reduce(
    (latest, r) => (r.date > latest ? r.date : latest),
    reportingDate,
  );
  const start = items.reduce(
    (earliest, r) => (r.date < earliest ? r.date : earliest),
    shiftDate(end, -27),
  );
  const days = Math.floor((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
  const width = Math.max(7, Math.ceil(days / 12));
  return Array.from({ length: Math.ceil(days / width) }, (_, i) => {
    const from = shiftDate(start, i * width),
      to = shiftDate(from, width - 1) > end ? end : shiftDate(from, width - 1);
    const label = `${from.slice(5)}–${to.slice(5)}`;
    return [label, from, to];
  }).map(([label, start, end]) => ({
    label,
    values: categories.map(
      (c) =>
        items.filter(
          (r) => r.category === c && r.date >= start && r.date <= end,
        ).length,
    ),
  }));
}
export function connectedLinks(items: RecordItem[]) {
  const ids = new Set(items.map((r) => r.id));
  return links.filter((link) => ids.has(link.fromId) && ids.has(link.toId));
}
export function relatedLinks(id: string) {
  return links.filter((link) => link.fromId === id || link.toId === id);
}
export function csvForRecords(items: RecordItem[]) {
  const cell = (value: unknown) =>
    `"${String(value)
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""')}"`;
  return [
    [`Synthetic demonstration — as of ${reportingLabel}`],
    [
      "ID",
      "Dataset",
      "Title",
      "Location ID",
      "Location",
      "Area",
      "Team ID",
      "Team",
      "Recorded date",
      "Due / completion date",
      "Status",
      "Priority",
      "Overdue",
      "Household contacts",
      "Participations",
    ],
    ...items.map((r) => [
      r.id,
      r.category,
      r.title,
      r.locationId,
      r.location,
      r.sector,
      r.teamId,
      r.owner,
      r.date,
      r.due,
      r.status,
      r.priority,
      isOverdue(r) ? "Yes" : "No",
      r.category === "House visits" && r.status !== "Cancelled" ? r.units : "",
      r.category === "Engagements" && r.status !== "Cancelled" ? r.units : "",
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
}
export function downloadRecords(items: RecordItem[], filename: string) {
  const url = URL.createObjectURL(
    new Blob([csvForRecords(items)], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
