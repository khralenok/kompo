import { describe, expect, it } from "vitest";
import { levels } from "./levels";
import { assistPosition, hintTargets } from "./guidance";
import { validate } from "./validation";

describe("Visual hint assistance", () => {
  it("places level three bottoms on the baseline without restricting horizontal placement", () => {
    const l = levels[2];
    const shapes = l.shapes.map((s) =>
      s.locked
        ? s
        : {
            ...s,
            ...assistPosition(
              l,
              s,
              s.id === "B" ? 450 : 650,
              s.id === "B" ? 355 : 328,
            ),
          },
    );
    expect(shapes[1]).toMatchObject({ x: 450, y: 348 });
    expect(shapes[2]).toMatchObject({ x: 650, y: 320 });
    expect(validate(l, shapes).success).toBe(true);
    expect(hintTargets(l, shapes[1])).toEqual([
      { axis: "y", anchor: "bottom", coordinate: 348, value: 380 },
    ]);
  });
  it("explains why placing centers on the baseline fails", () => {
    const l = levels[2];
    const result = validate(
      l,
      l.shapes.map((s) => (s.locked ? s : { ...s, y: 380 })),
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("up");
    expect(result.message).toContain("bottom edge");
    expect(result.message).toContain("rather than placing its center");
  });
  it("keeps movement free outside the snap threshold and keeps fixed shapes fixed", () => {
    const l = levels[2];
    expect(assistPosition(l, l.shapes[1], 410, 300)).toEqual({
      x: 410,
      y: 300,
    });
    expect(assistPosition(l, l.shapes[0], 400, 400)).toEqual({
      x: 170,
      y: 330,
    });
  });
  for (const l of levels)
    it(`${l.id} can be completed using near-guide positions`, () => {
      const shapes = l.shapes.map((s) => {
        if (s.locked) return s;
        const target = { ...s, ...l.solution[s.id] };
        return { ...s, ...assistPosition(l, s, target.x + 5, target.y + 5) };
      });
      expect(validate(l, shapes).success).toBe(true);
    });
  it("does not require players to read hidden coordinate units", () => {
    for (const l of levels) {
      expect(
        [l.objective, l.hint, ...l.guides.map((g) => g.label ?? "")].join(" "),
      ).not.toMatch(/\bunits?\b|[xy] = \d/);
    }
  });
});
