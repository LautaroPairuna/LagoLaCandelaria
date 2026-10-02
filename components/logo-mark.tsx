import Image from "next/image"

import { cn } from "cn"

export function LogoMark({
  className,
  priority = false,
}: {
  className?: string
  priority?: boolean
}) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={199}
      height={199}
      priority={priority}
      className={cn("h-auto w-full", className)}
    />
  )
}
