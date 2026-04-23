'use client'
import { useQuery } from '@tanstack/react-query'
import { invoiceApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ResponsiveContainer, Cell,
} from 'recharts'
import { FileText, IndianRupee, CreditCard, Banknote, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#f43f5e', '#8b5cf6']

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: any, label: string, value: string, sub?: string, color: string
}) {
  return (
    <div className="stat-card animate-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 8, background: color + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
          {value}
        </div>
        {sub && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: '#f8fafc'
    }}>
      <div style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div style={{ color: '#f59e0b', fontWeight: 600 }}>
        {formatCurrency(payload[0].value)}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: invoiceApi.dashboard })
  const { data: invoices } = useQuery({ queryKey: ['invoices'], queryFn: invoiceApi.list })

  const recent = invoices?.slice(0, 5) || []
  const chartData = (stats?.daily_sales || []).slice().reverse().slice(-14)

  if (isLoading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>⟳</div>
        <p>Loading dashboard…</p>
      </div>
    </div>
  )

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back — here's what's happening at Anju Trading</p>
        </div>
        <Link href="/invoices/new" className="btn btn-primary">
          <FileText size={15} /> New Invoice
        </Link>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard
          icon={FileText} label="Total Invoices"
          value={String(stats?.total_invoices ?? 0)}
          sub="All time" color="#3b82f6"
        />
        <StatCard
          icon={IndianRupee} label="Total Revenue"
          value={formatCurrency(stats?.total_revenue ?? 0)}
          sub="Incl. GST" color="#10b981"
        />
        <StatCard
          icon={Banknote} label="Cash Sales"
          value={String(stats?.cash_invoices ?? 0)}
          sub="Invoices" color="#f59e0b"
        />
        <StatCard
          icon={CreditCard} label="Credit Sales"
          value={String(stats?.credit_invoices ?? 0)}
          sub="Invoices" color="#f43f5e"
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Area Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Sales Trend (Last 14 days)</span>
            <TrendingUp size={15} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div style={{ padding: '16px 8px' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2}
                    fill="url(#salesGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <p>No sales data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Clients */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Top Clients</span>
          </div>
          <div style={{ padding: '12px 0' }}>
            {stats?.top_clients?.length ? (
              stats.top_clients.map((c, i) => (
                <div key={c.party} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 20px', borderBottom: i < (stats.top_clients.length - 1) ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: COLORS[i % COLORS.length] + '20',
                      color: COLORS[i % COLORS.length],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 700,
                    }}>{c.party.charAt(0)}</div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.party}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {formatCurrency(c.total)}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ padding: '30px 20px' }}>
                <p>No data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Invoices</span>
          <Link href="/invoices" className="btn btn-ghost btn-sm">View all →</Link>
        </div>
        {recent.length > 0 ? (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Party</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(inv => (
                  <tr key={inv.id}>
                    <td>
                      <Link href={`/invoices/${inv.id}`} style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        #{inv.inv_no}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{inv.date}</td>
                    <td style={{ fontWeight: 500 }}>{inv.party}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {formatCurrency(inv.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <FileText size={36} />
            <p>No invoices yet. <Link href="/invoices/new" style={{ color: 'var(--accent)' }}>Create one →</Link></p>
          </div>
        )}
      </div>
    </div>
  )
}
