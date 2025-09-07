import { useEffect, useState } from "react"

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

// Local storage state hook for persisting simple values
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw != null) setValue(JSON.parse(raw))
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
  }, [key, value])
  return [value, setValue] as const
}
