import { useState } from "react";
import { chapters, colors } from "../game/levels";
import type { ChapterId, Shape } from "../game/types";
import { Piece } from "./Canvas";
export function Principle({
  chapter,
  onReplay,
}: {
  chapter: ChapterId;
  onReplay: () => void;
}) {
  const [demo, setDemo] = useState(0);
  const current = chapters.find((c) => c.id === chapter)!;
  return (
    <div className="principle-content">
      <p>{current.lesson}</p>
      <svg
        viewBox="0 0 800 540"
        aria-label={`Interactive ${current.title} demonstration`}
      >
        {[0, 1, 2, 3].map((i) => {
          const t = demo / 100;
          const s: Shape = {
            id: String(i),
            type: chapter === "alignment" ? "bar" : "circle",
            x: chapter === "rhythm" ? 140 + i * 90 + i * i * 16 : 160 + i * 150,
            y: [160, 350, 210, 390][i] * (1 - t) + 280 * t,
            width:
              chapter === "alignment"
                ? 60
                : chapter === "rhythm"
                  ? 30 + i * 20
                  : 65,
            height:
              chapter === "alignment"
                ? 70 + i * 30
                : chapter === "rhythm"
                  ? 30 + i * 20
                  : 65,
            rotation: 0,
            fill: i === 0 ? colors.black : colors.red,
            z: 1,
          };
          if (chapter === "alignment")
            s.y = [160, 350, 210, 390][i] * (1 - t) + (380 - s.height / 2) * t;
          return <Piece key={i} s={s} />;
        })}
        <line
          x1="90"
          x2="720"
          y1={chapter === "alignment" ? 380 : 280}
          y2={chapter === "alignment" ? 380 : 280}
          stroke="var(--canvas-text)"
          strokeDasharray="5 6"
          opacity={demo / 100}
        />
      </svg>
      <label htmlFor="principle-demo">{current.demo}</label>
      <input
        id="principle-demo"
        type="range"
        min="0"
        max="100"
        value={demo}
        onChange={(e) => setDemo(Number(e.target.value))}
      />
      <section className="control-reference">
        <h3>Controls</h3>
        <p>
          Colored forms move; forms marked with a small paper-colored dot stay
          fixed. Drag with a mouse, or select a form and use the arrow keys.
          Shift makes larger steps.
        </p>
        <p>
          On touch devices, tap a form to select it, then use the thumb pad. Tap
          an arrow for a small step, or hold it to keep moving. Hints show the
          relevant axes and intervals.
        </p>
      </section>
      <button className="primary" onClick={onReplay}>
        Replay guidance
      </button>
    </div>
  );
}
