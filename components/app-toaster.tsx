"use client"

import type { CSSProperties } from "react"
import { Toaster } from "sonner"

const colores = {
  "--normal-bg": "#fffdf8",
  "--normal-border": "#e7d8c6",
  "--normal-text": "#3a3530",
  "--success-bg": "#eef7ea",
  "--success-border": "#cfe6c5",
  "--success-text": "#2f5e10",
  "--warning-bg": "#fdf4e3",
  "--warning-border": "#f0d9a8",
  "--warning-text": "#74450a",
  "--error-bg": "#fdf0ec",
  "--error-border": "#f2cdc2",
  "--error-text": "#982b19",
  "--width": "380px",
  fontFamily: "var(--font-outfit), Outfit, sans-serif",
} as CSSProperties

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      theme="light"
      richColors
      closeButton
      duration={5000}
      visibleToasts={4}
      containerAriaLabel="Avisos"
      style={colores}
      toastOptions={{
        closeButtonAriaLabel: "Cerrar aviso",
        classNames: {
          toast: "rounded-2xl! shadow-[0_10px_30px_rgba(58,42,24,0.14)]! text-[15px]! leading-snug!",
          title: "font-semibold!",
          actionButton: "rounded-full! font-semibold!",
        },
      }}
    />
  )
}
