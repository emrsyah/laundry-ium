import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '../integrations/trpc/react'
import { useState } from 'react'
import { Search, UserPlus, Users, Phone, MapPin, ShoppingBag, Wallet, X } from 'lucide-react'

export const Route = createFileRoute('/customers')({
  component: CustomersPage,
})

function CustomersPage() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: customers = [] } = useSuspenseQuery(trpc.customers.list.queryOptions())

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', address: '' })

  const createMutation = useMutation(
    trpc.customers.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.customers.list.queryOptions())
        setShowForm(false)
        setForm({ name: '', phone: '', address: '' })
      },
    })
  )

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  )

  return (
    <div className="min-h-screen px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Pelanggan</h1>
          <p className="text-xs text-muted-foreground">{customers.length} member terdaftar</p>
        </div>
        <button
          id="btn-add-customer"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-gradient-to-br from-purple-500 to-pink-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md hover:-translate-y-0.5 transition-transform"
        >
          <UserPlus className="h-4 w-4" /> Tambah
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          id="customer-search"
          type="text"
          placeholder="Cari nama atau nomor HP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--line)] bg-card text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lagoon-deep)]/30"
        />
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-[var(--line)] bg-card p-10 text-center">
            <Users className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-30" />
            <p className="text-sm text-muted-foreground">Tidak ada pelanggan ditemukan</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-xs text-[var(--lagoon-deep)] font-semibold"
            >
              + Tambah pelanggan pertama
            </button>
          </div>
        ) : (
          filtered.map((customer) => (
            <div key={customer.id} className="rounded-2xl border border-[var(--line)] bg-card p-4 shadow-sm hover:border-[var(--lagoon-deep)]/40 transition-colors">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0 shadow">
                  <span className="text-white font-bold text-base">
                    {customer.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[var(--sea-ink)] truncate">{customer.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{customer.phone}</p>
                  </div>
                  {customer.address && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground truncate">{customer.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-[var(--lagoon)]/10 p-2.5 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-[var(--lagoon-deep)]" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Total Pesanan</p>
                    <p className="text-sm font-bold text-[var(--sea-ink)]">{customer.totalOrders ?? 0}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-purple-50 p-2.5 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Total Belanja (LTV)</p>
                    <p className="text-sm font-bold text-[var(--sea-ink)]">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0, notation: 'compact' }).format(customer.totalSpent ?? 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Customer Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm px-4 pb-4">
          <div className="w-full max-w-md bg-background rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--sea-ink)]">Tambah Pelanggan</h2>
              <button onClick={() => setShowForm(false)} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nama Lengkap *</label>
                <input
                  id="customer-name-input"
                  type="text"
                  placeholder="Budi Santoso"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-[var(--line)] bg-card rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lagoon-deep)]/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nomor HP (WhatsApp) *</label>
                <input
                  id="customer-phone-input"
                  type="tel"
                  placeholder="08123456789"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-[var(--line)] bg-card rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lagoon-deep)]/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Alamat</label>
                <textarea
                  id="customer-address-input"
                  placeholder="Jl. Contoh No. 1, Kota..."
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2}
                  className="w-full border border-[var(--line)] bg-card rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lagoon-deep)]/30 resize-none"
                />
              </div>
            </div>

            <button
              id="btn-submit-customer"
              onClick={() => {
                if (!form.name || !form.phone) return
                createMutation.mutate({ name: form.name, phone: form.phone, address: form.address })
              }}
              disabled={createMutation.isPending || !form.name || !form.phone}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 hover:-translate-y-0.5 transition-transform"
            >
              {createMutation.isPending ? 'Menyimpan...' : 'Simpan Pelanggan'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
