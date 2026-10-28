import { test, expect } from "@playwright/test";
import { levels } from "../src/game/levels";

test("chapter lesson, mouse drag, failure, success, persistence and reset", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Learn to see. Learn to arrange." }),
  ).toBeVisible();
  await page.getByRole("button", { name: /01.*Alignment/ }).click();
  await page.getByLabel(/Move the slider/).fill("100");
  await page.getByRole("button", { name: "Start the study" }).click();
  await page.getByRole("button", { name: "Check composition" }).click();
  await expect(page.getByText("LOOK AGAIN")).toBeVisible();
  await page.getByRole("button", { name: "Show hint" }).click();
  await expect(page.locator(".guides")).toBeVisible();
  const svg = page.locator(".puzzle-svg");
  const box = (await svg.boundingBox())!;
  const x = box.x + (510 / 800) * box.width;
  const y = box.y + (170 / 600) * box.height;
  await page.mouse.move(x + 5, y + 4);
  await page.mouse.down();
  await page.mouse.move(
    box.x + (590 / 800) * box.width + 5,
    box.y + (300 / 600) * box.height + 4,
    {
      steps: 12,
    },
  );
  await page.mouse.up();
  await page.getByRole("button", { name: "Check composition" }).click();
  await expect(page.getByText("RELATIONSHIP FOUND")).toBeVisible();
  await page.reload();
  await expect(page.locator(".chapter-progress").first()).toContainText(
    "1 OF 5 COMPLETE",
  );
  await page.getByRole("button", { name: /01.*Alignment/ }).click();
  await page.getByRole("button", { name: "01 A common ground" }).click();
  const piece = page.getByRole("button", { name: /Piece B,/ });
  await piece.focus();
  await page.keyboard.press("ArrowDown");
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.locator('[data-piece="B"] > g')).toHaveAttribute(
    "transform",
    "translate(510 170) rotate(0)",
  );
  expect(errors).toEqual([]);
});

test("all levels can be solved through the rendered canvas and advance", async ({
  page,
}) => {
  await page.goto("/?debug=true");
  await page.getByText("Developer tools", { exact: true }).click();
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    await page.getByLabel("Jump to exercise").selectOption(String(i));
    for (const [id, target] of Object.entries(level.solution)) {
      const shape = level.shapes.find((s) => s.id === id)!;
      const box = (await page.locator(".puzzle-svg").boundingBox())!;
      await page.mouse.move(
        box.x + (shape.x / level.frame.width) * box.width,
        box.y + (shape.y / level.frame.height) * box.height,
      );
      await page.mouse.down();
      await page.mouse.move(
        box.x + (target.x / level.frame.width) * box.width,
        box.y + (target.y / level.frame.height) * box.height,
        { steps: 6 },
      );
      await page.mouse.up();
    }
    await page.getByRole("button", { name: "Check composition" }).click();
    await expect(page.getByText("RELATIONSHIP FOUND")).toBeVisible();
  }
  await page.getByRole("button", { name: "Finish the studies" }).click();
  await expect(page.locator(".chapter-progress")).toContainText([
    "5 OF 5 COMPLETE",
    "5 OF 5 COMPLETE",
    "5 OF 5 COMPLETE",
  ]);
  await expect(
    page.getByRole("heading", { name: "Learn to see. Learn to arrange." }),
  ).toBeVisible();
});

test("mobile touch drag, bounds and layout", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:5173");
  await page.getByRole("button", { name: "Begin exploring" }).click();
  await page.getByRole("button", { name: "Start the study" }).click();
  const svg = page.locator(".puzzle-svg");
  await svg.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  const points = await svg.evaluate((el) => {
    const m = (el as unknown as SVGSVGElement).getScreenCTM()!;
    return {
      start: new DOMPoint(510, 170).matrixTransform(m).toJSON(),
      end: new DOMPoint(590, 300).matrixTransform(m).toJSON(),
    };
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: points.start.x, y: points.start.y }],
  });
  for (let i = 1; i <= 10; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: points.start.x + ((points.end.x - points.start.x) * i) / 10,
          y: points.start.y + ((points.end.y - points.start.y) * i) / 10,
        },
      ],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.getByRole("button", { name: "Check composition" }).click();
  await expect(page.getByText("RELATIONSHIP FOUND")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await context.close();
});

