import { levels } from "./levels";
import { constrainPosition } from "./movement";
import type { Level } from "./types";
export type InputMode = "mouse" | "touch";
export type LearningState = { controls: InputMode[]; lessons: string[] };
const CURRENT = "kompo.current.v1",
  LEARNING = "kompo.learning.v1",
  DRAFT = "kompo.draft.v1";
function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}
function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function readCurrent() {
  const value = read(CURRENT);
  return typeof value === "string" && levels.some((l) => l.id === value)
    ? value
    : null;
}
export function saveCurrent(id: string) {
  return write(CURRENT, id);
}
export function exerciseHash(id: string) {
  return `#/exercise/${id}`;
}
export function parseExerciseHash(hash: string) {
  const match = /^#\/exercise\/([a-z]+-\d+)$/.exec(hash);
  return match && levels.some((l) => l.id === match[1]) ? match[1] : null;
}
export function readLearning(): LearningState {
  const value = read(LEARNING) as Partial<LearningState> | null;
  return {
    controls: Array.isArray(value?.controls)
      ? value.controls.filter(
          (v): v is InputMode => v === "mouse" || v === "touch",
        )
      : [],
    lessons: Array.isArray(value?.lessons)
      ? value.lessons.filter(
          (v): v is string =>
            typeof v === "string" && levels.some((l) => l.id === v),
        )
      : [],
  };
}
export function recordLearning(id: string, mode: InputMode) {
  const previous = readLearning();
  return write(LEARNING, {
    controls: [...new Set([...previous.controls, mode])],
    lessons: [...new Set([...previous.lessons, id])],
  });
}
export function clearLearning() {
  return write(LEARNING, { controls: [], lessons: [] });
}
export function saveDraft(level: Level, shapes: Level["shapes"]) {
  return write(DRAFT, {
    levelId: level.id,
    positions: shapes
      .filter((s) => !s.locked)
      .map(({ id, x, y }) => ({ id, x, y })),
  });
}
export function readDraft(level: Level): Level["shapes"] {
  const draft = read(DRAFT) as {
    levelId?: string;
    positions?: { id?: string; x?: number; y?: number }[];
  } | null;
  const positions =
    draft?.levelId === level.id && Array.isArray(draft.positions)
      ? draft.positions
      : [];
  return level.shapes.map((s) => {
    const p = positions.find((p) => p?.id === s.id);
    return p &&
      typeof p.x === "number" &&
      Number.isFinite(p.x) &&
      typeof p.y === "number" &&
      Number.isFinite(p.y)
      ? constrainPosition(s, p.x, p.y, level.frame)
      : { ...s };
  });
}
export function clearDraft() {
  return write(DRAFT, null);
}
