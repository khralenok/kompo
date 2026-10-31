import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Canvas } from "./Canvas";
import { Icon } from "./Icon";
import { ThumbController } from "./ThumbController";
import { SenseiDialogue } from "./sensei/SenseiDialogue";
import {
  completionDialogue,
  mistakeDialogue,
  type Dialogue,
} from "../game/dialogue";
import { validate } from "../game/validation";
import { settleControllerPosition } from "../game/guidance";
import { constrainPosition } from "../game/movement";
import type { InputMode } from "../game/session";
import type { Level, Shape, ValidationResult } from "../game/types";
export type CanvasWorkspaceHandle = {
  reset: () => void;
  complete: () => void;
  replayGuidance: () => void;
};
type Props = {
  level: Level;
  completed: string[];
  panelOpen: boolean;
  layoutKey: number;
  nextLabel: string;
  onNext: () => void;
  onInfo: () => void;
  onComplete: () => void;
  onShapesChange: (s: Shape[]) => void;
  debugGuides?: boolean;
};
type MessageKind = "intro" | "hint" | "feedback" | "idle";
export const CanvasWorkspace = forwardRef<CanvasWorkspaceHandle, Props>(
  function CanvasWorkspace(
    {
      level,
      completed,
      panelOpen,
      layoutKey,
      nextLabel,
      onNext,
      onInfo,
      onComplete,
      onShapesChange,
      debugGuides = false,
    },
    ref,
  ) {
    const [shapes, setShapes] = useState(() =>
      level.shapes.map((s) => ({ ...s })),
    );
    const [mode, setMode] = useState<InputMode>(() =>
      navigator.maxTouchPoints > 0 && matchMedia("(pointer: coarse)").matches
        ? "touch"
        : "mouse",
    );
    const [selected, setSelected] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<ValidationResult | null>(null);
    const [celebration, setCelebration] = useState<Dialogue | null>(null);
    const [mistakes, setMistakes] = useState(0);
    const [hint, setHint] = useState(false);
    const [dialogue, setDialogue] = useState<MessageKind | null>("intro");
    const [dialogueEvent, setDialogueEvent] = useState(0);
    const idleOffered = useRef(false);
    const controllerStart = useRef<Shape | null>(null);
    const toolbar = useRef<HTMLDivElement>(null);
    const shapeRef = useRef(shapes);
    shapeRef.current = shapes;
    const successful = feedback?.success === true;
    useEffect(() => onShapesChange(shapes), [shapes, onShapesChange]);
    function showDialogue(kind: MessageKind) {
      controllerStart.current = null;
      setDialogue(kind);
      setDialogueEvent((n) => n + 1);
    }
    function dismiss() {
      // Hints are read once; only their useful canvas guides remain during play.
      if (dialogue === "hint") setHint(true);
      setDialogue(null);
    }
    function update(next: Shape[]) {
      setShapes(next);
      setFeedback(null);
    }
    function select(id: string, input?: InputMode) {
      if (id !== selected) controllerStart.current = null;
      if (input) setMode(input);
      setSelected(id);
    }
    function replayGuidance() {
      showDialogue("intro");
    }
    function reset() {
      controllerStart.current = null;
      setMistakes(0);
      setCelebration(null);
      setShapes(level.shapes.map((s) => ({ ...s })));
      setSelected(null);
      setFeedback(null);
      setHint(false);
    }
    function check(bypass = false) {
      const result = bypass
        ? { success: true, message: "Completed through developer bypass." }
        : validate(level, shapes);
      if (result.success)
        setCelebration(completionDialogue(level, completed, mistakes));
      else setMistakes((n) => n + 1);
      setFeedback(result);
      showDialogue("feedback");
      if (result.success && !successful) onComplete();
    }
    useImperativeHandle(ref, () => ({
      reset,
      complete: () => check(true),
      replayGuidance,
    }));
    function move(dx: number, dy: number) {
      if (!selected || successful || dialogue) return;
      if (!controllerStart.current)
        controllerStart.current =
          shapeRef.current.find((s) => s.id === selected) ?? null;
      const next = shapeRef.current.map((s) =>
        s.id === selected
          ? constrainPosition(s, s.x + dx, s.y + dy, level.frame)
          : s,
      );
      shapeRef.current = next;
      update(next);
    }
    function release() {
      const start = controllerStart.current;
      controllerStart.current = null;
      if (!hint || !selected || successful || !start || dialogue) return;
      const next = shapeRef.current.map((s) =>
        s.id === selected
          ? constrainPosition(s, ...position(s, start), level.frame)
          : s,
      );
      shapeRef.current = next;
      update(next);
    }
    function position(s: Shape, start: Shape): [number, number] {
      const p = settleControllerPosition(level, s, start);
      return [p.x, p.y];
    }
    useEffect(() => {
      if (panelOpen || dialogue || successful || idleOffered.current) return;
      let timer: ReturnType<typeof setTimeout>;
      function arm() {
        clearTimeout(timer);
        if (document.visibilityState === "visible")
          timer = setTimeout(() => {
            idleOffered.current = true;
            showDialogue("idle");
          }, 60000);
      }
      const events = [
        "pointerdown",
        "pointermove",
        "keydown",
        "wheel",
      ] as const;
      events.forEach((event) =>
        window.addEventListener(event, arm, { passive: true }),
      );
      document.addEventListener("visibilitychange", arm);
      arm();
      return () => {
        clearTimeout(timer);
        events.forEach((event) => window.removeEventListener(event, arm));
        document.removeEventListener("visibilitychange", arm);
      };
    }, [panelOpen, dialogue, successful, shapes, selected]);
    const reaction = feedback?.success
      ? celebration
      : mistakeDialogue(mistakes);
    const content: Dialogue =
      dialogue === "intro"
        ? { pose: "teaching", title: level.title, text: level.objective }
        : dialogue === "hint"
          ? { pose: "thoughtful", title: "A way to see it", text: level.hint }
          : dialogue === "idle"
            ? {
                pose: "observant",
                title: "Want a clue?",
                text: "Take your time. I can offer a different way to look at this composition.",
              }
            : {
                pose: reaction?.pose ?? "patient",
                title: reaction?.title ?? "Take another look.",
                text: feedback?.success
                  ? (celebration?.text ?? feedback.message)
                  : (feedback?.message ?? ""),
                milestone: feedback?.success
                  ? celebration?.milestone
                  : undefined,
              };
    return (
      <section
        className={`canvas-section canvas-workspace ${mode === "touch" && !successful ? "touch-workspace" : ""}`}
        aria-label="Interactive composition canvas"
      >
        <div className="canvas-body">
          <div className="composition-stage">
            <Canvas
              level={level}
              layoutKey={layoutKey}
              shapes={shapes}
              onChange={update}
              guides={hint || debugGuides}
              assist={hint}
              disabled={successful || !!dialogue}
              highlightedIds={[]}
              selectedId={selected}
              onSelect={select}
              onTouch={() => setMode("touch")}
            />
          </div>
        </div>
        <div
          className="canvas-toolbar"
          ref={toolbar}
          role="toolbar"
          aria-label="Canvas controls"
          aria-orientation="horizontal"
          onKeyDown={(e) => {
            const keys = ["ArrowLeft", "ArrowRight"];
            if (![...keys, "Home", "End"].includes(e.key)) return;
            const buttons = [
              ...e.currentTarget.querySelectorAll<HTMLButtonElement>(
                "button:not(:disabled)",
              ),
            ];
            const i = buttons.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            const next =
              e.key === "Home"
                ? 0
                : e.key === "End"
                  ? buttons.length - 1
                  : (i + (e.key === keys[0] ? -1 : 1) + buttons.length) %
                    buttons.length;
            e.preventDefault();
            buttons[next]?.focus();
          }}
        >
          <button
            className="tool-button"
            onClick={reset}
            aria-label="Reset"
            data-tooltip="Reset"
          >
            <Icon name="replay" />
          </button>
          <button
            className="tool-button"
            aria-label={hint ? "Hide hint" : "Show hint"}
            data-tooltip={hint ? "Hide hint" : "Show hint"}
            aria-pressed={hint}
            onClick={() => {
              if (hint) setHint(false);
              else showDialogue("hint");
            }}
          >
            <Icon name="lightbulb_outline" />
          </button>
          <button
            className="tool-button"
            onClick={onInfo}
            aria-label="About this principle"
            data-tooltip="Lesson info"
          >
            <Icon name="info_outline" />
          </button>
          <span className="tool-divider" aria-hidden="true" />
          <button
            className="primary canvas-check"
            aria-label={successful ? nextLabel : "Check composition"}
            data-tooltip={successful ? nextLabel : "Check composition"}
            onClick={successful ? onNext : () => check()}
          >
            <Icon
              name={
                successful
                  ? nextLabel === "All studies"
                    ? "menu"
                    : "arrow_forward"
                  : "check_circle_outline"
              }
            />
          </button>
        </div>

        {dialogue && !panelOpen && (
          <SenseiDialogue
            key={`${level.id}:${dialogue}:${dialogueEvent}`}
            pose={content.pose}
            dialogueKey={`${level.id}:${dialogue}:${dialogueEvent}`}
            title={content.title}
            onClose={dismiss}
            milestone={content.milestone}
          >
            <p>{content.text}</p>
            {dialogue === "intro" && (
              <p className="sensei-controls">
                {mode === "touch"
                  ? "Tap a form to select it, then use the thumb pad to move it."
                  : "Drag forms to arrange them, or select one and use the arrow keys."}
              </p>
            )}
            {dialogue === "intro" ? (
              <button className="primary" onClick={dismiss}>
                Start composing
              </button>
            ) : dialogue === "hint" ? (
              <button className="primary" onClick={dismiss}>
                Try it
              </button>
            ) : dialogue === "idle" ||
              (dialogue === "feedback" && !successful && mistakes >= 2) ? (
              <>
                <button
                  className="primary"
                  onClick={() => showDialogue("hint")}
                >
                  Show me a hint
                </button>
                <button className="sensei-action" onClick={dismiss}>
                  Keep exploring
                </button>
              </>
            ) : dialogue === "feedback" && successful ? (
              <button className="primary" onClick={onNext}>
                {nextLabel === "All studies" ? "Explore studies" : "Continue"}
              </button>
            ) : (
              <button className="primary" onClick={dismiss}>
                Try again
              </button>
            )}
          </SenseiDialogue>
        )}
        {mode === "touch" && !successful && (
          <ThumbController
            selectedId={selected}
            disabled={!!dialogue}
            onMove={move}
            onRelease={release}
          />
        )}
      </section>
    );
  },
);
