import { describe, it, expect } from "vitest";
import { levels } from "./levels";
import { completionDialogue, mistakeDialogue } from "./dialogue";

describe("Sensei milestones", () => {
  it("celebrates an exercise and recognizes recovery after difficulty", () => {
    expect(completionDialogue(levels[0], [], 0)).toMatchObject({
      milestone: "exercise",
      pose: "encouraging",
    });
    expect(completionDialogue(levels[0], [], 3)).toMatchObject({
      milestone: "exercise",
      pose: "amused",
    });
  });
  it("recognizes a section finished out of order, ignoring duplicate and unknown IDs", () => {
    const other = levels
      .filter((l) => l.chapter === levels[0].chapter && l.id !== levels[0].id)
      .map((l) => l.id);
    expect(
      completionDialogue(levels[0], [...other, ...other, "unknown"], 0),
    ).toMatchObject({ milestone: "section", pose: "inspirational" });
  });
  it("gives course completion priority over section completion", () => {
    expect(
      completionDialogue(
        levels[0],
        levels.slice(1).map((l) => l.id),
        0,
      ),
    ).toMatchObject({ milestone: "course", pose: "enlightened" });
  });
  it("does not re-award a milestone on a completed exercise", () => {
    expect(
      completionDialogue(
        levels[0],
        levels.map((l) => l.id),
        0,
      ).milestone,
    ).toBe("exercise");
  });
  it("responds patiently before offering more concrete help", () => {
    expect(mistakeDialogue(1).pose).toBe("patient");
    expect(mistakeDialogue(2).pose).toBe("compassionate");
  });
});
