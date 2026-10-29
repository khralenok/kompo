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
import { validate } from "../game/validation";
import { settleControllerPosition } from "../game/guidance";
import { constrainPosition } from "../game/movement";
import {
  readDraft,
  readLearning,
  recordLearning,
  saveDraft,
} from "../game/session";
import type { InputMode } from "../game/session";
import type { Level, Shape, ValidationResult } from "../game/types";
export type CanvasWorkspaceHandle = {
  reset: () => void;
  complete: () => void;
  replayGuidance: () => void;
};
type Props = {
  level: Level;
  layoutKey: number;
  nextLabel: string;
  onNext: () => void;
  onInfo: () => void;
  onComplete: () => void;
  onShapesChange: (s: Shape[]) => void;
  debugGuides?: boolean;
  storageError?: boolean;
};
export const CanvasWorkspace = forwardRef<CanvasWorkspaceHandle, Props>(
  function CanvasWorkspace(
    {
      level,
      layoutKey,
      nextLabel,
      onNext,
      onInfo,
      onComplete,
      onShapesChange,
      debugGuides = false,
      storageError = false,
    },
    ref,
  ) {
    const [shapes, setShapes] = useState(() => readDraft(level));
    const [mode, setMode] = useState<InputMode>(() =>
      navigator.maxTouchPoints > 0 && matchMedia("(pointer: coarse)").matches
        ? "touch"
        : "mouse",
    );
    const [selected, setSelected] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<ValidationResult | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [hint, setHint] = useState(false);
    const [guideGuides, setGuideGuides] = useState(true);
    const [hintMessage, setHintMessage] = useState(false);
    const [guideActive, setGuideActive] = useState(() => {
      const l = readLearning();
      return (
        !l.lessons.includes(level.id) ||
        !l.controls.includes(
          navigator.maxTouchPoints > 0 &&
            matchMedia("(pointer: coarse)").matches
            ? "touch"
            : "mouse",
        )
      );
    });
    const [step, setStep] = useState<"select" | "move" | "check">(() =>
      readLearning().controls.includes(
        navigator.maxTouchPoints > 0 && matchMedia("(pointer: coarse)").matches
          ? "touch"
          : "mouse",
      )
        ? "check"
        : "select",
    );
    const [localStorageError, setLocalStorageError] = useState(false);
    const [storageDismissed, setStorageDismissed] = useState(false);
    const controllerStart = useRef<Shape | null>(null);
    const selectedAt = useRef<{ x: number; y: number } | null>(null);
    const toolbar = useRef<HTMLDivElement>(null);
    const shapeRef = useRef(shapes);
    shapeRef.current = shapes;
    const successful = feedback?.success === true;
    useEffect(() => onShapesChange(shapes), [shapes, onShapesChange]);
    useEffect(() => {
      const timer = setTimeout(() => {
        if (!saveDraft(level, shapes)) setLocalStorageError(true);
      }, 180);
      return () => clearTimeout(timer);
    }, [level, shapes]);
    useEffect(() => {
      const flush = () => saveDraft(level, shapeRef.current);
      window.addEventListener("pagehide", flush);
      return () => {
        flush();
        window.removeEventListener("pagehide", flush);
      };
    }, [level]);
    function stale() {
      setFeedback(null);
      setDismissed(false);
      setHintMessage(false);
    }
    function update(next: Shape[]) {
      setShapes(next);
      stale();
      if (guideActive && step === "move" && selectedAt.current) {
        const focus = next.find((s) => s.id === level.teaching.focusId)!;
        if (
          Math.hypot(
            focus.x - selectedAt.current.x,
            focus.y - selectedAt.current.y,
          ) >= 3
        )
          setStep("check");
      }
    }
    function select(id: string, input?: InputMode) {
      if (id !== selected) controllerStart.current = null;
      if (input) {
        setMode(input);
        if (!readLearning().controls.includes(input) && !guideActive) {
          setGuideActive(true);
          if (id === level.teaching.focusId) {
            const s = shapeRef.current.find((s) => s.id === id)!;
            selectedAt.current = { x: s.x, y: s.y };
            setStep("move");
          } else setStep("select");
        }
      }
      setSelected(id);
      if (guideActive && step === "select" && id === level.teaching.focusId) {
        const s = shapeRef.current.find((s) => s.id === id)!;
        selectedAt.current = { x: s.x, y: s.y };
        setStep("move");
      }
    }
    function acknowledge() {
      if (!recordLearning(level.id, mode)) setLocalStorageError(true);
      setGuideActive(false);
    }
    function replayGuidance() {
      setGuideActive(true);
      setGuideGuides(true);
      setStep("select");
      setSelected(null);
      setFeedback(null);
      setHintMessage(false);
      setDismissed(false);
    }
    function reset() {
      controllerStart.current = null;
      setShapes(level.shapes.map((s) => ({ ...s })));
      setSelected(null);
      stale();
      setHint(false);
      setHintMessage(false);
      if (guideActive)
        setStep(readLearning().controls.includes(mode) ? "check" : "select");
    }
    function check(bypass = false) {
      const result = bypass
        ? { success: true, message: "Completed through developer bypass." }
        : validate(level, shapes);
      setFeedback(result);
      setDismissed(false);
      setHintMessage(false);
      if (result.success && !successful) {
        if (!bypass) acknowledge();
        onComplete();
      }
    }
    useImperativeHandle(ref, () => ({
      reset,
      complete: () => check(true),
      replayGuidance,
    }));
    function dismiss() {
      setStorageDismissed(true);
      setDismissed(true);
      setHintMessage(false);
      toolbar.current
        ?.querySelector<HTMLButtonElement>(".canvas-check")
        ?.focus({ preventScroll: true });
    }
    function move(dx: number, dy: number) {
      if (!selected || successful) return;
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
      if (!hint || !selected || successful || !start) return;
      const next = shapeRef.current.map((s) => {
        if (s.id !== selected) return s;
        const p = settleControllerPosition(level, s, start);
        return constrainPosition(s, p.x, p.y, level.frame);
      });
      shapeRef.current = next;
      update(next);
    }
    const message = feedback && !dismissed ? feedback : null;
    const notice = message !== null || hintMessage;
    const relatedIds =
      message && !message.success
        ? shapes
            .filter((s) =>
              new RegExp(`\\bpiece ${s.id}\\b`, "i").test(message.message),
            )
            .map((s) => s.id)
        : guideActive && step !== "check"
          ? [level.teaching.focusId]
          : [];
    const focus = level.shapes.find((s) => s.id === level.teaching.focusId)!;
    const guidance =
      step === "select"
        ? `Select form ${focus.id}, the ${focus.fill === "#D8AF58" ? "ochre" : "red"} ${focus.type === "rectangle" && focus.width === focus.height ? "square" : focus.type}.`
        : step === "move"
          ? mode === "touch"
            ? "Tap the thumb pad to nudge. Hold an arrow to keep moving."
            : "Drag the selected form, or use the arrow keys to move it."
          : level.teaching.prompt;
    const storageWarning =
      (storageError || localStorageError) && !storageDismissed;
    const hasStatus = notice || (guideActive && !successful) || storageWarning;
    return (
      <section
        className={`canvas-section canvas-workspace ${mode === "touch" ? "touch-workspace" : ""}`}
        aria-label="Interactive composition canvas"
        data-guide-step={guideActive ? step : undefined}
        onKeyDown={(e) => {
          if (e.key === "Escape" && hasStatus) {
            e.preventDefault();
            if (notice) dismiss();
            else {
              setGuideActive(false);
              setStorageDismissed(true);
            }
          }
        }}
      >
        <div className="canvas-body">
          <div className="composition-stage">
            <Canvas
              level={level}
              layoutKey={layoutKey}
              shapes={shapes}
              onChange={update}
              guides={
                hint ||
                debugGuides ||
                (guideActive && step === "check" && guideGuides)
              }
              assist={hint}
              disabled={successful}
              highlightedIds={relatedIds}
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
              setGuideGuides(false);
              setHint(!hint);
              setHintMessage(!hint);
              setDismissed(true);
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
        <div
          className="workspace-announcements"
          aria-live="polite"
          aria-atomic="true"
        >
          {hasStatus && (
            <div
              className="workspace-message-area"
              tabIndex={0}
              role="region"
              aria-label="Exercise guidance and feedback"
            >
              <div className="canvas-notice">
                {notice ? (
                  <div
                    className={`${message ? "feedback" : "hint"} ${message?.success ? "success" : ""}`}
                  >
                    <div className="canvas-notice-heading">
                      <span className="eyebrow">
                        <Icon
                          name={
                            message?.success
                              ? "check_circle_outline"
                              : "lightbulb_outline"
                          }
                        />
                        {message
                          ? message.success
                            ? "RELATIONSHIP FOUND"
                            : "LOOK AGAIN"
                          : "A WAY TO SEE IT"}
                      </span>
                      <button
                        className="canvas-dismiss"
                        aria-label="Dismiss canvas message"
                        onClick={dismiss}
                      >
                        <Icon name="close" />
                      </button>
                    </div>
                    <p>{message?.message ?? level.hint}</p>
                  </div>
                ) : guideActive && !successful ? (
                  <div
                    className="onboarding"
                    aria-label="Lesson guidance"
                    data-step={step}
                  >
                    <div className="canvas-notice-heading">
                      <span className="eyebrow">
                        {step === "check" ? "THE PRINCIPLE" : "GETTING STARTED"}
                      </span>
                      <button className="skip-guidance" onClick={acknowledge}>
                        Skip guidance
                      </button>
                    </div>
                    <p className="teaching-concept">{level.teaching.concept}</p>
                    <p className="guide-action">{guidance}</p>
                  </div>
                ) : (
                  <div className="canvas-notice-heading">
                    <span className="eyebrow">SAVING PROGRESS</span>
                    <button
                      className="canvas-dismiss"
                      aria-label="Dismiss canvas message"
                      onClick={dismiss}
                    >
                      <Icon name="close" />
                    </button>
                  </div>
                )}
                {storageWarning && (
                  <p className="storage-warning">
                    Progress is available for this session.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        {mode === "touch" && (
          <ThumbController
            selectedId={selected}
            disabled={successful}
            onMove={move}
            onRelease={release}
          />
        )}
      </section>
    );
  },
);
