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

test("opens directly in a full-height workspace and learns through actions", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("region", { name: "Interactive composition canvas" }),
  ).toBeVisible();
  await expect(page).toHaveURL(/#\/exercise\/alignment-1$/);
  await expect(page.locator(".home")).toHaveCount(0);
  await expect(page.locator(".onboarding")).toHaveAttribute(
    "data-step",
    "select",
  );
  const b = await point(page, 510, 170);
  await page.mouse.move(b.x, b.y);
  await page.mouse.down();
  await expect(page.locator(".onboarding")).toHaveAttribute(
    "data-step",
    "move",
  );
  const end = await point(page, 590, 300);
  await page.mouse.move(end.x, end.y, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator(".onboarding")).toHaveAttribute(
    "data-step",
    "check",
  );
  await page.getByRole("button", { name: "Check composition" }).click();
  await expect(page.getByText("RELATIONSHIP FOUND")).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("kompo.learning.v1")!),
    ),
  ).toMatchObject({ controls: ["mouse"], lessons: ["alignment-1"] });
  await page.getByRole("button", { name: "Dismiss canvas message" }).click();
  await page.getByRole("button", { name: "Next exercise" }).click();
  await expect(page).toHaveURL(/alignment-2$/);
  await expect(page.locator(".onboarding")).toHaveAttribute(
    "data-step",
    "check",
  );
  expect(errors).toEqual([]);
});

test("skip guidance does not complete a puzzle, and guidance can be replayed", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Skip guidance" }).click();
  await expect(page.locator(".onboarding")).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("kompo.progress.v1")),
  ).toBeNull();
  await page.reload();
  await expect(page.locator(".onboarding")).toHaveCount(0);
  await page.getByRole("button", { name: "About this principle" }).click();
  await expect(page.getByRole("dialog", { name: "Alignment" })).toBeVisible();
  await page.getByLabel(/Move the slider/).fill("100");
  await page
    .getByRole("dialog", { name: "Alignment" })
    .getByRole("button", { name: "Replay guidance" })
    .click();
  await expect(page.locator(".onboarding")).toHaveAttribute(
    "data-step",
    "select",
  );
  await page.getByRole("button", { name: "Choose an exercise" }).click();
  await expect(page.getByRole("dialog", { name: "Studies" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("hash navigation, browser Back, refresh and root resume preserve context and drafts", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Skip guidance" }).click();
  await drag(page, { x: 510, y: 170 }, { x: 540, y: 220 });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("kompo.draft.v1") ?? "null")
            ?.positions[0].x,
      ),
    )
    .toBeCloseTo(540, 0);
  await page.reload();
  await expect
    .poll(() => position(page, "B").then((p) => p.x))
    .toBeCloseTo(540, 0);
  await page.getByRole("button", { name: "Choose an exercise" }).click();
  await page.getByRole("button", { name: /03 Different forms/ }).click();
  await expect(page).toHaveURL(/alignment-3$/);
  await page.goBack();
  await expect(page).toHaveURL(/alignment-1$/);
  await page.goForward();
  await expect(page).toHaveURL(/alignment-3$/);
  await page.goto("/");
  await expect(page).toHaveURL(/alignment-3$/);
  await page.goto("/#/exercise/bad-99");
  await expect(page).toHaveURL(/alignment-3$/);
});

test("all fifteen exercises remain solvable with pointer dragging", async ({
  page,
}) => {
  await page.goto("/");
  for (const l of levels) {
    await page.evaluate((id) => {
      location.hash = `/exercise/${id}`;
    }, l.id);
    await expect(page.locator(".workspace-objective h1")).toHaveText(l.title);
    for (const [id, target] of Object.entries(l.solution)) {
      const start = await position(page, id);
      await drag(page, start, target);
    }
    await page.getByRole("button", { name: "Check composition" }).click();
    await expect(page.getByText("RELATIONSHIP FOUND")).toBeVisible();
  }
  await page.getByRole("button", { name: "All studies", exact: true }).click();
  await expect(page.locator(".chapter-progress")).toHaveText([
    "5 / 5 complete",
    "5 / 5 complete",
    "5 / 5 complete",
  ]);
});

