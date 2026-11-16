import {
  categories,
  isOutstanding,
  isOverdue,
  links,
  type RecordItem,
} from "./data";
export function summarize(items: RecordItem[]) {
  const completed = items.filter((r) => !isOutstanding(r)).length;
  return {
    total: items.length,
    completed,
    outstanding: items.length - completed,
    urgent: items.filter((r) => isOutstanding(r) && r.priority === "Urgent")
      .length,
    overdue: items.filter(isOverdue).length,
    completionRate: items.length
      ? Math.round((completed / items.length) * 100)
      : 0,
    householdContacts: items
      .filter((r) => r.category === "House visits")
      .reduce((sum, r) => sum + r.units, 0),
    participations: items
      .filter((r) => r.category === "Engagements")
      .reduce((sum, r) => sum + r.units, 0),
  };
}
export function weeklyActivity(items: RecordItem[]) {
  return [
    ["19–25 Oct", "2026-10-19", "2026-10-25"],
    ["26 Oct–1 Nov", "2026-10-26", "2026-11-01"],
    ["2–8 Nov", "2026-11-02", "2026-11-08"],
    ["9–15 Nov", "2026-11-09", "2026-11-15"],
  ].map(([label, start, end]) => ({
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
    ["Synthetic demonstration — snapshot 16 Nov 2026"],
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
      r.category === "House visits" ? r.units : "",
      r.category === "Engagements" ? r.units : "",
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
