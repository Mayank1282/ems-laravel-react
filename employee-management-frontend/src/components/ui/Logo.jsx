export function EMSLogo({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="ems-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED" />
          <stop offset="0.45" stopColor="#4338CA" />
          <stop offset="1" stopColor="#0EA5E9" />
        </linearGradient>
        <linearGradient id="ems-shine" x1="0" y1="0" x2="0" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        {/* Clip everything to the rounded square so nothing pokes past corners */}
        <clipPath id="ems-clip">
          <rect width="48" height="48" rx="13" />
        </clipPath>
      </defs>

      <g clipPath="url(#ems-clip)">
        {/* Background */}
        <rect width="48" height="48" fill="url(#ems-grad)" />
        {/* Shine overlay (now clipped to rounded corners) */}
        <rect width="48" height="48" fill="url(#ems-shine)" />

        {/* Org chart — top node (manager) */}
        <circle cx="24" cy="10" r="4.5" fill="white" fillOpacity="0.95" />

        {/* Stem down + horizontal bar */}
        <line x1="24" y1="14.5" x2="24" y2="20" stroke="white" strokeWidth="1.5" strokeOpacity="0.55" />
        <line x1="11" y1="20" x2="37" y2="20" stroke="white" strokeWidth="1.5" strokeOpacity="0.55" />

        {/* Left, Center, Right stems */}
        <line x1="11" y1="20" x2="11" y2="25" stroke="white" strokeWidth="1.5" strokeOpacity="0.55" />
        <line x1="24" y1="20" x2="24" y2="25" stroke="white" strokeWidth="1.5" strokeOpacity="0.55" />
        <line x1="37" y1="20" x2="37" y2="25" stroke="white" strokeWidth="1.5" strokeOpacity="0.55" />

        {/* Middle row nodes */}
        <circle cx="11" cy="28.5" r="3.5" fill="white" fillOpacity="0.82" />
        <circle cx="24" cy="28.5" r="3.5" fill="white" fillOpacity="0.82" />
        <circle cx="37" cy="28.5" r="3.5" fill="white" fillOpacity="0.82" />

        {/* Bottom stems */}
        <line x1="11" y1="32" x2="11" y2="36.5" stroke="white" strokeWidth="1.2" strokeOpacity="0.38" />
        <line x1="24" y1="32" x2="24" y2="36.5" stroke="white" strokeWidth="1.2" strokeOpacity="0.38" />
        <line x1="37" y1="32" x2="37" y2="36.5" stroke="white" strokeWidth="1.2" strokeOpacity="0.38" />

        {/* Bottom row nodes */}
        <circle cx="11" cy="39" r="2.5" fill="white" fillOpacity="0.45" />
        <circle cx="24" cy="39" r="2.5" fill="white" fillOpacity="0.45" />
        <circle cx="37" cy="39" r="2.5" fill="white" fillOpacity="0.45" />
      </g>
    </svg>
  );
}
