import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getBillingYear(dateStr: string): string {
  const [day, month, year] = dateStr.split('-').map(Number)
  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`
  }
  return `${year - 1}-${String(year).slice(-2)}`
}

export function todayStr(): string {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

export function formatDisplayDate(dateStr: string): string {
  try {
    const [day, month, year] = dateStr.split('-')
    return `${day}/${month}/${year}`
  } catch {
    return dateStr
  }
}
