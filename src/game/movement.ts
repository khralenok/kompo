import { anchor } from "./validation";
import type { Frame, Shape } from "./types";
export function constrainPosition(
  shape: Shape,
  x: number,
  y: number,
  frame: Frame,
): Shape {
  if (shape.locked) return shape;
  const halfWidth = (anchor(shape, "right") - anchor(shape, "left")) / 2;
  const halfHeight = (anchor(shape, "bottom") - anchor(shape, "top")) / 2;
  return {
    ...shape,
    x:
      shape.axis === "y"
        ? shape.x
        : Math.max(
            halfWidth + frame.inset,
            Math.min(frame.width - halfWidth - frame.inset, x),
          ),
    y:
      shape.axis === "x"
        ? shape.y
        : Math.max(
            halfHeight + frame.inset,
            Math.min(frame.height - halfHeight - frame.inset, y),
          ),
  };
}

// Touch hit areas stay at least 44 screen pixels. When they overlap, choose
// the nearest form rather than whichever transparent SVG rectangle is on top.
export function pickTouchShape(
  shapes: Shape[],
  x: number,
  y: number,
  scale: number,
): Shape | undefined {
  const halfTarget = 22 / Math.max(0.01, scale);
  return shapes
    .filter(
      (s) =>
        Math.abs(x - s.x) <=
          Math.max((anchor(s, "right") - anchor(s, "left")) / 2, halfTarget) &&
        Math.abs(y - s.y) <=
          Math.max((anchor(s, "bottom") - anchor(s, "top")) / 2, halfTarget),
    )
    .sort(
      (a, b) =>
        Math.hypot(x - a.x, y - a.y) - Math.hypot(x - b.x, y - b.y) ||
        b.z - a.z,
    )[0];
}