test("hint snapping, bottom edges, keyboard nudging and reset remain usable", async ({
  page,
}) => {
  await page.goto(route("alignment-3"));
  await page.getByRole("button", { name: "Show hint" }).click();
  await drag(page, { x: 390, y: 200 }, { x: 450, y: 355 });
  await drag(page, { x: 590, y: 270 }, { x: 650, y: 328 });
  await expect(page.locator('[data-edge="B"]')).toHaveClass("matched");
  await expect(page.locator('[data-edge="C"]')).toHaveClass("matched");
  await page.getByRole("button", { name: "Check composition" }).click();
  await expect(page.getByText("RELATIONSHIP FOUND")).toBeVisible();
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.getByRole("button", { name: /Piece B,/ }).focus();
  await page.keyboard.press("ArrowDown");
  expect((await position(page, "B")).y).toBe(203);
  await page.getByRole("button", { name: "Check composition" }).click();
  await expect(page.getByText("LOOK AGAIN")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".feedback")).toHaveCount(0);
});

test("touch selects without dragging, and the pad taps, holds and stops", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(test.info().project.use.baseURL + route("alignment-1"));
  await expect(page.getByRole("button", { name: "Move right" })).toBeDisabled();
  const cdp = await context.newCDPSession(page);
  const a = await point(page, 510, 170),
    b = await point(page, 590, 300);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: a.x, y: a.y }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: b.x, y: b.y }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect(await position(page, "B")).toEqual({ x: 510, y: 170 });
  await expect(page.locator(".onboarding")).toHaveAttribute(
    "data-step",
    "move",
  );
  await expect(page.getByRole("button", { name: "Move right" })).toBeEnabled();
  await page.getByRole("button", { name: "Move right" }).tap();
  expect((await position(page, "B")).x).toBe(513);
  await expect(page.locator(".onboarding")).toHaveAttribute(
    "data-step",
    "check",
  );
  const button = (await page
    .getByRole("button", { name: "Move right" })
    .boundingBox())!;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: button.x + button.width / 2, y: button.y + button.height / 2 },
    ],
  });
  await expect
    .poll(() => position(page, "B").then((p) => p.x))
    .toBeGreaterThan(545);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  const stopped = await position(page, "B");
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let n = 0;
        const tick = () => {
          if (++n >= 10) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
  expect(await position(page, "B")).toEqual(stopped);
  await page.getByRole("button", { name: "Move down" }).focus();
  await page.keyboard.press("Space");
  expect((await position(page, "B")).y).toBe(173);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <= innerWidth &&
        document.documentElement.scrollHeight <= innerHeight + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/kompo-touch-workspace.png",
    fullPage: true,
  });
  await context.close();
});

test("holding respects bounds and stops on blur, cancellation and navigation", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(test.info().project.use.baseURL + route("alignment-1"));
  const cdp = await context.newCDPSession(page);
  const a = await point(page, 510, 170);
  await page.touchscreen.tap(a.x, a.y);
  async function start(name: string) {
    const r = (await page.getByRole("button", { name }).boundingBox())!;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: r.x + r.width / 2, y: r.y + r.height / 2 }],
    });
  }
  await start("Move right");
  await expect
    .poll(() => position(page, "B").then((p) => p.x), { timeout: 6000 })
    .toBe(748);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchCancel",
    touchPoints: [],
  });
  await start("Move left");
  await expect
    .poll(() => position(page, "B").then((p) => p.x))
    .toBeLessThan(720);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  const stopped = await position(page, "B");
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.evaluate(() => new Promise<void>((r) => setTimeout(r, 150)));
  expect(await position(page, "B")).toEqual(stopped);
  await start("Move down");
  await page.evaluate(() => {
    location.hash = "/exercise/alignment-2";
  });
  await expect(page.locator(".workspace-objective h1")).toHaveText(
    "A central axis",
  );
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.getByRole("button", { name: "Move down" })).toBeDisabled();
  expect(errors).toEqual([]);
  await context.close();
});

