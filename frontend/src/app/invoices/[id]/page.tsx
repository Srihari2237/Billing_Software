'use client'
import { useQuery } from '@tanstack/react-query'
import { invoiceApi, clientApi } from '@/lib/api'
import { formatCurrency, getBillingYear } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, Pencil, Printer } from 'lucide-react'

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id)
  const { data: inv,     isLoading } = useQuery({ queryKey: ['invoice', id], queryFn: () => invoiceApi.get(id) })
  const { data: clients = []       } = useQuery({ queryKey: ['clients'],      queryFn: clientApi.list })

  if (isLoading) return <div className="page"><p style={{ color: 'var(--text-muted)' }}>Loading…</p></div>
  if (!inv) return <div className="page"><p>Invoice not found.</p></div>

  const clientInfo  = clients.find(c => c.name === inv.party)
  const billingYear = (() => { try { return getBillingYear(inv.date) } catch { return '' } })()
  const cgst        = inv.gst / 2
  const roundOff    = Math.round(inv.total) - inv.total
  const nett        = Math.round(inv.total)

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link href="/invoices" className="btn btn-ghost btn-sm" style={{ marginBottom: 8, display: 'inline-flex' }}>
            <ArrowLeft size={14} /> Back
          </Link>
          <h1 className="page-title">Invoice #{inv.inv_no}</h1>
          <p className="page-subtitle">{inv.date} · {inv.party}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href={`/invoices/${id}/edit`} className="btn btn-secondary">
            <Pencil size={14} /> Edit
          </Link>
          <button className="btn btn-primary" onClick={() => window.open(`/invoices/${id}/print`, '_blank')}>
            <Printer size={14} /> Print Invoice
          </button>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 740 }}>
        {/* Dark header */}
        <div style={{
          background: 'linear-gradient(135deg,#0f172a,#1e293b)',
          borderRadius: '12px 12px 0 0', padding: '20px 28px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', fontWeight:700, color:'#f8fafc' }}>ANJU TRADING</div>
            <div style={{ fontSize:'0.72rem', color:'#94a3b8', marginTop:3 }}>
              Supplies: All kinds of sewing Thread &amp; Packaging Materials
            </div>
            <div style={{ fontSize:'0.7rem', color:'#64748b', marginTop:2 }}>
              4/142, Palladam Road, Veerapandi (P.O) – TIRUPPUR 641 605
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ background:'var(--accent)', color:'#1a1000', fontWeight:700, fontSize:'0.78rem', padding:'3px 12px', borderRadius:5, letterSpacing:'0.08em' }}>
              INVOICE
            </div>
            <div style={{ color:'#94a3b8', fontSize:'0.7rem', marginTop:6 }}>GSTIN: 33BHDPM4367B1ZO</div>
            <div style={{ color:'#94a3b8', fontSize:'0.7rem' }}>Mobile: 9865244882</div>
          </div>
        </div>

        {/* Bill To + Inv Info */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom:'1px solid var(--border)' }}>
          <div style={{ padding:'16px 22px', borderRight:'1px solid var(--border)' }}>
            <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Bill To</div>
            <div style={{ fontWeight:700, fontSize:'0.95rem' }}>{inv.party}</div>
            {clientInfo?.address && (
              <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginTop:4, lineHeight:1.5 }}>{clientInfo.address}</div>
            )}
            {inv.delivery && inv.delivery !== inv.party && (
              <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginTop:4 }}>Delivery: {inv.delivery}</div>
            )}
            {clientInfo?.gstin && (
              <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginTop:6, fontFamily:'var(--font-mono)' }}>
                GST IN: {clientInfo.gstin}
              </div>
            )}
          </div>
          <div style={{ padding:'16px 22px' }}>
            {[
              { label:'Invoice No', val:<span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--accent)' }}>{String(inv.inv_no).padStart(3,'0')} / {billingYear}</span> },
              { label:'Date',       val:<span style={{ fontFamily:'var(--font-mono)' }}>{inv.date}</span> },
              { label:'Payment',    val:<span className={`badge ${inv.payment==='Cash'?'badge-green':'badge-amber'}`}>{inv.payment}</span> },
            ].map(({ label, val }) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{label}</span>
                {val}
              </div>
            ))}
          </div>
        </div>

        {/* Items */}
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'var(--bg-surface-2)' }}>
              {['S.No','Particulars','Qty','Unit','Rate','Amount (Rs.)'].map((h,i) => (
                <th key={h} style={{ padding:'9px 14px', fontSize:'0.7rem', fontWeight:600,
                  color:'var(--text-secondary)', letterSpacing:'0.04em', textTransform:'uppercase',
                  textAlign: i > 1 ? 'right' : 'left', borderBottom:'1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inv.items.map((item, i) => (
              <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                <td style={{ padding:'10px 14px', color:'var(--text-muted)', fontSize:'0.78rem' }}>{i+1}</td>
                <td style={{ padding:'10px 14px', fontWeight:500 }}>{item.item}</td>
                <td style={{ padding:'10px 14px', textAlign:'right', fontFamily:'var(--font-mono)' }}>{item.qty}</td>
                <td style={{ padding:'10px 14px', textAlign:'right', color:'var(--text-secondary)' }}>{item.unit}</td>
                <td style={{ padding:'10px 14px', textAlign:'right', fontFamily:'var(--font-mono)' }}>{item.rate.toFixed(2)}</td>
                <td style={{ padding:'10px 14px', textAlign:'right', fontFamily:'var(--font-mono)', fontWeight:600 }}>{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display:'flex', justifyContent:'flex-end', padding:'16px 22px', borderTop:'1px solid var(--border)' }}>
          <div style={{ minWidth:260 }}>
            {[
              { label:'Sub Total',                      val:formatCurrency(inv.subtotal) },
              { label:`CGST @ ${inv.gst_percent/2}%`,   val:formatCurrency(cgst) },
              { label:`SGST @ ${inv.gst_percent/2}%`,   val:formatCurrency(cgst) },
              { label:'Total',                          val:formatCurrency(inv.total), bold:true },
              { label:'Round Off',                      val:`${roundOff>=0?'+':''}${roundOff.toFixed(2)}` },
            ].map(({ label, val, bold }) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:'0.83rem', color:bold?'var(--text-primary)':'var(--text-secondary)', fontWeight:bold?600:400 }}>{label}</span>
                <span style={{ fontFamily:'var(--font-mono)', fontWeight:bold?700:500 }}>{val}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'9px 0 0' }}>
              <span style={{ fontWeight:700, fontSize:'0.95rem' }}>Nett Amount</span>
              <span style={{ fontFamily:'var(--font-mono)', fontWeight:800, fontSize:'1.1rem', color:'var(--accent-dark)' }}>
                {formatCurrency(nett)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 22px', borderTop:'1px solid var(--border)', background:'var(--bg-surface-2)',
          borderRadius:'0 0 12px 12px', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>E. &amp; O. E</div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:20 }}>For ANJU TRADING</div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', fontWeight:600 }}>Authorised Signatory</div>
          </div>
        </div>
      </div>
    </div>
  )
}
