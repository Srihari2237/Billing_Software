'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, Users, Package, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/invoices', icon: FileText, label: 'Invoices' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/items', icon: Package, label: 'Items' },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: 'var(--sidebar-width)',
      background: '#0f172a',
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      zIndex: 40,
    }}>
      {/* Logo */}
      <div style={{
        padding: '28px 20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 16, color: '#1a1000', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(245,158,11,0.35)',
          }}>AT</div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: '1rem',
              fontWeight: 700, color: '#f8fafc', lineHeight: 1.1,
            }}>Anju Trading</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>
              Billing System v2.0
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map(({ href, icon: Icon, label }) => {
          const active = path === href || path.startsWith(href + '/')
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8,
              textDecoration: 'none',
              background: active ? 'rgba(245,158,11,0.12)' : 'transparent',
              color: active ? '#f59e0b' : '#94a3b8',
              fontWeight: active ? 600 : 400,
              fontSize: '0.875rem',
              transition: 'all 0.15s',
              borderLeft: active ? '2px solid #f59e0b' : '2px solid transparent',
            }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#f1f5f9' } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#94a3b8' } }}
            >
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: '0.7rem', color: '#334155', lineHeight: 1.5 }}>
          GSTIN: 33BHDPM4367B1ZO
        </div>
        <div style={{ fontSize: '0.68rem', color: '#1e293b', marginTop: 2 }}>
          Veerapandi, Tiruppur 641 605
        </div>
      </div>
    </aside>
  )
}
