import { describe, it, expect } from "vitest";
import { levels } from "./levels";
import { validate, anchor } from "./validation";
describe("Authored levels", () => {
  for (const level of levels) {
    it(`${level.id} has a valid, reachable solution and an unsolved initial state`, () => {
      expect(validate(level, level.shapes).success).toBe(false);
      const solved = level.shapes.map((s) => ({
        ...s,
        ...level.solution[s.id],
      }));
      expect(validate(level, solved)).toMatchObject({ success: true });
      for (const shape of solved) {
        expect(shape.x - shape.width / 2).toBeGreaterThanOrEqual(
          level.frame.inset,
        );
        expect(shape.x + shape.width / 2).toBeLessThanOrEqual(
          level.frame.width - level.frame.inset,
        );
        expect(shape.y - shape.height / 2).toBeGreaterThanOrEqual(
          level.frame.inset,
        );
        expect(shape.y + shape.height / 2).toBeLessThanOrEqual(
          level.frame.height - level.frame.inset,
        );
        if (shape.locked)
          expect(shape).toEqual(level.shapes.find((s) => s.id === shape.id));
      }
    });
  }
});
describe("Relationship validation", () => {
  const base = levels[0];
  it("accepts alignment at the tolerance boundary", () => {
    expect(
      validate(
        base,
        base.shapes.map((s) => (s.id === "B" ? { ...s, x: 590, y: 312 } : s)),
      ).success,
    ).toBe(true);
  });
  it("rejects alignment outside tolerance with actionable feedback", () => {
    const result = validate(
      base,
      base.shapes.map((s) => (s.id === "B" ? { ...s, x: 590, y: 313 } : s)),
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("horizontal centers");
  });
  it("accepts alternative positions within the frame tolerance", () => {
    expect(
      validate(
        base,
        base.shapes.map((s) => (s.id === "B" ? { ...s, x: 600, y: 300 } : s)),
      ).success,
    ).toBe(true);
  });
  it("handles missing required pieces without throwing", () => {
    expect(validate(base, []).success).toBe(false);
  });
  it("checks signed distances and sequence order", () => {
    const l = levels[12];
    const solved = l.shapes.map((s) => ({ ...s, ...l.solution[s.id] }));
    expect(validate(l, solved).success).toBe(true);
    expect(
      validate(
        l,
        solved.map((s) => (s.id === "B" ? { ...s, x: 100 } : s)),
      ).success,
    ).toBe(false);
  });
  it("checks interval tolerance boundaries", () => {
    const l = levels[5];
    const solved = l.shapes.map((s) => ({ ...s, ...l.solution[s.id] }));
    expect(
      validate(
        l,
        solved.map((s) => (s.id === "C" ? { ...s, x: s.x + 14 } : s)),
      ).success,
    ).toBe(true);
    expect(
      validate(
        l,
        solved.map((s) => (s.id === "C" ? { ...s, x: s.x + 15 } : s)),
      ).success,
    ).toBe(false);
  });
  it("uses rotated bounds for edge alignment", () => {
    expect(
      anchor(
        { ...base.shapes[1], width: 80, height: 40, rotation: 90 },
        "bottom",
      ),
    ).toBeCloseTo(210);
  });
});

describe("Frame relationships", () => {
  it("rejects an aligned pair when its surrounding space is wrong", () => {
    const l = levels[0];
    const result = validate(
      l,
      l.shapes.map((s) => (s.id === "B" ? { ...s, x: 510, y: 300 } : s)),
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("relative to the frame");
  });
  it("rejects translating a complete rhythm while preserving all its internal intervals", () => {
    const l = levels[10];
    const solved = l.shapes.map((s) => ({ ...s, ...l.solution[s.id] }));
    expect(solved.every((s) => !s.locked)).toBe(true);
    expect(validate(l, solved).success).toBe(true);
    expect(
      validate(
        l,
        solved.map((s) => ({ ...s, x: s.x + 40 })),
      ).success,
    ).toBe(false);
    expect(
      validate(
        l,
        solved.map((s) => ({ ...s, y: s.y + 40 })),
      ).success,
    ).toBe(false);
  });
  it("uses each level's frame dimensions rather than a global canvas", () => {
    const l = levels[1];
    const solved = l.shapes.map((s) => ({ ...s, ...l.solution[s.id] }));
    expect(validate(l, solved).success).toBe(true);
    expect(
      validate({ ...l, frame: { ...l.frame, width: 800 } }, solved).success,
    ).toBe(false);
  });
  it("supports frame edges and asymmetric placement with inclusive tolerance", () => {
    const l = levels[0];
    const shapes = l.shapes.map((s) => ({ ...s, ...l.solution[s.id] }));
    const custom = {
      ...l,
      validation: {
        ...l.validation,
        rules: [
          {
            type: "frame" as const,
            ids: ["B"],
            anchor: "right" as const,
            position: 0.8,
            tolerance: 10,
          },
        ],
      },
    };
    expect(validate(custom, shapes).success).toBe(true); // right=630, target=640
    expect(
      validate(
        custom,
        shapes.map((s) => (s.id === "B" ? { ...s, x: s.x - 1 } : s)),
      ).success,
    ).toBe(false);
  });
  it("checks containment independently of pointer clamping", () => {
    const l = levels[1];
    const solved = l.shapes.map((s) => ({ ...s, ...l.solution[s.id] }));
    const result = validate(
      l,
      solved.map((s) => (s.id === "A" ? { ...s, y: 0 } : s)),
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("inside the composition frame");
  });
});
