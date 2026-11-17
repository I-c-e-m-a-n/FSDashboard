import { test, expect } from "@playwright/test";
test("engagement lifecycle persists and shares a single operational record", async ({
  page,
}) => {
  await page.goto("#engagements");
  await expect(
    page.getByRole("heading", { name: "Engagement management." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "New engagement" }).click();
  const dialog = page.getByRole("dialog", { name: "Engagement editor" });
  await dialog
    .getByLabel("Title", { exact: true })
    .fill("Synthetic Raya planning");
  await dialog
    .getByLabel("Type", { exact: true })
    .selectOption("Raya distribution");
  await dialog.getByLabel("Lifecycle stage").selectOption("Scheduled");
  await dialog.getByLabel("Date", { exact: true }).fill("2027-03-12");
  await dialog.getByLabel("Planned participants").fill("80");
  await dialog.getByLabel("FS-002").check();
  await dialog.getByRole("button", { name: "Save engagement" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: /Synthetic Raya planning/ }),
  ).toHaveCount(1);
  await page.reload();
  await page.getByRole("button", { name: /Synthetic Raya planning/ }).click();
  await dialog.getByLabel("Lifecycle stage").selectOption("In progress");
  await dialog.getByLabel("Actual participants").fill("65");
  await dialog.getByRole("button", { name: "Save engagement" }).click();
  await page.getByRole("button", { name: /Synthetic Raya planning/ }).click();
  await dialog.getByLabel("Lifecycle stage").selectOption("Completed");
  await dialog.getByRole("button", { name: "Save engagement" }).click();
  await page.goto("#explorer");
  await page.getByLabel("Explorer period").selectOption("0");
  await page
    .getByLabel("Search explorer records")
    .fill("Synthetic Raya planning");
  await expect(page.getByTestId("explorer-total")).toHaveText("1");
  await expect(page.locator(".explorer-table")).toContainText("Completed");
  await page.goto("#engagements");
  await page.getByRole("button", { name: /Synthetic Raya planning/ }).click();
  await dialog.getByLabel("Lifecycle stage").selectOption("Cancelled");
  await dialog.getByRole("button", { name: "Save engagement" }).click();
  await page.getByLabel("Engagement stage").selectOption("Cancelled");
  await expect(page.locator(".schedule-event")).toHaveCount(1);
});
test("validation, media, map and accessibility", async ({ page }) => {
  await page.goto("#engagements");
  await page.getByRole("button", { name: "New engagement" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Title", { exact: true })
    .fill("Synthetic media visit");
  await dialog.getByLabel("Type", { exact: true }).selectOption("House visit");
  await dialog.getByLabel("End (SGT)").fill("08:00");
  await dialog.getByRole("button", { name: "Save engagement" }).click();
  await expect(dialog.getByRole("alert")).toContainText("end time");
  await dialog.getByLabel("End (SGT)").fill("10:00");
  await dialog.getByLabel("Add synthetic images").setInputFiles({
    name: "sample.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from("<svg/>"),
  });
  await expect(dialog.getByRole("alert")).toContainText("PNG");
  const buffer = await page.screenshot();
  await dialog
    .getByLabel("Add synthetic images")
    .setInputFiles({ name: "synthetic-ui.png", mimeType: "image/png", buffer });
  await expect(dialog.getByAltText("synthetic-ui.png")).toBeVisible();
  await dialog.getByRole("button", { name: "Save engagement" }).click();
  await page.reload();
  await page.getByRole("button", { name: /Synthetic media visit/ }).click();
  await expect(dialog.getByAltText("synthetic-ui.png")).toBeVisible();
  await dialog.getByLabel("Remove synthetic-ui.png").click();
  await dialog.getByRole("button", { name: "Save engagement" }).click();
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await expect(page.locator(".map-pin")).toHaveCount(9);
  await page.getByRole("button", { name: "Board", exact: true }).click();
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("storage failure preserves unsaved edits without adding a record", async ({
  page,
}) => {
  await page.goto("#engagements");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "New engagement" }).click();
  const d = page.getByRole("dialog");
  await d.getByLabel("Title", { exact: true }).fill("Not saved");
  await d.getByRole("button", { name: "Save engagement" }).click();
  await expect(d.getByRole("alert")).toContainText("not been saved");
  await d.getByRole("button", { name: "Discard changes" }).click();
  await expect(page.locator(".schedule-event")).toHaveCount(8);
});
