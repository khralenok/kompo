import { useEffect, useRef, useState } from "react";
import type { PointerEvent, KeyboardEvent, CSSProperties } from "react";
import type { Level, Shape } from "../game/types";
import { hintTargets, assistPosition } from "../game/guidance";
import { anchor } from "../game/validation";
export function Piece({ s }: { s: Shape }) {
  const props = { fill: s.fill };
  return (
    <g transform={`translate(${s.x} ${s.y}) rotate(${s.rotation})`}>
      {s.type === "circle" ? (
        <ellipse rx={s.width / 2} ry={s.height / 2} {...props} />
      ) : s.type === "triangle" ? (
        <polygon
          points={`0,${-s.height / 2} ${s.width / 2},${s.height / 2} ${-s.width / 2},${s.height / 2}`}
          {...props}
        />
      ) : (
        <rect
          x={-s.width / 2}
          y={-s.height / 2}
          width={s.width}
          height={s.height}
          {...props}
        />
      )}
    </g>
  );
}
export function Canvas({
  level,
  shapes,
  onChange,
  guides,
  assist = false,
  disabled = false,
  highlightedIds = [],
}: {
  level: Level;
  shapes: Shape[];
  onChange: (s: Shape[]) => void;
  guides: boolean;
  assist?: boolean;
  disabled?: boolean;
  highlightedIds?: string[];
}) {
  const { width, height, inset } = level.frame;
  const svg = useRef<SVGSVGElement>(null);
  const [renderedWidth, setRenderedWidth] = useState(width);
  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setRenderedWidth(entry.contentRect.width),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const drag = useRef<{
    id: string;
    pointer: number;
    dx: number;
    dy: number;
  } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  function point(e: PointerEvent<SVGSVGElement>) {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return null;
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
  }
  function move(id: string, x: number, y: number, snap = true) {
    onChange(
      shapes.map((s) => {
        if (s.id !== id || s.locked) return s;
        if (assist && snap) ({ x, y } = assistPosition(level, s, x, y));
        const r = (s.rotation * Math.PI) / 180;
        const w =
          (Math.abs(s.width * Math.cos(r)) + Math.abs(s.height * Math.sin(r))) /
          2;
        const h =
          (Math.abs(s.width * Math.sin(r)) + Math.abs(s.height * Math.cos(r))) /
          2;
        return {
          ...s,
          x:
            s.axis === "y"
              ? s.x
              : Math.max(w + inset, Math.min(width - w - inset, x)),
          y:
            s.axis === "x"
              ? s.y
              : Math.max(h + inset, Math.min(height - h - inset, y)),
        };
      }),
    );
  }
  function down(e: PointerEvent<SVGSVGElement>) {
    if (disabled || e.button !== 0) return;
    const id = (e.target as Element)
      .closest("[data-piece]")
      ?.getAttribute("data-piece");
    const s = shapes.find((s) => s.id === id);
    if (!s || s.locked) return;
    const p = point(e);
    if (!p) return;
    e.preventDefault();
    svg.current?.setPointerCapture(e.pointerId);
    drag.current = {
      id: s.id,
      pointer: e.pointerId,
      dx: p.x - s.x,
      dy: p.y - s.y,
    };
    setSelected(s.id);
  }
  function keyboard(e: KeyboardEvent<SVGGElement>, s: Shape) {
    if (disabled || s.locked) return;
    const delta = e.shiftKey ? 10 : 3;
    const offset: Record<string, [number, number]> = {
      ArrowLeft: [-delta, 0],
      ArrowRight: [delta, 0],
      ArrowUp: [0, -delta],
      ArrowDown: [0, delta],
    };
    if (offset[e.key]) {
      e.preventDefault();
      move(s.id, s.x + offset[e.key][0], s.y + offset[e.key][1], false);
      setSelected(s.id);
    }
  }
  return (
    <svg
      ref={svg}
      className={`puzzle-svg ${disabled ? "solved" : ""}`}
      viewBox={`0 0 ${width} ${height}`}
      style={
        {
          width: `min(100%, ${(width / height) * 62}vh)`,
          aspectRatio: `${width} / ${height}`,
          "--canvas-label-size": `${Math.max(12, (10 * width) / Math.max(1, renderedWidth))}px`,
        } as CSSProperties
      }
      role="group"
      aria-label={`${level.title}. Drag colored pieces or focus a piece and use arrow keys.`}
      onPointerDown={down}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || e.pointerId !== d.pointer) return;
        const p = point(e);
        if (p) move(d.id, p.x - d.dx, p.y - d.dy);
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onLostPointerCapture={() => {
        drag.current = null;
      }}
    >
      <defs>
        <pattern id="dots" width="25" height="25" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r=".7" fill="#191919" opacity=".12" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#dots)" />
      <path
        d={`M24 40V24H40 M${width - 40} 24H${width - 24}V40 M24 ${height - 40}V${height - 24}H40 M${width - 40} ${height - 24}H${width - 24}V${height - 40}`}
        stroke="#A6A39C"
        fill="none"
      />
      {guides && (
        <g className="guides" pointerEvents="none">
          {level.validation.rules
            .filter((r) => r.type === "frame")
            .map((r, i) => {
              const horizontal = ["x", "left", "right"].includes(r.anchor);
              const at = r.position * (horizontal ? width : height);
              return (
                <g key={`frame-${i}`} className="frame-guide">
                  <line
                    x1={horizontal ? at : 0}
                    y1={horizontal ? 0 : at}
                    x2={horizontal ? at : width}
                    y2={horizontal ? height : at}
                  />
                  <text
                    x={horizontal ? at + 10 : 16}
                    y={horizontal ? 20 : at - 10}
                  >
                    FRAME {Math.round(r.position * 100)}%
                  </text>
                </g>
              );
            })}
          {level.validation.rules
            .filter((r) => r.type === "distance")
            .map((r, i, intervals) => {
              const initialA = level.shapes.find((s) => s.id === r.a)!;
              const initialB = level.shapes.find((s) => s.id === r.b)!;
              const a = { ...initialA, ...level.solution[r.a] };
              const b = { ...initialB, ...level.solution[r.b] };
              const horizontal = r.axis === "x";
              const offset = horizontal
                ? Math.min(
                    height - 35,
                    Math.max(anchor(a, "bottom"), anchor(b, "bottom")) + 45,
                  )
                : Math.min(
                    width - 35,
                    Math.max(anchor(a, "right"), anchor(b, "right")) + 45,
                  );
              const label =
                i > 0 && r.distance > intervals[i - 1].distance
                  ? "wider beat"
                  : intervals.every((other) => other.distance === r.distance)
                    ? "same beat"
                    : "short beat";
              return (
                <g
                  className="interval-guide"
                  key={`interval-${i}`}
                  data-interval={`${r.a}-${r.b}`}
                >
                  <line
                    x1={horizontal ? a.x : offset}
                    y1={horizontal ? offset : a.y}
                    x2={horizontal ? b.x : offset}
                    y2={horizontal ? offset : b.y}
                  />
                  {[a, b].map((s) => (
                    <line
                      key={s.id}
                      x1={horizontal ? s.x : offset - 6}
                      y1={horizontal ? offset - 6 : s.y}
                      x2={horizontal ? s.x : offset + 6}
                      y2={horizontal ? offset + 6 : s.y}
                    />
                  ))}
                  <text
                    x={horizontal ? (a.x + b.x) / 2 : offset + 10}
                    y={horizontal ? offset + 20 : (a.y + b.y) / 2}
                    textAnchor={horizontal ? "middle" : "start"}
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          {level.guides.map((g, i) => (
            <g key={i}>
              <line {...{ x1: g.x1, y1: g.y1, x2: g.x2, y2: g.y2 }} />
              {g.label && (
                <text
                  x={(g.x1 + g.x2) / 2}
                  y={Math.min(g.y1, g.y2) - 18}
                  textAnchor="middle"
                >
                  {g.label}
                </text>
              )}
            </g>
          ))}
          {shapes
            .filter((s) => !s.locked)
            .map((s) => {
              const targets = hintTargets(level, s);
              const ghost = { ...s };
              for (const target of targets)
                ghost[target.axis] = target.coordinate;
              return (
                <g key={s.id} className="hint-target" data-target={s.id}>
                  <g className="target-outline">
                    <Piece s={ghost} />
                  </g>
                  <text
                    x={ghost.x}
                    y={ghost.y - ghost.height / 2 - 16}
                    textAnchor="middle"
                  >
                    {s.id} · target
                  </text>
                </g>
              );
            })}
        </g>
      )}
      {[...shapes]
        .sort((a, b) => a.z - b.z)
        .map((s) => (
          <g
            key={s.id}
            data-piece={s.id}
            tabIndex={s.locked || disabled ? undefined : 0}
            role={s.locked ? undefined : "button"}
            aria-label={`Piece ${s.id}, ${s.fill === "#D12F26" ? "red" : s.fill === "#D8AF58" ? "ochre" : "black"} ${s.type}. ${s.locked ? "Fixed." : "Use arrow keys to move; Shift for larger steps."}`}
            className={s.locked ? "piece locked" : "piece movable"}
            onFocus={() => setSelected(s.id)}
            onKeyDown={(e) => keyboard(e, s)}
          >
            <rect
              x={s.x - Math.max(86, s.width + 20) / 2}
              y={s.y - Math.max(86, s.height + 20) / 2}
              width={Math.max(86, s.width + 20)}
              height={Math.max(86, s.height + 20)}
              fill="transparent"
            />
            {highlightedIds.includes(s.id) && (
              <rect
                className="feedback-highlight"
                x={s.x - s.width / 2 - 12}
                y={s.y - s.height / 2 - 12}
                width={s.width + 24}
                height={s.height + 24}
                fill="none"
                rx="2"
                pointerEvents="none"
              />
            )}
            <Piece s={s} />
            {selected === s.id && !s.locked && (
              <rect
                className="selection"
                x={s.x - s.width / 2 - 7}
                y={s.y - s.height / 2 - 7}
                width={s.width + 14}
                height={s.height + 14}
                fill="none"
                stroke={s.fill}
                strokeDasharray="3 4"
                pointerEvents="none"
              />
            )}
            {s.locked ? (
              <circle
                cx={s.x}
                cy={s.y}
                r="3"
                fill="#F2EFE6"
                pointerEvents="none"
              />
            ) : (
              <text
                className="piece-id"
                x={s.x}
                y={s.y + s.height / 2 + 24}
                textAnchor="middle"
                pointerEvents="none"
              >
                {s.id}
              </text>
            )}
          </g>
        ))}
      {guides && (
        <g className="live-guides" pointerEvents="none">
          {shapes
            .filter((s) => !s.locked)
            .flatMap((s) =>
              hintTargets(level, s)
                .filter((t) =>
                  ["left", "right", "top", "bottom"].includes(t.anchor),
                )
                .map((t, i) => {
                  const actual = anchor(s, t.anchor);
                  const matched = Math.abs(actual - t.value) <= 12;
                  const horizontal = t.axis === "y";
                  return (
                    <g
                      key={`${s.id}-${i}`}
                      className={matched ? "matched" : "adjust"}
                      data-edge={s.id}
                    >
                      <line
                        x1={horizontal ? s.x - s.width / 2 - 12 : actual}
                        y1={horizontal ? actual : s.y - s.height / 2 - 12}
                        x2={horizontal ? s.x + s.width / 2 + 12 : actual}
                        y2={horizontal ? actual : s.y + s.height / 2 + 12}
                      />
                      <text
                        x={horizontal ? s.x + s.width / 2 + 18 : actual + 12}
                        y={horizontal ? actual + 4 : s.y}
                      >
                        {matched
                          ? "✓"
                          : t.value > actual
                            ? horizontal
                              ? "↓"
                              : "→"
                            : horizontal
                              ? "↑"
                              : "←"}
                      </text>
                    </g>
                  );
                }),
            )}
        </g>
      )}
    </svg>
  );
}
