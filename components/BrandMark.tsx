/**
 * VESTRIPPN brand mark — an isometric 3D "3" in mint with a dark-teal outline
 * and an extruded depth face behind it. Fixed brand colours (reads on both
 * light and dark backgrounds).
 */
export function BrandMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label="VESTRIPPN">
      <g
        transform="translate(2.5 0) skewX(-9)"
        fontFamily="'Segoe UI', system-ui, Roboto, Arial, sans-serif"
        fontWeight="900"
        fontSize="40"
        textAnchor="middle"
      >
        {/* extruded depth face */}
        <text x="20" y="32" fill="#2fa588" transform="translate(2.6 3)">3</text>
        {/* mint front with a dark-teal outline */}
        <text
          x="20"
          y="32"
          fill="#4fe6b3"
          stroke="#236b7c"
          strokeWidth="2.2"
          paintOrder="stroke"
          strokeLinejoin="round"
        >
          3
        </text>
      </g>
    </svg>
  );
}
