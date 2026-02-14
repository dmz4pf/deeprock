import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const BASE_URL = "http://localhost:3000";
// Remotion's staticFile() resolves from frontend/public/ (the cwd when rendering)
const OUT_DIR = path.resolve(__dirname, "../../public/screenshots");
const VIEWPORT = { width: 1920, height: 1080 };
const RETINA_SCALE = 2;

const SCREENS = [
  { name: "landing-hero", url: "/", waitFor: 3000 },
  { name: "landing-full", url: "/", fullPage: true, waitFor: 3000 },
  { name: "login", url: "/login", waitFor: 2000 },
  { name: "portfolio", url: "/portfolio", waitFor: 3000 },
  { name: "pools-main", url: "/pools", waitFor: 3000 },
  { name: "pools-treasury", url: "/pools/treasury", waitFor: 3000 },
  { name: "pools-real-estate", url: "/pools/real-estate", waitFor: 2000 },
  { name: "pools-private-credit", url: "/pools/private-credit", waitFor: 2000 },
  { name: "pools-corporate-bonds", url: "/pools/corporate-bonds", waitFor: 2000 },
  { name: "pools-commodities", url: "/pools/commodities", waitFor: 2000 },
  { name: "pool-detail", url: "/pools/pool-1", waitFor: 3000 },
  { name: "documents", url: "/documents", waitFor: 2000 },
  { name: "settings", url: "/settings", waitFor: 2000 },
  { name: "settings-passkeys", url: "/settings/passkeys", waitFor: 2000 },
];

async function captureScreenshots() {
  // Ensure output dir exists
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: RETINA_SCALE,
  });
  const page = await context.newPage();

  for (const screen of SCREENS) {
    console.log(`Capturing: ${screen.name}...`);
    try {
      await page.goto(`${BASE_URL}${screen.url}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(screen.waitFor ?? 2000);

      await page.screenshot({
        path: path.join(OUT_DIR, `${screen.name}.png`),
        fullPage: screen.fullPage ?? false,
      });
      console.log(`  -> saved ${screen.name}.png`);
    } catch (err) {
      console.error(`  -> FAILED: ${screen.name}`, err);
    }
  }

  await browser.close();
  console.log("\nAll screenshots captured.");
}

captureScreenshots().catch(console.error);
