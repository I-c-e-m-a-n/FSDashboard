import { test, expect } from "@playwright/test";
test("summary and record details are consistent", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("");
  await expect(
    page.getByRole("heading", { name: "Community overview." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Filter House visits", exact: true }),
  ).toContainText("146");
  await expect(page.locator(".map-pin")).toHaveCount(16);
  await page
    .getByRole("button", {
      name: /Infrastructure Urgent Lift landing lighting/,
    })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText(
    "North coordination team",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(errors).toEqual([]);
});
test("geographic, period, search and layer filters share one dataset", async ({
  page,
}) => {
  await page.goto("");
  await page.getByLabel("Geographical area").selectOption("South");
  await expect(page.locator(".map-pin")).toHaveCount(5);
  await page.getByLabel("Reporting period").selectOption("7");
  await expect(page.locator(".map-pin")).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Filter House visits", exact: true }),
  ).toContainText("0");
  await page.getByLabel("Search operational records").fill("playground");
  await expect(page.locator(".map-pin")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Infrastructure", exact: true })
    .click();
  await expect(page.locator(".map-pin")).toHaveCount(0);
  await expect(page.getByText("No matching records")).toBeVisible();
  await page
    .getByRole("button", { name: "Reset filters", exact: true })
    .first()
    .click();
  await expect(page.locator(".map-pin")).toHaveCount(16);
  await page
    .getByRole("button", { name: "Filter Engagements", exact: true })
    .click();
  await expect(page.locator(".map-pin")).toHaveCount(3);
  await expect(page.getByText("All caught up")).toBeVisible();
  await page.getByRole("button", { name: /All records/ }).click();
  await expect(page.locator(".record")).toHaveCount(3);
});
test("map markers, export, help and responsive layout work", async ({
  page,
}, testInfo) => {
  await page.goto("");
  await page.locator(".map-pin").first().click();
  await expect(page.getByRole("dialog")).toContainText("Lift landing lighting");
  await page.getByLabel("Close record details").click();
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export snapshot" }).click();
  expect((await dl).suggestedFilename()).toBe("fengshan-demo-2026-11-16.csv");
  if (testInfo.project.name === "mobile")
    await page.getByLabel("Toggle navigation").click();
  await page.getByRole("button", { name: /About this demonstration/ }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "not official administrative boundaries",
  );
  await page.getByLabel("Close about dialog").click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
});
test("map failure leaves operational records usable", async ({ page }) => {
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.abort(),
  );
  await page.goto("");
  await expect(page.getByText(/Street map unavailable/)).toBeVisible();
  await page
    .getByRole("button", {
      name: /Infrastructure Urgent Lift landing lighting/,
    })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("accessible page structure and dialogs", async ({ page }) => {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  await page.goto("");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    results.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  await page
    .getByRole("button", {
      name: /Infrastructure Urgent Lift landing lighting/,
    })
    .click();
  const dialogResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    dialogResults.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
});
