// Google Material Icons, Sharp, 24px. Apache-2.0.
// Original SVGs and license: src/assets/material-icons.
const paths = {
  menu: ["M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"],
  info_outline: [
    "M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z",
  ],
  check_circle_outline: [
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z",
  ],
  arrow_downward: [
    "M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z",
  ],
  arrow_back: ["M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"],
  north_east: ["M9,5v2h6.59L4,18.59L5.41,20L17,8.41V15h2V5H9z"],
  check: ["M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"],
  replay: [
    "M12,5V1L7,6l5,5V7c3.31,0,6,2.69,6,6s-2.69,6-6,6s-6-2.69-6-6H4c0,4.42,3.58,8,8,8s8-3.58,8-8S16.42,5,12,5z",
  ],
  close: [
    "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z",
  ],
  arrow_forward: [
    "M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z",
  ],
  lightbulb_outline: [
    "M9 22h6v-2H9v2zm1.54-19.85c-2.75.56-4.94 2.81-5.43 5.58-.51 2.89.76 5.52 2.89 7.01V18h8v-3.26c1.81-1.27 3-3.36 3-5.74 0-4.34-3.97-7.77-8.46-6.85zm4.31 10.95l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z",
  ],
} as const;
export type IconName = keyof typeof paths;
export function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      className={`material-icon ${className}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      data-icon={name}
    >
      {paths[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
