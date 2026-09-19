import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return "?"

  const parts = name.trim().split(/\s+/).slice(0, 2)

  return parts.map((part) => part[0]?.toUpperCase()).join("")
}
