import type { Anchor, Level, Shape, ValidationResult } from "./types";
export function anchor(s: Shape, key: Anchor): number {
  const r = (s.rotation * Math.PI) / 180;
  const w = Math.abs(s.width * Math.cos(r)) + Math.abs(s.height * Math.sin(r));
  const h = Math.abs(s.width * Math.sin(r)) + Math.abs(s.height * Math.cos(r));
  return key === "left"
    ? s.x - w / 2
    : key === "right"
      ? s.x + w / 2
      : key === "top"
        ? s.y - h / 2
        : key === "bottom"
          ? s.y + h / 2
          : s[key];
}
export function validateRelationships(
  level: Level,
  shapes: Shape[],
): ValidationResult {
  const byId = new Map(shapes.map((s) => [s.id, s]));
  const failures: string[] = [];
  // Frame containment applies even when a state arrives outside the interaction engine.
  for (const s of shapes) {
    if (
      anchor(s, "left") < level.frame.inset ||
      anchor(s, "right") > level.frame.width - level.frame.inset ||
      anchor(s, "top") < level.frame.inset ||
      anchor(s, "bottom") > level.frame.height - level.frame.inset
    ) {
      failures.push(`Keep piece ${s.id} inside the composition frame.`);
    }
  }
  for (const rule of level.validation.rules) {
    const ids =
      rule.type === "align" || rule.type === "sequence" || rule.type === "frame"
        ? rule.ids
        : rule.type === "distance"
          ? [rule.a, rule.b]
          : [rule.id];
    if (ids.some((id) => !byId.has(id))) {
      failures.push("A required piece is missing. Reset this exercise.");
      continue;
    }
    const get = (id: string) => byId.get(id)!;
    if (rule.type === "frame") {
      const horizontal = ["x", "left", "right"].includes(rule.anchor);
      const low = Math.min(
        ...rule.ids.map((id) => anchor(get(id), horizontal ? "left" : "top")),
      );
      const high = Math.max(
        ...rule.ids.map((id) =>
          anchor(get(id), horizontal ? "right" : "bottom"),
        ),
      );
      const actual =
        rule.anchor === "x" || rule.anchor === "y"
          ? (low + high) / 2
          : rule.anchor === "left" || rule.anchor === "top"
            ? low
            : high;
      const target =
        rule.position * (horizontal ? level.frame.width : level.frame.height);
      if (Math.abs(actual - target) > rule.tolerance)
        failures.push(
          `Adjust the group’s ${rule.anchor === "x" ? "horizontal center" : rule.anchor === "y" ? "vertical center" : rule.anchor + " edge"} relative to the frame. ${rule.position === 0.5 ? "Aim for the frame’s centerline." : `Aim for ${Math.round(rule.position * 100)}% of the frame’s ${horizontal ? "width" : "height"}.`}`,
        );
    } else if (rule.type === "align") {
      const values = rule.ids.map((id) => anchor(get(id), rule.anchor));
      if (Math.max(...values) - Math.min(...values) > rule.tolerance) {
        const reference =
          rule.ids.map(get).find((s) => s.locked) ?? get(rule.ids[0]);
        const target = anchor(reference, rule.anchor);
        const misplaced = rule.ids
          .map(get)
          .filter((s) => !s.locked)
          .sort(
            (a, b) =>
              Math.abs(anchor(b, rule.anchor) - target) -
              Math.abs(anchor(a, rule.anchor) - target),
          )[0];
        const horizontal = ["x", "left", "right"].includes(rule.anchor);
        const direction =
          anchor(misplaced, rule.anchor) < target
            ? horizontal
              ? "right"
              : "down"
            : horizontal
              ? "left"
              : "up";
        const relationship =
          rule.anchor === "x"
            ? "vertical centers"
            : rule.anchor === "y"
              ? "horizontal centers"
              : rule.anchor + " edges";
        failures.push(
          `Move piece ${misplaced.id} ${direction} to align the ${relationship}. ${rule.anchor === "bottom" ? "Rest its bottom edge on the shared baseline, rather than placing its center on the line." : "Use the hint’s dashed outline as a guide."}`,
        );
      }
    } else if (rule.type === "distance") {
      if (
        Math.abs(
          get(rule.b)[rule.axis] - get(rule.a)[rule.axis] - rule.distance,
        ) > rule.tolerance
      )
        failures.push(
          `Adjust the ${rule.axis === "x" ? "horizontal" : "vertical"} interval between pieces ${rule.a} and ${rule.b}. Use the hint’s interval bracket to match the intended spacing.`,
        );
    } else if (rule.type === "position") {
      if (
        (rule.x !== undefined &&
          Math.abs(get(rule.id).x - rule.x) > rule.tolerance) ||
        (rule.y !== undefined &&
          Math.abs(get(rule.id).y - rule.y) > rule.tolerance)
      )
        failures.push(
          `Move piece ${rule.id} closer to its place in the pattern. The hint reveals the target.`,
        );
    } else if (
      rule.ids.some(
        (id, i) =>
          i > 0 &&
          get(id)[rule.axis] - get(rule.ids[i - 1])[rule.axis] < rule.minGap,
      )
    )
      failures.push(
        "Check the order of the pieces and leave a clear interval between them.",
      );
  }
  return {
    success: failures.length === 0,
    message: failures[0] ?? level.success,
    details: { failures },
  };
}
export const validators = { relationships: validateRelationships };
export function validate(level: Level, shapes: Shape[]) {
  return validators[level.validation.strategy](level, shapes);
}