test("workspace and bounded frames fit desktop, portrait and landscape", async ({
  browser,
  page,
}) => {
  await page.goto("/");
  await page.screenshot({
    path: "test-results/kompo-workspace.png",
    fullPage: true,
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const mobile = await context.newPage();
  await mobile.goto(test.info().project.use.baseURL + route("alignment-2"));
  for (const size of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await mobile.setViewportSize(size);
    const box = (await mobile.locator(".puzzle-svg").boundingBox())!;
    expect(box.width / box.height).toBeCloseTo(1, 2);
    expect(box.width).toBeGreaterThan(100);
    expect(
      await mobile.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          document.documentElement.scrollHeight <= innerHeight + 1,
      ),
    ).toBe(true);
    await expect(
      mobile.getByRole("button", { name: "Move down" }),
    ).toBeVisible();
    await mobile.screenshot({
      path: `test-results/kompo-layout-${size.width}.png`,
      fullPage: false,
    });
  }
  await context.close();
});

test("touch hints snap on release without trapping a held movement", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(test.info().project.use.baseURL + route("alignment-1"));
  const p = await point(page, 510, 170);
  await page.touchscreen.tap(p.x, p.y);
  await page.getByRole("button", { name: "Show hint" }).tap();
  await page.getByRole("button", { name: /Piece B,/ }).focus();
  for (let i = 0; i < 8; i++) await page.keyboard.press("Shift+ArrowRight");
  for (let i = 0; i < 13; i++) await page.keyboard.press("Shift+ArrowDown");
  expect(await position(page, "B")).toEqual({ x: 590, y: 300 });
  await page.getByRole("button", { name: "Move right" }).tap();
  expect((await position(page, "B")).x).toBe(593);
  await page.getByRole("button", { name: "Move left" }).tap();
  expect((await position(page, "B")).x).toBe(590);
  const cdp = await context.newCDPSession(page);
  const r = (await page
    .getByRole("button", { name: "Move right" })
    .boundingBox())!;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: r.x + r.width / 2, y: r.y + r.height / 2 }],
  });
  await expect
    .poll(() => position(page, "B").then((p) => p.x))
    .toBeGreaterThan(625);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect((await position(page, "B")).x).toBeGreaterThan(625);
  await context.close();
});

test("learned mouse controls do not suppress new touch onboarding", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await context.addInitScript(() =>
    localStorage.setItem(
      "kompo.learning.v1",
      JSON.stringify({ controls: ["mouse"], lessons: ["alignment-1"] }),
    ),
  );
  const page = await context.newPage();
  await page.goto(test.info().project.use.baseURL + "/");
  await expect(page.locator(".onboarding")).toHaveAttribute(
    "data-step",
    "select",
  );
  const p = await point(page, 510, 170);
  await page.touchscreen.tap(p.x, p.y);
  await expect(page.locator(".onboarding")).toHaveAttribute(
    "data-step",
    "move",
  );
  await context.close();
});

test("blocked storage does not prevent the first exercise from working", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem() {
          throw new Error("blocked");
        },
        setItem() {
          throw new Error("blocked");
        },
      },
    }),
  );
  await page.goto("/");
  await expect(page.locator(".workspace-objective h1")).toHaveText(
    "A common ground",
  );
  await page.getByRole("button", { name: "Skip guidance" }).click();
  await drag(page, { x: 510, y: 170 }, { x: 590, y: 300 });
  await page.getByRole("button", { name: "Check composition" }).click();
  await expect(page.getByText("RELATIONSHIP FOUND")).toBeVisible();
  await expect(
    page.getByText("Progress is available for this session."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next exercise" }).click();
  await expect(page).toHaveURL(/alignment-2$/);
});

