import Link from "next/link"

import { cn } from "cn"

export function TextLink({
  href,
  children,
  className,
  light = false,
  externo = false,
}: {
  href: string
  children: React.ReactNode
  className?: string
  light?: boolean
  externo?: boolean
}) {
  return (
    <Link
      href={href}
      target={externo ? "_blank" : undefined}
      rel={externo ? "noreferrer" : undefined}
      className={cn(
        "group inline-flex items-center gap-2 text-base font-semibold tracking-wide",
        light ? "text-cream" : "text-lake-ink",
        className,
      )}
    >
      <span className="border-b border-current/35 pb-0.5 transition-colors group-hover:border-current">
        {children}
      </span>
      <span
        aria-hidden
        className="transition-transform duration-300 group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
  )
}
