import { test, expect } from "@playwright/test";
test("all twenty poses animate once and settle", async ({ page }) => {
  await page.goto("/?sensei-gallery");
  await expect(page.locator(".sensei svg")).toHaveCount(20);
  await page.waitForTimeout(2600);
  const body = page.locator(
    '.sensei[data-pose="encouraging"] [data-part="body"]',
  );
  const settled = await body.getAttribute("style");
  await page.waitForTimeout(400);
  expect(await body.getAttribute("style")).toBe(settled);
  await page.getByRole("button", { name: "Replay reactions" }).click();
  await page.waitForTimeout(2600);
  expect(await body.getAttribute("style")).toBe(settled);
});
test("reduced motion is static and repeated corrections offer a hint", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".sensei svg")).not.toHaveAttribute(
    "style",
    /opacity|transform/,
  );
  await page.getByRole("button", { name: "Start composing" }).click();
  await page.getByRole("button", { name: "Check composition" }).click();
  await expect(page.locator(".sensei-modal .sensei")).toHaveAttribute(
    "data-pose",
    "patient",
  );
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page.getByRole("button", { name: "Check composition" }).click();
  await expect(page.locator(".sensei-modal .sensei")).toHaveAttribute(
    "data-pose",
    "compassionate",
  );
  await page.getByRole("button", { name: "Show me a hint" }).click();
  await expect(page.locator(".sensei-modal .sensei")).toHaveAttribute(
    "data-pose",
    "thoughtful",
  );
});
test("quiet help waits for a clear canvas and appears only once", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.clock.fastForward(61000);
  await expect(page.getByRole("dialog", { name: "Want a clue?" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Start composing" }).click();
  await page.clock.fastForward(45000);
  await page.keyboard.press("Tab");
  await page.clock.fastForward(45000);
  await expect(page.getByRole("dialog", { name: "Want a clue?" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "About this principle" }).click();
  await page.clock.fastForward(61000);
  await expect(page.getByRole("dialog", { name: "Want a clue?" })).toHaveCount(
    0,
  );
  await page.keyboard.press("Escape");
  await page.clock.fastForward(61000);
  await expect(
    page.getByRole("dialog", { name: "Want a clue?" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.clock.fastForward(120000);
  await expect(page.locator("dialog[open]")).toHaveCount(0);
});
