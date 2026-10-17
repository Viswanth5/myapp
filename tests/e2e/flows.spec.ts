import { test, expect } from "@playwright/test";

test.describe("Orbit Student Life-OS Flows", () => {
  test("Flow 1: Conversational Brain Dump quick capture and confirm", async ({ page }) => {
    await page.goto("/");

    // Verify Brand & Hero Dashboard
    await expect(page.locator("text=Orbit")).toBeVisible();
    await expect(page.locator("text=Today Stack")).toBeVisible();

    // Trigger Brain dump capture bar
    const input = page.locator("input[placeholder*='DBMS assignment']");
    await expect(input).toBeVisible();
    await input.fill("CN socket programming due saturday, spent 120 on chai");
    await input.press("Enter");

    // Modal should appear with parsed items
    await expect(page.locator("text=Brain Dump Capture")).toBeVisible();
    await expect(page.locator("text=Confirm All")).toBeVisible();

    // Tap confirm all
    await page.locator("button:has-text('Confirm All')").click();

    // Verify modal closes
    await expect(page.locator("text=Brain Dump Capture")).not.toBeVisible();
  });

  test("Flow 2: Check off task and view money runway", async ({ page }) => {
    await page.goto("/");

    // Check off top task
    const checkBtn = page.locator("button[title='Mark done']").first();
    if (await checkBtn.isVisible()) {
      await checkBtn.click();
    }

    // Navigate to Money tab
    await page.locator("button:has-text('Money')").click();
    await expect(page.locator("text=Money Runway & Expenses")).toBeVisible();
    await expect(page.locator("text=Daily Safe-to-Spend")).toBeVisible();

    // Navigate to Habits tab
    await page.locator("button:has-text('Habits')").click();
    await expect(page.locator("text=Habits with Grace")).toBeVisible();
  });
});
