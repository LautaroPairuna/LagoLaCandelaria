"use client"

import Link from "next/link"
import type { MouseEvent, ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "cn"

export function ButtonLink({
  href,
  children,
  variant = "default",
  className,
  onClick,
}: {
  href: string
  children: ReactNode
  variant?: "default" | "outline" | "secondary" | "ghost"
  className?: string
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  return (
    <Button
      nativeButton={false}
      variant={variant}
      className={cn(
        "h-12 rounded-full px-5 text-base",
        variant === "default" ? "font-bold" : "font-semibold",
        className,
      )}
      render={<Link href={href} onClick={onClick} />}
    >
      {children}
    </Button>
  )
}
