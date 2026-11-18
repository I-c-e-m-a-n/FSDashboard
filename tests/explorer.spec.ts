import { test, expect } from "@playwright/test";
import { operations, locations, teams, links, records } from "../src/data";
import { summarize } from "../src/analytics";
test("normalized relationships and measures are valid", () => {
  for (const r of operations) {
    expect(locations.some((l) => l.id === r.locationId)).toBe(true);
    expect(teams.some((t) => t.id === r.teamId)).toBe(true);
  }
  for (const l of links) {
    const a = records.find((r) => r.id === l.fromId)!,
      b = records.find((r) => r.id === l.toId)!;
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(a.date <= b.date).toBe(true);
  }
  expect(summarize(records)).toMatchObject({
    total: 16,
    householdContacts: 146,
    participations: 119,
    outstanding: 6,
    overdue: 3,
  });
});
test("explorer filters, pagination, links, export and shared navigation", async ({
  page,
}, info) => {
  await page.goto("#explorer");
  await expect(
    page.getByRole("heading", { name: "Data explorer." }),
  ).toBeVisible();
  await expect(page.getByTestId("explorer-total")).toContainText("16");
  await page.getByLabel("Next records page").click();
  await expect(page.getByText("Page 2 of 2")).toBeVisible();
  await page
    .getByLabel("Record status", { exact: true })
    .selectOption("Overdue");
  await expect(page.getByTestId("explorer-total")).toContainText("3");
  await page.getByRole("button", { name: "Reset all", exact: true }).click();
  await page
    .getByRole("button", { name: "Connections 7", exact: true })
    .click();
  await expect(page.locator(".connection-card")).toHaveCount(7);
  await page
    .locator(".connection-card")
    .first()
    .locator("button")
    .first()
    .click();
  await expect(page.getByRole("dialog")).toContainText("Connected records");
  await page.getByRole("dialog").locator(".related-record").click();
  await expect(page.getByRole("dialog")).toContainText("Assistance follow-up");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Records", exact: true }).click();
  await page.getByLabel("Explorer area").selectOption("South");
  await expect(page.getByTestId("explorer-total")).toContainText("5");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export 5 records" }).click();
  expect((await download).suggestedFilename()).toContain("explorer");
  if (info.project.name === "mobile")
    await page.getByLabel("Toggle navigation").click();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(page.getByLabel("Geographical area")).toHaveValue("South");
  await expect(page.locator(".map-pin")).toHaveCount(5);
});
test("explorer accessible views and empty state", async ({ page }) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  await page.goto("#explorer");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  for (const name of ["Records", "Connections 7", "Data model"]) {
    await page.getByRole("button", { name, exact: true }).click();
    const r = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(
      r.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  }
  await page.getByRole("button", { name: "Records", exact: true }).click();
  await page.getByLabel("Search explorer records").fill("not-a-record");
  await expect(page.getByText("No records match this view")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
