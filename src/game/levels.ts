import type { ChapterId, Level, Rule, Shape } from "./types";
export const colors = {
  red: "#D12F26",
  black: "#191919",
  gray: "#A6A39C",
  ochre: "#D8AF58",
};
export const chapters: {
  id: ChapterId;
  number: string;
  title: string;
  description: string;
  lesson: string;
  demo: string;
}[] = [
  {
    id: "alignment",
    number: "01",
    title: "Alignment",
    description: "Find the invisible lines.",
    lesson:
      "Elements that share an axis feel connected. Align their centers or edges with each other—or with the frame itself. The space around a group is part of its composition.",
    demo: "Move the slider to bring scattered forms onto a common baseline.",
  },
  {
    id: "repetition",
    number: "02",
    title: "Repetition",
    description: "Give a form a familiar echo.",
    lesson:
      "Repeating a shape, color, or arrangement gives a composition a visual language. Consistent intervals help separate an intentional pattern from a collection of objects.",
    demo: "Move the slider to reveal a repeated motif with consistent spacing.",
  },
  {
    id: "rhythm",
    number: "03",
    title: "Rhythm",
    description: "Make the eye move.",
    lesson:
      "Rhythm carries the eye through a composition. A sequence can keep a steady beat, alternate between forms, or gradually change its intervals and scale.",
    demo: "Move the slider to turn a scattered arrangement into a progressive rhythm.",
  },
];
const s = (
  id: string,
  x: number,
  y: number,
  type: Shape["type"] = "rectangle",
  width = 60,
  height = 60,
  fill = colors.red,
  locked = false,
): Shape => ({
  id,
  x,
  y,
  type,
  width,
  height,
  fill,
  locked,
  rotation: 0,
  z: 1,
});
const align = (
  ids: string[],
  anchor: "x" | "y" | "bottom" | "left" = "y",
): Rule => ({ type: "align", ids, anchor, tolerance: 12 });
const gap = (
  a: string,
  b: string,
  distance: number,
  axis: "x" | "y" = "x",
): Rule => ({ type: "distance", a, b, axis, distance, tolerance: 14 });
const pos = (id: string, x: number, y: number): Rule => ({
  type: "position",
  id,
  x,
  y,
  tolerance: 16,
});
const line = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label?: string,
) => ({ x1, y1, x2, y2, label });
function level(
  chapter: ChapterId,
  n: number,
  title: string,
  objective: string,
  shapes: Shape[],
  rules: Rule[],
  solution: Level["solution"],
  hint: string,
  guides: Level["guides"],
  frame: Level["frame"] = { width: 800, height: 540, inset: 12 },
): Level {
  return {
    id: `${chapter}-${n}`,
    chapter,
    title,
    objective,
    instructions:
      "Drag the colored pieces. Black pieces with a small dot are fixed. Check when the relationships feel right.",
    frame,
    shapes,
    interactions: ["drag"],
    validation: { strategy: "relationships", rules },
    solution,
    hint,
    guides,
    success:
      (rules.some((r) => r.type === "frame")
        ? "The forms relate to each other and to the surrounding frame. "
        : "") +
      (chapter === "alignment"
        ? "A shared axis connects these forms into one composition."
        : chapter === "repetition"
          ? "The repeated motif and its intervals now form a consistent visual language."
          : "The sequence now carries the eye through a deliberate visual rhythm."),
  };
}
export const levels: Level[] = [
  level(
    "alignment",
    1,
    "A common ground",
    "Align the square and circle horizontally, then center the pair’s outer bounds within the frame.",
    [
      s("A", 220, 300, "circle", 100, 100, colors.black, true),
      s("B", 510, 170, "rectangle", 80, 80),
    ],
    [
      align(["A", "B"]),
      {
        type: "frame",
        ids: ["A", "B"],
        anchor: "x",
        position: 0.5,
        tolerance: 16,
      },
      {
        type: "frame",
        ids: ["A", "B"],
        anchor: "y",
        position: 0.5,
        tolerance: 12,
      },
    ],
    { B: { x: 590, y: 300 } },
    "Share the circle’s horizontal axis, then leave equal space outside the pair at the left and right frame edges.",
    [line(130, 300, 680, 300, "shared center")],
    { width: 800, height: 600, inset: 12 },
  ),
  level(
    "alignment",
    2,
    "A central axis",
    "Arrange the four bars on the square frame’s vertical centerline. Keep them at different heights.",
    [
      s("A", 180, 110, "bar", 100, 24, colors.red),
      s("B", 220, 220, "bar", 100, 24),
      s("C", 450, 320, "bar", 100, 24),
      s("D", 280, 420, "bar", 100, 24),
    ],
    [
      align(["A", "B", "C", "D"], "x"),
      { type: "sequence", ids: ["A", "B", "C", "D"], axis: "y", minGap: 60 },
      {
        type: "frame",
        ids: ["A", "B", "C", "D"],
        anchor: "x",
        position: 0.5,
        tolerance: 12,
      },
    ],
    {
      A: { x: 270, y: 110 },
      B: { x: 270, y: 220 },
      C: { x: 270, y: 320 },
      D: { x: 270, y: 420 },
    },
    "Use the vertical guide halfway across the frame. Keep the bars ordered from A to D, with clear space between them.",
    [line(270, 70, 270, 470, "frame centerline")],
    { width: 540, height: 540, inset: 12 },
  ),
  level(
    "alignment",
    3,
    "Different forms. One line.",
    "Rest the square, circle, and triangle on the same baseline.",
    [
      s("A", 170, 330, "rectangle", 90, 100, colors.black, true),
      s("B", 390, 200, "circle", 64, 64),
      s("C", 590, 270, "triangle", 110, 120, colors.ochre),
    ],
    [align(["A", "B", "C"], "bottom")],
    { B: { x: 390, y: 348 }, C: { x: 590, y: 320 } },
    "Rest the bottom of the circle and the triangle’s flat base on the black square’s bottom edge. The short edge markers turn green when aligned.",
    [line(100, 380, 680, 380, "baseline")],
  ),
  level(
    "alignment",
    4,
    "Two conversations",
    "Align the red forms with the upper anchor and ochre forms with the lower anchor.",
    [
      s("A", 140, 180, "circle", 55, 55, colors.black, true),
      s("B", 140, 370, "rectangle", 55, 55, colors.black, true),
      s("C", 340, 280),
      s("D", 570, 110, "bar", 100, 24),
      s("E", 360, 140, "circle", 70, 70, colors.ochre),
      s("F", 600, 290, "triangle", 70, 70, colors.ochre),
    ],
    [align(["A", "C", "D"]), align(["B", "E", "F"])],
    {
      C: { x: 340, y: 180 },
      D: { x: 570, y: 180 },
      E: { x: 360, y: 370 },
      F: { x: 600, y: 370 },
    },
    "Use the upper black anchor for the red forms and the lower black anchor for the ochre forms. Match their centerlines.",
    [line(90, 180, 700, 180), line(90, 370, 700, 370)],
  ),
  level(
    "alignment",
    5,
    "An invisible architecture",
    "Build a corner: align the tall bar’s left edge with the square, and the circle’s center with the square.",
    [
      s("A", 270, 300, "rectangle", 100, 100, colors.black, true),
      s("B", 520, 180, "bar", 30, 140),
      s("C", 570, 400, "circle", 80, 80, colors.ochre),
    ],
    [align(["A", "B"], "left"), align(["A", "C"])],
    { B: { x: 235, y: 140 }, C: { x: 570, y: 300 } },
    "Bring the red bar’s left edge onto the square’s left-edge guide. Align the ochre circle with the square’s horizontal centerline.",
    [line(220, 60, 220, 440, "left edge"), line(160, 300, 690, 300, "center")],
  ),
  level(
    "repetition",
    1,
    "The missing beat",
    "Complete the row with a third square at the same interval. Center the row within the frame.",
    [
      s("A", 180, 280, "rectangle", 65, 65, colors.black, true),
      s("B", 360, 280, "rectangle", 65, 65, colors.black, true),
      s("C", 580, 150, "rectangle", 65, 65),
    ],
    [
      align(["A", "B", "C"]),
      gap("B", "C", 180),
      {
        type: "frame",
        ids: ["A", "B", "C"],
        anchor: "x",
        position: 0.5,
        tolerance: 16,
      },
      {
        type: "frame",
        ids: ["A", "B", "C"],
        anchor: "y",
        position: 0.5,
        tolerance: 12,
      },
    ],
    { C: { x: 540, y: 280 } },
    "Repeat the spacing between the two fixed squares. Leave equal space outside the completed row at the frame’s sides.",
    [line(180, 280, 540, 280, "repeat this spacing"), line(540, 240, 540, 320)],
    { width: 720, height: 560, inset: 12 },
  ),
  level(
    "repetition",
    2,
    "Equal intervals",
    "Continue the row of circles with equal spacing, following the hint’s repeated beat.",
    [
      s("A", 170, 280, "circle", 64, 64, colors.black, true),
      s("B", 300, 170, "circle", 64, 64),
      s("C", 530, 360, "circle", 64, 64),
      s("D", 650, 200, "circle", 64, 64),
    ],
    [
      align(["A", "B", "C", "D"]),
      gap("A", "B", 140),
      gap("B", "C", 140),
      gap("C", "D", 140),
    ],
    { B: { x: 310, y: 280 }, C: { x: 450, y: 280 }, D: { x: 590, y: 280 } },
    "Follow the dashed circle outlines. Each interval bracket marks the same center-to-center spacing.",
    [line(170, 280, 590, 280, "equal intervals")],
  ),
  level(
    "repetition",
    3,
    "A motif of two",
    "Repeat the square-and-circle pair twice, keeping the same internal spacing.",
    [
      s("A", 150, 260, "rectangle", 60, 60, colors.black, true),
      s("B", 220, 260, "circle", 30, 30, colors.black, true),
      s("C", 400, 150),
      s("D", 330, 380, "circle", 30, 30),
      s("E", 580, 350),
      s("F", 680, 150, "circle", 30, 30),
    ],
    [
      pos("C", 350, 260),
      pos("D", 420, 260),
      pos("E", 550, 260),
      pos("F", 620, 260),
    ],
    {
      C: { x: 350, y: 260 },
      D: { x: 420, y: 260 },
      E: { x: 550, y: 260 },
      F: { x: 620, y: 260 },
    },
    "Echo the fixed square-and-circle pair. Keep the same small gap inside each pair and the same larger gap between pairs.",
    [
      line(
        150,
        260,
        620,
        260,
        "square · circle / square · circle / square · circle",
      ),
    ],
  ),
  level(
    "repetition",
    4,
    "Fill the silence",
    "Fill the two gaps in the vertical sequence of alternating bars and circles.",
    [
      s("A", 400, 90, "bar", 100, 22, colors.black, true),
      s("B", 400, 170, "circle", 36, 36, colors.black, true),
      s("C", 220, 220, "bar", 100, 22),
      s("D", 400, 330, "circle", 36, 36, colors.black, true),
      s("E", 590, 350, "bar", 100, 22),
    ],
    [pos("C", 400, 250), pos("E", 400, 410)],
    { C: { x: 400, y: 250 }, E: { x: 400, y: 410 } },
    "Follow the evenly spaced vertical pattern. Put a bar between the circles and another bar below the last circle.",
    [line(400, 70, 400, 440, "equal intervals")],
  ),
  level(
    "repetition",
    5,
    "A repeated constellation",
    "Make the red group echo the black triangle of circles on the right-hand side of the frame.",
    [
      s("A", 160, 330, "circle", 44, 44, colors.black, true),
      s("B", 240, 190, "circle", 44, 44, colors.black, true),
      s("C", 320, 330, "circle", 44, 44, colors.black, true),
      s("D", 460, 170, "circle", 44, 44),
      s("E", 600, 360, "circle", 44, 44),
      s("F", 680, 200, "circle", 44, 44),
    ],
    [pos("D", 500, 330), pos("E", 580, 190), pos("F", 660, 330)],
    { D: { x: 500, y: 330 }, E: { x: 580, y: 190 }, F: { x: 660, y: 330 } },
    "Copy the black group’s configuration and spacing: one high circle between two lower circles. The dashed outlines show the matching motif.",
    [
      line(500, 330, 580, 190),
      line(580, 190, 660, 330),
      line(500, 330, 660, 330),
    ],
  ),
  level(
    "rhythm",
    1,
    "A steady pulse",
    "Make an evenly spaced row of four bars, centered horizontally and vertically in the frame. Use the hint’s beat as a guide.",
    [
      s("A", 200, 280, "bar", 24, 100, colors.red),
      s("B", 300, 150, "bar", 24, 100),
      s("C", 500, 370, "bar", 24, 100),
      s("D", 640, 180, "bar", 24, 100),
    ],
    [
      align(["A", "B", "C", "D"]),
      {
        type: "frame",
        ids: ["A", "B", "C", "D"],
        anchor: "x",
        position: 0.5,
        tolerance: 12,
      },
      {
        type: "frame",
        ids: ["A", "B", "C", "D"],
        anchor: "y",
        position: 0.5,
        tolerance: 12,
      },
      gap("A", "B", 130),
      gap("B", "C", 130),
      gap("C", "D", 130),
    ],
    {
      A: { x: 205, y: 280 },
      B: { x: 335, y: 280 },
      C: { x: 465, y: 280 },
      D: { x: 595, y: 280 },
    },
    "Follow the equal interval brackets and center the row in the frame. Every bar is movable.",
    [line(205, 280, 595, 280, "equal beats")],
    { width: 800, height: 560, inset: 12 },
  ),
  level(
    "rhythm",
    2,
    "Gathering momentum",
    "Arrange the circles from small to large, with gradually wider spaces between their centers. Follow the hint’s expanding beat.",
    [
      s("A", 160, 280, "circle", 30, 30, colors.black, true),
      s("B", 290, 160, "circle", 45, 45),
      s("C", 480, 390, "circle", 65, 65),
      s("D", 640, 160, "circle", 90, 90),
    ],
    [
      align(["A", "B", "C", "D"]),
      gap("A", "B", 90),
      gap("B", "C", 140),
      gap("C", "D", 190),
    ],
    { B: { x: 250, y: 280 }, C: { x: 390, y: 280 }, D: { x: 580, y: 280 } },
    "Use the dashed outlines and interval brackets: start with a short beat, then a wider beat, then the widest beat.",
    [line(160, 280, 580, 280, "gradually wider")],
  ),
  level(
    "rhythm",
    3,
    "Call and response",
    "Create an evenly spaced square–circle–square–circle sequence. Follow the hint’s repeated beat.",
    [
      s("A", 180, 280, "rectangle", 65, 65, colors.black, true),
      s("B", 590, 160, "circle", 50, 50),
      s("C", 300, 380, "rectangle", 65, 65),
      s("D", 460, 160, "circle", 50, 50),
    ],
    [
      align(["A", "B", "C", "D"]),
      gap("A", "B", 140),
      gap("B", "C", 140),
      gap("C", "D", 140),
      { type: "sequence", ids: ["A", "B", "C", "D"], axis: "x", minGap: 100 },
    ],
    { B: { x: 320, y: 280 }, C: { x: 460, y: 280 }, D: { x: 600, y: 280 } },
    "Alternate the two shapes. The first circle follows the black square.",
    [line(180, 280, 600, 280, "square / circle / square / circle")],
  ),
  level(
    "rhythm",
    4,
    "A rising cadence",
    "Arrange the bars from short to tall on the baseline, with gradually wider spacing. Follow the hint’s expanding beat.",
    [
      s("A", 150, 340, "bar", 30, 60, colors.black, true),
      s("B", 310, 160, "bar", 30, 110),
      s("C", 470, 230, "bar", 30, 160),
      s("D", 650, 200, "bar", 30, 210),
    ],
    [
      align(["A", "B", "C", "D"], "bottom"),
      gap("A", "B", 100),
      gap("B", "C", 140),
      gap("C", "D", 180),
    ],
    { B: { x: 250, y: 315 }, C: { x: 390, y: 290 }, D: { x: 570, y: 265 } },
    "Rest all four bottom edges on the shared baseline. Follow the brackets to widen the spacing as the bars get taller.",
    [line(100, 370, 660, 370, "shared baseline · widening intervals")],
  ),
  level(
    "rhythm",
    5,
    "A rhythm in two voices",
    "Build two staggered rows: red circles on the upper beat, ochre squares on the lower offbeat.",
    [
      s("A", 160, 210, "circle", 45, 45, colors.black, true),
      s("B", 250, 340, "rectangle", 45, 45, colors.black, true),
      s("C", 360, 390, "circle", 65, 65),
      s("D", 580, 150, "circle", 85, 85),
      s("E", 390, 150, "rectangle", 45, 45, colors.ochre),
      s("F", 650, 390, "rectangle", 45, 45, colors.ochre),
    ],
    [
      pos("C", 340, 210),
      pos("D", 520, 210),
      pos("E", 430, 340),
      pos("F", 610, 340),
    ],
    {
      C: { x: 340, y: 210 },
      D: { x: 520, y: 210 },
      E: { x: 430, y: 340 },
      F: { x: 610, y: 340 },
    },
    "Repeat equal spacing in each row. Place each lower square halfway between the upper circles, continuing after the last circle.",
    [
      line(160, 210, 600, 210, "upper beat"),
      line(250, 340, 670, 340, "lower offbeat"),
    ],
  ),
];
