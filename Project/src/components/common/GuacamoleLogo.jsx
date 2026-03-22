export function GuacamoleIcon({ size = 36 }) {
  const h = size * 1.25;
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 80 100"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <defs>
        <clipPath id="gl-left">
          <rect x="0" y="0" width="40" height="100" />
        </clipPath>
        <clipPath id="gl-right">
          <rect x="40" y="0" width="40" height="100" />
        </clipPath>
      </defs>

      {/* Outer avocado – left half (lighter) */}
      <path
        clipPath="url(#gl-left)"
        d="M40,4 C60,4 76,20 76,42 C76,66 58,83 40,98 C22,83 4,66 4,42 C4,20 20,4 40,4 Z"
        fill="#4ade80"
      />
      {/* Outer avocado – right half (darker) */}
      <path
        clipPath="url(#gl-right)"
        d="M40,4 C60,4 76,20 76,42 C76,66 58,83 40,98 C22,83 4,66 4,42 C4,20 20,4 40,4 Z"
        fill="#16a34a"
      />
      {/* Center divider shadow */}
      <line x1="40" y1="4" x2="40" y2="92" stroke="#15803d" strokeWidth="1.2" />

      {/* Inner flesh */}
      <ellipse cx="40" cy="44" rx="22" ry="28" fill="#dcfce7" />

      {/* Seed */}
      <ellipse cx="40" cy="47" rx="10" ry="12" fill="#92400e" />
      {/* Seed highlight */}
      <ellipse
        cx="36.5"
        cy="43"
        rx="3.5"
        ry="4.5"
        fill="#b45309"
        opacity="0.55"
      />
    </svg>
  );
}

export function GuacamoleLogoFull({ iconSize = 36 }) {
  return (
    <div className="flex items-center gap-2">
      <GuacamoleIcon size={iconSize} />
      <span className="text-xl font-bold text-slate-900">Guacamole</span>
    </div>
  );
}
