import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Check,
	CreditCard,
	Loader2,
	MessageSquare,
	Save,
	Store,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useTRPC } from "../integrations/trpc/react";

export const Route = createFileRoute("/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { data: settings } = useSuspenseQuery(trpc.settings.get.queryOptions());

	const [form, setForm] = useState({
		name: "",
		address: "",
		waTemplate: "",
		autoWaEnabled: false,
		paymentConfigs: [] as string[],
	});

	const [saved, setSaved] = useState(false);

	useEffect(() => {
		if (settings) {
			setForm({
				name: settings.name ?? "LaundryKu",
				address: settings.address ?? "",
				waTemplate: settings.waTemplate ?? "",
				autoWaEnabled: settings.autoWaEnabled ?? false,
				paymentConfigs: (settings.paymentConfigs as string[]) ?? [
					"TUNAI",
					"TRANSFER",
				],
			});
		}
	}, [settings]);

	const updateMutation = useMutation(
		trpc.settings.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.settings.get.queryOptions());
				setSaved(true);
				toast.success("Pengaturan berhasil disimpan!");
				setTimeout(() => setSaved(false), 2500);
			},
			onError: () => {
				toast.error("Gagal menyimpan pengaturan. Coba lagi.");
			},
		}),
	);

	const paymentOptions = ["TUNAI", "TRANSFER", "QRIS", "OVO", "GOPAY", "DANA"];

	function togglePayment(method: string) {
		setForm((f) => ({
			...f,
			paymentConfigs: f.paymentConfigs.includes(method)
				? f.paymentConfigs.filter((p) => p !== method)
				: [...f.paymentConfigs, method],
		}));
	}

	function handleSave() {
		updateMutation.mutate({
			name: form.name,
			address: form.address,
			waTemplate: form.waTemplate,
			autoWaEnabled: form.autoWaEnabled,
			paymentConfigs: form.paymentConfigs,
		});
	}

	return (
		<div className="px-4 py-5 space-y-5">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
				<p className="text-sm text-muted-foreground">Konfigurasi toko Anda</p>
			</div>

			{/* Store Info */}
			<div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-4">
				<div className="flex items-center gap-2">
					<Store className="h-4 w-4 text-primary" />
					<h2 className="text-sm font-bold text-foreground">Informasi Toko</h2>
				</div>
				<div className="space-y-3">
					<div className="space-y-1.5">
						<Label htmlFor="settings-name" className="text-sm font-medium">
							Nama Toko
						</Label>
						<Input
							id="settings-name"
							type="text"
							value={form.name}
							onChange={(e) => setForm({ ...form, name: e.target.value })}
							className="h-11 rounded-xl"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="settings-address" className="text-sm font-medium">
							Alamat Toko
						</Label>
						<Textarea
							id="settings-address"
							value={form.address}
							onChange={(e) => setForm({ ...form, address: e.target.value })}
							rows={2}
							placeholder="Jl. Contoh No. 1..."
							className="rounded-xl resize-none"
						/>
					</div>
				</div>
			</div>

			{/* WhatsApp Settings */}
			<div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-4">
				<div className="flex items-center gap-2">
					<MessageSquare className="h-4 w-4 text-green-600" />
					<h2 className="text-sm font-bold text-foreground">
						WhatsApp Notifikasi
					</h2>
				</div>

				{/* Auto WA Toggle */}
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm font-medium text-foreground">
							Kirim Otomatis
						</p>
						<p className="text-xs text-muted-foreground">
							Otomatis kirim WA saat pesanan selesai
						</p>
					</div>
					<button
						type="button"
						onClick={() =>
							setForm({
								...form,
								autoWaEnabled: !form.autoWaEnabled,
							})
						}
						className={[
							"relative h-7 w-12 rounded-full transition-colors shrink-0",
							form.autoWaEnabled ? "bg-primary" : "bg-muted",
						].join(" ")}
					>
						<span
							className={[
								"absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform",
								form.autoWaEnabled
									? "translate-x-5.5 left-0"
									: "translate-x-0.5 left-0",
							].join(" ")}
						/>
					</button>
				</div>

				{/* WA Template */}
				<div className="space-y-1.5">
					<Label className="text-sm font-medium">Template Pesan</Label>
					<p className="text-xs text-muted-foreground">
						Gunakan{" "}
						<code className="bg-muted px-1.5 py-0.5 rounded text-xs">
							{"{{nama}}"}
						</code>{" "}
						untuk nama pelanggan
					</p>
					<Textarea
						value={form.waTemplate}
						onChange={(e) => setForm({ ...form, waTemplate: e.target.value })}
						rows={3}
						className="rounded-xl resize-none"
					/>
				</div>
			</div>

			{/* Payment Methods */}
			<div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3">
				<div className="flex items-center gap-2">
					<CreditCard className="h-4 w-4 text-primary" />
					<h2 className="text-sm font-bold text-foreground">
						Metode Pembayaran
					</h2>
				</div>
				<div className="flex flex-wrap gap-2">
					{paymentOptions.map((method) => {
						const isActive = form.paymentConfigs.includes(method);
						return (
							<button
								key={method}
								type="button"
								onClick={() => togglePayment(method)}
								className={[
									"flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-full border transition-all h-10",
									isActive
										? "bg-primary text-primary-foreground border-primary"
										: "bg-background border-border text-muted-foreground hover:border-primary/50",
								].join(" ")}
							>
								{isActive && <Check className="h-3.5 w-3.5" />}
								{method}
							</button>
						);
					})}
				</div>
			</div>

			{/* Save Button */}
			<Button
				onClick={handleSave}
				disabled={updateMutation.isPending}
				variant={saved ? "outline" : "default"}
				className={[
					"w-full h-12 rounded-xl text-sm font-semibold gap-2",
					saved
						? "bg-green-500 text-white hover:bg-green-500 border-green-500"
						: "",
				].join(" ")}
			>
				{saved ? (
					<>
						<Check className="h-4 w-4" /> Tersimpan!
					</>
				) : updateMutation.isPending ? (
					<>
						<Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
					</>
				) : (
					<>
						<Save className="h-4 w-4" /> Simpan Pengaturan
					</>
				)}
			</Button>
		</div>
	);
}
