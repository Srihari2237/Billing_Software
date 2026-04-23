import InvoiceForm from '@/components/InvoiceForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewInvoicePage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link href="/invoices" className="btn btn-ghost btn-sm" style={{ marginBottom: 8, display: 'inline-flex' }}>
            <ArrowLeft size={14} /> Back
          </Link>
          <h1 className="page-title">New Invoice</h1>
          <p className="page-subtitle">Create a new sales invoice</p>
        </div>
      </div>
      <InvoiceForm />
    </div>
  )
}
