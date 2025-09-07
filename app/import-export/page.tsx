"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"

export default function ImportExportPage() {
  const [status, setStatus] = useState<string>("")

  const handleGeneratePdf = async () => {
    setStatus("Loading pdf-lib and generating...")
    try {
      const { createBlankPdf } = await import("@/features/import-export/pdf")
      const bytes = await createBlankPdf({ title: "Lily Demo" })
      // Trigger download in browser
      const blob = new Blob([bytes], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "lily-demo.pdf"
      a.click()
      URL.revokeObjectURL(url)
      setStatus("Generated lily-demo.pdf")
    } catch (e) {
      console.error(e)
      setStatus("Failed to generate: see console")
    }
  }

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Import / Export</h1>
      <p className="text-muted-foreground">Heavy libraries are loaded on demand to keep initial bundle tiny.</p>
      <div className="flex gap-2">
        <Button onClick={handleGeneratePdf}>Generate sample PDF (lazy-load)</Button>
      </div>
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </div>
  )
}
