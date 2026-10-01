import { expect, test } from "@playwright/test";

test.describe("public pages", () => {
  test("landing shows the tagline and both actions", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Build the man.");
    await expect(page.getByRole("link", { name: "Create your account" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  });

  test("sign-up validates before submitting", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Tell us your first name.")).toBeVisible();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(page.getByText("You need to accept the terms to continue.")).toBeVisible();
  });

  test("protected routes redirect to sign-in", async ({ page }) => {
    await page.goto("/today");
    await expect(page).toHaveURL(/\/sign-in\?next=%2Ftoday/);
  });

  test("every control on the sign-in form is at least 44px tall", async ({ page }) => {
    await page.goto("/sign-in");
    // Scoped to the form so the Next.js dev overlay button is not measured.
    const controls = page.locator("form").locator("input, button");
    const count = await controls.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const box = await controls.nth(i).boundingBox();
      if (!box) continue;
      expect(box.height, `control ${i} height`).toBeGreaterThanOrEqual(44);
    }
  });
});
