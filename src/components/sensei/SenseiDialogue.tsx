import { useEffect, useRef, type ReactNode } from "react";
import { Sensei } from "./Sensei";
import type { SenseiPose } from "./poses";
import { Icon } from "../Icon";
export function SenseiDialogue({
  pose,
  dialogueKey,
  title,
  onClose,
  milestone,
  children,
}: {
  pose: SenseiPose;
  dialogueKey: string | number;
  title: string;
  onClose: () => void;
  milestone?: "exercise" | "section" | "course";
  children: ReactNode;
}) {
  const root = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = root.current!;
    const previous = document.activeElement as HTMLElement | null;
    el.showModal();
    return () => {
      el.close();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={root}
      className="sensei-modal"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`sensei-speech ${milestone === "section" || milestone === "course" ? "sensei-speech--celebration" : ""}`}
      >
        <Sensei pose={pose} dialogueKey={dialogueKey} />
        <div className="sensei-speech-copy">
          <button
            className="canvas-dismiss"
            onClick={onClose}
            aria-label="Dismiss dialogue"
          >
            <Icon name="close" />
          </button>
          <h2 data-milestone={milestone}>{title}</h2>
          {children}
        </div>
      </div>
    </dialog>
  );
}
