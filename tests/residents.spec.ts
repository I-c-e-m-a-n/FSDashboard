import { test, expect } from "@playwright/test";
test("MPS referral, resolution, reopening and shared operation survive reload", async ({
  page,
}) => {
  await page.goto("#residents");
  await expect(
    page.getByRole("heading", { name: "Residents & cases." }),
  ).toBeVisible();
  await expect(page.getByTestId("case-total")).toHaveText("4");
  await page.getByRole("button", { name: "New case", exact: true }).click();
  const d = page.getByRole("dialog", { name: "Resident case editor" });
  await d
    .getByLabel("Case title", { exact: true })
    .fill("Synthetic MPS housing follow-up");
  await d.getByLabel("Case channel", { exact: true }).selectOption("MPS");
  await d.getByLabel("Case urgency", { exact: true }).selectOption("Critical");
  await d.getByLabel("Case lifecycle").selectOption("Referred");
  await d
    .getByLabel("Action note (required)")
    .fill("Synthetic housing referral prepared.");
  await d.getByRole("button", { name: "Save case & action" }).click();
  await expect(d.getByRole("alert")).toContainText("responsible organisation");
  await d.getByLabel("Case organisation").selectOption("ORG-HDB");
  await d.getByLabel("FS-001", { exact: false }).check();
  await d.getByRole("button", { name: "Save case & action" }).click();
  await expect(d).not.toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: /Synthetic MPS housing follow-up/ })
    .click();
  await expect(d.getByLabel("Case organisation")).toHaveValue("ORG-HDB");
  await d.getByLabel("Case lifecycle").selectOption("Resolved");
  await d.getByLabel("Resolution date").fill("2026-11-17");
  await d.getByLabel("Resolution note").fill("Synthetic outcome confirmed.");
  await d
    .getByLabel("Action note (required)")
    .fill("Resolved after follow-up.");
  await d.getByRole("button", { name: "Save case & action" }).click();
  await page.goto("#explorer");
  await page
    .getByLabel("Search explorer records")
    .fill("Synthetic MPS housing follow-up");
  await expect(page.getByTestId("explorer-total")).toHaveText("1");
  await expect(page.locator(".explorer-table")).toContainText("Completed");
  await page.goto("#residents");
  await page.getByRole("button", { name: "MPS", exact: true }).click();
  await expect(page.getByTestId("case-total")).toHaveText("3");
  await page
    .getByRole("button", { name: /Synthetic MPS housing follow-up/ })
    .click();
  await d.getByLabel("Case lifecycle").selectOption("Follow-up");
  await d
    .getByLabel("Action note (required)")
    .fill("Reopened for an additional synthetic query.");
  await d.getByRole("button", { name: "Save case & action" }).click();
  await page.reload();
  await page
    .getByRole("button", { name: /Synthetic MPS housing follow-up/ })
    .click();
  await expect(d).toContainText("Case journal · 3 actions");
  await expect(d.getByLabel("Case lifecycle")).toHaveValue("Follow-up");
  await d.getByLabel("Close case editor").click();
  await page.goto("#infrastructure");
  await page.getByRole("button", { name: /Lift landing lighting/ }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Synthetic MPS housing follow-up",
  );
});
test("household relationships and deduplicated block coverage", async ({
  page,
}) => {
  await page.goto("#residents");
  await page.getByRole("button", { name: "Coverage", exact: true }).click();
  await page.getByLabel("Resident block filter").selectOption("BLOCK-01");
  await expect(
    page.getByText("0 / 3 households contacted", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Review households" }).click();
  const card = page.locator(".rc-households article").filter({
    has: page.getByRole("heading", { name: "HH-001", exact: true }),
  });
  await card.getByRole("button", { name: "View household" }).click();
  const h = page.getByRole("dialog", { name: "Household editor" });
  await h.getByLabel("Resident 1 age").fill("45");
  await h.getByRole("button", { name: "Save household" }).click();
  await card.getByRole("button", { name: "Record visit" }).click();
  const v = page.getByRole("dialog", { name: "Visit outcome editor" });
  await v.getByRole("button", { name: "Save visit outcome" }).click();
  await page.getByRole("button", { name: "Coverage", exact: true }).click();
  await expect(
    page.getByText("1 / 3 households contacted", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Review households" }).click();
  await card.getByRole("button", { name: "Record visit" }).click();
  await v.getByRole("button", { name: "Save visit outcome" }).click();
  await expect(v.getByRole("alert")).toContainText("already has an outcome");
  await v.getByLabel("Close visit editor").click();
  await card.getByRole("button", { name: "View household" }).click();
  await expect(h.getByLabel("Resident 1 age")).toHaveValue("45");
  await h.getByRole("button", { name: "Raise visit case" }).click();
  const c = page.getByRole("dialog", { name: "Resident case editor" });
  await expect(c.getByLabel("Case channel", { exact: true })).toHaveValue(
    "House visit",
  );
  await c
    .getByLabel("Case title", { exact: true })
    .fill("Synthetic doorstep referral");
  await c
    .getByLabel("Action note (required)")
    .fill("Follow up on synthetic household feedback.");
  await c.getByRole("button", { name: "Save case & action" }).click();
  await page.reload();
  await page
    .getByRole("button", { name: /Synthetic doorstep referral/ })
    .click();
  await expect(c.getByLabel("Case household")).toHaveValue("HH-001");
  await c.getByLabel("Close case editor").click();
  await page.getByRole("button", { name: "Coverage", exact: true }).click();
  await page.getByLabel("Resident block filter").selectOption("BLOCK-01");
  await expect(
    page.getByText("1 / 3 households contacted", { exact: false }),
  ).toBeVisible();
});
test("resident views and dialogs are accessible; failed storage retains edits", async ({
  page,
}) => {
  await page.goto("#residents");
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  for (const name of ["Cases", "Households", "Coverage", "MPS", "Outcomes"]) {
    await page.getByRole("button", { name, exact: true }).click();
    expect(
      (
        await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()
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
  }
  await page.getByRole("button", { name: "New case", exact: true }).click();
  const d = page.getByRole("dialog");
  await d
    .getByLabel("Case title", { exact: true })
    .fill("Synthetic failed save");
  await d.getByLabel("Action note (required)").fill("Must remain unsaved.");
  expect(
    (
      await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()
    ).violations.map((v) => v.id),
  ).toEqual([]);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  await d.getByRole("button", { name: "Save case & action" }).click();
  await expect(d.getByRole("alert")).toContainText("Nothing was saved");
  await expect(d.getByLabel("Case title", { exact: true })).toHaveValue(
    "Synthetic failed save",
  );
  await d.getByLabel("Close case editor").click();
  await expect(page.getByTestId("case-total")).toHaveText("4");
});
test("family constraints, resolution validation and repeated-contact coverage", async ({
  page,
}) => {
  await page.goto("#residents");
  await page.getByRole("button", { name: "Households", exact: true }).click();
  await page.getByLabel("Resident block filter").selectOption("BLOCK-01");
  const card = page.locator(".rc-households article").filter({
    has: page.getByRole("heading", { name: "HH-001", exact: true }),
  });
  await card.getByRole("button", { name: "View household" }).click();
  const h = page.getByRole("dialog", { name: "Household editor" });
  await h.getByLabel("Resident 1 age").fill("5");
  await h.getByRole("button", { name: "Save household" }).click();
  await expect(h.getByRole("alert")).toContainText("parent must be older");
  await h.getByLabel("Resident 1 age").fill("35");
  await h.getByRole("button", { name: "Save household" }).click();
  for (const round of ["FS-004", "FS-005"]) {
    await card.getByRole("button", { name: "Record visit" }).click();
    const v = page.getByRole("dialog", { name: "Visit outcome editor" });
    await v.getByLabel("Visit round", { exact: true }).selectOption(round);
    await v.getByRole("button", { name: "Save visit outcome" }).click();
  }
  await page.getByRole("button", { name: "Coverage", exact: true }).click();
  await expect(
    page.getByText("1 / 3 households contacted · 2 attempts", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "New case", exact: true }).click();
  const d = page.getByRole("dialog", { name: "Resident case editor" });
  await d
    .getByLabel("Case title", { exact: true })
    .fill("Synthetic resolution date validation");
  await d.getByLabel("Case lifecycle").selectOption("Closed");
  await d.getByLabel("Resolution date").fill("2026-11-16");
  await d.getByLabel("Resolution note").fill("Illustrative result.");
  await d.getByLabel("Action note (required)").fill("Check chronology.");
  await d.getByRole("button", { name: "Save case & action" }).click();
  await expect(d.getByRole("alert")).toContainText(
    "between opening and the reporting date",
  );
});