test("responsive views, chapter transition and visual review captures", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("/?debug=true");
  await page.screenshot({
    path: "test-results/kompo-home.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /02.*Repetition/ }).click();
  await page.screenshot({
    path: "test-results/kompo-lesson.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Start the study" }).click();
  await page.screenshot({
    path: "test-results/kompo-game.png",
    fullPage: true,
  });
  await page.getByText("Developer tools", { exact: true }).click();
  await page.getByLabel("Jump to exercise").selectOption("4");
  await page.getByRole("button", { name: "Complete / bypass" }).click();
  await page.getByRole("button", { name: "Next study" }).click();
  await expect(
    page.getByRole("heading", { name: "Repetition." }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Start the study" }).click();
  await page.screenshot({
    path: "test-results/kompo-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Clear progress" }).click();
  await page.getByRole("button", { name: "KOMPO home" }).click();
  await expect(page.locator(".chapter-progress")).toContainText([
    "0 OF 5 COMPLETE",
    "0 OF 5 COMPLETE",
    "0 OF 5 COMPLETE",
  ]);
});

test("frame aspect ratio survives resizing and dragging stays contained", async ({
  page,
}) => {
  await page.goto("/?debug=true");
  await page.getByText("Developer tools", { exact: true }).click();
  for (const index of [0, 1, 5]) {
    await page.getByLabel("Jump to exercise").selectOption(String(index));
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const box = (await page.locator(".puzzle-svg").boundingBox())!;
      expect(box.width / box.height).toBeCloseTo(
        levels[index].frame.width / levels[index].frame.height,
        2,
      );
    }
  }
  await page.getByLabel("Jump to exercise").selectOption("1");
  await page.evaluate(() => document.fonts.ready);
  const svg = page.locator(".puzzle-svg");
  const points = await svg.evaluate((el) => {
    const m = (el as unknown as SVGSVGElement).getScreenCTM()!;
    return {
      start: new DOMPoint(180, 110).matrixTransform(m).toJSON(),
      end: new DOMPoint(-100, -100).matrixTransform(m).toJSON(),
    };
  });
  await page.mouse.move(points.start.x, points.start.y);
  await page.mouse.down();
  await page.mouse.move(points.end.x, points.end.y, { steps: 5 });
  await page.mouse.up();
  await expect(page.locator('[data-piece="A"] > g')).toHaveAttribute(
    "transform",
    "translate(62 24) rotate(0)",
  );
  await page.screenshot({
    path: "test-results/kompo-square-frame.png",
    fullPage: true,
  });
});

test("third alignment level explains the bottom edge and can be completed with hints", async ({
  page,
}) => {
  await page.goto("/?debug=true");
  await page.getByText("Developer tools", { exact: true }).click();
  await page.getByLabel("Jump to exercise").selectOption("2");
  await page.getByRole("button", { name: "Show hint" }).click();
  await expect(
    page.locator('[data-target="B"] .target-outline ellipse'),
  ).toBeVisible();
  await expect(
    page.locator('[data-target="C"] .target-outline polygon'),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  async function drag(
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) {
    const p = await page.locator(".puzzle-svg").evaluate(
      (el, pts) => {
        const m = (el as unknown as SVGSVGElement).getScreenCTM()!;
        return pts.map((p) =>
          new DOMPoint(p.x, p.y).matrixTransform(m).toJSON(),
        );
      },
      [from, to],
    );
    await page.mouse.move(p[0].x, p[0].y);
    await page.mouse.down();
    await page.mouse.move(p[1].x, p[1].y, { steps: 8 });
    await page.mouse.up();
  }
  await drag({ x: 390, y: 200 }, { x: 450, y: 355 });
  await expect(page.locator('[data-piece="B"] > g')).toHaveAttribute(
    "transform",
    /translate\([^ ]+ 348\)/,
  );
  await expect(page.locator('[data-edge="B"]')).toHaveClass("matched");
  await drag({ x: 590, y: 270 }, { x: 650, y: 328 });
  await expect(page.locator('[data-edge="C"]')).toHaveClass("matched");
  await page.screenshot({
    path: "test-results/kompo-baseline-hint.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Check composition" }).click();
  await expect(page.getByText("RELATIONSHIP FOUND")).toBeVisible();
});

test("spacing hints show interval brackets and use visual instructions", async ({
  page,
}) => {
  await page.goto("/?debug=true");
  await page.getByText("Developer tools", { exact: true }).click();
  for (const index of ["6", "11", "13"]) {
    await page.getByLabel("Jump to exercise").selectOption(index);
    await page.getByRole("button", { name: "Show hint" }).click();
    await expect(page.locator(".interval-guide").first()).toBeVisible();
    await expect(page.locator(".objective")).not.toContainText(/units|\d{2,}/);
    await expect(page.locator(".hint")).not.toContainText(/units|[xy] =/);
  }
  await page.screenshot({
    path: "test-results/kompo-spacing-hint.png",
    fullPage: true,
  });
});

test("readable interface contrast and local Material icons", async ({
  page,
}) => {
  await page.goto("/?debug=true");
  async function checkContrast(selectors: string[], canvas = false) {
    const results = await page
      .locator(selectors.join(","))
      .evaluateAll((elements, canvas) => {
        const rgb = (value: string) => value.match(/[\d.]+/g)!.map(Number);
        const luminance = (color: number[]) =>
          color
            .slice(0, 3)
            .map((v) => v / 255)
            .map((v) =>
              v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
            )
            .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
        return elements
          .filter((el) => el.getBoundingClientRect().width > 0)
          .map((el) => {
            const style = getComputedStyle(el);
            let parent: Element | null = el;
            let background = "";
            while (parent) {
              const value = getComputedStyle(parent).backgroundColor;
              if (rgb(value)[3] !== 0) {
                background = value;
                break;
              }
              parent = parent.parentElement;
            }
            if (canvas)
              background = getComputedStyle(
                document.documentElement,
              ).getPropertyValue("--canvas-paper");
            // The frame's paper is deliberately stable across UI themes.
            if (background.startsWith("#")) {
              const h = background.trim();
              background = `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`;
            }
            const foreground = canvas ? style.fill : style.color;
            const a = luminance(rgb(foreground));
            const b = luminance(rgb(background));
            return {
              label: el.textContent?.trim(),
              ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
            };
          });
      }, canvas);
    expect(results.length).toBeGreaterThan(0);
    for (const result of results)
      expect(result.ratio, `${result.label} contrast`).toBeGreaterThanOrEqual(
        4.5,
      );
  }
  await checkContrast([
    ".intro-copy",
    ".chapter-card p",
    ".chapter-progress",
    "footer",
    ".primary",
  ]);
  const primary = page.getByRole("button", { name: "Begin exploring" });
  await expect(primary.locator("svg")).toHaveCount(0);
  await primary.hover();
  await checkContrast([".primary"]);
  await primary.click();
  await checkContrast([".lesson-copy", ".quiet", ".slider-label", ".primary"]);
  await page.getByRole("button", { name: "Start the study" }).click();
  await page.getByRole("button", { name: "Show hint" }).click();
  await checkContrast([
    ".instructions",
    ".canvas-bottom",
    ".canvas-status",
    ".exercise-number span",
    ".hint",
    ".hint-instructions",
    ".keyboard-tip",
  ]);
  await expect(page.locator(".hint")).toHaveCSS("opacity", "1");
  await checkContrast([".hint-target text", ".frame-guide text"], true);
  await expect(
    page
      .getByRole("button", { name: "Reset", exact: true })
      .locator('[data-icon="replay"]'),
  ).toBeVisible();
  for (const theme of ["dark", "light"]) {
    await page
      .locator("html")
      .evaluate((el, theme) => el.setAttribute("data-theme", theme), theme);
    await checkContrast([
      ".instructions",
      ".canvas-bottom",
      ".hint",
      ".hint-instructions",
      ".primary",
    ]);
  }
  await page.screenshot({
    path: "test-results/kompo-colors-icons.png",
    fullPage: true,
  });
});

test("canvas workspace owns controls, dismissible feedback and progression", async ({
  page,
}) => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/?debug=true");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole("button", { name: "Begin exploring" }).click();
    await page.getByRole("button", { name: "Start the study" }).click();
    const workspace = page.getByRole("region", {
      name: "Interactive composition canvas",
    });
    await expect(
      workspace.getByRole("toolbar", { name: "Canvas controls" }),
    ).toBeVisible();
    await expect(page.locator(".game-sidebar button")).toHaveCount(0);
    await workspace.getByRole("button", { name: "Check composition" }).click();
    await expect(workspace.getByText("LOOK AGAIN")).toBeVisible();
    await expect(workspace.locator(".feedback-highlight")).toHaveCount(1);
    const frame = await workspace.locator(".puzzle-svg").boundingBox();
    const popup = await workspace.locator(".canvas-notice").boundingBox();
    expect(frame).not.toBeNull();
    expect(popup).not.toBeNull();
    const overlaps = await workspace.evaluate((el) => {
      const notice = el
        .querySelector(".canvas-notice")!
        .getBoundingClientRect();
      return [...el.querySelectorAll(".puzzle-svg > [data-piece] > g")].some(
        (piece) => {
          const r = piece.getBoundingClientRect();
          return (
            notice.left < r.right &&
            notice.right > r.left &&
            notice.top < r.bottom &&
            notice.bottom > r.top
          );
        },
      );
    });
    expect(overlaps).toBe(false);
    await page.screenshot({
      path: `test-results/kompo-canvas-feedback-${width}.png`,
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await expect(workspace.locator(".canvas-notice")).toHaveCount(0);
    await expect(
      workspace.getByRole("button", { name: "Check composition" }),
    ).toBeFocused();
    await workspace.getByRole("button", { name: "Show hint" }).click();
    await expect(workspace.locator(".hint")).toBeVisible();
    await workspace
      .getByRole("button", { name: "Dismiss canvas message" })
      .click();
    await expect(workspace.locator(".guides")).toBeVisible();
    await expect(
      workspace.getByRole("button", { name: "Hide hint" }),
    ).toHaveAttribute("aria-pressed", "true");
    await workspace.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(workspace.locator(".guides")).toHaveCount(0);
    await expect(
      workspace.getByRole("button", { name: "Show hint" }),
    ).toBeVisible();
    await workspace.getByRole("button", { name: "Check composition" }).click();
    const form = workspace.getByRole("button", { name: /Piece B,/ });
    await form.focus();
    await page.keyboard.press("ArrowDown");
    await expect(workspace.locator(".canvas-notice")).toHaveCount(0);
    await expect(workspace.locator(".feedback-highlight")).toHaveCount(0);
    await page.getByText("Developer tools", { exact: true }).click();
    await page.getByRole("button", { name: "Complete / bypass" }).click();
    await expect(workspace.getByText("RELATIONSHIP FOUND")).toBeVisible();
    await workspace
      .getByRole("button", { name: "Dismiss canvas message" })
      .click();
    await expect(
      workspace.getByRole("button", { name: "Next exercise" }),
    ).toBeVisible();
    await workspace.getByRole("button", { name: "Next exercise" }).click();
    await expect(workspace.locator(".canvas-top")).toContainText(
      "A central axis",
    );
    await expect(
      workspace.getByRole("button", { name: "Check composition" }),
    ).toBeVisible();
  }
});
