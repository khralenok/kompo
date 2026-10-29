import type { CSSProperties } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CanvasWorkspace } from "./components/CanvasWorkspace";
import type { CanvasWorkspaceHandle } from "./components/CanvasWorkspace";
import { Icon } from "./components/Icon";
import { Panel } from "./components/Panel";
import { Principle } from "./components/Principle";
import { chapters, levels } from "./game/levels";
import { readProgress, saveProgress } from "./game/storage";
import {
  clearDraft,
  clearLearning,
  exerciseHash,
  parseExerciseHash,
  readCurrent,
  saveCurrent,
} from "./game/session";
import type { Level, Shape } from "./game/types";
const ignoreShapeUpdates = () => {};
export default function App() {
  const [completed, setCompleted] = useState(readProgress);
  const [id, setId] = useState(
    () =>
      parseExerciseHash(location.hash) ??
      readCurrent() ??
      levels.find((l) => !readProgress().includes(l.id))?.id ??
      levels[0].id,
  );
  const [panel, setPanel] = useState<"studies" | "principle" | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [debugGuides, setDebugGuides] = useState(false);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const workspace = useRef<CanvasWorkspaceHandle>(null);
  const navigation = useRef<HTMLElement>(null);
  const [contextClearance, setContextClearance] = useState(180);
  useLayoutEffect(() => {
    const node = navigation.current!;
    const measure = () =>
      setContextClearance(Math.ceil(node.getBoundingClientRect().bottom) + 16);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [id]);
  const level = levels.find((l) => l.id === id)!;
  const index = levels.indexOf(level);
  const current = chapters.find((c) => c.id === level.chapter)!;
  const number =
    levels.filter((l) => l.chapter === level.chapter).indexOf(level) + 1;
  const debug = new URLSearchParams(location.search).get("debug") === "true";
  useEffect(() => {
    function change() {
      const next = parseExerciseHash(location.hash);
      if (next) {
        setId(next);
        setPanel(null);
      } else
        history.replaceState(
          null,
          "",
          `${location.pathname}${location.search}${exerciseHash(id)}`,
        );
    }
    window.addEventListener("hashchange", change);
    if (!parseExerciseHash(location.hash))
      history.replaceState(
        null,
        "",
        `${location.pathname}${location.search}${exerciseHash(id)}`,
      );
    return () => window.removeEventListener("hashchange", change);
  }, [id]);
  useEffect(() => {
    document.title = `${level.title} — KOMPO`;
    if (!saveCurrent(id)) setStorageError(true);
  }, [id, level.title]);
  function open(l: Level) {
    setPanel(null);
    if (l.id === id) return;
    setId(l.id);
    location.hash = exerciseHash(l.id);
  }
  function complete() {
    const next = [...new Set([...completed, id])];
    setCompleted(next);
    setStorageError(!saveProgress(next));
  }
  return (
    <div
      className="app app--workspace"
      style={
        { "--context-clearance": `${contextClearance}px` } as CSSProperties
      }
    >
      <header className="workspace-navigation" ref={navigation}>
        <button
          className="lessons-trigger"
          onClick={() => setPanel("studies")}
          aria-label="Choose an exercise"
          aria-haspopup="dialog"
        >
          <Icon name="menu" />
          <span>Lessons</span>
        </button>
        <div className="workspace-objective">
          <p className="lesson-location">
            {current.title} · {String(number).padStart(2, "0")} / 05
          </p>
          <h1>{level.title}</h1>
          <p className="objective">{level.objective}</p>
        </div>
      </header>
      <main className="workspace-main">
        <CanvasWorkspace
          key={id}
          ref={workspace}
          level={level}
          layoutKey={contextClearance}
          nextLabel={
            index === levels.length - 1
              ? "All studies"
              : number === 5
                ? "Next study"
                : "Next exercise"
          }
          onNext={() =>
            index === levels.length - 1
              ? setPanel("studies")
              : open(levels[index + 1])
          }
          onInfo={() => setPanel("principle")}
          onComplete={complete}
          onShapesChange={debug ? setShapes : ignoreShapeUpdates}
          debugGuides={debugGuides}
          storageError={storageError}
        />
      </main>
      {panel === "studies" && (
        <Panel title="Studies" onClose={() => setPanel(null)}>
          <div className="studies-list">
            {chapters.map((chapter) => (
              <section key={chapter.id}>
                <div className="study-heading">
                  <h3>
                    {chapter.number} {chapter.title}
                  </h3>
                  <span className="chapter-progress">
                    {
                      levels.filter(
                        (l) =>
                          l.chapter === chapter.id && completed.includes(l.id),
                      ).length
                    }{" "}
                    / 5 complete
                  </span>
                </div>
                {levels
                  .filter((l) => l.chapter === chapter.id)
                  .map((l, i) => (
                    <button
                      key={l.id}
                      onClick={() => open(l)}
                      aria-current={id === l.id ? "step" : undefined}
                    >
                      <span>{String(i + 1).padStart(2, "0")}</span>
                      <span>{l.title}</span>
                      <Icon
                        name={completed.includes(l.id) ? "check" : "north_east"}
                      />
                    </button>
                  ))}
              </section>
            ))}
          </div>
        </Panel>
      )}
      {panel === "principle" && (
        <Panel title={current.title} onClose={() => setPanel(null)}>
          <Principle
            chapter={current.id}
            onReplay={() => {
              setPanel(null);
              workspace.current?.replayGuidance();
            }}
          />
        </Panel>
      )}
      {debug && (
        <details className="debug workspace-debug">
          <summary>Developer tools</summary>
          <label>
            Jump to exercise{" "}
            <select
              value={index}
              onChange={(e) => open(levels[Number(e.target.value)])}
            >
              {levels.map((l, i) => (
                <option key={l.id} value={i}>
                  {l.id}: {l.title}
                </option>
              ))}
            </select>
          </label>
          <button onClick={() => workspace.current?.reset()}>
            Reset puzzle
          </button>
          <button onClick={() => workspace.current?.complete()}>
            Complete / bypass
          </button>
          <label>
            <input
              type="checkbox"
              checked={debugGuides}
              onChange={(e) => setDebugGuides(e.target.checked)}
            />
            Debug guides
          </label>
          <button
            onClick={() => {
              setCompleted([]);
              setStorageError(!saveProgress([]));
              clearDraft();
            }}
          >
            Clear progress
          </button>
          <button
            onClick={() => {
              clearLearning();
              workspace.current?.replayGuidance();
            }}
          >
            Replay onboarding
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
