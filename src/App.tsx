import { useEffect, useRef, useState } from "react";
import { Icon } from "./components/Icon";
import { Artwork } from "./components/Artwork";
import { Piece } from "./components/Canvas";
import { CanvasWorkspace } from "./components/CanvasWorkspace";
import type { CanvasWorkspaceHandle } from "./components/CanvasWorkspace";
import { chapters, levels, colors } from "./game/levels";
import { readProgress, saveProgress } from "./game/storage";
import type { ChapterId, Level, Shape } from "./game/types";
type View = "home" | "lesson" | "game";
export default function App() {
  const [view, setView] = useState<View>("home");
  const [chapter, setChapter] = useState<ChapterId>("alignment");
  const [index, setIndex] = useState(0);
  const [shapes, setShapes] = useState<Shape[]>(
    levels[0].shapes.map((s) => ({ ...s })),
  );
  const [completed, setCompleted] = useState(readProgress);
  const canvasRef = useRef<CanvasWorkspaceHandle>(null);
  const [bypassRequested, setBypassRequested] = useState(false);
  const [debugGuides, setDebugGuides] = useState(false);
  const [demo, setDemo] = useState(0);
  const [storageError, setStorageError] = useState(false);
  const debug = new URLSearchParams(location.search).get("debug") === "true";
  const level = levels[index];
  const current = chapters.find((c) => c.id === chapter)!;
  const chapterLevels = levels.filter((l) => l.chapter === chapter);
  const number = chapterLevels.findIndex((l) => l.id === level.id) + 1;
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title =
      view === "home" ? "KOMPO — Learn to see." : `${current.title} — KOMPO`;
  }, [view, chapter]);
  function openLevel(l: Level) {
    if (view === "game" && l.id === level.id) canvasRef.current?.reset();
    setIndex(levels.indexOf(l));
    setChapter(l.chapter);
    setShapes(l.shapes.map((s) => ({ ...s })));
    setView("game");
  }
  function startChapter(id: ChapterId) {
    setChapter(id);
    setDemo(0);
    setView("lesson");
  }
  function completeLevel() {
    const next = [...new Set([...completed, level.id])];
    setCompleted(next);
    setStorageError(!saveProgress(next));
  }
  useEffect(() => {
    if (view === "game" && bypassRequested) {
      canvasRef.current?.complete();
      setBypassRequested(false);
    }
  }, [view, bypassRequested]);
  const remaining =
    chapterLevels.find((l) => !completed.includes(l.id)) ?? chapterLevels[0];
  return (
    <div className="app">
      <header className="topbar">
        <button
          className="wordmark"
          onClick={() => setView("home")}
          aria-label="KOMPO home"
        >
          <span className="brand-icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path
                d="M2 2h20v20H2z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M2 22V2h20z" fill="currentColor" />
            </svg>
          </span>{" "}
          KOMPO
        </button>
      </header>
      {view === "home" ? (
        <main className="home">
          <div className="home-intro">
            <h1>
              Learn to see.
              <br />
              Learn to <span>arrange.</span>
            </h1>
            <p className="intro-copy">
              A few simple shapes. Endless relationships.
              <br />
              Discover the principles that hold a composition together.
            </p>
            <button
              className="primary"
              onClick={() =>
                startChapter(
                  (levels.find((l) => !completed.includes(l.id)) ?? levels[0])
                    .chapter,
                )
              }
            >
              {" "}
              {completed.length ? "Continue exploring" : "Begin exploring"}{" "}
            </button>
          </div>
          <div className="hero-art">
            <Artwork />
          </div>
          <section className="chapter-section">
            <div className="section-label">
              <span>THE STUDIES</span>
              <span>
                SELECT A CHAPTER <Icon name="arrow_downward" />
              </span>
            </div>
            <div className="chapter-grid">
              {chapters.map((c) => {
                const count = levels.filter(
                  (l) => l.chapter === c.id && completed.includes(l.id),
                ).length;
                return (
                  <button
                    className="chapter-card"
                    key={c.id}
                    onClick={() => startChapter(c.id)}
                  >
                    <div className="chapter-card-top">
                      <span className="chapter-number">{c.number}</span>
                    </div>
                    <div
                      className={`chapter-symbol ${c.id}`}
                      aria-hidden="true"
                    >
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                    <h2>{c.title}</h2>
                    <p>{c.description}</p>
                    <div className="chapter-progress">
                      <span>{count} OF 5 COMPLETE</span>
                      <span className="mini-progress">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <i key={i} className={i < count ? "filled" : ""} />
                        ))}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
          <footer>
            <span>INSPIRED BY THE AVANT-GARDE. MADE FOR EXPLORATION.</span>
            <span>KOMPO</span>
          </footer>
        </main>
      ) : view === "lesson" ? (
        <main className="lesson">
          <button className="text-button back" onClick={() => setView("home")}>
            <Icon name="arrow_back" /> All studies
          </button>
          <div className="lesson-grid">
            <section>
              <div className="eyebrow">
                STUDY {current.number} / AN INTRODUCTION
              </div>
              <div className="lesson-number">{current.number}</div>
              <h1>
                {current.title}
                <span className="red">.</span>
              </h1>
              <p className="lesson-copy">{current.lesson}</p>
              <button className="primary" onClick={() => openLevel(remaining)}>
                Start the study
              </button>
              <p className="quiet">5 exercises · No timers. Take your time.</p>
            </section>
            <section className="demo-panel">
              <div className="panel-label">
                <span>OBSERVE THE RELATIONSHIP</span>
                <span>FIG. {current.number}</span>
              </div>
              <svg
                viewBox="0 0 800 540"
                aria-label={`Interactive ${current.title} demonstration`}
              >
                {[0, 1, 2, 3].map((i) => {
                  const t = demo / 100;
                  const targetX =
                    chapter === "rhythm"
                      ? 140 + i * 90 + i * i * 16
                      : 160 + i * 150;
                  const targetY = chapter === "alignment" ? 330 : 280;
                  const starts = [160, 350, 210, 390];
                  const s: Shape = {
                    id: String(i),
                    type: chapter === "alignment" ? "bar" : "circle",
                    x: targetX,
                    y: starts[i] * (1 - t) + targetY * t,
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
                    s.y = starts[i] * (1 - t) + (380 - s.height / 2) * t;
                  return <Piece key={i} s={s} />;
                })}
                <line
                  x1="90"
                  x2="720"
                  y1={chapter === "alignment" ? 380 : 280}
                  y2={chapter === "alignment" ? 380 : 280}
                  stroke="#A6A39C"
                  strokeDasharray="5 6"
                  opacity={demo / 100}
                />
              </svg>
              <label className="slider-label" htmlFor="demo">
                {current.demo}
              </label>
              <input
                id="demo"
                type="range"
                min="0"
                max="100"
                value={demo}
                onChange={(e) => setDemo(Number(e.target.value))}
              />
              <div className="range-labels">
                <span>SCATTERED</span>
                <span>
                  {chapter === "alignment"
                    ? "ALIGNED"
                    : chapter === "repetition"
                      ? "REPEATED"
                      : "RHYTHMIC"}
                </span>
              </div>
            </section>
          </div>
          <div className="lesson-levels">
            <span className="eyebrow">THE EXERCISES</span>
            {chapterLevels.map((l, i) => (
              <button key={l.id} onClick={() => openLevel(l)}>
                <span>0{i + 1}</span>
                {l.title}
                <span>
                  <Icon
                    name={completed.includes(l.id) ? "check" : "north_east"}
                  />
                </span>
              </button>
            ))}
          </div>
        </main>
      ) : (
        <main className="game">
          <div className="game-heading">
            <button className="text-button" onClick={() => setView("home")}>
              <Icon name="arrow_back" /> All studies
            </button>
            <span>
              STUDY {current.number} / {current.title.toUpperCase()}
            </span>
            <span>EXERCISE {String(number).padStart(2, "0")} / 05</span>
          </div>
          <div className="game-layout">
            <CanvasWorkspace
              key={level.id}
              ref={canvasRef}
              level={level}
              nextLabel={
                index === levels.length - 1
                  ? "Finish the studies"
                  : number === 5
                    ? "Next study"
                    : "Next exercise"
              }
              onNext={() =>
                index === levels.length - 1
                  ? setView("home")
                  : number === 5
                    ? startChapter(levels[index + 1].chapter)
                    : openLevel(levels[index + 1])
              }
              onComplete={completeLevel}
              onShapesChange={setShapes}
              debugGuides={debugGuides}
              storageError={storageError}
            />
            <aside className="game-sidebar">
              <div className="eyebrow">THE OBJECTIVE</div>
              <div className="exercise-number">
                {String(number).padStart(2, "0")}
                <span>/05</span>
              </div>
              <h1>{level.title}</h1>
              <p className="objective">{level.objective}</p>
              <p className="lesson-context">{current.lesson}</p>
            </aside>
          </div>
          <nav className="level-nav" aria-label="Exercises">
            <span>{current.title} /</span>
            {chapterLevels.map((l, i) => (
              <button
                aria-label={`Exercise ${i + 1}: ${l.title}`}
                aria-current={l.id === level.id ? "step" : undefined}
                className={l.id === level.id ? "active" : ""}
                key={l.id}
                onClick={() => openLevel(l)}
              >
                {String(i + 1).padStart(2, "0")}
                {completed.includes(l.id) && (
                  <Icon name="check" className="completion-icon" />
                )}
              </button>
            ))}
            <button
              className="lesson-link"
              onClick={() => {
                setDemo(0);
                setView("lesson");
              }}
            >
              Revisit the principle
            </button>
          </nav>
        </main>
      )}
      {debug && (
        <details className="debug">
          <summary>Developer tools</summary>
          <label>
            Jump to exercise{" "}
            <select
              value={index}
              onChange={(e) => openLevel(levels[Number(e.target.value)])}
            >
              {levels.map((l, i) => (
                <option key={l.id} value={i}>
                  {l.id}: {l.title}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              if (view !== "game") openLevel(level);
              else canvasRef.current?.reset();
            }}
          >
            Reset puzzle
          </button>
          <button
            onClick={() => {
              setView("game");
              setBypassRequested(true);
            }}
          >
            Complete / bypass
          </button>
          <label>
            <input
              type="checkbox"
              checked={debugGuides}
              onChange={(e) => setDebugGuides(e.target.checked)}
            />{" "}
            Debug guides
          </label>
          <button
            onClick={() => {
              setCompleted([]);
              setStorageError(!saveProgress([]));
            }}
          >
            Clear progress
          </button>
          <pre>
            {shapes
              .map(
                (s) =>
                  `${s.id}: x=${s.x.toFixed(1)} y=${s.y.toFixed(1)}${s.locked ? " [locked]" : ""}`,
              )
              .join("\n")}
          </pre>
        </details>
      )}
    </div>
  );
}
