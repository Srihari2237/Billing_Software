'use client'
import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface AutocompleteProps {
  value: string
  onChange: (val: string) => void
  onSelect?: (val: string) => void
  options: string[]
  placeholder?: string
  className?: string
  label?: string
}

export default function Autocomplete({
  value, onChange, onSelect, options, placeholder, className, label
}: AutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  // Use index-based keys to avoid duplicate key errors when items have the same name
  const filtered = value
    ? options.filter(o => o.toLowerCase().includes(value.toLowerCase()))
    : options

  const choose = (val: string) => {
    onChange(val)
    onSelect?.(val)
    setOpen(false)
    setActiveIdx(-1)
  }

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || filtered.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); choose(filtered[activeIdx]) }
    if (e.key === 'Escape') setOpen(false)
  }

  // Position dropdown using fixed positioning so it always appears above table rows
  const updateDropdownPos = () => {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      background: 'var(--bg-surface)',
      border: '1.5px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
      maxHeight: 220,
      overflowY: 'auto' as const,
    })
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    window.addEventListener('scroll', () => setOpen(false), true)
    return () => {
      document.removeEventListener('mousedown', handler)
      window.removeEventListener('scroll', () => setOpen(false), true)
    }
  }, [])

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {label && <label className="form-label" style={{ display: 'block', marginBottom: 5 }}>{label}</label>}
      <input
        ref={inputRef}
        className={cn('form-input', className)}
        value={value}
        onChange={e => { onChange(e.target.value); updateDropdownPos(); setOpen(true); setActiveIdx(-1) }}
        onFocus={() => { updateDropdownPos(); setOpen(true) }}
        onKeyDown={handleKey}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div style={dropdownStyle}>
          {filtered.map((opt, i) => (
            <div
              key={`${opt}-${i}`}
              className={cn('autocomplete-item', i === activeIdx && 'active')}
              onMouseDown={() => choose(opt)}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
