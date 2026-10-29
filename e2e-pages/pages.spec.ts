import { test, expect } from "@playwright/test";
test("workspace routes and assets work under a GitHub Pages repository path", async ({
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
  expect((await request.get("/fonts/alumni-sans-900-0.ttf")).status()).toBe(
    404,
  );
  expect((await request.get("/textures/paper-grain.svg")).status()).toBe(404);
  await page.goto("/kompo/");
  await expect(page).toHaveURL(/\/kompo\/#\/exercise\/alignment-1$/);
  await expect(page).toHaveTitle("A common ground — KOMPO");
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
  await page.getByRole("button", { name: "Skip guidance" }).click();
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
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("kompo.progress.v1") ?? "[]"),
    ),
  ).toContain("alignment-1");
  await expect(page.locator(".onboarding")).toHaveCount(0);
  await page.getByRole("button", { name: "Choose an exercise" }).click();
  await page.getByRole("button", { name: /03 Different forms/ }).click();
  await expect(page).toHaveURL(/\/kompo\/#\/exercise\/alignment-3$/);
  await page.reload();
  await expect(page.locator(".workspace-objective h1")).toHaveText(
    "Different forms. One line.",
  );
  await page.goBack();
  await expect(page).toHaveURL(/alignment-1$/);
  await page.goto("/kompo/?debug=true#/exercise/rhythm-1");
  await page.getByText("Developer tools", { exact: true }).click();
  await expect(page.getByLabel("Jump to exercise")).toHaveValue("10");
  expect(failures).toEqual([]);
});
