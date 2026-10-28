export type ChapterId = "alignment" | "repetition" | "rhythm";
export type Shape = {
  id: string;
  type: "rectangle" | "circle" | "bar" | "triangle";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  z: number;
  locked?: boolean;
  axis?: "x" | "y";
};
export type Anchor = "x" | "y" | "left" | "right" | "top" | "bottom";
export type Frame = { width: number; height: number; inset: number };
export type Rule =
  | {
      type: "frame";
      ids: string[];
      anchor: Anchor;
      position: number;
      tolerance: number;
    }
  | { type: "align"; ids: string[]; anchor: Anchor; tolerance: number }
  | {
      type: "distance";
      a: string;
      b: string;
      axis: "x" | "y";
      distance: number;
      tolerance: number;
    }
  | { type: "position"; id: string; x?: number; y?: number; tolerance: number }
  | { type: "sequence"; ids: string[]; axis: "x" | "y"; minGap: number };
export type ValidationResult = {
  success: boolean;
  score?: number;
  message: string;
  details?: Record<string, unknown>;
};
export type Level = {
  id: string;
  chapter: ChapterId;
  title: string;
  objective: string;
  instructions: string;
  frame: Frame;
  shapes: Shape[];
  interactions: ["drag"];
  validation: { strategy: "relationships"; rules: Rule[] };
  hint: string;
  success: string;
  solution: Record<string, { x: number; y: number }>;
  guides: { x1: number; y1: number; x2: number; y2: number; label?: string }[];
};
