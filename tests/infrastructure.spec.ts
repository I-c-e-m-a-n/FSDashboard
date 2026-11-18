import { test, expect } from "@playwright/test";
test("infrastructure lifecycle, reports and cross-module persistence", async ({
  page,
}) => {
  await page.goto("#infrastructure");
  await expect(
    page.getByRole("heading", { name: "Infrastructure tracking." }),
  ).toBeVisible();
  await expect(page.getByTestId("infra-total")).toHaveText("9");
  await page.getByRole("button", { name: "Report a matter" }).click();
  const d = page.getByRole("dialog", { name: "Infrastructure matter editor" });
  await d
    .getByLabel("Title", { exact: true })
    .fill("Synthetic parking surface repair");
  await d
    .getByLabel("Matter category")
    .selectOption("LTA · parking & transport");
  await d
    .getByLabel("Description", { exact: true })
    .fill("Fictional surface repair for demonstration.");
  await d
    .getByLabel("Update note (required)")
    .fill("Initial synthetic report.");
  await d.getByRole("button", { name: "Save matter & update" }).click();
  await expect(d).not.toBeVisible();
  await page
    .getByRole("button", { name: /Synthetic parking surface repair/ })
    .click();
  await d.getByLabel("Matter lifecycle stage").selectOption("Assigned");
  await d.getByLabel("Update note (required)").fill("Assignment attempted.");
  await d.getByRole("button", { name: "Save matter & update" }).click();
  await expect(d.getByRole("alert")).toContainText(
    "Assign a responsible organisation",
  );
  await d
    .getByLabel("Responsible organisation", { exact: true })
    .selectOption("ORG-LTA");
  await d.getByRole("button", { name: "Save matter & update" }).click();
  await page.goto("#engagements");
  await page.getByRole("button", { name: "New engagement" }).click();
  const e = page.getByRole("dialog", { name: "Engagement editor" });
  await e
    .getByLabel("Title", { exact: true })
    .fill("Synthetic inspection walk");
  await e.getByLabel("Type", { exact: true }).selectOption("GRC walk");
  await e.getByLabel(/Synthetic parking surface repair/).check();
  await e.getByRole("button", { name: "Save engagement" }).click();
  await page.reload();
  await page.goto("#infrastructure");
  await page
    .getByRole("button", { name: /Synthetic parking surface repair/ })
    .click();
  await expect(
    d.getByLabel("Responsible organisation", { exact: true }),
  ).toHaveValue("ORG-LTA");
  await expect(d).toContainText("Synthetic inspection walk");
  await expect(d).toContainText("2 recorded updates");
  await d.getByLabel("Matter lifecycle stage").selectOption("In progress");
  await d.getByLabel("Progress (%)").fill("55");
  await d.getByLabel("Update note (required)").fill("Repair underway.");
  await d.getByRole("button", { name: "Save matter & update" }).click();
  await page
    .getByRole("button", { name: /Synthetic parking surface repair/ })
    .click();
  await d.getByLabel("Matter lifecycle stage").selectOption("Resolved");
  await d.getByLabel("Update note (required)").fill("Work inspected.");
  await d.getByRole("button", { name: "Save matter & update" }).click();
  await expect(d.getByRole("alert")).toContainText("100%");
  await d.getByLabel("Progress (%)").fill("100");
  await d.getByRole("button", { name: "Save matter & update" }).click();
  await page
    .getByRole("button", { name: /Synthetic parking surface repair/ })
    .click();
  await d.getByLabel("Matter lifecycle stage").selectOption("Closed");
  await d
    .getByLabel("Update note (required)")
    .fill("Administrative follow-up completed.");
  await d.getByRole("button", { name: "Save matter & update" }).click();
  await page.reload();
  await page
    .getByRole("button", { name: /Synthetic parking surface repair/ })
    .click();
  await expect(d).toContainText("5 recorded updates");
  await d.getByLabel("Close infrastructure editor").click();
  await page
    .getByLabel("Responsible organisation filter")
    .selectOption("ORG-LTA");
  await expect(page.getByTestId("infra-total")).toHaveText("2");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export report" }).click();
  expect((await download).suggestedFilename()).toBe(
    "fengshan-infrastructure-demo.csv",
  );
  await page.goto("#explorer");
  await page.getByLabel("Explorer period").selectOption("0");
  await page
    .getByLabel("Search explorer records")
    .fill("Synthetic parking surface repair");
  await expect(page.getByTestId("explorer-total")).toHaveText("1");
  await expect(page.locator(".explorer-table")).toContainText("Completed");
  await page.goto("#engagements");
  await expect(
    page.getByRole("button", { name: /Synthetic inspection walk/ }),
  ).toHaveCount(1);
});
test("infrastructure map, reports, editor accessibility and storage failure", async ({
  page,
}) => {
  await page.goto("#infrastructure");
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  for (const view of ["Register", "Reports"]) {
    await page.getByRole("button", { name: view, exact: true }).click();
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
  }
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await expect(page.locator(".map-pin")).toHaveCount(9);
  await page.getByTitle("Lift landing lighting", { exact: true }).click();
  const d = page.getByRole("dialog");
  await expect(d).toContainText("Lift landing lighting");
  await expect(d).toContainText("Weekend doorstep visits");
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    accessibility.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  await d.getByLabel("Update note (required)").fill("This save must fail.");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  await d.getByRole("button", { name: "Save matter & update" }).click();
  await expect(d.getByRole("alert")).toContainText("Nothing was saved");
  await expect(d).toContainText("1 recorded updates");
  await d.getByRole("button", { name: "Discard changes" }).click();
  await page.getByLabel("Search infrastructure").fill("unknown-no-record");
  await expect(
    page.getByText("No matching infrastructure matters"),
  ).toBeVisible();
});
