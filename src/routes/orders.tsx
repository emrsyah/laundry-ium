import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '../integrations/trpc/react'
import { useState } from 'react'
import { Search, Plus, MessageCircle, X, ChevronDown, ShoppingBag } from 'lucide-react'

export const Route = createFileRoute('/orders')({
  component: OrdersPage,
})

type OrderStatus = 'PENDING' | 'DIPROSES' | 'SELESAI'

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Menunggu',
  DIPROSES: 'Diproses',
  SELESAI: 'Selesai',
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  DIPROSES: 'bg-blue-100 text-blue-700 border-blue-200',
  SELESAI: 'bg-green-100 text-green-700 border-green-200',
}

function OrdersPage() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: orders = [] } = useSuspenseQuery(trpc.orders.list.queryOptions())
  const { data: customers = [] } = useSuspenseQuery(trpc.customers.list.queryOptions())

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'ALL'>('ALL')
  const [selectedOrder, setSelectedOrder] = useState<typeof orders[0] | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Form state
  const [form, setForm] = useState({ customerId: '', type: 'kiloan', nominal: '' })
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing')
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' })

  const createMutation = useMutation(
    trpc.orders.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.orders.list.queryOptions())
        setShowCreateForm(false)
        setForm({ customerId: '', type: 'kiloan', nominal: '' })
        setNewCustomer({ name: '', phone: '' })
        setCustomerMode('existing')
      },
    })
  )

  const createCustomerMutation = useMutation(
    trpc.customers.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(trpc.customers.list.queryOptions())
        createMutation.mutate({
          customerId: data.id,
          type: form.type,
          nominal: Number(form.nominal),
        })
      },
    })
  )

  const updateStatusMutation = useMutation(
    trpc.orders.updateStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.orders.list.queryOptions())
        queryClient.invalidateQueries(trpc.analytics.summary.queryOptions())
        setSelectedOrder(null)
      },
    })
  )

  const filtered = orders.filter((o) => {
    const matchSearch = o.customerName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'ALL' || o.status === filterStatus
    return matchSearch && matchStatus
  })

  function handleWaNotif(order: typeof orders[0]) {
    const phone = order.customerPhone.replace(/\D/g, '')
    const normalizedPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone
    const msg = encodeURIComponent(
      `Halo ${order.customerName}, pesanan laundry Anda (${order.type}) sudah SELESAI! Silakan diambil. Total: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(order.nominal)} 🙏`
    )
    window.open(`https://wa.me/${normalizedPhone}?text=${msg}`, '_blank')
  }

  const nextStatus: Record<OrderStatus, OrderStatus | null> = {
    PENDING: 'DIPROSES',
    DIPROSES: 'SELESAI',
    SELESAI: null,
  }

  return (
    <div className="min-h-screen px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Pesanan</h1>
          <p className="text-xs text-muted-foreground">{orders.length} pesanan total</p>
        </div>
        <button
          id="btn-new-order"
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-1.5 bg-gradient-to-br from-[var(--lagoon-deep)] to-[var(--palm)] text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md hover:-translate-y-0.5 transition-transform"
        >
          <Plus className="h-4 w-4" /> Baru
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          id="order-search"
          type="text"
          placeholder="Cari nama pelanggan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--line)] bg-card text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lagoon-deep)]/30"
        />
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['ALL', 'PENDING', 'DIPROSES', 'SELESAI'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              filterStatus === s
                ? 'bg-[var(--lagoon-deep)] text-white border-[var(--lagoon-deep)]'
                : 'bg-card text-muted-foreground border-[var(--line)] hover:border-[var(--lagoon-deep)]'
            }`}
          >
            {s === 'ALL' ? 'Semua' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Order List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-[var(--line)] bg-card p-10 text-center">
            <ShoppingBag className="h-10 w-10 mx-auto mb-2 text-[var(--lagoon-deep)] opacity-30" />
            <p className="text-sm text-muted-foreground">Tidak ada pesanan</p>
          </div>
        ) : (
          filtered.map((order) => (
            <div
              key={order.id}
              className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-card p-3.5 shadow-sm cursor-pointer hover:border-[var(--lagoon-deep)]/40 transition-colors"
              onClick={() => setSelectedOrder(order)}
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--lagoon)] to-[var(--lagoon-deep)] flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--sea-ink)] truncate">{order.customerName}</p>
                <p className="text-xs text-muted-foreground">
                  {order.type} · {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(order.nominal)}
                </p>
                <p className="text-[10px] text-muted-foreground/70">{new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLOR[order.status as OrderStatus]}`}>
                  {STATUS_LABELS[order.status as OrderStatus]}
                </span>
                {order.status === 'SELESAI' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleWaNotif(order) }}
                    className="flex items-center gap-1 text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold hover:bg-green-600 transition-colors"
                  >
                    <MessageCircle className="h-3 w-3" /> WA
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm px-4 pb-4">
          <div className="w-full max-w-md bg-background rounded-3xl p-6 space-y-4 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--sea-ink)]">Detail Pesanan</h2>
              <button onClick={() => setSelectedOrder(null)} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Pelanggan</span><span className="font-semibold">{selectedOrder.customerName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Telepon</span><span className="font-semibold">{selectedOrder.customerPhone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Jenis</span><span className="font-semibold capitalize">{selectedOrder.type}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Nominal</span><span className="font-semibold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(selectedOrder.nominal)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pembayaran</span><span className="font-semibold">{selectedOrder.paymentMethod}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${STATUS_COLOR[selectedOrder.status as OrderStatus]}`}>
                  {STATUS_LABELS[selectedOrder.status as OrderStatus]}
                </span>
              </div>
            </div>

            {/* Status Actions */}
            <div className="space-y-2">
              {nextStatus[selectedOrder.status as OrderStatus] && (
                <button
                  onClick={() => updateStatusMutation.mutate({ id: selectedOrder.id, status: nextStatus[selectedOrder.status as OrderStatus]! })}
                  disabled={updateStatusMutation.isPending}
                  className="w-full bg-gradient-to-r from-[var(--lagoon-deep)] to-[var(--palm)] text-white font-semibold py-3 rounded-xl disabled:opacity-50 hover:-translate-y-0.5 transition-transform"
                >
                  {updateStatusMutation.isPending ? 'Memperbarui...' : `Tandai ${STATUS_LABELS[nextStatus[selectedOrder.status as OrderStatus]!]}`}
                </button>
              )}
              {selectedOrder.status === 'SELESAI' && (
                <button
                  onClick={() => handleWaNotif(selectedOrder)}
                  className="w-full flex items-center justify-center gap-2 bg-green-500 text-white font-semibold py-3 rounded-xl hover:-translate-y-0.5 transition-transform"
                >
                  <MessageCircle className="h-4 w-4" /> Kirim WA Notifikasi
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm px-4 pb-4">
          <div className="w-full max-w-md bg-background rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--sea-ink)]">Pesanan Baru</h2>
              <button onClick={() => setShowCreateForm(false)} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Pelanggan</label>
                
                <div className="flex bg-[var(--line)]/50 p-1 rounded-xl mb-3">
                  <button 
                    onClick={() => setCustomerMode('existing')}
                    className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all ${customerMode === 'existing' ? 'bg-card shadow-sm text-[var(--sea-ink)]' : 'text-muted-foreground hover:text-[var(--sea-ink-soft)]'}`}
                  >
                    Pilih Lama
                  </button>
                  <button 
                    onClick={() => setCustomerMode('new')}
                    className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all ${customerMode === 'new' ? 'bg-card shadow-sm text-[var(--sea-ink)]' : 'text-muted-foreground hover:text-[var(--sea-ink-soft)]'}`}
                  >
                    Pelanggan Baru
                  </button>
                </div>

                {customerMode === 'existing' ? (
                  <div className="relative animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 duration-200">
                    <select
                      id="order-customer-select"
                      value={form.customerId}
                      onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                      className="w-full appearance-none border border-[var(--line)] bg-card rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lagoon-deep)]/30 pr-8"
                    >
                      <option value="">-- Pilih Pelanggan --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                ) : (
                  <div className="space-y-2 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 duration-200">
                    <input
                      type="text"
                      placeholder="Nama Pelanggan"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      className="w-full border border-[var(--line)] bg-card rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lagoon-deep)]/30"
                    />
                    <input
                      type="tel"
                      placeholder="Nomor HP / WhatsApp"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                      className="w-full border border-[var(--line)] bg-card rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lagoon-deep)]/30"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Jenis Layanan</label>
                <div className="grid grid-cols-2 gap-2">
                  {['kiloan', 'satuan'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, type: t })}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                        form.type === t
                          ? 'bg-[var(--lagoon-deep)] text-white border-[var(--lagoon-deep)] shadow-md'
                          : 'bg-card border-[var(--line)] text-[var(--sea-ink-soft)] hover:bg-[var(--line)]/50'
                      }`}
                    >
                      {t === 'kiloan' ? '⚖️' : '👔'} {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Total Harga (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold flex items-center pr-2 border-r border-[var(--line)]">Rp</span>
                  <input
                    id="order-nominal-input"
                    type="number"
                    placeholder="Contoh: 15000"
                    value={form.nominal}
                    onChange={(e) => setForm({ ...form, nominal: e.target.value })}
                    className="w-full border border-[var(--line)] bg-card rounded-xl pl-14 pr-3 py-2.5 text-base font-bold text-[var(--sea-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--lagoon-deep)]/30"
                  />
                </div>
                <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 no-scrollbar">
                  {['15000', '20000', '25000', '35000', '50000'].map(nom => (
                    <button
                      key={nom}
                      onClick={() => setForm({ ...form, nominal: nom })}
                      className="flex-shrink-0 text-[11px] font-semibold px-2.5 py-1.5 rounded border border-[var(--line)] bg-card text-[var(--sea-ink-soft)] hover:bg-[var(--lagoon)]/20 hover:border-[var(--lagoon-deep)] transition-all"
                    >
                      {Number(nom) / 1000}k
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              id="btn-submit-order"
              onClick={() => {
                if (!form.nominal) return
                if (customerMode === 'existing') {
                  if (!form.customerId) return
                  createMutation.mutate({
                    customerId: Number(form.customerId),
                    type: form.type,
                    nominal: Number(form.nominal),
                  })
                } else {
                  if (!newCustomer.name || !newCustomer.phone) return
                  createCustomerMutation.mutate({
                    name: newCustomer.name,
                    phone: newCustomer.phone,
                  })
                }
              }}
              disabled={createMutation.isPending || createCustomerMutation.isPending || !form.nominal || (customerMode === 'existing' ? !form.customerId : (!newCustomer.name || !newCustomer.phone))}
              className="w-full bg-gradient-to-r from-[var(--lagoon-deep)] to-[var(--palm)] text-white font-semibold py-3 rounded-xl disabled:opacity-50 hover:-translate-y-0.5 transition-transform"
            >
              {createMutation.isPending || createCustomerMutation.isPending ? 'Menyimpan...' : 'Buat Pesanan'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
