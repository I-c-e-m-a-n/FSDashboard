/** One reproducible SGT date-only reporting context for every module. */
export const reportingDate = "2026-11-17";
export const reportingLabel = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Singapore",
}).format(new Date(`${reportingDate}T00:00:00Z`));
export function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function inReportingWindow(
  date: string,
  days: number,
  asOf = reportingDate,
) {
  return days === 0 || (date >= shiftDate(asOf, 1 - days) && date <= asOf);
}
export function matchesQuery(query: string, ...values: unknown[]) {
  return values.join(" ").toLowerCase().includes(query.trim().toLowerCase());
}
