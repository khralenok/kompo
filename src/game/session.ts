import { levels } from "./levels";
export type InputMode = "mouse" | "touch";
export function exerciseHash(id: string) {
  return `#/exercise/${id}`;
}
export function parseExerciseHash(hash: string) {
  const match = /^#\/exercise\/([a-z]+-\d+)$/.exec(hash);
  return match && levels.some((l) => l.id === match[1]) ? match[1] : null;
}
