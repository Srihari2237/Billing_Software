'use client'
import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoiceApi, clientApi, itemApi, type Invoice, type InvoiceItem } from '@/lib/api'
import { todayStr, getBillingYear, formatCurrency } from '@/lib/utils'
import Autocomplete from '@/components/Autocomplete'
import { Plus, Trash2, Printer, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Props { invoiceId?: number }
const EMPTY_ROW = (): InvoiceItem => ({ item: '', qty: 1, unit: 'NOS', rate: 0, amount: 0 })

export default function InvoiceForm({ invoiceId }: Props) {
  const router = useRouter()
  const qc = useQueryClient()
  const isEdit = !!invoiceId

  const [invNo,      setInvNo]      = useState('')
  const [date,       setDate]       = useState(todayStr())
  const [party,      setParty]      = useState('')
  const [delivery,   setDelivery]   = useState('')
  const [payment,    setPayment]    = useState('Cash')
  const [gstPercent, setGstPercent] = useState(0)
  const [rows,       setRows]       = useState<InvoiceItem[]>([EMPTY_ROW()])

  const { data: clients   = [] } = useQuery({ queryKey: ['clients'], queryFn: clientApi.list })
  const { data: itemMaster = [] } = useQuery({ queryKey: ['items'],   queryFn: itemApi.list })
  const { data: nextNo }          = useQuery({ queryKey: ['next-no'], queryFn: invoiceApi.nextNo, enabled: !isEdit })

  const { data: existing } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn:  () => invoiceApi.get(invoiceId!),
    enabled:  isEdit,
  })

  useEffect(() => {
    if (isEdit && existing) {
      setInvNo(existing.inv_no); setDate(existing.date)
      setParty(existing.party);  setDelivery(existing.delivery)
      setPayment(existing.payment); setGstPercent(existing.gst_percent)
      setRows(existing.items.length > 0 ? existing.items : [EMPTY_ROW()])
    }
  }, [existing, isEdit])

  useEffect(() => { if (!isEdit && nextNo) setInvNo(nextNo.inv_no) }, [nextNo, isEdit])

  const clientNames = clients.map(c => c.name)
  const itemNames   = itemMaster.map(i => i.name)
  const billingYear = (() => { try { return getBillingYear(date) } catch { return '' } })()

  const subtotal  = rows.reduce((s, r) => s + (r.amount || 0), 0)
  const gstAmount = subtotal * (gstPercent / 100)
  const total     = subtotal + gstAmount
  const roundOff  = Math.round(total) - total
  const nett      = Math.round(total)

  const updateRow = useCallback((idx: number, field: keyof InvoiceItem, val: string | number) => {
    setRows(prev => {
      const next = [...prev]
      const row: any = { ...next[idx], [field]: val }
      if (field === 'qty' || field === 'rate') {
        row.amount = parseFloat(String(row.qty || 0)) * parseFloat(String(row.rate || 0))
      }
      next[idx] = row
      return next
    })
  }, [])

  const pickItem = (idx: number, name: string) => {
    const found = itemMaster.find(i => i.name === name)
    setRows(prev => {
      const next = [...prev]
      const row: any = { ...next[idx], item: name }
      if (found) {
        row.unit   = found.unit
        row.rate   = found.rate
        row.amount = parseFloat(String(row.qty || 1)) * found.rate
        if (found.gst) setGstPercent(found.gst)
      }
      next[idx] = row
      return next
    })
  }

  const handlePartySelect = (val: string) => {
    setParty(val); setDelivery(val)
    const client = clients.find(c => c.name === val)
    if (client?.payment_terms) {
      setPayment(client.payment_terms === 'CREDIT' ? 'Credit' : 'Cash')
    }
  }

  const buildPayload = () => ({
    inv_no: invNo, date, party, delivery, payment,
    subtotal, gst: gstAmount, total: nett, gst_percent: gstPercent,
    items: rows.filter(r => r.item),
  })

  const saveMut = useMutation({
    mutationFn: () => isEdit ? invoiceApi.update(invoiceId!, buildPayload()) : invoiceApi.create(buildPayload()),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success(isEdit ? 'Invoice updated!' : 'Invoice saved!')
      if (!isEdit && res?.id) router.push(`/invoices/${res.id}`)
    },
    onError: () => toast.error('Failed to save invoice'),
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Card */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Invoice Details</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-surface-2)', padding: '3px 10px', borderRadius: 20 }}>
            FY {billingYear}
          </span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Invoice No</label>
              <input className="form-input" value={invNo} onChange={e => setInvNo(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Date (DD-MM-YYYY)</label>
              <input className="form-input" value={date} onChange={e => setDate(e.target.value)} placeholder="DD-MM-YYYY" />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select className="form-select" value={payment} onChange={e => setPayment(e.target.value)}>
                {['Cash', 'Credit', 'UPI', 'Bank Transfer'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <Autocomplete label="Party Name" value={party} onChange={setParty}
                onSelect={handlePartySelect} options={clientNames} placeholder="Search client…" />
            </div>
            <div className="form-group">
              <Autocomplete label="Delivery At" value={delivery} onChange={setDelivery}
                options={clientNames} placeholder="Same as party or other…" />
            </div>
            <div className="form-group">
              <label className="form-label">GST %</label>
              <select className="form-select" value={gstPercent} onChange={e => setGstPercent(Number(e.target.value))}>
                {[0, 5, 12, 18].map(g => <option key={g} value={g}>{g}%</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Items</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setRows(p => [...p, EMPTY_ROW()])}>
            <Plus size={13} /> Add Row
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-2)' }}>
                {['#', 'Particulars', 'Qty', 'Unit', 'Rate', 'Amount', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 12px', fontSize: '0.72rem', fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textAlign: ['Qty','Rate','Amount'].includes(h) ? 'right' : 'left',
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    borderBottom: '1px solid var(--border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.8rem', width: 36 }}>{idx + 1}</td>
                  <td style={{ padding: '6px 8px', minWidth: 220 }}>
                    <Autocomplete value={row.item} onChange={v => updateRow(idx, 'item', v)}
                      onSelect={v => pickItem(idx, v)} options={itemNames} placeholder="Item name…" />
                  </td>
                  <td style={{ padding: '6px 8px', width: 90 }}>
                    <input className="form-input" type="number" value={row.qty}
                      onChange={e => updateRow(idx, 'qty', parseFloat(e.target.value) || 0)}
                      style={{ textAlign: 'right' }} />
                  </td>
                  <td style={{ padding: '6px 8px', width: 90 }}>
                    <input className="form-input" value={row.unit} onChange={e => updateRow(idx, 'unit', e.target.value)} />
                  </td>
                  <td style={{ padding: '6px 8px', width: 110 }}>
                    <input className="form-input" type="number" value={row.rate}
                      onChange={e => updateRow(idx, 'rate', parseFloat(e.target.value) || 0)}
                      style={{ textAlign: 'right' }} />
                  </td>
                  <td style={{ padding: '6px 12px', width: 120, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600 }}>
                      {formatCurrency(row.amount)}
                    </span>
                  </td>
                  <td style={{ padding: '6px 8px', width: 40 }}>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => setRows(p => p.filter((_, i) => i !== idx))} disabled={rows.length === 1}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals + Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start' }}>
        <div className="card">
          <div className="card-body">
            <div style={{ maxWidth: 320, marginLeft: 'auto' }}>
              {[
                { label: 'Sub Total',               val: formatCurrency(subtotal),      bold: false },
                { label: `CGST @ ${gstPercent/2}%`, val: formatCurrency(gstAmount/2),  bold: false },
                { label: `SGST @ ${gstPercent/2}%`, val: formatCurrency(gstAmount/2),  bold: false },
                { label: 'Total',                   val: formatCurrency(total),         bold: true  },
                { label: 'Round Off',               val: `${roundOff>=0?'+':''}${roundOff.toFixed(2)}`, bold: false },
              ].map(({ label, val, bold }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.875rem', color: bold ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: bold ? 600 : 400 }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: bold ? 700 : 500, fontSize: bold ? '0.95rem' : '0.875rem' }}>{val}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700 }}>Nett Amount</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-dark)' }}>
                  {formatCurrency(nett)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 170 }}>
          <button className="btn btn-primary" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            <Save size={15} /> {saveMut.isPending ? 'Saving…' : isEdit ? 'Update Invoice' : 'Save Invoice'}
          </button>
          {isEdit && invoiceId && (
            <button className="btn btn-secondary" onClick={() => window.open(invoiceApi.printUrl(invoiceId), '_blank')}>
              <Printer size={15} /> Print Invoice
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
