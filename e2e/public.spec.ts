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
    const controls = page.locator("input, button, a[href]");
    const count = await controls.count();
    for (let i = 0; i < count; i++) {
      const box = await controls.nth(i).boundingBox();
      if (!box) continue;
      // Inline text links in prose are exempt; form controls and buttons are not.
      const tag = await controls.nth(i).evaluate((el) => el.tagName.toLowerCase());
      if (tag === "a") continue;
      expect(box.height, `control ${i} (${tag}) height`).toBeGreaterThanOrEqual(44);
    }
  });
});
