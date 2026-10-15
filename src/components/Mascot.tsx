/** Decorative "Matt", the matrix mascot: four quadrant tiles with a friendly face. */
export function Mascot() {
  return (
    <svg
      className="mascot"
      viewBox="0 0 200 210"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse className="mascot-shadow" cx="100" cy="196" rx="52" ry="7" />
      <g className="mascot-body">
        <path className="mascot-leaf" d="M100 26c-2-14 6-24 20-26-1 14-8 24-20 26z" />
        <path className="mascot-leaf mascot-leaf-2" d="M100 28c2-12-4-20-16-23 0 12 5 20 16 23z" />
        <rect x="97" y="22" width="6" height="14" rx="3" className="mascot-stem" />
        <g transform="rotate(-4 100 100)">
          <clipPath id="mascot-clip">
            <rect x="38" y="38" width="124" height="120" rx="30" />
          </clipPath>
          <g clipPath="url(#mascot-clip)">
            <rect x="38" y="38" width="63" height="61" fill="#d9775b" />
            <rect x="99" y="38" width="63" height="61" fill="#6fa27c" />
            <rect x="38" y="97" width="63" height="61" fill="#e0b455" />
            <rect x="99" y="97" width="63" height="61" fill="#a597cb" />
            <rect x="98" y="38" width="4" height="120" fill="#fffdf6" />
            <rect x="38" y="96" width="124" height="4" fill="#fffdf6" />
          </g>
          <circle cx="100" cy="98" r="38" fill="#fffdf6" />
          <g className="mascot-eyes">
            <ellipse cx="86" cy="92" rx="6.5" ry="8" fill="#1f3a2a" />
            <ellipse cx="114" cy="92" rx="6.5" ry="8" fill="#1f3a2a" />
            <circle cx="88.4" cy="89" r="2.5" fill="#fff" />
            <circle cx="116.4" cy="89" r="2.5" fill="#fff" />
          </g>
          <ellipse cx="76" cy="108" rx="6.5" ry="4.5" fill="#f5a08a" opacity="0.8" />
          <ellipse cx="124" cy="108" rx="6.5" ry="4.5" fill="#f5a08a" opacity="0.8" />
          <path
            d="M92 107c3.5 8 12.5 8 16 0"
            fill="none"
            stroke="#1f3a2a"
            strokeWidth="3.6"
            strokeLinecap="round"
          />
        </g>
        <g className="mascot-wave">
          <path
            d="M160 112c14-2 22-12 20-26"
            fill="none"
            className="mascot-limb"
            stroke="#1f3a2a"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="180" cy="84" r="7" fill="#e0b455" stroke="none" />
        </g>
        <path
          d="M40 118c-12 2-18 10-18 20"
          fill="none"
          className="mascot-limb"
          stroke="#1f3a2a"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="22" cy="140" r="7" fill="#d9775b" />
        <path
          d="M84 156v16M116 156v16"
          fill="none"
          className="mascot-limb"
          stroke="#1f3a2a"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <ellipse cx="82" cy="176" rx="12" ry="6" fill="#1f3a2a" className="mascot-foot" />
        <ellipse cx="118" cy="176" rx="12" ry="6" fill="#1f3a2a" className="mascot-foot" />
      </g>
    </svg>
  );
}
