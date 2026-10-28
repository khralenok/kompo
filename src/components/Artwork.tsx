export function Artwork({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? "artwork small" : "artwork"}
      viewBox="0 0 700 620"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="hatch"
          width="6"
          height="6"
          patternTransform="rotate(35)"
          patternUnits="userSpaceOnUse"
        >
          <line y2="6" stroke="#191919" strokeWidth="1" />
        </pattern>
      </defs>
      <circle cx="374" cy="305" r="205" fill="#191919" />
      <path d="M75 88L598 433L190 328Z" fill="#D12F26" />
      <path d="M218 31L567 488" stroke="#F2EFE6" strokeWidth="3" />
      <path d="M85 440L582 136" stroke="#191919" strokeWidth="2" />
      <rect
        x="88"
        y="422"
        width="260"
        height="42"
        fill="#D8AF58"
        transform="rotate(-31 88 422)"
      />
      <rect
        x="490"
        y="82"
        width="78"
        height="110"
        fill="url(#hatch)"
        transform="rotate(32 490 82)"
      />
      <circle cx="586" cy="476" r="22" fill="#D12F26" />
      <path d="M78 510H195M78 520H152" stroke="#191919" strokeWidth="5" />
      <path d="M355 532V580M331 556H379" stroke="#A6A39C" />
    </svg>
  );
}
