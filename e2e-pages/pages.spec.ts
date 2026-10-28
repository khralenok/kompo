import { test, expect } from "@playwright/test";

test("production build works from a GitHub Pages repository subpath", async ({
  page,
  request,
}) => {
  const failures: string[] = [];
  const loaded: string[] = [];
  page.on("pageerror", (e) => failures.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
    else loaded.push(r.url());
  });
  page.on("requestfailed", (r) =>
    failures.push(`${r.url()}: ${r.failure()?.errorText}`),
  );
  // Root URLs must fail; otherwise a broken absolute asset URL could pass QA.
  expect((await request.get("/fonts/alumni-sans-900-0.ttf")).status()).toBe(
    404,
  );
  expect((await request.get("/textures/paper-grain.svg")).status()).toBe(404);
  await page.goto("/kompo/");
  await expect(page).toHaveTitle("KOMPO — Learn to see.");
  await expect(page.getByRole("button", { name: "KOMPO home" })).toBeVisible();
  await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('900 32px "Alumni Sans"'),
      ...[400, 500, 600, 700].map((w) =>
        document.fonts.load(`${w} 16px "IBM Plex Sans"`),
      ),
    ]);
    await document.fonts.ready;
  });
  expect(loaded.filter((url) => url.includes("/kompo/fonts/")).length).toBe(5);
  expect(
    loaded.some((url) => url.includes("/kompo/textures/paper-grain.svg")),
  ).toBe(true);
  await page.getByRole("button", { name: "Begin exploring" }).click();
  await page.getByRole("button", { name: "Start the study" }).click();
  await page.getByRole("button", { name: "Show hint" }).click();
  const points = await page.locator(".puzzle-svg").evaluate((el) => {
    const m = (el as unknown as SVGSVGElement).getScreenCTM()!;
    return [new DOMPoint(510, 170), new DOMPoint(590, 300)].map((p) =>
      p.matrixTransform(m).toJSON(),
    );
  });
  await page.mouse.move(points[0].x, points[0].y);
  await page.mouse.down();
  await page.mouse.move(points[1].x, points[1].y, { steps: 8 });
  await page.mouse.up();
  await page.getByRole("button", { name: "Check composition" }).click();
  await expect(page.getByText("RELATIONSHIP FOUND")).toBeVisible();
  await page.reload();
  await expect(page.locator(".chapter-progress").first()).toContainText(
    "1 OF 5 COMPLETE",
  );
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("kompo.progress.v1") ?? "[]"),
    ),
  ).toContain("alignment-1");
  await page.goto("/kompo/?debug=true");
  await page.getByText("Developer tools", { exact: true }).click();
  await page.getByLabel("Jump to exercise").selectOption("2");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Show hint" }).click();
  await expect(page.locator(".guides")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(failures).toEqual([]);
});
