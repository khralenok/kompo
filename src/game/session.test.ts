import { describe, expect, it } from "vitest";
import { exerciseHash, parseExerciseHash } from "./session";
import { levels } from "./levels";
describe("exercise routes", () => {
  it("round-trips every authored exercise", () => {
    for (const level of levels)
      expect(parseExerciseHash(exerciseHash(level.id))).toBe(level.id);
  });
  it("rejects invalid and unknown exercise routes", () => {
    for (const hash of [
      "",
      "#/exercise/alignment-99",
      "#/exercise/unknown-1",
      "#/exercise/alignment-1/extra",
    ])
      expect(parseExerciseHash(hash)).toBeNull();
  });
});
