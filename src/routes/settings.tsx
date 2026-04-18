import {
	queryOptions,
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
	Pencil,
	Plus,
	Save,
	Shirt,
	Store,
	Trash2,
	Lock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authClient } from "#/lib/auth-client";
import {
	servicesCreate,
	servicesDelete,
	servicesList,
	servicesUpdate,
	settingsGet,
	settingsUpdate,
} from "#/lib/server-fns";
import { formatRupiah } from "#/lib/utils";
import { Button } from "../components/ui/button";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "../components/ui/drawer";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";

export const Route = createFileRoute("/settings")({
	component: SettingsPage,
});

export const settingsGetQueryOptions = queryOptions({
	queryKey: ["settings"],
	queryFn: () => settingsGet(),
});

export const servicesListQueryOptions = queryOptions({
	queryKey: ["services", "list"],
	queryFn: () => servicesList(),
});

type ServiceForm = {
	name: string;
	category: "kiloan" | "satuan";
	unit: string;
	price: string;
};

function SettingsPage() {
	const queryClient = useQueryClient();
	const { data: settings } = useSuspenseQuery(settingsGetQueryOptions);
	const { data: services = [] } = useSuspenseQuery(servicesListQueryOptions);

	const [form, setForm] = useState({
		name: "",
		address: "",
		waTemplate: "",
		autoWaEnabled: false,
		paymentConfigs: [] as string[],
	});

	const [saved, setSaved] = useState(false);

	const [showServiceDrawer, setShowServiceDrawer] = useState(false);
	const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
	const [serviceForm, setServiceForm] = useState<ServiceForm>({
		name: "",
		category: "kiloan",
		unit: "",
		price: "",
	});

	const [pinForm, setPinForm] = useState({ current: "", new: "", confirm: "" });
	const [pinLoading, setPinLoading] = useState(false);
	const [showPinDrawer, setShowPinDrawer] = useState(false);

	async function handleChangePin() {
		if (!pinForm.current || !pinForm.new || !pinForm.confirm) {
			toast.error("Lengkapi semua field PIN");
			return;
		}
		if (pinForm.new !== pinForm.confirm) {
			toast.error("PIN baru dan konfirmasi tidak cocok");
			return;
		}

		setPinLoading(true);
		try {
			const { error } = await authClient.changePassword({
				newPassword: pinForm.new,
				currentPassword: pinForm.current,
				revokeOtherSessions: true
			});

			if (error) {
				toast.error(error.message || "Gagal mengubah PIN");
			} else {
				toast.success("PIN berhasil diubah!");
				setPinForm({ current: "", new: "", confirm: "" });
				setShowPinDrawer(false);
			}
		} catch (err) {
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setPinLoading(false);
		}
	}

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

	const updateMutation = useMutation({
		mutationFn: (data: {
			name?: string;
			address?: string;
			waTemplate?: string;
			autoWaEnabled?: boolean;
			paymentConfigs?: string[];
		}) => settingsUpdate({ data }),
		onSuccess: () => {
			queryClient.invalidateQueries(settingsGetQueryOptions);
			setSaved(true);
			toast.success("Pengaturan berhasil disimpan!");
			setTimeout(() => setSaved(false), 2500);
		},
		onError: () => toast.error("Gagal menyimpan pengaturan. Coba lagi."),
	});

	const serviceCreateMutation = useMutation({
		mutationFn: (data: {
			name: string;
			category: string;
			unit: string;
			price: number;
		}) => servicesCreate({ data }),
		onSuccess: () => {
			queryClient.invalidateQueries(servicesListQueryOptions);
			resetServiceForm();
			toast.success("Layanan berhasil ditambahkan");
		},
		onError: () => toast.error("Gagal menambah layanan. Coba lagi."),
	});

	const serviceUpdateMutation = useMutation({
		mutationFn: (data: {
			id: number;
			name?: string;
			category?: string;
			unit?: string;
			price?: number;
		}) => servicesUpdate({ data }),
		onSuccess: () => {
			queryClient.invalidateQueries(servicesListQueryOptions);
			setShowServiceDrawer(false);
			toast.success("Layanan berhasil diperbarui");
		},
		onError: () => toast.error("Gagal memperbarui layanan. Coba lagi."),
	});

	const serviceDeleteMutation = useMutation({
		mutationFn: (data: { id: number }) => servicesDelete({ data }),
		onSuccess: () => {
			queryClient.invalidateQueries(servicesListQueryOptions);
			toast.success("Layanan berhasil dihapus");
		},
		onError: () => toast.error("Gagal menghapus layanan. Coba lagi."),
	});

	function resetServiceForm() {
		setServiceForm({ name: "", category: "kiloan", unit: "", price: "" });
		setEditingServiceId(null);
	}

	function openServiceDrawer(service?: (typeof services)[0]) {
		if (service) {
			setEditingServiceId(service.id);
			setServiceForm({
				name: service.name,
				category: service.category as "kiloan" | "satuan",
				unit: service.unit,
				price: String(service.price),
			});
		} else {
			resetServiceForm();
		}
		setShowServiceDrawer(true);
	}

	function handleServiceSubmit() {
		if (
			!serviceForm.name.trim() ||
			!serviceForm.unit.trim() ||
			!serviceForm.price
		) {
			toast.error("Lengkapi semua field");
			return;
		}
		if (editingServiceId) {
			serviceUpdateMutation.mutate({
				id: editingServiceId,
				name: serviceForm.name.trim(),
				category: serviceForm.category,
				unit: serviceForm.unit.trim(),
				price: Number(serviceForm.price),
			});
		} else {
			serviceCreateMutation.mutate({
				name: serviceForm.name.trim(),
				category: serviceForm.category,
				unit: serviceForm.unit.trim(),
				price: Number(serviceForm.price),
			});
		}
	}

	function handleServiceDelete(id: number, name: string) {
		if (window.confirm(`Hapus layanan "${name}"?`)) {
			serviceDeleteMutation.mutate({ id });
		}
	}

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

			{/* Security / Admin PIN */}
			<div className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
						<Lock className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h2 className="text-sm font-bold text-foreground">Akses Kasir (PIN)</h2>
						<p className="text-xs text-muted-foreground mt-0.5">Kelola PIN untuk masuk</p>
					</div>
				</div>
				<Button size="sm" variant="outline" onClick={() => setShowPinDrawer(true)} className="rounded-xl font-semibold px-4">
					Ubah
				</Button>
			</div>

			{/* WhatsApp Settings */}
			<div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-4">
				<div className="flex items-center gap-2">
					<MessageSquare className="h-4 w-4 text-green-600" />
					<h2 className="text-sm font-bold text-foreground">
						WhatsApp Notifikasi
					</h2>
				</div>
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
							setForm({ ...form, autoWaEnabled: !form.autoWaEnabled })
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

			{/* Services Catalog */}
			<div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Shirt className="h-4 w-4 text-primary" />
						<h2 className="text-sm font-bold text-foreground">
							Katalog Layanan & Harga
						</h2>
					</div>
					<Button
						size="sm"
						variant="outline"
						className="rounded-full gap-1.5 h-9"
						onClick={() => openServiceDrawer()}
					>
						<Plus className="h-4 w-4" /> Tambah
					</Button>
				</div>

				{services.length === 0 ? (
					<div className="text-center py-6">
						<p className="text-sm text-muted-foreground">
							Belum ada layanan. Tambah layanan pertama Anda.
						</p>
					</div>
				) : (
					<div className="space-y-2">
						{services.map((service) => (
							<div
								key={service.id}
								className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3"
							>
								<div className="min-w-0">
									<p className="text-sm font-semibold text-foreground truncate">
										{service.name}
									</p>
									<div className="flex items-center gap-2 mt-0.5">
										<span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
											{service.category === "kiloan" ? "⚖️ Kiloan" : "👔 Satuan"}
										</span>
										<span className="text-[11px] text-muted-foreground">
											/{service.unit}
										</span>
										<span className="text-xs font-bold text-primary">
											{formatRupiah(service.price)}
										</span>
									</div>
								</div>
								<div className="flex items-center gap-1">
									<button
										type="button"
										onClick={() => openServiceDrawer(service)}
										className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
									>
										<Pencil className="h-3.5 w-3.5" />
									</button>
									<button
										type="button"
										onClick={() =>
											handleServiceDelete(service.id, service.name)
										}
										className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								</div>
							</div>
						))}
					</div>
				)}
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

			{/* Service Drawer */}
			<Drawer
				open={showServiceDrawer}
				onOpenChange={(open) => {
					if (!open) {
						setShowServiceDrawer(false);
						resetServiceForm();
					}
				}}
			>
				<DrawerContent>
					<div className="mx-auto w-full max-w-lg flex flex-col max-h-[85dvh]">
						<DrawerHeader className="text-left px-4 pt-6 shrink-0">
							<DrawerTitle>
								{editingServiceId ? "Edit Layanan" : "Tambah Layanan"}
							</DrawerTitle>
							<DrawerDescription>
								{editingServiceId
									? "Ubah detail layanan laundry"
									: "Tambah layanan baru ke katalog"}
							</DrawerDescription>
						</DrawerHeader>
						<div className="space-y-4 px-4 pb-8 pt-2 overflow-y-auto shrink">
							<div className="space-y-2">
								<Label className="text-sm font-semibold text-foreground/80">
									Nama Layanan
								</Label>
								<Input
									type="text"
									placeholder="Cuci Kiloan, Setrika, Dry Cleaning..."
									value={serviceForm.name}
									onChange={(e) =>
										setServiceForm({ ...serviceForm, name: e.target.value })
									}
									className="h-12 rounded-2xl bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all"
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-sm font-semibold text-foreground/80">
									Kategori
								</Label>
								<div className="flex bg-muted/50 p-1 rounded-xl">
									{(["kiloan", "satuan"] as const).map((cat) => (
										<button
											key={cat}
											type="button"
											onClick={() =>
												setServiceForm({ ...serviceForm, category: cat })
											}
											className={[
												"flex-1 text-sm font-medium py-2 rounded-lg transition-all",
												serviceForm.category === cat
													? "bg-background shadow-sm text-foreground"
													: "text-muted-foreground",
											].join(" ")}
										>
											{cat === "kiloan" ? "⚖️ Kiloan" : "👔 Satuan"}
										</button>
									))}
								</div>
							</div>
							<div className="space-y-2">
								<Label className="text-sm font-semibold text-foreground/80">
									Satuan
								</Label>
								<Input
									type="text"
									placeholder="kg, pcs, potong..."
									value={serviceForm.unit}
									onChange={(e) =>
										setServiceForm({ ...serviceForm, unit: e.target.value })
									}
									className="h-12 rounded-2xl bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all"
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-sm font-semibold text-foreground/80">
									Harga per Satuan
								</Label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm pr-2 border-r border-border">
										Rp
									</span>
									<Input
										type="number"
										placeholder="7000"
										value={serviceForm.price}
										onChange={(e) =>
											setServiceForm({ ...serviceForm, price: e.target.value })
										}
										className="pl-14 h-12 rounded-2xl bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all text-base font-bold"
									/>
								</div>
							</div>
							<Button
								onClick={handleServiceSubmit}
								disabled={
									serviceCreateMutation.isPending ||
									serviceUpdateMutation.isPending
								}
								className="w-full h-13 rounded-2xl text-sm font-black shadow-lg shadow-primary/20 mt-2 hover:scale-[1.01] active:scale-[0.98] transition-all"
							>
								{serviceCreateMutation.isPending ||
								serviceUpdateMutation.isPending ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
										Menyimpan...
									</>
								) : editingServiceId ? (
									"Simpan Perubahan"
								) : (
									"Tambah Layanan"
								)}
							</Button>
						</div>
					</div>
				</DrawerContent>
			</Drawer>

			{/* PIN Drawer */}
			<Drawer
				open={showPinDrawer}
				onOpenChange={(open) => {
					if (!open) {
						setShowPinDrawer(false);
						setPinForm({ current: "", new: "", confirm: "" });
					}
				}}
			>
				<DrawerContent>
					<div className="mx-auto w-full max-w-lg flex flex-col max-h-[85dvh]">
						<DrawerHeader className="text-left px-4 pt-6 shrink-0">
							<DrawerTitle>Ubah PIN Kasir</DrawerTitle>
							<DrawerDescription>
								Masukkan PIN kelola toko Anda yang lama dan baru
							</DrawerDescription>
						</DrawerHeader>
						<div className="space-y-4 px-4 pb-8 pt-2 overflow-y-auto shrink">
							<div className="space-y-2">
								<Label className="text-sm font-semibold text-foreground/80">PIN Saat Ini</Label>
								<Input
									type="password"
									placeholder="••••••"
									value={pinForm.current}
									onChange={(e) => setPinForm({ ...pinForm, current: e.target.value })}
									className="h-12 rounded-2xl tracking-[0.4em] text-center text-xl font-bold bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all"
								/>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-foreground/80">PIN Baru</Label>
									<Input
										type="password"
										placeholder="••••••"
										value={pinForm.new}
										onChange={(e) => setPinForm({ ...pinForm, new: e.target.value })}
										className="h-12 rounded-2xl tracking-[0.4em] text-center text-xl font-bold bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all"
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-semibold text-foreground/80">Konfirmasi</Label>
									<Input
										type="password"
										placeholder="••••••"
										value={pinForm.confirm}
										onChange={(e) => setPinForm({ ...pinForm, confirm: e.target.value })}
										className="h-12 rounded-2xl tracking-[0.4em] text-center text-xl font-bold bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all"
									/>
								</div>
							</div>
							<Button
								onClick={handleChangePin}
								disabled={pinLoading || !pinForm.current || !pinForm.new || !pinForm.confirm}
								className="w-full h-13 rounded-2xl text-sm font-black shadow-lg shadow-primary/20 mt-4 hover:scale-[1.01] active:scale-[0.98] transition-all"
							>
								{pinLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Simpan PIN Baru"}
							</Button>
						</div>
					</div>
				</DrawerContent>
			</Drawer>
		</div>
	);
}
