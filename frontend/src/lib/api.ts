import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export interface InvoiceItem {
  item: string
  qty: number
  unit: string
  rate: number
  amount: number
}

export interface Invoice {
  id: number
  inv_no: string
  date: string
  party: string
  delivery: string
  payment: string
  subtotal: number
  gst: number
  total: number
  gst_percent: number
  items: InvoiceItem[]
}

export interface InvoiceSummary {
  id: number
  inv_no: string
  date: string
  party: string
  total: number
}

export interface Client {
  name: string
  payment_terms: string
  address: string
  gstin: string
}

export interface Item {
  name: string
  unit: string
  rate: number
  gst: number
}

export interface DashboardStats {
  total_invoices: number
  total_revenue: number
  total_subtotal: number
  cash_invoices: number
  credit_invoices: number
  top_clients: { party: string; total: number }[]
  daily_sales: { date: string; total: number }[]
}

export const invoiceApi = {
  list:      ()                        => api.get<InvoiceSummary[]>('/invoices').then(r => r.data),
  get:       (id: number)              => api.get<Invoice>(`/invoices/${id}`).then(r => r.data),
  nextNo:    ()                        => api.get<{ inv_no: string; billing_year: string }>('/invoices/next-no').then(r => r.data),
  dashboard: ()                        => api.get<DashboardStats>('/invoices/dashboard').then(r => r.data),
  create:    (data: Omit<Invoice,'id'>) => api.post<{id:number}>('/invoices', data).then(r => r.data),
  update:    (id: number, data: Omit<Invoice,'id'>) => api.put(`/invoices/${id}`, data).then(r => r.data),
  delete:    (id: number)              => api.delete(`/invoices/${id}`).then(r => r.data),
  printUrl:  (id: number)              => `/invoices/${id}/print`,
}

export const clientApi = {
  list:   ()                   => api.get<Client[]>('/clients').then(r => r.data),
  add:    (c: Omit<Client,'name'> & {name:string}) => api.post('/clients', c).then(r => r.data),
  update: (name: string, c: Client)                => api.put(`/clients/${encodeURIComponent(name)}`, c).then(r => r.data),
  remove: (name: string)       => api.delete(`/clients/${encodeURIComponent(name)}`).then(r => r.data),
}

export const itemApi = {
  list:   ()                  => api.get<Item[]>('/items').then(r => r.data),
  add:    (i: Item)           => api.post('/items', i).then(r => r.data),
  update: (name: string, i: Item) => api.put(`/items/${encodeURIComponent(name)}`, i).then(r => r.data),
  remove: (name: string)      => api.delete(`/items/${encodeURIComponent(name)}`).then(r => r.data),
}
