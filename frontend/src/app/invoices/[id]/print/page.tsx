'use client'
import { useQuery } from '@tanstack/react-query'
import { invoiceApi, clientApi } from '@/lib/api'
import { getBillingYear } from '@/lib/utils'
import { useRef, useState } from 'react'
import Providers from '@/components/Providers'

/* ─── Indian number → words ─────────────────────────────────────────────── */
function num2words(n: number): string {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
    'Seventeen','Eighteen','Nineteen']
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  if (n === 0) return 'Zero'
  const c = (x: number): string => {
    if (x < 20)       return ones[x]
    if (x < 100)      return tens[Math.floor(x/10)] + (x%10 ? ' '+ones[x%10] : '')
    if (x < 1000)     return ones[Math.floor(x/100)]+' Hundred'+(x%100 ? ' '+c(x%100) : '')
    if (x < 100000)   return c(Math.floor(x/1000))+' Thousand'+(x%1000 ? ' '+c(x%1000) : '')
    if (x < 10000000) return c(Math.floor(x/100000))+' Lakh'+(x%100000 ? ' '+c(x%100000) : '')
    return c(Math.floor(x/10000000))+' Crore'+(x%10000000 ? ' '+c(x%10000000) : '')
  }
  return c(Math.round(n))
}

/* ─── format address: split on comma → new lines ────────────────────────── */
function formatAddress(addr: string): React.ReactNode {
  if (!addr) return null
  return addr.split(',').map((part, i, arr) => (
    <span key={i}>
      {part.trim()}{i < arr.length - 1 ? ',' : ''}
      {i < arr.length - 1 && <br />}
    </span>
  ))
}

/* ─── CSS for the popup print window ────────────────────────────────────── */
const PRINT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    font-family: 'Inter', Arial, sans-serif;
    background: #fff;
    color: #0f172a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page { size: A4 portrait; margin: 0; }
  @media print { .no-print { display: none !important; } }
