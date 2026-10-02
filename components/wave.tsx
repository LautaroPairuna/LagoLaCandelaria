export function Wave({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden
      className={className ?? "pointer-events-none absolute inset-x-0 top-0 z-20 h-[7.5rem] w-full"}
    >
      <path
        d="M0 18C90 34 160 6 250 22C360 42 430 8 540 16C680 28 760 4 900 26C1040 46 1140 10 1280 20C1360 26 1410 12 1440 18"
        fill="none"
        stroke="#e7f7ff"
        strokeWidth="1.4"
      />
      <path
        d="M0 44C70 18 180 62 310 28C420 6 510 58 660 36C820 12 910 70 1080 30C1220 8 1340 48 1440 22"
        fill="none"
        stroke="#9ad8f3"
        strokeWidth="2.6"
      />
      <path
        d="M0 70C140 88 220 48 340 76C480 102 560 54 700 68C860 90 980 46 1120 80C1260 104 1360 62 1440 74"
        fill="none"
        stroke="#3aaad8"
        strokeWidth="1.5"
        opacity="0.85"
      />
      <path
        d="M0 36C200 14 280 52 420 24C560 4 640 40 820 18C980 2 1080 38 1240 16C1340 8 1400 28 1440 14"
        fill="none"
        stroke="#1f7fb5"
        strokeWidth="1.15"
        opacity="0.4"
      />
      <path
        d="M0 96C120 78 240 112 400 86C540 66 680 108 840 82C1000 60 1120 104 1280 78C1360 68 1410 92 1440 84"
        fill="none"
        stroke="#7ec8e8"
        strokeWidth="1.3"
        opacity="0.75"
      />
    </svg>
  )
}
