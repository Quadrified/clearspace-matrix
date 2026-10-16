import { useId } from 'react';

/** A small workspace, with a place for each priority and room to breathe. */
export function AxisBoard() {
  const id = useId();
  return (
    <svg
      className="axis-board"
      viewBox="0 0 300 220"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-paper`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="var(--card)" />
          <stop offset="1" stopColor="var(--paper)" />
        </linearGradient>
        <linearGradient id={`${id}-leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#95b890" />
          <stop offset="1" stopColor="#4e7b5a" />
        </linearGradient>
      </defs>
      <ellipse cx="146" cy="112" rx="126" ry="89" fill="var(--soft)" opacity=".6" />
      <ellipse cx="156" cy="194" rx="114" ry="8" fill="var(--ink)" opacity=".06" />
      <g strokeLinecap="round" strokeLinejoin="round">
        <g transform="rotate(-9 130 112)">
          <rect x="51" y="34" width="162" height="157" rx="14" fill="var(--ink)" opacity=".06" />
          <rect
            x="46"
            y="27"
            width="162"
            height="157"
            rx="14"
            fill="var(--paper)"
            stroke="var(--line)"
          />
        </g>
        <g transform="rotate(5 134 108)">
          <rect x="53" y="22" width="162" height="166" rx="14" fill="var(--ink)" opacity=".07" />
          <path
            d="M65 17h117l27 27v126a13 13 0 0 1-13 13H65a13 13 0 0 1-13-13V30a13 13 0 0 1 13-13Z"
            fill={`url(#${id}-paper)`}
            stroke="var(--line)"
          />
          <path d="M182 17v17a10 10 0 0 0 10 10h17" fill="var(--soft)" stroke="var(--line)" />
          <path d="M70 38h44m-44 7h28" stroke="var(--muted)" strokeWidth="3" opacity=".45" />
          <rect x="68" y="60" width="59" height="48" rx="8" fill="#f1d5c9" />
          <rect x="135" y="60" width="59" height="48" rx="8" fill="#d5e5cf" />
          <rect x="68" y="116" width="59" height="48" rx="8" fill="#efdfb4" />
          <rect x="135" y="116" width="59" height="48" rx="8" fill="#dfd8ec" />
          <g fill="none" strokeWidth="2">
            <path d="m79 77 3 3 5-6m-8 16 3 3 5-6m7-10h22m-22 13h15" stroke="#ad624d" />
            <g stroke="#578062">
              <rect x="147" y="73" width="24" height="22" rx="4" />
              <path d="M147 80h24m-18-10v6m12-6v6m-12 11h3m6 0h3" />
            </g>
            <path
              d="M80 129h24a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H91l-7 5v-5h-4a4 4 0 0 1-4-4v-10a4 4 0 0 1 4-4Z"
              stroke="#a1803d"
            />
            <path d="M84 138h1m7 0h1m7 0h1" stroke="#a1803d" strokeWidth="2.5" />
            <path d="M151 143c0-9 6-15 14-17 2 9-3 16-14 17Zm0 0-4 10" stroke="#8b7ca7" />
          </g>
        </g>
        <g transform="rotate(24 218 145)">
          <rect x="214" y="94" width="8" height="83" rx="3" fill="#527b60" />
          <path d="M214 174h8l-4 13Z" fill="#dcc8a5" />
          <path d="m216 184 2 3 2-3" fill="#31513b" />
          <path d="M214 108h8" stroke="#bbceae" strokeWidth="3" />
          <rect x="214" y="94" width="8" height="9" rx="3" fill="#a3b99a" />
        </g>
        <g>
          <path
            d="M254 153c-1-23-8-38-13-48m13 35c5-14 10-23 17-29"
            fill="none"
            stroke="#5d8263"
            strokeWidth="2"
          />
          <path
            d="M247 123c-20 0-26-12-25-23 16-1 26 8 25 23Zm9 9c-2-16 7-29 22-30 2 16-8 28-22 30Z"
            fill={`url(#${id}-leaf)`}
          />
          <path
            d="M239 148h30l-4 28h-22Z"
            fill="var(--paper)"
            stroke="var(--line)"
            strokeWidth="1.5"
          />
          <path d="M243 155h22" stroke="var(--line)" />
        </g>
        <g fill="none" stroke="#87a47f" strokeWidth="1.5" opacity=".8">
          <path d="M27 80h8m-4-4v8M251 55h10m-5-5v10" />
          <circle cx="34" cy="150" r="3" />
          <circle cx="237" cy="29" r="2" />
        </g>
      </g>
    </svg>
  );
}