`

/* ════════════════════════════════════════════════════════════════════════════
   INVOICE TEMPLATE
   A4 = 210mm × 297mm  (at screen: 794px wide)
   Section heights (exact A4 mm):
     Header / shop details  : 45mm  (~170px)
     To + Invoice info      : 50mm  (~189px)
     Items table            : 110mm (~416px)  ← flex-grow fills remainder
     GST / totals           : 40mm  (~151px)
     Signatory              : 30mm  (~114px)  ← incl. amount-in-words
   Total target             : 275mm (297mm - 22mm top/bottom bleed)
   ══════════════════════════════════════════════════════════════════════════ */
function InvoiceTemplate({ inv, clientInfo, billingYear }: any) {
  const nett     = Math.round(inv.total)
  const roundOff = nett - inv.total
  const cgst     = inv.gst / 2
  const sgst     = inv.gst / 2
  const halfGst  = inv.gst_percent / 2
  const amtWords = `Rupees ${num2words(nett)} Only`

  // Rows that fit in 110mm items section (each row ≈ 7mm)
  const MAX_ROWS  = 13
  const emptyRows = Math.max(0, MAX_ROWS - inv.items.length)

  return (
    <div style={{
      width: '210mm',
      height: '297mm',
      margin: '0 auto',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', Arial, sans-serif",
      fontSize: '10.5px',
      color: '#0f172a',
      overflow: 'hidden',
    }}>

      {/* ══ 1. SHOP HEADER — 45mm ════════════════════════════════════════════ */}
      <div style={{
        height: '45mm',
        background: '#0f172a',
        padding: '14px 22px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexShrink: 0,
      }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            ANJU TRADING
          </div>
          <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.65 }}>
            Supplies : All kinds of sewing Thread &amp; Packaging Materials<br />
            4/142, Palladam Road, Near Vigneshwara Petrol Bunk<br />
            Veerapandi (P.O) – TIRUPPUR 641 605
          </div>
        </div>
        {/* Right */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', height: '100%', gap: '6px' }}>
          <span style={{
            background: '#f59e0b', color: '#1a1000',
            fontWeight: 800, fontSize: '11px',
            padding: '5px 16px', borderRadius: '4px',
            letterSpacing: '0.12em',
          }}>INVOICE</span>
          <div style={{ fontSize: '9px', color: '#94a3b8', lineHeight: 1.7 }}>
            GSTIN: 33BHDPM4367B1ZO<br />
            Mobile: 9865244882
          </div>
        </div>
      </div>

      {/* ══ 2. TO + INVOICE INFO — 50mm ══════════════════════════════════════ */}
      <div style={{
        height: '50mm',
        display: 'grid',
        gridTemplateColumns: '56% 44%',
        borderBottom: '1.5px solid #e2e8f0',
        flexShrink: 0,
      }}>
        {/* Bill To */}
        <div style={{
          padding: '12px 20px 10px',
          borderRight: '1.5px solid #e2e8f0',
          overflow: 'hidden',
        }}>
          <div style={{
            fontSize: '7.5px', fontWeight: 700, color: '#94a3b8',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: '6px',
          }}>Bill To</div>

          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
            {inv.party}
          </div>

          {clientInfo?.address && (
            <div style={{
              fontSize: '9px', color: '#475569',
              marginTop: '5px', lineHeight: 1.7,
            }}>
              {formatAddress(clientInfo.address)}
            </div>
          )}

          {inv.delivery && inv.delivery !== inv.party && (
            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>
              <span style={{ color: '#94a3b8' }}>Delivery:</span> {inv.delivery}
            </div>
          )}

          {clientInfo?.gstin && (
            <div style={{
              fontSize: '9px', fontWeight: 600,
              color: '#334155', marginTop: '7px',
              fontFamily: "'Courier New', monospace",
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '3px',
              padding: '3px 7px',
              display: 'inline-block',
              letterSpacing: '0.04em',
            }}>
              GST IN: {clientInfo.gstin}
            </div>
          )}
        </div>

        {/* Invoice meta */}
        <div style={{ padding: '12px 20px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' }}>
          {[
            {
              label: 'Invoice No',
              value: <span style={{ fontWeight: 800, fontSize: '13px', color: '#f59e0b', fontFamily: "'Courier New', monospace" }}>
                {String(inv.inv_no).padStart(3,'0')} / {billingYear}
              </span>
            },
            {
              label: 'Date',
              value: <span style={{ fontWeight: 500, fontSize: '11px', fontFamily: "'Courier New', monospace" }}>
                {inv.date}
              </span>
            },
            {
              label: 'Payment',
              value: <span style={{
                background: inv.payment.toLowerCase() === 'cash' ? '#d1fae5' : '#fef3c7',
                color:      inv.payment.toLowerCase() === 'cash' ? '#065f46' : '#92400e',
                fontWeight: 700, fontSize: '9px',
                padding: '2px 10px', borderRadius: '20px',
                letterSpacing: '0.05em',
              }}>{inv.payment}</span>
            },
          ].map(({ label, value }, i, arr) => (
            <div key={label} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '7px 0',
              borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
            }}>
              <span style={{ fontSize: '8px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {label}
              </span>
              {value}
            </div>
          ))}
        </div>
      </div>

      {/* ══ 3. ITEMS TABLE — 110mm (flex-grow) ═══════════════════════════════ */}
      <div style={{ height: '110mm', flexShrink: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '38px' }} />
            <col />
            <col style={{ width: '52px' }} />
            <col style={{ width: '52px' }} />
            <col style={{ width: '72px' }} />
            <col style={{ width: '88px' }} />
          </colgroup>
          <thead>
            <tr style={{ background: '#f8fafc', borderTop: '1.5px solid #e2e8f0', borderBottom: '1.5px solid #e2e8f0' }}>
              {[
                { label: 'S.No',          align: 'center' },
                { label: 'Particulars',   align: 'left'   },
                { label: 'Qty',           align: 'right'  },
                { label: 'Unit',          align: 'center' },
                { label: 'Rate',          align: 'right'  },
                { label: 'Amount (Rs.)',  align: 'right'  },
              ].map(({ label, align }) => (
                <th key={label} style={{
                  padding: '6px 10px',
                  fontSize: '7.5px', fontWeight: 700,
                  color: '#64748b', letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  textAlign: align as any,
                }}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inv.items.map((item: any, i: number) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '5px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '10px' }}>{i + 1}</td>
                <td style={{ padding: '5px 10px', fontWeight: 600, fontSize: '10.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.item}</td>
                <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: "'Courier New', monospace", fontSize: '10px' }}>{item.qty}</td>
                <td style={{ padding: '5px 10px', textAlign: 'center', color: '#64748b', fontSize: '10px' }}>{item.unit}</td>
                <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: "'Courier New', monospace", fontSize: '10px' }}>{item.rate.toFixed(2)}</td>
                <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: '10.5px' }}>₹{item.amount.toFixed(2)}</td>
              </tr>
            ))}
            {/* empty filler rows */}
            {Array.from({ length: emptyRows }).map((_, i) => (
              <tr key={`e${i}`} style={{ background: (inv.items.length + i) % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '5px 10px', height: '26px' }}></td>
                <td style={{ padding: '5px 10px' }}></td>
                <td style={{ padding: '5px 10px' }}></td>
                <td style={{ padding: '5px 10px' }}></td>
                <td style={{ padding: '5px 10px' }}></td>
                <td style={{ padding: '5px 10px' }}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ══ 4. GST / TOTALS — 40mm ════════════════════════════════════════════ */}
      <div style={{
        height: '40mm',
        display: 'grid',
        gridTemplateColumns: '56% 44%',
        borderTop: '1.5px solid #e2e8f0',
        flexShrink: 0,
      }}>
        {/* Left — E. & O. E only */}
        <div style={{
          borderRight: '1.5px solid #e2e8f0',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: '8.5px', color: '#94a3b8', fontStyle: 'italic' }}>E. &amp; O. E</span>
        </div>

        {/* Right — totals */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {[
            { label: 'Sub Total',          val: `₹${inv.subtotal.toFixed(2)}`,                        bold: false },
            { label: `CGST @ ${halfGst}%`, val: `₹${cgst.toFixed(2)}`,                               bold: false },
            { label: `SGST @ ${halfGst}%`, val: `₹${sgst.toFixed(2)}`,                               bold: false },
            { label: 'Total',              val: `₹${inv.total.toFixed(2)}`,                           bold: true  },
            { label: 'Round Off',          val: `${roundOff >= 0 ? '+' : ''}${roundOff.toFixed(2)}`,  bold: false },
          ].map(({ label, val, bold }, i, arr) => (
            <div key={label} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: bold ? '5px 18px' : '4px 18px',
              borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
              background: bold ? '#fffbeb' : 'transparent',
            }}>
              <span style={{ fontSize: bold ? '11px' : '10px', fontWeight: bold ? 700 : 400, color: bold ? '#0f172a' : '#475569' }}>
                {bold ? <strong>{label}</strong> : label}
              </span>
              <span style={{ fontSize: bold ? '12px' : '10.5px', fontWeight: bold ? 700 : 500, fontFamily: "'Courier New', monospace", color: bold ? '#0f172a' : '#334155' }}>
                {val}
              </span>
            </div>
          ))}

          {/* Nett — dark bar at bottom */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '7px 18px',
            background: '#0f172a',
            marginTop: '2px',
          }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>Nett Amount</span>
            <span style={{ fontSize: '14px', fontWeight: 900, fontFamily: "'Courier New', monospace", color: '#f59e0b' }}>
              ₹{nett.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* ══ 5. AUTHORISED SIGNATORY — 30mm ════════════════════════════════════ */}
      <div style={{
        height: '30mm',
        flexShrink: 0,
        borderTop: '1.5px solid #e2e8f0',
        display: 'grid',
        gridTemplateColumns: '56% 44%',
        background: '#f8fafc',
      }}>
        {/* Left — Amount in Words */}
        <div style={{
          padding: '10px 20px',
          borderRight: '1.5px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '4px',
        }}>
          <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2px' }}>
            Amount in Words
          </div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a', lineHeight: 1.6 }}>
            {amtWords}
          </div>
        </div>

        {/* Right — For Anju Trading + Signatory */}
        <div style={{
          padding: '8px 18px 10px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}>
          <div style={{ fontSize: '8.5px', color: '#64748b' }}>
            For <strong style={{ color: '#0f172a' }}>ANJU TRADING</strong>
          </div>
          <div style={{
            fontSize: '9.5px', fontWeight: 700, color: '#0f172a',
            borderTop: '1px solid #cbd5e1',
            paddingTop: '4px', width: '100%', textAlign: 'right',
          }}>
            Authorised Signatory
          </div>
        </div>
      </div>

    </div>
  )
}

/* ─── PrintContent: fetches data, shows toolbar + preview ───────────────── */
function PrintContent({ id }: { id: number }) {
  const printRef              = useRef<HTMLDivElement>(null)
  const [printed, setPrinted] = useState(false)

  const { data: inv,     isLoading: l1 } = useQuery({ queryKey: ['invoice', id], queryFn: () => invoiceApi.get(id) })
  const { data: clients, isLoading: l2 } = useQuery({ queryKey: ['clients'],      queryFn: clientApi.list })

  const ready       = !l1 && !l2 && !!inv
  const clientInfo  = clients?.find((c: any) => c.name === inv?.party)
  const billingYear = ready
    ? (() => { try { return getBillingYear(inv!.date) } catch { return '' } })()
    : ''

  /* ── in-app print engine ────────────────────────────────────────────────── */
  const handlePrint = () => {
    const html = printRef.current?.innerHTML
    if (!html) return
    const win = window.open('', '_blank', 'width=900,height=1200,scrollbars=yes')
    if (!win) { window.print(); return }
    win.document.write(`<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Invoice ${inv?.inv_no} — Anju Trading</title>
  <style>${PRINT_CSS}</style>
