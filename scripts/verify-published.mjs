import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const url = process.env.PLAYWRIGHT_BASE_URL;
if (!url?.startsWith("https://"))
  throw new Error("A published HTTPS URL is required");
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  const response = await page.goto(url, { waitUntil: "networkidle" });
  if (response?.status() !== 200)
    throw new Error(`Published homepage returned ${response?.status()}`);
  await page.getByRole("heading", { name: "Community overview." }).waitFor();
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll(".leaflet-tile-loaded")].some(
        (tile) => tile instanceof HTMLImageElement && tile.naturalWidth > 0,
      ),
    { timeout: 30000 },
  );
  await mkdir("published-evidence", { recursive: true });
  await page.screenshot({
    path: "published-evidence/desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "published-evidence/mobile.png",
    fullPage: true,
  });
  await page.goto(`${url}#explorer`);
  await page.getByRole("heading", { name: "Data explorer." }).waitFor();
  await page.screenshot({
    path: "published-evidence/explorer-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({
    path: "published-evidence/explorer-desktop.png",
    fullPage: true,
  });
  await page.goto(`${url}#engagements`);
  await page.getByRole("heading", { name: "Engagement management." }).waitFor();
  await page.screenshot({
    path: "published-evidence/engagement-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "published-evidence/engagement-mobile.png",
    fullPage: true,
  });
  await page.goto(`${url}#infrastructure`);
  await page
    .getByRole("heading", { name: "Infrastructure tracking." })
    .waitFor();
  await page.screenshot({
    path: "published-evidence/infrastructure-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({
    path: "published-evidence/infrastructure-desktop.png",
    fullPage: true,
  });
  console.log(
    `Verified HTTP 200, rendered homepage and live map tiles at ${url}`,
  );
} finally {
  await browser.close();
}
