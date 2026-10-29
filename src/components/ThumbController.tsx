import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
type Direction = "up" | "down" | "left" | "right";
const vectors: Record<Direction, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};
export function ThumbController({
  selectedId,
  disabled,
  onMove,
  onRelease,
}: {
  selectedId: string | null;
  disabled: boolean;
  onMove: (dx: number, dy: number) => void;
  onRelease: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState<Direction | null>(null);
  const callbacks = useRef({ onMove, onRelease });
  callbacks.current = { onMove, onRelease };
  const active = useRef<{
    pointer: number;
    direction: Direction;
    start: number;
    last: number;
    raf: number;
  } | null>(null);
  function stop(settle = true) {
    const current = active.current;
    if (!current) return;
    cancelAnimationFrame(current.raf);
    active.current = null;
    setPressed(null);
    if (settle) callbacks.current.onRelease();
  }
  useEffect(() => {
    stop(false);
    return () => stop(false);
  }, [selectedId, disabled]);
  useEffect(() => {
    const blur = () => stop();
    const visibility = () => {
      if (document.hidden) stop();
    };
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    const node = root.current!;
    // React's delegated touch listeners may be passive. Cancel the native
    // gesture locally, before iOS starts a text-selection/callout interaction.
    const prevent = (event: Event) => {
      if (event.cancelable) event.preventDefault();
    };
    node.addEventListener("touchstart", prevent, { passive: false });
    node.addEventListener("selectstart", prevent);
    return () => {
      node.removeEventListener("touchstart", prevent);
      node.removeEventListener("selectstart", prevent);
    };
  }, []);
  function tick(now: number) {
    const current = active.current;
    if (!current) return;
    const dt = Math.min(40, now - current.last);
    current.last = now;
    if (now - current.start >= 240) {
      const [x, y] = vectors[current.direction];
      callbacks.current.onMove(x * dt * 0.11, y * dt * 0.11);
    }
    current.raf = requestAnimationFrame(tick);
  }
  return (
    <div
      className="thumb-controller"
      ref={root}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      role="group"
      aria-label="Move selected form"
    >
      <div className="thumb-label">
        {selectedId ? `FORM ${selectedId}` : "SELECT A FORM"}
      </div>
      <div className="direction-pad">
        {(["up", "left", "right", "down"] as const).map((direction) => (
          <button
            key={direction}
            className={`pad-${direction} ${pressed === direction ? "pressed" : ""}`}
            aria-label={`Move ${direction}`}
            disabled={disabled || !selectedId}
            onPointerDown={(e) => {
              if (disabled || !selectedId || active.current || e.button !== 0)
                return;
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              const now = performance.now();
              active.current = {
                pointer: e.pointerId,
                direction,
                start: now,
                last: now,
                raf: 0,
              };
              setPressed(direction);
              const [x, y] = vectors[direction];
              callbacks.current.onMove(x * 3, y * 3);
              active.current.raf = requestAnimationFrame(tick);
            }}
            onPointerUp={(e) => {
              if (active.current?.pointer === e.pointerId) stop();
            }}
            onPointerCancel={(e) => {
              if (active.current?.pointer === e.pointerId) stop();
            }}
            onLostPointerCapture={(e) => {
              if (active.current?.pointer === e.pointerId) stop();
            }}
            onClick={(e) => {
              if (e.detail === 0 && !disabled && selectedId) {
                const [x, y] = vectors[direction];
                callbacks.current.onMove(x * 3, y * 3);
                callbacks.current.onRelease();
              }
            }}
          >
            <Icon name="arrow_forward" />
          </button>
        ))}
        <span className="pad-center" aria-hidden="true">
          {selectedId ?? "·"}
        </span>
      </div>
    </div>
  );
}
