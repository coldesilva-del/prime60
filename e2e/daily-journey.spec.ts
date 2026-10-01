import { expect, test } from "@playwright/test";

/**
 * Signed-in daily journey. Needs a verified, onboarded test account:
 *   E2E_EMAIL=... E2E_PASSWORD=... npx playwright test daily-journey
 * Create one with `npx tsx scripts/make-test-user.ts` and complete onboarding once.
 */
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.describe("daily journey", () => {
  test.skip(!email || !password, "E2E_EMAIL and E2E_PASSWORD are not set");

  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/(today|welcome)/);
  });

  test("Today shows the trajectory, commitments and the one thing", async ({ page }) => {
    await page.goto("/today");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Good (morning|afternoon|evening)/);
    await expect(page.getByText("Trajectory")).toBeVisible();
    await expect(page.getByRole("link", { name: "I'm stuck" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Quick actions" })).toBeVisible();
  });

  test("morning check-in saves the one thing", async ({ page }) => {
    await page.goto("/today/morning");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    const oneThing = `E2E one thing ${Date.now()}`;
    await page.getByPlaceholder("One thing, finished").fill(oneThing);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Start the day" }).click();
    await page.waitForURL(/\/today$/);
    await expect(page.getByText(oneThing)).toBeVisible();
  });

  test("evening check-in reveals a score with a breakdown", async ({ page }) => {
    await page.goto("/today/evening");
    const reveal = page.getByRole("button", { name: "Reveal today's score" });
    if (await reveal.isVisible()) {
      await reveal.click();
    }
    await expect(page.getByRole("button", { name: "Why this score" })).toBeVisible();
    await page.getByRole("button", { name: "Why this score" }).click();
    await expect(page.getByText("Every point, with its reason.")).toBeVisible();
  });

  test("quick pattern log takes two taps", async ({ page }) => {
    await page.goto("/today?log=pattern");
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Which pattern?")).toBeVisible();
    await dialog.getByRole("button").filter({ hasNotText: /All actions|More patterns/ }).first().click();
    await dialog.getByRole("button", { name: "Did the replacement" }).click();
    await expect(dialog.getByText("Logged.")).toBeVisible();
  });
});
