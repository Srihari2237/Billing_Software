'use client'
import { useQuery } from '@tanstack/react-query'
import { itemApi } from '@/lib/api'
import { Package, Search, Plus, X, Save } from 'lucide-react'
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import axios from 'axios'

interface NewItemForm {
  name: string
  unit: string
  rate: string
  gst: string
}

const EMPTY_FORM: NewItemForm = { name: '', unit: 'NOS', rate: '', gst: '0' }
const UNITS = ['NOS', 'KGS', 'MTR', 'BOX', 'PKT', 'DZN', 'PCS', 'SET', 'LTR']
const GST_OPTIONS = ['0', '5', '12', '18']

export default function ItemsPage() {
  const { data: items = [], isLoading, refetch } = useQuery({ queryKey: ['items'], queryFn: itemApi.list })
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<NewItemForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [localItems, setLocalItems] = useState<typeof items>([])

  const allItems = [...items, ...localItems]
  const filtered = allItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))

  const handleAdd = async () => {
    if (!form.name.trim()) { toast.error('Item name is required'); return }
    setSaving(true)
    try {
      const newItem = {
        name: form.name.trim(),
        unit: form.unit,
        rate: parseFloat(form.rate) || 0,
        gst: parseFloat(form.gst) || 0,
      }
      await axios.post('/api/items', newItem)
      setLocalItems(prev => [...prev, newItem])
      await refetch()
      toast.success(`"${form.name}" added to item master`)
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to add item — check backend supports POST /api/items')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Item Master</h1>
          <p className="page-subtitle">{allItems.length} items in master</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
          <Plus size={15} /> Add New Item
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Search items…"
            value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 32 }} />
        </div>
      </div>

      {showForm && (
        <div className="card animate-up" style={{ marginBottom: 20, border: '1.5px solid var(--accent)' }}>
          <div className="card-header" style={{ background: '#fffbeb' }}>
            <span className="card-title" style={{ color: 'var(--accent-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={15} /> Add New Item
            </span>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>
              <X size={15} />
            </button>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Item Name *</label>
                <input className="form-input" placeholder="e.g. 3 PLY POLYSTER WHITE"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()} />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select className="form-select" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Default Rate (₹)</label>
                <input className="form-input" type="number" placeholder="0.00"
                  value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">GST %</label>
                <select className="form-select" value={form.gst} onChange={e => setForm(f => ({ ...f, gst: e.target.value }))}>
                  {GST_OPTIONS.map(g => <option key={g} value={g}>{g}%</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
                <Save size={14} /> {saving ? 'Saving…' : 'Save Item'}
              </button>
              <button className="btn btn-secondary" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>
                Cancel
              </button>
            </div>
            <p style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              ⚠️ Item is saved to the database immediately. To also persist in Excel, update <code>item_master.xlsx</code> manually.
            </p>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item Name</th>
              <th>Unit</th>
              <th style={{ textAlign: 'right' }}>Default Rate</th>
              <th style={{ textAlign: 'center' }}>GST %</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5}>
                <div className="empty-state"><Package size={36} /><p>No items found</p></div>
              </td></tr>
            ) : filtered.map((item, i) => (
              <tr key={`item-${i}-${item.name}`}>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                <td style={{ fontWeight: 500 }}>{item.name}</td>
                <td><span className="badge badge-gray">{item.unit}</span></td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {item.rate > 0 ? formatCurrency(item.rate) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {item.gst > 0
                    ? <span className="badge badge-blue">{item.gst}%</span>
                    : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Nil</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Base items loaded from <code style={{ background: 'var(--bg-surface-2)', padding: '2px 6px', borderRadius: 4 }}>item_master.xlsx</code>.
        Items added here are saved to the database.
      </div>
    </div>
  )
}
