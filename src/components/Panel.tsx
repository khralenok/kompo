import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
export function Panel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current!;
    el.showModal();
    return () => el.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="app-panel"
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="panel-heading">
        <h2>{title}</h2>
        <button onClick={onClose} aria-label={`Close ${title}`}>
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
