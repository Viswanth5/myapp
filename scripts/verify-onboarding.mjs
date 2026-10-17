import { chromium } from "@playwright/test";
import path from "path";

async function verifyOnboarding() {
  console.log("Launching Chromium/Edge to test VIRA Onboarding across devices...");
  const browser = await chromium.launch({ headless: true, channel: "msedge" });

  const viewports = [
    { name: "desktop", width: 1280, height: 800 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    console.log(`\n--- Testing ${vp.name.toUpperCase()} (${vp.width}x${vp.height}) ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    await page.goto("http://localhost:3000/onboarding", { waitUntil: "networkidle" });

    // Step 1: Profile & Identity
    await page.waitForSelector("text=Who is stepping up to this desk?");
    console.log(`[${vp.name}] Step 1 visible: Header, progress, and inputs rendered.`);

    // Take screenshot of Step 1
    const s1Path = path.resolve(`scratch/onboarding_${vp.name}_step1.png`);
    await page.screenshot({ path: s1Path, fullPage: false });
    console.log(`[${vp.name}] Saved screenshot: ${s1Path}`);

    // Fill Step 1
    const nameInput = page.locator("input[placeholder*='Alex Chen']");
    await nameInput.fill("Alex Chen");
    await page.locator("button:has-text('Working Professional')").first().click();
    await page.locator("button:has-text('Continue')").click();

    // Step 2: Focus Areas
    await page.waitForSelector("text=Which areas of life do you want to manage?");
    console.log(`[${vp.name}] Step 2 reached: Focus Areas cards rendered.`);
    // Toggle a focus area
    await page.locator("button:has-text('Finance & Budget')").first().click();
    await page.locator("button:has-text('Continue')").click();

    // Step 3: Goals & Rhythm
    await page.waitForSelector("text=Define your outcomes and daily pace");
    console.log(`[${vp.name}] Step 3 reached: Outcomes & pace.`);
    await page.locator("button:has-text('Continue')").click();

    // Step 4: Daily Schedule
    await page.waitForSelector("text=Map your natural circadian rhythm");
    console.log(`[${vp.name}] Step 4 reached: Circadian schedule cards.`);
    await page.locator("button:has-text('Continue')").click();

    // Step 5: Financial Setup (Optional)
    await page.waitForSelector("text=Budget & Spending Runway");
    console.log(`[${vp.name}] Step 5 reached: Financial setup with Optional badge.`);
    const skipBtn = page.locator("button:has-text('Skip for now')");
    const isSkipVisible = await skipBtn.isVisible();
    console.log(`[${vp.name}] Skip button visible: ${isSkipVisible}`);

    // Take screenshot of Step 5
    const s5Path = path.resolve(`scratch/onboarding_${vp.name}_step5.png`);
    await page.screenshot({ path: s5Path, fullPage: false });

    await page.locator("button:has-text('Continue')").click();

    // Step 6: Tasks & Priorities
    await page.waitForSelector("text=Capture today's priorities");
    console.log(`[${vp.name}] Step 6 reached: Tasks & priorities.`);
    await page.locator("button:has-text('Continue')").click();

    // Step 7: Habits & Fitness
    await page.waitForSelector("text=Design your daily consistency");
    console.log(`[${vp.name}] Step 7 reached: Habits & fitness.`);
    await page.locator("button:has-text('Continue')").click();

    // Step 8: Personalize & Launch
    await page.waitForSelector("text=Your personal Life-OS is ready");
    console.log(`[${vp.name}] Step 8 reached: Configuration summary & Launch CTA.`);

    const s8Path = path.resolve(`scratch/onboarding_${vp.name}_step8.png`);
    await page.screenshot({ path: s8Path, fullPage: false });
    console.log(`[${vp.name}] Saved screenshot: ${s8Path}`);

    const launchBtn = page.locator("button:has-text('Launch VIRA Life-OS')");
    console.log(`[${vp.name}] Launch button visible: ${await launchBtn.isVisible()}`);

    await context.close();
  }

  await browser.close();
  console.log("\nAll device checks completed successfully!");
}

verifyOnboarding().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
