import { chapters, levels } from "./levels";
import type { Level } from "./types";
import type { SenseiPose } from "../components/sensei/poses";
export type Dialogue = {
  pose: SenseiPose;
  title: string;
  text: string;
  milestone?: "exercise" | "section" | "course";
};

/** Progress, rather than exercise order, determines a newly earned milestone. */
export function completionDialogue(
  level: Level,
  completed: string[],
  mistakes: number,
): Dialogue {
  const before = new Set(completed);
  const after = new Set([...before, level.id]);
  const section = levels.filter((l) => l.chapter === level.chapter);
  const newlyCompleted = !before.has(level.id);
  if (newlyCompleted && levels.every((l) => after.has(l.id)))
    return {
      pose: "enlightened",
      title: "You have an eye for composition.",
      text: "All 15 exercises complete. You have explored alignment, repetition, and rhythm. Revisit a study and notice how much more you can see.",
      milestone: "course",
    };
  if (newlyCompleted && section.every((l) => after.has(l.id)))
    return {
      pose: "inspirational",
      title: `${chapters.find((c) => c.id === level.chapter)!.title}, understood.`,
      text: `All five exercises in this study are complete. ${sectionReflection[level.chapter]}`,
      milestone: "section",
    };
  return {
    pose: mistakes >= 2 ? "amused" : "encouraging",
    title:
      mistakes >= 2
        ? "You stayed with it. You found it."
        : "You found the connection.",
    text: level.teaching.concept,
    milestone: "exercise",
  };
}
export function mistakeDialogue(
  mistakes: number,
): Pick<Dialogue, "pose" | "title" | "text"> {
  return mistakes >= 2
    ? {
        pose: "compassionate",
        title: "Let’s take it one relationship at a time.",
        text: "A hint can make the next adjustment easier to see.",
      }
    : { pose: "patient", title: "Take another look.", text: "" };
}
export const sectionReflection = {
  alignment:
    "Shared edges and axes connect forms. Next, look for the patterns those connections can create.",
  repetition:
    "A familiar form creates an echo. Changes in that pattern can give the eye a rhythm to follow.",
  rhythm:
    "Intervals and changes in scale guide the eye. Try noticing those beats in the compositions around you.",
};
export const principleHighlights = {
  alignment: {
    pose: "analytical" as const,
    text: "Watch the lower edges. Different shapes can share the same invisible line.",
  },
  repetition: {
    pose: "knowledgeable" as const,
    text: "Follow the recurring circles. A shared shape gives the arrangement a familiar voice.",
  },
  rhythm: {
    pose: "visionary" as const,
    text: "Read from left to right. Growing forms and changing gaps create a direction for the eye.",
  },
};
