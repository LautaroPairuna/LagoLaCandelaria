"use client"

import { Toaster } from "sonner"

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      theme="light"
      toastOptions={{
        style: {
          background: "#fffdf8",
          color: "#102227",
          border: "1px solid #d9d0c3",
          fontFamily: "var(--font-outfit), Outfit, sans-serif",
        },
      }}
    />
  )
}
