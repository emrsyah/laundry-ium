import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTRPC } from '../integrations/trpc/react'
import { useState, useEffect } from 'react'
import { Store, MessageSquare, CreditCard, ToggleLeft, ToggleRight, Save, Check } from 'lucide-react'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: settings } = useSuspenseQuery(trpc.settings.get.queryOptions())

  const [form, setForm] = useState({
    name: '',
    address: '',
    waTemplate: '',
    autoWaEnabled: false,
    paymentConfigs: [] as string[],
  })

  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) {
      setForm({
        name: settings.name ?? 'LaundryKu',
        address: settings.address ?? '',
        waTemplate: settings.waTemplate ?? '',
        autoWaEnabled: settings.autoWaEnabled ?? false,
        paymentConfigs: (settings.paymentConfigs as string[]) ?? ['TUNAI', 'TRANSFER'],
      })
    }
  }, [settings])

  const updateMutation = useMutation(
    trpc.settings.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.settings.get.queryOptions())
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      },
    })
  )

  const paymentOptions = ['TUNAI', 'TRANSFER', 'QRIS', 'OVO', 'GOPAY', 'DANA']

  function togglePayment(method: string) {
    setForm((f) => ({
      ...f,
      paymentConfigs: f.paymentConfigs.includes(method)
        ? f.paymentConfigs.filter((p) => p !== method)
        : [...f.paymentConfigs, method],
    }))
  }

  function handleSave() {
    updateMutation.mutate({
      name: form.name,
      address: form.address,
      waTemplate: form.waTemplate,
      autoWaEnabled: form.autoWaEnabled,
      paymentConfigs: form.paymentConfigs,
    })
  }

  return (
    <div className="min-h-screen px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">Pengaturan</h1>
        <p className="text-xs text-muted-foreground">Konfigurasi toko Anda</p>
      </div>

      {/* Store Info */}
      <div className="rounded-2xl border border-[var(--line)] bg-card p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Store className="h-4 w-4 text-[var(--lagoon-deep)]" />
          <h2 className="text-sm font-bold text-[var(--sea-ink)]">Informasi Toko</h2>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Nama Toko</label>
          <input
            id="settings-store-name"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-[var(--line)] bg-background rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lagoon-deep)]/30"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Alamat Toko</label>
          <textarea
            id="settings-store-address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            rows={2}
            placeholder="Jl. Contoh No. 1..."
            className="w-full border border-[var(--line)] bg-background rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lagoon-deep)]/30 resize-none"
          />
        </div>
      </div>

      {/* WhatsApp Settings */}
      <div className="rounded-2xl border border-[var(--line)] bg-card p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="h-4 w-4 text-green-600" />
          <h2 className="text-sm font-bold text-[var(--sea-ink)]">WhatsApp Notifikasi</h2>
        </div>

        {/* Auto WA Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--sea-ink)]">Auto WA Notif</p>
            <p className="text-xs text-muted-foreground">Kirim otomatis saat pesanan Selesai</p>
          </div>
          <button
            id="settings-auto-wa-toggle"
            onClick={() => setForm({ ...form, autoWaEnabled: !form.autoWaEnabled })}
            className="flex-shrink-0"
          >
            {form.autoWaEnabled
              ? <ToggleRight className="h-8 w-8 text-green-500" />
              : <ToggleLeft className="h-8 w-8 text-muted-foreground" />
            }
          </button>
        </div>

        {/* WA Template */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Template Pesan</label>
          <p className="text-[10px] text-muted-foreground mb-1.5">Gunakan <code className="bg-muted px-1 rounded">{'{{nama}}'}</code> untuk nama pelanggan</p>
          <textarea
            id="settings-wa-template"
            value={form.waTemplate}
            onChange={(e) => setForm({ ...form, waTemplate: e.target.value })}
            rows={3}
            className="w-full border border-[var(--line)] bg-background rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--lagoon-deep)]/30 resize-none"
          />
        </div>
      </div>

      {/* Payment Methods */}
      <div className="rounded-2xl border border-[var(--line)] bg-card p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="h-4 w-4 text-purple-600" />
          <h2 className="text-sm font-bold text-[var(--sea-ink)]">Metode Pembayaran</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {paymentOptions.map((method) => {
            const isActive = form.paymentConfigs.includes(method)
            return (
              <button
                key={method}
                id={`payment-toggle-${method.toLowerCase()}`}
                onClick={() => togglePayment(method)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full border transition-all ${
                  isActive
                    ? 'bg-[var(--lagoon-deep)] text-white border-[var(--lagoon-deep)]'
                    : 'bg-background border-[var(--line)] text-muted-foreground hover:border-[var(--lagoon-deep)]'
                }`}
              >
                {isActive && <Check className="h-3 w-3" />}
                {method}
              </button>
            )
          })}
        </div>
      </div>

      {/* Save Button */}
      <button
        id="btn-save-settings"
        onClick={handleSave}
        disabled={updateMutation.isPending}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 ${
          saved
            ? 'bg-green-500 text-white'
            : 'bg-gradient-to-r from-[var(--lagoon-deep)] to-[var(--palm)] text-white'
        } disabled:opacity-50`}
      >
        {saved ? (
          <><Check className="h-4 w-4" /> Tersimpan!</>
        ) : updateMutation.isPending ? (
          'Menyimpan...'
        ) : (
          <><Save className="h-4 w-4" /> Simpan Pengaturan</>
        )}
      </button>
    </div>
  )
}