</head><body>${html}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 800)
    setPrinted(true)
  }

  if (!ready) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', gap: 12,
      fontFamily: 'Inter, sans-serif', color: '#64748b', background: '#f8fafc',
    }}>
      <span style={{ fontSize: 28, display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
      Preparing invoice…
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: '#dde3ec', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        @media print { .no-print { display: none !important } body { background: #fff } }
      `}</style>

      {/* ── sticky toolbar ── */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#0f172a',
        padding: '11px 28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 2px 16px rgba(0,0,0,0.35)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg,#f59e0b,#d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 12, color: '#1a1000',
          }}>AT</div>
          <div>
            <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: 14 }}>Invoice #{inv!.inv_no}</div>
            <div style={{ color: '#64748b', fontSize: 11 }}>{inv!.party} · {inv!.date}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          <button onClick={() => window.close()} style={{
            background: 'transparent', border: '1px solid #334155',
            color: '#94a3b8', padding: '7px 16px',
            borderRadius: 7, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
          }}>← Back</button>
          <button onClick={handlePrint} style={{
            background: printed ? '#10b981' : '#f59e0b',
            border: 'none',
            color: printed ? '#fff' : '#1a1000',
            padding: '7px 22px', borderRadius: 7,
            cursor: 'pointer', fontSize: 14, fontWeight: 700,
            fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: printed ? '0 4px 12px rgba(16,185,129,0.35)' : '0 4px 12px rgba(245,158,11,0.4)',
            transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: 16 }}>{printed ? '✓' : '🖨'}</span>
            {printed ? 'Print Again' : 'Print / Save PDF'}
          </button>
        </div>
      </div>

      {/* ── A4 paper preview ── */}
      <div style={{ padding: '28px 16px 48px', display: 'flex', justifyContent: 'center' }}>
        <div ref={printRef} style={{
          background: '#fff',
          boxShadow: '0 4px 6px rgba(0,0,0,0.08), 0 20px 60px rgba(0,0,0,0.2)',
          borderRadius: 4,
          overflow: 'hidden',
          width: '794px',   /* A4 at 96dpi */
        }}>
          <InvoiceTemplate inv={inv} clientInfo={clientInfo} billingYear={billingYear} />
        </div>
      </div>
    </div>
  )
}

export default function PrintPage({ params }: { params: { id: string } }) {
  return <Providers><PrintContent id={parseInt(params.id)} /></Providers>
}
