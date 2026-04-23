'use client'
import InvoiceForm from '@/components/InvoiceForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id)
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link href={`/invoices/${id}`} className="btn btn-ghost btn-sm" style={{ marginBottom: 8, display: 'inline-flex' }}>
            <ArrowLeft size={14} /> Back to Invoice
          </Link>
          <h1 className="page-title">Edit Invoice</h1>
          <p className="page-subtitle">Modify invoice #{id}</p>
        </div>
      </div>
      <InvoiceForm invoiceId={id} />
    </div>
  )
}
