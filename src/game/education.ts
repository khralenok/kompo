import type { ChapterId } from "./types";
export type Teaching = { concept: string; prompt: string; focusId: string };
const teaching: Record<ChapterId, Teaching[]> = {
  alignment: [
    {
      concept: "Alignment connects forms along a shared axis.",
      prompt:
        "Bring the square onto the circle’s horizontal axis, then center the pair in the frame.",
      focusId: "B",
    },
    {
      concept: "The frame can be an alignment reference, too.",
      prompt:
        "Arrange the bars on the square frame’s vertical centerline, keeping them in order.",
      focusId: "A",
    },
    {
      concept:
        "Different-sized forms can share an edge even when their centers differ.",
      prompt:
        "Rest the circle and triangle on the square’s bottom edge. Watch the bottom-edge markers.",
      focusId: "B",
    },
    {
      concept: "A composition can use more than one axis.",
      prompt:
        "Connect each color to its own fixed anchor: red above, ochre below.",
      focusId: "C",
    },
    {
      concept: "Edges and centers can work together to build a structure.",
      prompt:
        "Align the bar’s left edge with the square and the circle with its horizontal center.",
      focusId: "B",
    },
  ],
  repetition: [
    {
      concept: "Repeating an interval turns separate forms into a pattern.",
      prompt:
        "Echo the gap between the fixed squares and complete the centered row.",
      focusId: "C",
    },
    {
      concept: "A consistent interval creates a repeated beat.",
      prompt:
        "Follow the equal interval brackets to continue the row of circles.",
      focusId: "B",
    },
    {
      concept: "A repeated motif can contain more than one form.",
      prompt:
        "Copy the square-and-circle pair, keeping both the small and large gaps consistent.",
      focusId: "C",
    },
    {
      concept:
        "A missing element becomes visible when a pattern is established.",
      prompt:
        "Complete the vertical bar-and-circle pattern in the two empty places.",
      focusId: "C",
    },
    {
      concept: "A whole arrangement can repeat as a single motif.",
      prompt:
        "Echo the black triangular group with the red circles on the right.",
      focusId: "D",
    },
  ],
  rhythm: [
    {
      concept: "Regular spacing creates a steady visual rhythm.",
      prompt: "Build an evenly spaced row of bars, centered in the frame.",
      focusId: "A",
    },
    {
      concept: "Gradually wider intervals create a progressive rhythm.",
      prompt:
        "Arrange the circles from small to large, widening the beat as you go.",
      focusId: "B",
    },
    {
      concept: "Alternating forms create a call-and-response rhythm.",
      prompt: "Alternate square and circle, keeping a steady interval.",
      focusId: "B",
    },
    {
      concept: "Scale and spacing can grow together while sharing a baseline.",
      prompt:
        "Rest the bars on one baseline, with wider intervals as they get taller.",
      focusId: "B",
    },
    {
      concept: "Two staggered sequences can create a layered rhythm.",
      prompt:
        "Build the upper beat and the lower offbeat, with equal spacing within each row.",
      focusId: "C",
    },
  ],
};
export function teachingFor(chapter: ChapterId, n: number) {
  return teaching[chapter][n - 1];
}
