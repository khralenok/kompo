import type { Anchor, Level, Shape } from "./types";
import { anchor } from "./validation";
export type HintTarget = {
  axis: "x" | "y";
  coordinate: number;
  anchor: Anchor;
  value: number;
};
const axisFor = (key: Anchor): "x" | "y" =>
  ["x", "left", "right"].includes(key) ? "x" : "y";

// Only constrain axes that the exercise actually checks. A baseline hint must
// never force the player's horizontally arranged forms into one exact solution.
export function hintTargets(level: Level, shape: Shape): HintTarget[] {
  const solved = level.shapes.map((s) => ({ ...s, ...level.solution[s.id] }));
  const own = solved.find((s) => s.id === shape.id);
  if (!own || shape.locked) return [];
  const targets: HintTarget[] = [];
  const add = (key: Anchor, value: number) => {
    const axis = axisFor(key);
    targets.push({
      axis,
      anchor: key,
      value,
      coordinate: value - (anchor(shape, key) - shape[axis]),
    });
  };
  for (const rule of level.validation.rules) {
    if (rule.type === "align" && rule.ids.includes(shape.id)) {
      const reference =
        solved.find((s) => rule.ids.includes(s.id) && s.locked) ?? own;
      add(rule.anchor, anchor(reference, rule.anchor));
    } else if (
      rule.type === "distance" &&
      [rule.a, rule.b].includes(shape.id)
    ) {
      add(rule.axis, own[rule.axis]);
    } else if (rule.type === "position" && rule.id === shape.id) {
      if (rule.x !== undefined) add("x", rule.x);
      if (rule.y !== undefined) add("y", rule.y);
    } else if (rule.type === "frame" && rule.ids.includes(shape.id)) {
      const axis = axisFor(rule.anchor);
      add(axis, own[axis]);
    }
  }
  return targets.filter(
    (t, i) =>
      targets.findIndex(
        (other) =>
          other.axis === t.axis &&
          Math.abs(other.coordinate - t.coordinate) < 0.01,
      ) === i,
  );
}

export function assistPosition(
  level: Level,
  shape: Shape,
  x: number,
  y: number,
  threshold = 14,
) {
  const result = { x, y };
  if (shape.locked) return { x: shape.x, y: shape.y };
  for (const target of hintTargets(level, shape)) {
    if (
      (shape.axis === "x" && target.axis === "y") ||
      (shape.axis === "y" && target.axis === "x")
    )
      continue;
    if (Math.abs(result[target.axis] - target.coordinate) <= threshold)
      result[target.axis] = target.coordinate;
  }
  return result;
}
