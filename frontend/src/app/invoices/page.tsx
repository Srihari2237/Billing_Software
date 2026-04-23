'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoiceApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, Printer, Trash2, Pencil, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

export default function InvoicesPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: invoices = [], isLoading } = useQuery({ queryKey: ['invoices'], queryFn: invoiceApi.list })

  const deleteMut = useMutation({
    mutationFn: invoiceApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invoices'] }); toast.success('Invoice deleted'); setDeleteId(null) },
    onError: () => toast.error('Delete failed'),
  })

  const filtered = invoices.filter(inv =>
    inv.party.toLowerCase().includes(search.toLowerCase()) ||
    inv.inv_no.includes(search) ||
    inv.date.includes(search)
  )

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{invoices.length} total invoices</p>
        </div>
        <Link href="/invoices/new" className="btn btn-primary">
          <Plus size={15} /> New Invoice
        </Link>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input" placeholder="Search by party, invoice no, date…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 32 }}
          />
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Invoice No</th>
              <th>Date</th>
              <th>Party</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6}>
                <div className="empty-state">
                  <p>{search ? 'No invoices match your search' : 'No invoices yet'}</p>
                </div>
              </td></tr>
            ) : filtered.map((inv, i) => (
              <tr key={inv.id}>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)', fontSize: '0.85rem' }}>
                    #{inv.inv_no}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{inv.date}</td>
                <td style={{ fontWeight: 500 }}>{inv.party}</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {formatCurrency(inv.total)}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <Link href={`/invoices/${inv.id}`} className="btn btn-ghost btn-icon btn-sm" title="View">
                      <Eye size={14} />
                    </Link>
                    <Link href={`/invoices/${inv.id}/edit`} className="btn btn-ghost btn-icon btn-sm" title="Edit">
                      <Pencil size={14} />
                    </Link>
                    <button
                      className="btn btn-ghost btn-icon btn-sm" title="Print Invoice"
                      onClick={() => window.open(invoiceApi.pdfUrl(inv.id).replace('/pdf', '/print'), '_blank')}
                    >
                      <Printer size={14} />
                    </button>
                    <button
                      className="btn btn-danger btn-icon btn-sm" title="Delete"
                      onClick={() => setDeleteId(inv.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirm Modal */}
      {deleteId !== null && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '28px 28px 20px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', marginBottom: 8 }}>Delete Invoice?</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                This action cannot be undone. The invoice and all its items will be permanently removed.
              </p>
            </div>
            <div style={{ padding: '0 28px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={() => deleteMut.mutate(deleteId!)}
                disabled={deleteMut.isPending}
              >
                {deleteMut.isPending ? 'Deleting…' : 'Delete Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
