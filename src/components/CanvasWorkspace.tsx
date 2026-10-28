import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode, RefObject } from "react";
import { Canvas } from "./Canvas";
import { Icon } from "./Icon";
import { anchor, validate } from "../game/validation";
import type { Level, Shape, ValidationResult } from "../game/types";

export type CanvasWorkspaceHandle = { reset: () => void; complete: () => void };
type Props = {
  level: Level;
  nextLabel: string;
  onNext: () => void;
  onComplete: () => void;
  onShapesChange: (shapes: Shape[]) => void;
  debugGuides?: boolean;
  storageError?: boolean;
};

// Keep the popup away from the composition. If every corner is occupied (or the
// screen is narrow), dock it inside the workspace below the frame instead.
function CanvasNotice({
  level,
  shapes,
  children,
  bodyRef,
}: {
  level: Level;
  shapes: Shape[];
  children: ReactNode;
  bodyRef: RefObject<HTMLDivElement | null>;
}) {
  const card = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  useLayoutEffect(() => {
    const body = bodyRef.current;
    const node = card.current;
    if (!body || !node) return;
    function place() {
      const bodyBox = body!.getBoundingClientRect();
      const svg = body!.querySelector("svg.puzzle-svg") as SVGSVGElement | null;
      const matrix = svg?.getScreenCTM();
      if (!matrix) return;
      const stageHeight = body!
        .querySelector(".composition-stage")!
        .getBoundingClientRect().height;
      const w = node!.offsetWidth;
      const h = node!.offsetHeight;
      if (bodyBox.width < 620) {
        setPosition(null);
        return;
      }
      const candidates = [
        { left: 14, top: 14 },
        { left: bodyBox.width - w - 14, top: 14 },
        { left: 14, top: stageHeight - h - 14 },
        { left: bodyBox.width - w - 14, top: stageHeight - h - 14 },
      ];
      const free = candidates.find(
        (p) =>
          p.left >= 0 &&
          p.top >= 0 &&
          shapes.every((s) => {
            const a = new DOMPoint(
              anchor(s, "left"),
              anchor(s, "top"),
            ).matrixTransform(matrix);
            const b = new DOMPoint(
              anchor(s, "right"),
              anchor(s, "bottom"),
            ).matrixTransform(matrix);
            return (
              p.left + w < a.x - bodyBox.x - 14 ||
              p.left > b.x - bodyBox.x + 14 ||
              p.top + h < a.y - bodyBox.y - 14 ||
              p.top > b.y - bodyBox.y + 28
            );
          }),
      );
      setPosition(free ?? null);
    }
    place();
    const observer = new ResizeObserver(place);
    observer.observe(body);
    observer.observe(node);
    return () => observer.disconnect();
  }, [level, shapes, children, bodyRef]);
  return (
    <div
      className={`canvas-notice-layer ${position ? "floating" : "docked"}`}
      style={position ? { left: position.left, top: position.top } : undefined}
    >
      <div ref={card} className="canvas-notice">
        {children}
      </div>
    </div>
  );
}

