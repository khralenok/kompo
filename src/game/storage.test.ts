import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readProgress, saveProgress } from "./storage";
let values: Map<string, string>;
beforeEach(() => {
  values = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  });
});
afterEach(() => vi.unstubAllGlobals());
it("reads old progress after the KOMPO rename", () => {
  values.set("composition.progress.v1", '["alignment-1"]');
  expect(readProgress()).toEqual(["alignment-1"]);
});
it("writes new progress under KOMPO and respects clearing over legacy progress", () => {
  values.set("composition.progress.v1", '["alignment-1"]');
  expect(saveProgress([])).toBe(true);
  expect(values.get("kompo.progress.v1")).toBe("[]");
  expect(readProgress()).toEqual([]);
});
it("filters malformed progress and tolerates invalid JSON", () => {
  values.set("kompo.progress.v1", '["alignment-1",null,2]');
  expect(readProgress()).toEqual(["alignment-1"]);
  values.set("kompo.progress.v1", "{");
  expect(readProgress()).toEqual([]);
});
it("keeps gameplay usable when storage is blocked", () => {
  vi.stubGlobal("localStorage", {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("blocked");
    },
  });
  expect(readProgress()).toEqual([]);
  expect(saveProgress(["alignment-1"])).toBe(false);
});
