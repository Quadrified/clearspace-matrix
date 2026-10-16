/** Decorative tilted coordinate board in the four quadrant colours. */
export function AxisBoard() {
  return (
    <svg
      className="axis-board"
      viewBox="0 0 240 200"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <g transform="rotate(-8 120 100)">
        <rect className="axis-card" x="18" y="14" width="204" height="172" rx="18" />
        <rect x="30" y="26" width="90" height="72" rx="8" fill="#d9775b" opacity="0.85" />
        <rect x="124" y="26" width="86" height="72" rx="8" fill="#6fa27c" opacity="0.85" />
        <rect x="30" y="102" width="90" height="72" rx="8" fill="#e0b455" opacity="0.85" />
        <rect x="124" y="102" width="86" height="72" rx="8" fill="#a597cb" opacity="0.85" />
        <g className="axis-grid">
          <path d="M75 26v148M167 26v148M30 62h180M30 138h180" />
        </g>
        <g className="axis-lines">
          <path d="M122 20v160M24 100h192" />
          <path d="M122 18l-5 9h10zM218 100l-9-5v10z" />
        </g>
        <g className="axis-dots">
          <circle cx="82" cy="56" r="5" />
          <circle cx="164" cy="48" r="5" />
          <circle cx="62" cy="132" r="5" />
          <circle cx="176" cy="142" r="5" />
        </g>
      </g>
    </svg>
  );
}
