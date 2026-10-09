export function PageHero({
  kicker,
  title,
  children,
}: {
  kicker: string
  title: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <section className="bg-cream text-ink">
      <div className="mx-auto max-w-[1120px] px-5 pt-28 pb-12 md:px-8 md:pt-32 md:pb-16">
        <p className="kicker">{kicker}</p>
        <h1 className="font-display mt-4 max-w-4xl text-[clamp(2.8rem,6vw,5.1rem)] leading-[0.92] tracking-[-0.03em]">
          {title}
        </h1>
        {children ? (
          <div className="mt-6 max-w-xl text-lg leading-relaxed text-text-muted">
            {children}
          </div>
        ) : null}
      </div>
    </section>
  )
}
