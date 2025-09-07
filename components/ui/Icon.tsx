import * as React from "react"

export function Icon({ as: As, className }: { as: React.ComponentType<{ className?: string }>; className?: string }) {
  return <As className={className} />
}
