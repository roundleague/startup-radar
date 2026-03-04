import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`
  }
  return `$${amount}`
}

export function formatDate(isoDate: string): string {
  try {
    return format(parseISO(isoDate), 'MMM d, yyyy')
  } catch {
    return isoDate
  }
}

export function formatRelativeDate(isoDate: string): string {
  try {
    return format(parseISO(isoDate), 'MMM yyyy')
  } catch {
    return isoDate
  }
}
