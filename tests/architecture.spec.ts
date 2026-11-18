import { test, expect } from "@playwright/test";
import { records, operations, locations, teams, isOverdue } from "../src/data";
import { summarize, weeklyActivity } from "../src/analytics";
import { inReportingWindow, reportingDate } from "../src/reporting";
import { validatePerson, seed } from "../src/personnelStore";
test("reporting boundaries, cancellation and date buckets conserve measures", () => {
  expect(reportingDate).toBe("2026-11-17");
  expect(inReportingWindow("2026-11-11", 7)).toBe(true);
  expect(inReportingWindow("2026-11-10", 7)).toBe(false);
  expect(inReportingWindow("2026-11-18", 7)).toBe(false);
  expect(inReportingWindow("2027-01-01", 0)).toBe(true);
  const cancelled = {
    ...records.find((r) => r.category === "House visits")!,
    status: "Cancelled" as const,
    units: 999,
  };
  expect(summarize([cancelled]).householdContacts).toBe(0);
  expect(isOverdue(cancelled)).toBe(false);
  const items = [
    ...records,
    { ...records[0], date: reportingDate },
    { ...records[0], date: "2027-01-01" },
  ];
  expect(
    weeklyActivity(items)
      .flatMap((w) => w.values)
      .reduce((a, b) => a + b, 0),
  ).toBe(items.length);
  expect(weeklyActivity(items).length).toBeLessThanOrEqual(12);
  expect(() =>
    validatePerson({
      ...seed[0],
      deployments: [{ recordId: "missing", status: "Attended" }],
    }),
  ).toThrow();
  for (const operation of operations) {
    expect(locations.some((l) => l.id === operation.locationId)).toBe(true);
    expect(teams.some((t) => t.id === operation.teamId)).toBe(true);
  }
});
test("personnel identity and team edits are shared with engagement ownership", async ({
  page,
}) => {
  await page.goto("#personnel");
  await page.getByRole("button", { name: /SYN-004/ }).click();
  await page.getByLabel("Team", { exact: true }).selectOption("TEAM-SOUTH");
  await page.getByRole("button", { name: "Save profile" }).click();
  await page.goto("#engagements");
  await page.getByRole("button", { name: "New engagement" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Title", { exact: true })
    .fill("Shared personnel architecture check");
  await dialog
    .getByLabel("Coordinator", { exact: true })
    .selectOption("SYN-004");
  await dialog.getByRole("button", { name: "Save engagement" }).click();
  await page.reload();
  await page.goto("#explorer");
  await page.getByLabel("Explorer period").selectOption("0");
  await page
    .getByLabel("Search explorer records")
    .fill("Shared personnel architecture check");
  await page.getByLabel("Responsible team filter").selectOption("TEAM-SOUTH");
  await expect(page.getByTestId("explorer-total")).toHaveText("1");
  await page.getByLabel("Responsible team filter").selectOption("TEAM-NORTH");
  await expect(page.getByTestId("explorer-total")).toHaveText("0");
});
test("legacy personnel and coordinator migration preserves edits and relationships", async ({
  page,
}) => {
  await page.goto("#personnel");
  await page.getByRole("button", { name: /SYN-004/ }).click();
  await page.getByLabel("Age", { exact: true }).fill("64");
  await page.getByRole("button", { name: "Save profile" }).click();
  await page.goto("#engagements");
  await page.getByRole("button", { name: "New engagement" }).click();
  const d = page.getByRole("dialog");
  await d
    .getByLabel("Title", { exact: true })
    .fill("Legacy coordinator migration");
  await d.getByLabel("Coordinator", { exact: true }).selectOption("SYN-004");
  await d.getByRole("button", { name: "Save engagement" }).click();
  await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("fengshan.personnel.v1")!);
    localStorage.setItem(
      "fengshan.personnel.v1",
      JSON.stringify(
        saved.people.map((p: any) => {
          const { teamId, ...rest } = p;
          return { ...rest, team: teamId };
        }),
      ),
    );
    const events = JSON.parse(localStorage.getItem("fengshan.engagements.v1")!);
    events.events.find(
      (e: any) => e.title === "Legacy coordinator migration",
    ).personId = "P-01";
    localStorage.setItem("fengshan.engagements.v1", JSON.stringify(events));
  });
  await page.reload();
  await page
    .getByRole("button", { name: /Legacy coordinator migration/ })
    .click();
  await expect(d.getByLabel("Coordinator", { exact: true })).toHaveValue(
    "SYN-004",
  );
  await page.goto("#personnel");
  await page.getByRole("button", { name: /SYN-004/ }).click();
  await expect(page.getByLabel("Age", { exact: true })).toHaveValue("64");
});
test("expanded collection shares reference data and exposes all workflow categories", async ({
  page,
}) => {
  await page.goto("#explorer");
  await page.getByLabel("Explorer period").selectOption("0");
  await expect(page.getByTestId("explorer-total")).toHaveText("28");
  await page.getByRole("button", { name: "Data model", exact: true }).click();
  await expect(
    page.getByText(/18 personnel · 5 organisation entries/),
  ).toBeVisible();
  await page.goto("#infrastructure");
  await expect(page.getByTestId("infra-total")).toHaveText("9");
  await page
    .getByLabel("Responsible organisation filter")
    .selectOption("ORG-NEA");
  await expect(page.getByTestId("infra-total")).toHaveText("1");
  await page.goto("#engagements");
  await expect(page.locator(".schedule-event")).toHaveCount(15);
});
test("malformed personnel storage warns without overwriting the saved snapshot", async ({
  page,
}) => {
  await page.goto("#personnel");
  await page.evaluate(() =>
    localStorage.setItem(
      "fengshan.personnel.v1",
      JSON.stringify([{ id: "SYN-001", deployments: [null] }]),
    ),
  );
  await page.reload();
  await expect(page.getByRole("status")).toContainText(
    "Saved personnel data is invalid",
  );
  await expect(page.getByRole("button", { name: /SYN-001/ })).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("fengshan.personnel.v1")!)[0]
          .deployments,
    ),
  ).toEqual([null]);
});

test("all-date reporting remains contained and keyboard scrollable", async ({
  page,
}) => {
  await page.goto("");
  await page.getByLabel("Reporting period").selectOption("0");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator(".chart")).toHaveAttribute("tabindex", "0");
});
