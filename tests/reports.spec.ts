import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  buildReports,
  reportCSV,
  type ReportingSources,
} from "../src/reportingModel";
import { freshCase } from "../src/caseStore";
import { records } from "../src/data";
test("resolution flow uses resolution dates and counted attendance excludes cancellation", () => {
  const c = {
    ...freshCase(),
    id: "CASE-test",
    openedOn: "2026-09-01",
    resolvedOn: "2026-11-16",
    stage: "Closed" as const,
    resolution: "Synthetic outcome",
  };
  const op = {
    ...records[0],
    id: c.id,
    category: "Case management" as const,
    date: c.openedOn,
    status: "Completed" as const,
  };
  const source: ReportingSources = {
    records: [op, { ...records[0], id: "cancelled", status: "Cancelled" }],
    cases: [c],
    households: [
      {
        id: c.householdId,
        blockId: "BLOCK-01",
        members: [{ id: c.residentId, age: 35 }],
        relationships: [],
      },
    ],
    contacts: [],
    people: [
      {
        id: "SYN-TEST",
        name: "Synthetic",
        age: 30,
        sex: "Not stated",
        race: "Not stated",
        kind: "Regular",
        stage: "Active",
        teamId: "TEAM-NORTH",
        awards: [],
        training: [],
        deployments: [{ recordId: "cancelled", status: "Attended" }],
      },
    ],
    infrastructure: [],
    engagements: [],
    links: [],
  };
  const report = buildReports({ area: "All areas", days: 7 }, source);
  expect(report.datasets.find((d) => d.key === "cases")!.rows).toHaveLength(0);
  expect(report.metrics.resolutions).toBe(1);
  expect(report.metrics.attendances).toBe(0);
  const dataset = report.datasets.find((d) => d.key === "resolutions")!;
  const csv = reportCSV(
    dataset,
    [
      {
        ...dataset.rows[0],
        values: { ...dataset.rows[0].values, Title: "=SUM(A1)" },
      },
    ],
    report.scope,
  );
  expect(csv).toContain("'=SUM(A1)");
  expect(csv).toContain("Latest resolution date");
  const reopened = buildReports(report.scope, {
    ...source,
    cases: [{ ...c, stage: "Follow-up", resolvedOn: "" }],
  });
  expect(reopened.metrics.resolutions).toBe(0);
});
test("report summaries drill to matching rows, linked records and filtered exports", async ({
  page,
}) => {
  await page.goto("#explorer");
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Consolidated reports." }),
  ).toBeVisible();
  await expect(page.getByTestId("report-resolutions")).toHaveText("2");
  await page.getByRole("button", { name: /Resolved \/ closed cases/ }).click();
  await expect(page.getByTestId("report-row-count")).toHaveText("2 rows");
  await page
    .getByRole("button", { name: "Inspect FS-010", exact: true })
    .click();
  const d = page.getByRole("dialog", { name: "Report row details" });
  await expect(d).toContainText("Resolution days");
  await d.getByRole("button", { name: "Open operational record" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Service guidance follow-up",
  );
  await page.getByLabel("Close record details").click();
  await page.getByRole("button", { name: /Unassigned.*2 cases/ }).click();
  await expect(page.getByTestId("report-row-count")).toHaveText("2 rows");
  await page.getByLabel("Reporting dataset").selectOption("residents");
  await expect(page.getByTestId("report-row-count")).toHaveText("96 rows");
  await page.getByLabel("Next report page").click();
  await expect(page.getByText(/Page 2 of 8/)).toBeVisible();
  await page.getByLabel("Search report rows").fill("HH-001");
  await expect(page.getByTestId("report-row-count")).toHaveText("2 rows");
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export 2 rows", exact: true })
    .click();
  const dl = await pending;
  const csv = await readFile((await dl.path())!, "utf8");
  expect(csv.split("\r\n")).toHaveLength(5);
  expect(csv).toContain("HH-001-A");
  expect(csv).not.toContain("HH-002-A");
  await page
    .getByRole("button", { name: "Inspect HH-001-A", exact: true })
    .click();
  await d.getByRole("button", { name: "HH-001 ↗", exact: true }).click();
  await expect(page.getByLabel("Reporting dataset")).toHaveValue("households");
  await expect(page.getByTestId("report-row-count")).toHaveText("1 rows");
});
test("homepage reporting links preserve scope and reports remain accessible", async ({
  page,
}) => {
  await page.goto("");
  await page.getByLabel("Geographical area").selectOption("North");
  await page.getByRole("link", { name: /Cases resolved \/ closed/ }).click();
  await expect(page.getByLabel("Reporting area")).toHaveValue("North");
  await expect(page.getByLabel("Reporting dataset")).toHaveValue("resolutions");
  await page.getByLabel("Reporting area").selectOption("All areas");
  await page.getByRole("button", { name: /Households reached/ }).click();
  await expect(page.getByTestId("report-row-count")).toHaveText("5 rows");
  await page.getByLabel("Reporting window").selectOption("7");
  await expect(page.getByTestId("report-row-count")).toHaveText("2 rows");
  await page.getByRole("button", { name: "Clear table filters" }).click();
  await page.getByLabel("Search report rows").fill("no-such-household");
  await expect(
    page.getByText("No rows match this report selection."),
  ).toBeVisible();
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Operational explorer", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Data explorer." }),
  ).toBeVisible();
});
