import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { levels } from "../src/game/levels";
const route = (id: string) => `/#/exercise/${id}`;
async function point(page: Page, x: number, y: number) {
  return page
    .locator(".puzzle-svg")
    .evaluate(
      (el, p) =>
        new DOMPoint(p.x, p.y)
          .matrixTransform((el as unknown as SVGSVGElement).getScreenCTM()!)
          .toJSON(),
      { x, y },
    );
}
async function drag(
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  const a = await point(page, from.x, from.y),
    b = await point(page, to.x, to.y);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 8 });
  await page.mouse.up();
}
async function position(page: Page, id: string) {
  return page.locator(`[data-piece="${id}"] > g`).evaluate((el) => {
    const t = (el as unknown as SVGGElement).transform.baseVal.consolidate()!
      .matrix;
    return { x: t.e, y: t.f };
  });
}

test("lesson rules are a modal, then only canvas and tools remain", async ({
  page,
}) => {
  await page.goto("/");
  const intro = page.getByRole("dialog", {
    name: levels[0].title,
    exact: true,
  });
  await expect(intro).toBeVisible();
  await expect(
    intro.getByText(levels[0].objective, { exact: true }),
  ).toHaveCount(1);
  await expect(
    page.locator(".workspace-objective,.workspace-message-area,.onboarding"),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Start composing" }).click();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  const frame = await page.locator(".puzzle-svg").boundingBox();
  await page.getByRole("button", { name: "Show hint", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "A way to see it" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try it", exact: true }).click();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  expect(await page.locator(".puzzle-svg").boundingBox()).toEqual(frame);
  await expect(
    page.getByRole("button", { name: "Hide hint", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "About this principle" }).click();
  await expect(page.locator(".principle-sensei-highlight")).toBeVisible();
  await page.getByRole("button", { name: "Replay guidance" }).click();
  await expect(intro).toBeVisible();
});

test("outside tap, Escape, and close dismiss the blocking dialogue", async ({
  page,
}) => {
  await page.goto("/");
  await page.mouse.click(5, 5);
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await page.getByRole("button", { name: "Show hint", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Check composition", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Take another look." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Dismiss dialogue" }).click();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
});

test("all fifteen puzzles solve and milestones build only within the current run", async ({
  page,
}) => {
  await page.goto("/");
  for (const level of levels) {
    await expect(
      page.getByRole("dialog", { name: level.title, exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Start composing" }).click();
    for (const [id, target] of Object.entries(level.solution))
      await drag(page, await position(page, id), target);
    await page
      .getByRole("button", { name: "Check composition", exact: true })
      .click();
    const milestone =
      levels.indexOf(level) === 14
        ? "course"
        : (levels.indexOf(level) + 1) % 5 === 0
          ? "section"
          : "exercise";
    await expect(page.locator(`[data-milestone="${milestone}"]`)).toBeVisible();
    await page
      .getByRole("button", {
        name: milestone === "course" ? "Explore studies" : "Continue",
        exact: true,
      })
      .click();
  }
  await expect(page.locator(".chapter-progress")).toHaveText([
    "5 / 5 complete",
    "5 / 5 complete",
    "5 / 5 complete",
  ]);
  await page.reload();
  await page.getByRole("button", { name: "Start composing" }).click();
  await page.getByRole("button", { name: "Choose an exercise" }).click();
  await expect(page.locator(".chapter-progress")).toHaveText([
    "0 / 5 complete",
    "0 / 5 complete",
    "0 / 5 complete",
  ]);
});

test("old saved state is ignored; reload resets pieces and a root visit starts at lesson one", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem("kompo.progress.v1", '["alignment-1"]');
    localStorage.setItem("kompo.current.v1", '"rhythm-5"');
    localStorage.setItem(
      "kompo.learning.v1",
      '{"controls":["mouse"],"lessons":["alignment-1"]}',
    );
    localStorage.setItem(
      "kompo.draft.v1",
      '{"levelId":"alignment-1","positions":[{"id":"B","x":590,"y":300}]}',
    );
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem() {
          throw Error("Storage must not be read");
        },
        setItem() {
          throw Error("Storage must not be written");
        },
      },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page).toHaveURL(/alignment-1$/);
  await page.getByRole("button", { name: "Start composing" }).click();
  expect(await position(page, "B")).toEqual({ x: 510, y: 170 });
  await drag(page, { x: 510, y: 170 }, { x: 590, y: 300 });
  await page.reload();
  await page.getByRole("button", { name: "Start composing" }).click();
  expect(await position(page, "B")).toEqual({ x: 510, y: 170 });
  await page.goto(route("rhythm-3"));
  await expect(
    page.getByRole("dialog", {
      name: levels.find((l) => l.id === "rhythm-3")!.title,
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/");
  await expect(page).toHaveURL(/alignment-1$/);
  expect(errors).toEqual([]);
});

test("hint guides, keyboard nudging, reset, and correction remain usable", async ({
  page,
}) => {
  await page.goto(route("alignment-3"));
  await page.getByRole("button", { name: "Start composing" }).click();
  await page.getByRole("button", { name: "Show hint", exact: true }).click();
  await page.getByRole("button", { name: "Try it", exact: true }).click();
  await drag(page, { x: 390, y: 200 }, { x: 450, y: 355 });
  await drag(page, { x: 590, y: 270 }, { x: 650, y: 328 });
  await expect(page.locator('[data-edge="B"]')).toHaveClass("matched");
  await expect(page.locator('[data-edge="C"]')).toHaveClass("matched");
  await page.getByRole("button", { name: "Check composition" }).click();
  await expect(page.locator('[data-milestone="exercise"]')).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.getByRole("button", { name: /Piece B,/ }).focus();
  await page.keyboard.press("ArrowDown");
  expect((await position(page, "B")).y).toBe(203);
});

test("mobile thumb control still taps, holds, stops and suppresses native selection", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByRole("button", { name: "Start composing" }).tap();
  const target = await point(page, 510, 170);
  await page.touchscreen.tap(target.x, target.y);
  const start = await position(page, "B");
  await page.getByRole("button", { name: "Move right" }).tap();
  expect((await position(page, "B")).x).toBe(start.x + 3);
  const button = (await page
    .getByRole("button", { name: "Move down" })
    .boundingBox())!;
  await page.mouse.move(
    button.x + button.width / 2,
    button.y + button.height / 2,
  );
  await page.mouse.down();
  await page.waitForTimeout(550);
  await page.mouse.up();
  const end = await position(page, "B");
  expect(end.y).toBeGreaterThan(start.y + 10);
  await page.waitForTimeout(180);
  expect(await position(page, "B")).toEqual(end);
  expect(
    await page.locator(".thumb-controller").evaluate((e) => {
      const event = new Event("contextmenu", {
        bubbles: true,
        cancelable: true,
      });
      e.dispatchEvent(event);
      return event.defaultPrevented;
    }),
  ).toBe(true);
  await context.close();
});

test("mobile and landscape keep a full workspace after dismissing speech", async ({
  browser,
}) => {
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [844, 390],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto("/");
    const speech = (await page.locator(".sensei-speech").boundingBox())!;
    expect(speech.x).toBeGreaterThanOrEqual(0);
    expect(speech.x + speech.width).toBeLessThanOrEqual(width);
    await page.getByRole("button", { name: "Start composing" }).tap();
    const frame = (await page.locator(".puzzle-svg").boundingBox())!;
    expect(frame.height).toBeGreaterThan(150);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(page.getByRole("button", { name: "Move down" })).toBeVisible();
    await context.close();
  }
});

test("clicking or dragging a shape focuses it for arrow-key movement", async ({
  page,
}) => {
  await page.goto(route("alignment-3"));
  await page.getByRole("button", { name: "Start composing" }).click();
  const start = await position(page, "B");
  const target = await point(page, start.x, start.y);
  await page.mouse.click(target.x, target.y);
  const piece = page.getByRole("button", { name: /Piece B,/ });
  await expect(piece).toBeFocused();
  await expect(piece).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  expect(await position(page, "B")).toEqual({ x: start.x + 3, y: start.y + 3 });
  await page.keyboard.press("Shift+ArrowLeft");
  expect((await position(page, "B")).x).toBe(start.x - 7);
  await page.keyboard.press("Control+ArrowDown");
  expect((await position(page, "B")).y).toBe(start.y + 3);
  await drag(page, await position(page, "C"), { x: 600, y: 280 });
  await expect(page.getByRole("button", { name: /Piece C,/ })).toBeFocused();
  const c = await position(page, "C");
  await page.keyboard.press("ArrowDown");
  expect((await position(page, "C")).y).toBe(c.y + 3);
  expect(await position(page, "B")).toEqual({ x: start.x - 7, y: start.y + 3 });
  await page.getByRole("button", { name: "Reset", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("button", { name: "Show hint", exact: true }),
  ).toBeFocused();
  expect((await position(page, "C")).y).toBe(c.y + 3);
});
