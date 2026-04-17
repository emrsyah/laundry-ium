import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useTRPC } from '../integrations/trpc/react'
import { TrendingUp, ShoppingBag, BarChart3, Shirt } from 'lucide-react'

export const Route = createFileRoute('/analytics')({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const trpc = useTRPC()
  const { data: summary } = useSuspenseQuery(trpc.analytics.summary.queryOptions())
  const { data: weekly = [] } = useSuspenseQuery(trpc.analytics.weeklyRevenue.queryOptions())
  const { data: services = [] } = useSuspenseQuery(trpc.analytics.serviceBreakdown.queryOptions())

  const maxRevenue = Math.max(...weekly.map((d) => d.revenue), 1)
  const totalRevenue = weekly.reduce((acc, d) => acc + d.revenue, 0)
  const totalOrders = weekly.reduce((acc, d) => acc + d.count, 0)

  const kiloan = services.find((s) => s.type === 'kiloan')
  const satuan = services.find((s) => s.type === 'satuan')
  const totalServiceOrders = (kiloan?.count ?? 0) + (satuan?.count ?? 0)

  return (
    <div className="min-h-screen px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Analitik</h1>
        <p className="text-xs text-muted-foreground">7 hari terakhir</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-[var(--lagoon-deep)] to-[var(--palm)] p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-semibold">Total Pendapatan</span>
          </div>
          <p className="text-xl font-bold leading-tight">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0, notation: 'compact' }).format(totalRevenue)}
          </p>
          <p className="text-[10px] opacity-80 mt-0.5">7 hari terakhir</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 p-4 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <ShoppingBag className="h-4 w-4" />
            <span className="text-xs font-semibold">Total Pesanan</span>
          </div>
          <p className="text-xl font-bold">{totalOrders}</p>
          <p className="text-[10px] opacity-80 mt-0.5">7 hari terakhir</p>
        </div>
      </div>

      {/* Weekly Bar Chart */}
      <div className="rounded-2xl border border-[var(--line)] bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-[var(--lagoon-deep)]" />
          <h2 className="text-sm font-bold text-[var(--sea-ink)]">Pendapatan 7 Hari</h2>
        </div>
        <div className="flex items-end gap-2 h-32">
          {weekly.map((day, i) => {
            const heightPct = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full relative flex items-end" style={{ height: '96px' }}>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[var(--lagoon-deep)] to-[var(--lagoon)] transition-all duration-500"
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                    title={`Rp ${day.revenue.toLocaleString('id-ID')}`}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{day.label}</span>
              </div>
            )
          })}
        </div>
        {maxRevenue === 1 && (
          <p className="text-center text-xs text-muted-foreground mt-2">Belum ada data pendapatan minggu ini</p>
        )}
      </div>

      {/* Service Breakdown */}
      <div className="rounded-2xl border border-[var(--line)] bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Shirt className="h-4 w-4 text-purple-600" />
          <h2 className="text-sm font-bold text-[var(--sea-ink)]">Layanan Terlaris</h2>
        </div>

        {totalServiceOrders === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Belum ada data layanan</p>
        ) : (
          <div className="space-y-3">
            {[
              { label: 'Kiloan', data: kiloan, color: 'from-[var(--lagoon-deep)] to-[var(--lagoon)]' },
              { label: 'Satuan', data: satuan, color: 'from-purple-500 to-purple-300' },
            ].map(({ label, data, color }) => {
              const pct = totalServiceOrders > 0 ? ((data?.count ?? 0) / totalServiceOrders) * 100 : 0
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold text-[var(--sea-ink)]">{label}</span>
                    <span className="text-muted-foreground">{data?.count ?? 0} pesanan · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Today Stats */}
      <div className="rounded-2xl border border-[var(--line)] bg-card p-4 shadow-sm">
        <h2 className="text-sm font-bold text-[var(--sea-ink)] mb-3">📊 Hari Ini</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-[var(--sea-ink)]">{summary?.ordersToday ?? 0}</p>
            <p className="text-xs text-muted-foreground">Pesanan</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[var(--sea-ink)]">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0, notation: 'compact' }).format(summary?.revenueToday ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">Pendapatan</p>
          </div>
        </div>
      </div>
    </div>
  )
}
