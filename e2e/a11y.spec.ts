import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** Every public page passes axe's WCAG 2.1 A and AA rules in both colour schemes. */
const PAGES = ["/", "/letter", "/scorecard", "/sign-in", "/sign-up", "/install", "/privacy", "/terms", "/this-page-does-not-exist"];

for (const path of PAGES) {
  for (const scheme of ["light", "dark"] as const) {
    test(`${path} has no accessibility violations in ${scheme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const summary = results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)\n  ${v.nodes.map((n) => n.target.join(" ")).join("\n  ")}`);
      expect(summary, summary.join("\n")).toEqual([]);
    });
  }
}