test("one floating tool panel owns every action and status is anchored at the bottom center", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.getByRole("button", { name: "Skip guidance" }).click();
  const tools = page.getByRole("toolbar", { name: "Canvas controls" });
  await expect(tools).toHaveCount(1);
  await expect(tools).toHaveAttribute("aria-orientation", "horizontal");
  await expect(tools.getByRole("button")).toHaveCount(4);
  for (const name of [
    "Reset",
    "Show hint",
    "About this principle",
    "Check composition",
  ])
    await expect(
      tools.getByRole("button", { name, exact: true }),
    ).toBeVisible();
  await expect(
    page.locator(
      ".workspace-header,.workspace-deck,.canvas-top,.canvas-bottom",
    ),
  ).toHaveCount(0);
  const menu = (await page
    .getByRole("button", { name: "Choose an exercise" })
    .boundingBox())!;
  const toolbar = (await tools.boundingBox())!;
  expect(menu.x).toBeLessThan(24);
  expect(menu.y).toBeLessThan(24);
  expect(Math.abs(toolbar.x + toolbar.width / 2 - 640)).toBeLessThan(1);
  expect(toolbar.y).toBeLessThan(24);
  const before = (await page.locator(".puzzle-svg").boundingBox())!;
  await tools.getByRole("button", { name: "Check composition" }).click();
  await expect(page.getByText("LOOK AGAIN")).toBeVisible();
  const notice = (await page.locator(".workspace-message-area").boundingBox())!;
  expect(Math.abs(notice.x + notice.width / 2 - 640)).toBeLessThan(1);
  expect(notice.y + notice.height).toBeCloseTo(884, 0);
  expect(notice.y).toBeGreaterThanOrEqual(before.y + before.height);
  expect(await page.locator(".puzzle-svg").boundingBox()).toEqual(before);
  await page.screenshot({
    path: "test-results/kompo-floating-desktop.png",
    fullPage: false,
  });
  await page.getByRole("button", { name: "Dismiss canvas message" }).click();
  await expect(page.locator(".workspace-message-area")).toHaveCount(0);
  await tools.getByRole("button", { name: "Reset", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(tools.getByRole("button", { name: "Show hint" })).toBeFocused();
  await tools.getByRole("button", { name: "About this principle" }).click();
  await expect(page.getByRole("dialog", { name: "Alignment" })).toBeVisible();
  await expect(page.locator(".control-reference")).toContainText("stay fixed");
});

test("mobile toolbar stays on the upper edge and keeps the artwork width available", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(test.info().project.use.baseURL + "/");
  await page.getByRole("button", { name: "Skip guidance" }).tap();
  const tools = page.getByRole("toolbar", { name: "Canvas controls" });
  await expect(tools).toHaveAttribute("aria-orientation", "horizontal");
  const rail = (await tools.boundingBox())!;
  const frame = (await page.locator(".puzzle-svg").boundingBox())!;
  expect(rail.y).toBe(12);
  expect(rail.width).toBeGreaterThan(180);
  expect(rail.height).toBeLessThan(60);
  expect(frame.width).toBeGreaterThan(350);
  const menu = (await page
    .getByRole("button", { name: "Choose an exercise" })
    .boundingBox())!;
  expect(rail.x).toBeGreaterThanOrEqual(menu.x + menu.width + 8);
  const action = tools.getByRole("button", { name: "Check composition" });
  await expect(
    action.locator('[data-icon="check_circle_outline"]'),
  ).toBeVisible();
  expect(
    await action.evaluate((el) =>
      [...el.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent)
        .join("")
        .trim(),
    ),
  ).toBe("");
  await tools.getByRole("button", { name: "Check composition" }).tap();
  await expect(page.getByText("LOOK AGAIN")).toBeVisible();
  const popup = (await page.locator(".workspace-message-area").boundingBox())!;
  const pad = (await page.locator(".thumb-controller").boundingBox())!;
  expect(popup.x + popup.width + 12).toBeLessThanOrEqual(pad.x);
  expect(popup.y + popup.height).toBeCloseTo(832, 0);
  expect(popup.y).toBeGreaterThanOrEqual(frame.y + frame.height);
  expect(pad.y).toBeGreaterThanOrEqual(frame.y + frame.height);
  expect(await page.locator(".puzzle-svg").boundingBox()).toEqual(frame);
  await page.screenshot({
    path: "test-results/kompo-floating-mobile.png",
    fullPage: false,
  });
  await tools.getByRole("button", { name: "Reset", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(tools.getByRole("button", { name: "Show hint" })).toBeFocused();
  await context.close();
});

test("controller suppresses native long-press editing without disabling lesson text selection", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(test.info().project.use.baseURL + "/");
  const suppressed = await page.locator(".thumb-controller").evaluate((el) => {
    const button = el.querySelector("button")!;
    return {
      touch: !button.dispatchEvent(
        new Event("touchstart", { bubbles: true, cancelable: true }),
      ),
      selection: !el.dispatchEvent(
        new Event("selectstart", { bubbles: true, cancelable: true }),
      ),
      context: !el.dispatchEvent(
        new MouseEvent("contextmenu", { bubbles: true, cancelable: true }),
      ),
      drag: !el.dispatchEvent(
        new Event("dragstart", { bubbles: true, cancelable: true }),
      ),
      styles: [el, ...el.querySelectorAll("*")].every(
        (node) =>
          getComputedStyle(node).getPropertyValue("-webkit-user-select") ===
          "none",
      ),
    };
  });
  expect(suppressed).toEqual({
    touch: true,
    selection: true,
    context: true,
    drag: true,
    styles: true,
  });
  expect(
    await page
      .locator(".objective")
      .evaluate((el) =>
        getComputedStyle(el).getPropertyValue("-webkit-user-select"),
      ),
  ).not.toBe("none");
  for (const width of [320, 360, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const menu = (await page
      .getByRole("button", { name: "Choose an exercise" })
      .boundingBox())!;
    const toolbar = (await page
      .getByRole("toolbar", { name: "Canvas controls" })
      .boundingBox())!;
    expect(menu.x + menu.width + 4).toBeLessThanOrEqual(toolbar.x);
    expect(toolbar.x + toolbar.width).toBeLessThanOrEqual(width);
  }
  await context.close();
});
