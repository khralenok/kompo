// Individually authored from kompo-sensei/07-meditative.png.
export function MeditativePose() {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <g data-part="accent" fill="#D82E25">
        <circle cx="215" cy="42" r="25" fill="#D8AF58" />
      </g>
      <g data-part="body" transform="rotate(0 128 150)">
        <path d="M84 57h87l44 174H40Z" fill="#191918" />
        <path d="M89 64h77l36 152H55Z" fill="#F4E5C5" />
        <path d="m82 216 25-54 20 54 M137 216l24-57 30 57Z" fill="#C9BEA3" />
        <path d="m110 166 17 69h10l14-69Z" fill="#F4E5C5" />
        <g stroke="#A78D61" opacity=".22" strokeWidth="1">
          <path d="m94 76 3 3m45-5 2 5m-30 30 4-2m60 80 4 3m-88-5 2 4m42-6 3 2m-13 20 2 4m26-60 2 3m-59 0 3-2" />
        </g>
        <g data-part="brows" transform="translate(0 -9)" fill="#191918">
          <path d="m67 62 49 35-18 29-53-26Z M143 97l48-35 24 38-53 26Z" />
        </g>
        <g data-part="eyes" fill="#191918">
          <path
            d="M77 126 Q91 151 105 126 M151 126 Q165 151 179 126"
            fill="none"
            stroke="#191918"
            strokeWidth="6"
          />
        </g>
        <circle cx="128" cy="144" r="15" fill="#D82E25" />
        <path d="M113 164h31" stroke="#191918" strokeWidth="7" />
      </g>
      <g data-part="prop"></g>
    </svg>
  );
}
export const reaction = {
  tilt: 1,
  brow: 2,
  part: "accent",
  duration: 0.54,
} as const;
