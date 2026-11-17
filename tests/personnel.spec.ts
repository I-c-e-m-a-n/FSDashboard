import { test, expect } from "@playwright/test";
test("personnel profile, deployment and development persist", async ({
  page,
}) => {
  await page.goto("#personnel");
  await expect(
    page.getByRole("heading", { name: "Personnel management." }),
  ).toBeVisible();
  await page.getByRole("button", { name: /SYN-003/ }).click();
  await page.getByLabel("Age", { exact: true }).fill("61");
  await page.getByRole("button", { name: "Set deployment" }).click();
  await page
    .getByLabel("Award", { exact: true })
    .selectOption("CDC District Achievement Award");
  await page.getByRole("button", { name: "Record award" }).click();
  await page.getByRole("button", { name: "Update learning record" }).click();
  await page.getByRole("button", { name: "Save profile" }).click();
  await page.reload();
  await page.getByRole("button", { name: /SYN-003/ }).click();
  await expect(page.getByLabel("Age", { exact: true })).toHaveValue("61");
  await expect(
    page.locator("p").filter({hasText:"CDC District Achievement Award · 2026"}),
  ).toBeVisible();
  await expect(
    page.getByText("Community first aid · Planned · 2026", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Discard changes" }).click();
  await page.getByLabel("Search directory").fill("no-match");
  await expect(page.getByText("No matching members.")).toBeVisible();
});
