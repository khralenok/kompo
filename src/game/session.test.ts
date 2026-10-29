import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import {
  clearDraft,
  clearLearning,
  exerciseHash,
  parseExerciseHash,
  readCurrent,
  saveCurrent,
  readDraft,
  saveDraft,
  readLearning,
  recordLearning,
} from "./session";
import { levels } from "./levels";
import { constrainPosition, pickTouchShape } from "./movement";
let values: Map<string, string>;
beforeEach(() => {
  values = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => values.set(k, v),
  });
});
afterEach(() => vi.unstubAllGlobals());
describe("workspace routes and progress", () => {
  it("uses validated hash routes without server-side paths", () => {
    for (const l of levels)
      expect(parseExerciseHash(exerciseHash(l.id))).toBe(l.id);
    for (const hash of [
      "",
      "#/exercise/nope-1",
      "#/exercise/%",
      "#/exercise/alignment-99",
    ])
      expect(parseExerciseHash(hash)).toBeNull();
  });
  it("stores the current exercise separately from completion", () => {
    expect(readCurrent()).toBeNull();
    saveCurrent("rhythm-3");
    expect(readCurrent()).toBe("rhythm-3");
    saveCurrent("invalid");
    expect(readCurrent()).toBeNull();
  });
  it("records input instructions and lesson guidance independently without changing completion", () => {
    recordLearning("alignment-1", "mouse");
    recordLearning("alignment-2", "mouse");
    recordLearning("alignment-1", "touch");
    expect(readLearning()).toEqual({
      controls: ["mouse", "touch"],
      lessons: ["alignment-1", "alignment-2"],
    });
    expect(values.has("kompo.progress.v1")).toBe(false);
    clearLearning();
    expect(readLearning()).toEqual({ controls: [], lessons: [] });
  });
  it("rejects corrupt educational state", () => {
    values.set(
      "kompo.learning.v1",
      '{"controls":["bad",null,"touch"],"lessons":["bad","alignment-1",2]}',
    );
    expect(readLearning()).toEqual({
      controls: ["touch"],
      lessons: ["alignment-1"],
    });
  });
  it("persists draft positions while keeping fixed pieces fixed", () => {
    const l = levels[0];
    saveDraft(
      l,
      l.shapes.map((s) => ({ ...s, x: 600, y: 300 })),
    );
    expect(readDraft(l)[0]).toEqual(l.shapes[0]);
    expect(readDraft(l)[1]).toMatchObject({ x: 600, y: 300 });
    expect(readDraft(levels[1])).toEqual(levels[1].shapes);
    clearDraft();
    expect(readDraft(l)).toEqual(l.shapes);
  });
  it("clamps malformed draft positions and ignores invalid values", () => {
    values.set(
      "kompo.draft.v1",
      '{"levelId":"alignment-1","positions":[null,{"id":"B","x":9999,"y":-99}]}',
    );
    expect(readDraft(levels[0])[1]).toMatchObject({ x: 748, y: 52 });
    values.set(
      "kompo.draft.v1",
      '{"levelId":"alignment-1","positions":[{"id":"B","x":"oops","y":4}]}',
    );
    expect(readDraft(levels[0])).toEqual(levels[0].shapes);
  });
  it("tolerates unavailable browser storage", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(readLearning()).toEqual({ controls: [], lessons: [] });
    expect(readCurrent()).toBeNull();
    expect(saveCurrent("alignment-1")).toBe(false);
    expect(readDraft(levels[0])).toEqual(levels[0].shapes);
  });
});
describe("shared movement constraints", () => {
  it("clamps both axes and respects locks and axis constraints", () => {
    const l = levels[0];
    expect(constrainPosition(l.shapes[0], 400, 400, l.frame)).toEqual(
      l.shapes[0],
    );
    expect(constrainPosition(l.shapes[1], 9999, -100, l.frame)).toMatchObject({
      x: 748,
      y: 52,
    });
    expect(
      constrainPosition({ ...l.shapes[1], axis: "x" }, 600, 500, l.frame),
    ).toMatchObject({ x: 600, y: 170 });
  });
  it("uses rotated bounds", () => {
    expect(
      constrainPosition(
        { ...levels[0].shapes[1], width: 100, height: 20, rotation: 90 },
        0,
        0,
        levels[0].frame,
      ),
    ).toMatchObject({ x: 22, y: 62 });
  });
  it("has guidance with a selectable focus form for every level", () => {
    for (const l of levels) {
      expect(l.teaching.concept.length).toBeGreaterThan(10);
      expect(
        l.shapes.find((s) => s.id === l.teaching.focusId)?.locked,
      ).not.toBe(true);
      expect(l.shapes.some((s) => s.id === l.teaching.focusId)).toBe(true);
    }
  });
});

it("chooses the nearest form when enlarged touch targets overlap", () => {
  const a = {
    ...levels[0].shapes[1],
    id: "A",
    x: 100,
    y: 100,
    width: 20,
    height: 20,
  };
  const b = { ...a, id: "B", x: 160 };
  expect(pickTouchShape([a, b], 105, 100, 0.4)?.id).toBe("A");
  expect(pickTouchShape([a, b], 155, 100, 0.4)?.id).toBe("B");
  expect(pickTouchShape([a, b], 500, 500, 0.4)).toBeUndefined();
});