export const CanvasWorkspace = forwardRef<CanvasWorkspaceHandle, Props>(
  function CanvasWorkspace(
    {
      level,
      nextLabel,
      onNext,
      onComplete,
      onShapesChange,
      debugGuides = false,
      storageError = false,
    },
    ref,
  ) {
    const [shapes, setShapes] = useState(() =>
      level.shapes.map((s) => ({ ...s })),
    );
    const [feedback, setFeedback] = useState<ValidationResult | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [hint, setHint] = useState(false);
    const [hintMessage, setHintMessage] = useState(false);
    const body = useRef<HTMLDivElement>(null);
    const toolbar = useRef<HTMLDivElement>(null);
    const noticeShown = (!dismissed && feedback !== null) || hintMessage;
    const successful = feedback?.success === true;
    useEffect(() => onShapesChange(shapes), [shapes, onShapesChange]);
    function reset() {
      setShapes(level.shapes.map((s) => ({ ...s })));
      setFeedback(null);
      setDismissed(false);
      setHint(false);
      setHintMessage(false);
    }
    function check(bypass = false) {
      const result = bypass
        ? { success: true, message: "Completed through developer bypass." }
        : validate(level, shapes);
      setFeedback(result);
      setDismissed(false);
      setHintMessage(false);
      if (result.success && !successful) onComplete();
    }
    useImperativeHandle(ref, () => ({ reset, complete: () => check(true) }));
    function dismiss() {
      setDismissed(true);
      setHintMessage(false);
      toolbar.current
        ?.querySelector<HTMLButtonElement>(".canvas-check")
        ?.focus({ preventScroll: true });
    }
    function update(next: Shape[]) {
      setShapes(next);
      setFeedback(null);
      setDismissed(false);
      setHintMessage(false);
    }
    function toggleHint() {
      setHint(!hint);
      setHintMessage(!hint);
      setDismissed(true);
    }
    const message = feedback && !dismissed ? feedback : null;
    const title = message
      ? message.success
        ? "RELATIONSHIP FOUND"
        : "LOOK AGAIN"
      : "A WAY TO SEE IT";
    // An explicit piece reference lets any validator point at a form without
    // coupling the workspace to a particular validation algorithm.
    const relatedIds =
      message && !message.success
        ? shapes
            .filter((s) =>
              new RegExp(`\\bpiece ${s.id}\\b`, "i").test(message.message),
            )
            .map((s) => s.id)
        : [];
    return (
      <section
        className="canvas-section canvas-workspace"
        aria-label="Interactive composition canvas"
        onKeyDown={(e) => {
          if (e.key === "Escape" && noticeShown) {
            e.preventDefault();
            dismiss();
          }
        }}
      >
        <div className="canvas-top">
          <span>{level.title}</span>
          <span className="canvas-status">
            {successful && <Icon name="check_circle_outline" />}
            {successful ? "COMPOSITION COMPLETE" : "DRAG TO ARRANGE"}
          </span>
        </div>
        <div
          ref={toolbar}
          className="canvas-toolbar"
          role="toolbar"
          aria-label="Canvas controls"
        >
          <div className="canvas-tools">
            <button onClick={reset}>
              <Icon name="replay" />
              Reset
            </button>
            <button aria-pressed={hint} onClick={toggleHint}>
              <Icon name={hint ? "close" : "lightbulb_outline"} />
              {hint ? "Hide hint" : "Show hint"}
            </button>
          </div>
          <button
            className="primary canvas-check"
            onClick={successful ? onNext : () => check()}
          >
            {successful ? nextLabel : "Check composition"}
          </button>
        </div>
        <div className="canvas-body" ref={body}>
          <div className="composition-stage">
            <Canvas
              level={level}
              shapes={shapes}
              onChange={update}
              guides={hint || debugGuides}
              assist={hint}
              disabled={successful}
              highlightedIds={relatedIds}
            />
          </div>
          <div
            className="canvas-announcements"
            aria-live="polite"
            aria-atomic="true"
          >
            {noticeShown && (
              <CanvasNotice level={level} shapes={shapes} bodyRef={body}>
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
                      {title}
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
                  {!message && (
                    <p className="hint-instructions">
                      Dashed outlines show where to aim. Pieces gently snap near
                      a guide.
                    </p>
                  )}
                </div>
              </CanvasNotice>
            )}
          </div>
        </div>
        <div className="canvas-bottom">
          <span>
            <i className="legend-dot fixed" /> FIXED FORM{" "}
            <i className="legend-dot moving" /> MOVABLE FORM
          </span>
          <span>
            {level.frame.width} × {level.frame.height}
          </span>
        </div>
        <div className="canvas-help">
          Drag colored forms. Tab to a form and use arrow keys to move it. Shift
          makes larger steps.
        </div>
        {storageError && (
          <p className="canvas-storage quiet" role="status">
            Progress is saved for this session. Browser storage is unavailable.
          </p>
        )}
      </section>
    );
  },
);
