"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export function Modal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title?: string }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" className={cn("relative z-10 w-full max-w-lg rounded-lg border bg-background shadow-lg")}>
        {title && (
          <div className="flex items-center justify-between p-4 pb-0">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        )}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}
