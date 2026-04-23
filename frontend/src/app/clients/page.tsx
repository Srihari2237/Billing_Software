'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientApi, type Client } from '@/lib/api'
import { Users, Search, Plus, X, Save, Trash2, Pencil } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

const EMPTY: Client = { name: '', payment_terms: 'CASH', address: '', gstin: '' }

export default function ClientsPage() {
  const qc = useQueryClient()
  const { data: clients = [], isLoading } = useQuery({ queryKey: ['clients'], queryFn: clientApi.list })
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState<Client>(EMPTY)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.gstin || '').toLowerCase().includes(search.toLowerCase())
  )

  const saveMut = useMutation({
    mutationFn: (c: Client) => editing
      ? clientApi.update(editing.name, c)
      : clientApi.add(c),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success(editing ? 'Client updated!' : 'Client added!')
      setShowForm(false); setEditing(null); setForm(EMPTY)
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Save failed'),
  })

  const deleteMut = useMutation({
    mutationFn: clientApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); toast.success('Client deleted'); setDeleteTarget(null) },
    onError: () => toast.error('Delete failed'),
  })

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (c: Client) => { setEditing(c); setForm({ ...c }); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(EMPTY) }
  const set = (k: keyof Client, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{clients.length} clients in master</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={15} /> Add New Client
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Search by name or GSTIN…"
            value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="card animate-up" style={{ marginBottom: 20, border: '1.5px solid var(--accent)' }}>
          <div className="card-header" style={{ background: '#fffbeb' }}>
            <span className="card-title" style={{ color: 'var(--accent-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {editing ? <><Pencil size={14} /> Edit Client</> : <><Plus size={14} /> Add New Client</>}
            </span>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={closeForm}><X size={15} /></button>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Party Name *</label>
                <input className="form-input" placeholder="e.g. BALAJI PRINTERS"
                  value={form.name} onChange={e => set('name', e.target.value)}
                  disabled={!!editing} />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Terms</label>
                <select className="form-select" value={form.payment_terms} onChange={e => set('payment_terms', e.target.value)}>
                  {['CASH', 'CREDIT', 'UPI', 'BANK TRANSFER'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Address</label>
                <textarea className="form-input" rows={2} placeholder="Street, City, PIN"
                  value={form.address} onChange={e => set('address', e.target.value)}
                  style={{ resize: 'vertical', minHeight: 60 }} />
              </div>
              <div className="form-group">
                <label className="form-label">GST IN</label>
                <input className="form-input" placeholder="e.g. 33XXXXX1234X1ZX"
                  value={form.gstin} onChange={e => set('gstin', e.target.value.toUpperCase())}
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>
                <Save size={14} /> {saveMut.isPending ? 'Saving…' : editing ? 'Update Client' : 'Save Client'}
              </button>
              <button className="btn btn-secondary" onClick={closeForm}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Party Name</th>
              <th>Address</th>
              <th>GST IN</th>
              <th>Payment</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6}>
                <div className="empty-state"><Users size={36} /><p>No clients found</p></div>
              </td></tr>
            ) : filtered.map((c, i) => (
              <tr key={`client-${i}`} onClick={() => openEdit(c)}>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--accent-light)', color: '#92400e',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                    }}>{c.name.charAt(0)}</div>
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                  </div>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.address || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>
                <td>
                  {c.gstin
                    ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{c.gstin}</span>
                    : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>
                <td>
                  <span className={`badge ${c.payment_terms === 'CREDIT' ? 'badge-amber' : 'badge-green'}`}>
                    {c.payment_terms}
                  </span>
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(c)}><Pencil size={13} /></button>
                    <button className="btn btn-danger btn-icon btn-sm" title="Delete" onClick={() => setDeleteTarget(c.name)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '28px 28px 16px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 8 }}>Delete Client?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Remove <strong>{deleteTarget}</strong> from the master list? This cannot be undone.
              </p>
            </div>
            <div style={{ padding: '0 28px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => deleteMut.mutate(deleteTarget!)} disabled={deleteMut.isPending}>
                {deleteMut.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
