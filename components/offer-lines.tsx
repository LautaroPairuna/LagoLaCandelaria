function OfferLinePaths() {
  return (
    <>
      <path d="M-80 70C220 190 460-30 700 110C940 250 1080 20 1280 130" stroke="#9acd32" strokeOpacity="0.42" strokeWidth="1.3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d="M-80 250C240 110 500 390 760 210C1020 30 1120 340 1280 190" stroke="#ff7a14" strokeOpacity="0.36" strokeWidth="1.15" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d="M160-70C70 140 300 220 190 400C80 580 320 700 210 1080" stroke="#5daa4f" strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d="M1280-40C1060 120 1180 280 980 430C780 580 1140 720 1280 980" stroke="#ff7a14" strokeOpacity="0.32" strokeWidth="1.35" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d="M-80 560C220 430 460 700 740 520C1020 340 1100 690 1280 540" stroke="#5daa4f" strokeOpacity="0.34" strokeWidth="1.1" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d="M-80 820C260 680 500 960 780 760C1060 560 1120 940 1280 800" stroke="#9acd32" strokeOpacity="0.38" strokeWidth="1.25" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d="M1040-60C1160 160 860 300 1020 500C1180 700 880 860 1080 1080" stroke="#5daa4f" strokeOpacity="0.3" strokeWidth="1.15" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </>
  )
}

export function OfferLines({ tiles = 1 }: { tiles?: number }) {
  if (tiles <= 1) {
    return (
      <svg aria-hidden className="offer-lines" viewBox="0 0 1200 1000" preserveAspectRatio="xMidYMid slice" fill="none">
        <OfferLinePaths />
      </svg>
    )
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {Array.from({ length: tiles }, (_, index) => (
        <svg
          key={index}
          className="absolute left-0 w-full"
          style={{ top: index * 920, height: 1000 }}
          viewBox="0 0 1200 1000"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <OfferLinePaths />
        </svg>
      ))}
    </div>
  )
}
