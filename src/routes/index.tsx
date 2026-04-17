import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useTRPC } from '../integrations/trpc/react'
import { ShoppingBag, Wallet, PlusCircle, UserPlus, Clock, ChevronRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: BerandaPage,
})

function BerandaPage() {
  const trpc = useTRPC()
  const { data: summary } = useSuspenseQuery(trpc.analytics.summary.queryOptions())
  const { data: orders } = useSuspenseQuery(trpc.orders.list.queryOptions())

  const recentOrders = orders?.slice(0, 5) ?? []

  const statusColor: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    DIPROSES: 'bg-blue-100 text-blue-700',
    SELESAI: 'bg-green-100 text-green-700',
  }

  return (
    <div className="min-h-screen px-4 py-6 space-y-5">
      {/* Header Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--lagoon-deep)] opacity-80">Selamat Datang 👋</p>
          <h1 className="text-2xl font-bold text-[var(--sea-ink)] mt-0.5">LaundryKu</h1>
        </div>
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[var(--lagoon)] to-[var(--palm)] flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-sm">LK</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card bg-gradient-to-br from-[var(--lagoon-deep)] to-[var(--palm)] rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <ShoppingBag className="h-4 w-4" />
            <span className="text-xs font-semibold">Pesanan Hari Ini</span>
          </div>
          <p className="text-3xl font-bold">{summary?.ordersToday ?? 0}</p>
        </div>
        <div className="stat-card bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <Wallet className="h-4 w-4" />
            <span className="text-xs font-semibold">Pendapatan Hari Ini</span>
          </div>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(summary?.revenueToday ?? 0)}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-bold text-[var(--sea-ink)] mb-3 uppercase tracking-wider opacity-70">Aksi Cepat</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/orders"
            className="quick-action-btn flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-card p-4 shadow-sm hover:-translate-y-0.5 transition-transform no-underline"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--lagoon)] to-[var(--lagoon-deep)] flex items-center justify-center shadow">
              <PlusCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--sea-ink)]">+ Pesanan</p>
              <p className="text-[10px] text-[var(--sea-ink-soft)]">Buat baru</p>
            </div>
          </Link>
          <Link
            to="/customers"
            className="quick-action-btn flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-card p-4 shadow-sm hover:-translate-y-0.5 transition-transform no-underline"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--sea-ink)]">+ Member</p>
              <p className="text-[10px] text-[var(--sea-ink-soft)]">Tambah pelanggan</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[var(--sea-ink)] uppercase tracking-wider opacity-70">
            <Clock className="inline h-4 w-4 mr-1" />
            Aktivitas Terakhir
          </h2>
          <Link to="/orders" className="text-xs text-[var(--lagoon-deep)] font-semibold flex items-center gap-0.5 no-underline">
            Lihat semua <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="rounded-2xl border border-[var(--line)] bg-card p-8 text-center">
            <ShoppingBag className="h-10 w-10 mx-auto mb-3 text-[var(--lagoon-deep)] opacity-40" />
            <p className="text-sm text-muted-foreground">Belum ada pesanan hari ini</p>
            <p className="text-xs text-muted-foreground mt-1">Buat pesanan pertama Anda!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-card p-3.5 shadow-sm">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[var(--lagoon)] to-[var(--lagoon-deep)] flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--sea-ink)] truncate">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground">{order.type} · {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(order.nominal)}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${statusColor[order.status] ?? ''}`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
