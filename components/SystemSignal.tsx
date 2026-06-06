import type { ReactNode } from "react";

type SystemSignalProps = {
  systemId: string;
  className?: string;
};

function Label({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <text x={x} y={y} className="fill-[var(--ph-muted)] text-[10px] font-bold uppercase tracking-[0.18em]">
      {children}
    </text>
  );
}

export function SystemSignal({ systemId, className = "" }: SystemSignalProps) {
  return (
    <svg
      className={`ph-system-signal ${className}`}
      viewBox="0 0 360 190"
      role="img"
      aria-label={`${systemId.toUpperCase()} physiology signal preview`}
    >
      <defs>
        <linearGradient id={`signal-flow-${systemId}`} x1="0" x2="1">
          <stop offset="0%" stopColor="var(--ph-curve-5)" />
          <stop offset="55%" stopColor="var(--ph-accent)" />
          <stop offset="100%" stopColor="var(--ph-curve-2)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="358" height="188" rx="8" fill="var(--ph-surface)" />
      <path d="M0 48H360M0 95H360M0 142H360M72 0V190M144 0V190M216 0V190M288 0V190" stroke="var(--ph-grid)" />
      {renderSignal(systemId)}
    </svg>
  );
}

function renderSignal(systemId: string) {
  switch (systemId) {
    case "cv":
      return (
        <>
          <Label x={24} y={34}>pressure</Label>
          <path
            d="M30 128 C54 126 58 116 68 116 C84 116 86 132 101 132 C119 132 121 72 138 72 C154 72 156 130 174 130 C205 130 206 96 230 96 C256 96 262 128 330 126"
            fill="none"
            stroke="url(#signal-flow-cv)"
            strokeLinecap="round"
            strokeWidth="7"
          />
          <path d="M224 68C265 40 304 62 301 98C297 140 251 151 222 126C190 99 190 80 224 68Z" fill="color-mix(in srgb, var(--ph-curve-4), transparent 86%)" stroke="var(--ph-curve-4)" strokeWidth="3" />
          <circle cx="251" cy="96" r="11" fill="var(--ph-curve-4)" />
        </>
      );
    case "resp":
      return (
        <>
          <Label x={27} y={34}>gas exchange</Label>
          <path d="M64 54C78 70 84 91 79 123M134 54C120 70 114 91 119 123" fill="none" stroke="var(--ph-axis)" strokeLinecap="round" strokeWidth="7" />
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={90 + i * 25} cy={104 + (i % 2) * 16} r="17" fill="color-mix(in srgb, var(--ph-curve-5), transparent 84%)" stroke="var(--ph-curve-5)" strokeWidth="3" />
          ))}
          <path d="M214 132C242 72 276 65 330 72" fill="none" stroke="var(--ph-curve-2)" strokeLinecap="round" strokeWidth="7" />
          <path d="M218 132C235 122 246 102 258 96C274 88 290 100 330 98" fill="none" stroke="var(--ph-accent)" strokeLinecap="round" strokeWidth="4" strokeDasharray="7 8" />
        </>
      );
    case "renal":
      return (
        <>
          <Label x={25} y={34}>filtrate</Label>
          <path d="M45 72C98 35 150 62 134 102C126 123 88 124 91 91C94 63 144 74 154 117C164 160 235 153 304 118" fill="none" stroke="url(#signal-flow-renal)" strokeLinecap="round" strokeWidth="8" />
          <path d="M236 62C254 80 254 114 236 132M270 62C252 80 252 114 270 132" fill="none" stroke="var(--ph-curve-3)" strokeLinecap="round" strokeWidth="4" />
          <circle cx="302" cy="117" r="12" fill="var(--ph-curve-2)" />
        </>
      );
    case "endo":
      return (
        <>
          <Label x={24} y={34}>feedback</Label>
          <circle cx="86" cy="88" r="26" fill="color-mix(in srgb, var(--ph-accent), transparent 86%)" stroke="var(--ph-accent)" strokeWidth="3" />
          <circle cx="181" cy="88" r="26" fill="color-mix(in srgb, var(--ph-curve-2), transparent 84%)" stroke="var(--ph-curve-2)" strokeWidth="3" />
          <circle cx="276" cy="88" r="26" fill="color-mix(in srgb, var(--ph-curve-3), transparent 84%)" stroke="var(--ph-curve-3)" strokeWidth="3" />
          <path d="M112 88H155M207 88H250M276 114C226 159 124 158 86 114" fill="none" stroke="var(--ph-axis)" strokeLinecap="round" strokeWidth="5" />
          <path d="M92 137H64M64 137V111" fill="none" stroke="var(--ph-danger)" strokeLinecap="round" strokeWidth="4" />
        </>
      );
    case "gi":
      return (
        <>
          <Label x={24} y={34}>absorption</Label>
          <path d="M38 103C64 58 102 146 130 101C159 55 197 145 226 101C255 56 292 143 326 93" fill="none" stroke="var(--ph-curve-2)" strokeLinecap="round" strokeWidth="8" />
          <path d="M60 134H318" stroke="var(--ph-axis)" strokeLinecap="round" strokeWidth="4" />
          {[82, 134, 188, 240, 294].map((x, i) => (
            <circle key={x} cx={x} cy={132 - (i % 2) * 13} r="9" fill={i % 2 ? "var(--ph-curve-5)" : "var(--ph-accent)"} />
          ))}
        </>
      );
    case "msk":
      return (
        <>
          <Label x={26} y={34}>force</Label>
          <path d="M46 74H314M46 126H314" stroke="var(--ph-axis)" strokeLinecap="round" strokeWidth="5" />
          {[72, 112, 152, 192, 232, 272].map((x) => (
            <path key={x} d={`M${x} 60V140M${x - 17} 76L${x} 95L${x + 17} 76M${x - 17} 124L${x} 105L${x + 17} 124`} stroke="var(--ph-accent)" strokeLinecap="round" strokeWidth="4" />
          ))}
          <path d="M58 160C101 128 152 116 196 126C236 136 263 152 322 151" fill="none" stroke="var(--ph-curve-2)" strokeLinecap="round" strokeWidth="5" />
        </>
      );
    case "nerv":
      return (
        <>
          <Label x={24} y={34}>excitation</Label>
          <path d="M30 126H91C101 126 105 123 110 116L133 66C138 55 148 55 153 66L173 129C178 145 193 146 202 132C219 108 229 96 254 97C281 98 306 119 332 118" fill="none" stroke="var(--ph-accent)" strokeLinecap="round" strokeWidth="7" />
          <path d="M52 70C84 48 119 44 149 66M230 66C264 42 303 48 330 72" fill="none" stroke="var(--ph-curve-3)" strokeLinecap="round" strokeWidth="4" strokeDasharray="8 8" />
          <circle cx="149" cy="66" r="10" fill="var(--ph-curve-2)" />
        </>
      );
    case "repro":
      return (
        <>
          <Label x={24} y={34}>cycle</Label>
          <circle cx="112" cy="96" r="48" fill="none" stroke="var(--ph-curve-ref)" strokeWidth="5" strokeDasharray="10 10" />
          <path d="M112 48A48 48 0 0 1 160 96" fill="none" stroke="var(--ph-accent)" strokeLinecap="round" strokeWidth="8" />
          <path d="M160 96A48 48 0 0 1 84 137" fill="none" stroke="var(--ph-curve-2)" strokeLinecap="round" strokeWidth="8" />
          <path d="M203 135C226 76 252 62 291 77C310 84 320 103 329 129" fill="none" stroke="var(--ph-curve-3)" strokeLinecap="round" strokeWidth="6" />
          <circle cx="291" cy="77" r="10" fill="var(--ph-curve-3)" />
        </>
      );
    default:
      return (
        <>
          <Label x={24} y={34}>signal</Label>
          <path d="M34 124C86 61 118 59 160 103C198 143 236 145 326 75" fill="none" stroke="var(--ph-accent)" strokeLinecap="round" strokeWidth="7" />
        </>
      );
  }
}
