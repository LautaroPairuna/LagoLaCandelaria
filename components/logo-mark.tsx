import { Foto } from "@/components/foto"
import { cn } from "cn"

export function LogoMark({
  className,
  priority = false,
}: {
  className?: string
  priority?: boolean
}) {
  return <Foto src="/logo.png" alt="" sizes="64px" prioridad={priority} className={cn("h-auto w-full", className)} />
}
