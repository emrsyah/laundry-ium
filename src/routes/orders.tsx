import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	CheckCircle2,
	Clock,
	Loader2,
	MessageCircle,
	Plus,
	Search,
	ShoppingBag,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../components/ui/select";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "../components/ui/drawer";
import { motion, AnimatePresence } from "framer-motion";
import { useTRPC } from "../integrations/trpc/react";

export const Route = createFileRoute("/orders")({
	component: OrdersPage,
});

type OrderStatus = "PENDING" | "DIPROSES" | "SELESAI";

const STATUS_CONFIG: Record<
	OrderStatus,
	{ label: string; icon: typeof Clock; className: string }
> = {
	PENDING: {
		label: "Menunggu",
		icon: Clock,
		className: "bg-yellow-100 text-yellow-700 border-yellow-200",
	},
	DIPROSES: {
		label: "Diproses",
		icon: Loader2,
		className: "bg-blue-100 text-blue-700 border-blue-200",
	},
	SELESAI: {
		label: "Selesai",
		icon: CheckCircle2,
		className: "bg-green-100 text-green-700 border-green-200",
	},
};

function formatRupiah(amount: number) {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(amount);
}

function formatDate(date: string | Date) {
	return new Date(date).toLocaleDateString("id-ID", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function OrdersPage() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { data: orders = [] } = useSuspenseQuery(
		trpc.orders.list.queryOptions(),
	);
	const { data: customers = [] } = useSuspenseQuery(
		trpc.customers.list.queryOptions(),
	);

	const [search, setSearch] = useState("");
	const [filterStatus, setFilterStatus] = useState<OrderStatus | "ALL">("ALL");
	const [selectedOrder, setSelectedOrder] = useState<(typeof orders)[0] | null>(
		null,
	);
	const [showCreateForm, setShowCreateForm] = useState(false);

	// Form state
	const [form, setForm] = useState({
		customerId: "",
		type: "kiloan",
		nominal: "",
	});
	const [customerMode, setCustomerMode] = useState<"existing" | "new">(
		"existing",
	);
	const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const createMutation = useMutation(
		trpc.orders.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.orders.list.queryOptions());
				queryClient.invalidateQueries(trpc.analytics.summary.queryOptions());
				setShowCreateForm(false);
				setForm({ customerId: "", type: "kiloan", nominal: "" });
				setNewCustomer({ name: "", phone: "" });
				setCustomerMode("existing");
				setFormErrors({});
				toast.success("Pesanan berhasil dibuat!");
			},
			onError: () => {
				toast.error("Gagal membuat pesanan. Coba lagi.");
			},
		}),
	);

	const createCustomerMutation = useMutation(
		trpc.customers.create.mutationOptions({
			onSuccess: (data) => {
				queryClient.invalidateQueries(trpc.customers.list.queryOptions());
				toast.success(`Pelanggan "${data.name}" berhasil ditambahkan`);
				createMutation.mutate({
					customerId: data.id,
					type: form.type,
					nominal: Number(form.nominal),
				});
			},
			onError: () => {
				toast.error("Gagal menambah pelanggan. Coba lagi.");
			},
		}),
	);

	const updateStatusMutation = useMutation(
		trpc.orders.updateStatus.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.orders.list.queryOptions());
				queryClient.invalidateQueries(trpc.analytics.summary.queryOptions());
				setSelectedOrder(null);
				toast.success("Status pesanan diperbarui");
			},
			onError: () => {
				toast.error("Gagal memperbarui status. Coba lagi.");
			},
		}),
	);

	const filtered = orders.filter((o) => {
		const matchSearch = o.customerName
			.toLowerCase()
			.includes(search.toLowerCase());
		const matchStatus = filterStatus === "ALL" || o.status === filterStatus;
		return matchSearch && matchStatus;
	});

	function handleWaNotif(order: (typeof orders)[0]) {
		const phone = order.customerPhone.replace(/\D/g, "");
		const normalizedPhone = phone.startsWith("0")
			? `62${phone.slice(1)}`
			: phone;
		const msg = encodeURIComponent(
			`Halo ${order.customerName}, pesanan laundry Anda (${order.type === "kiloan" ? "Cuci Kiloan" : "Cuci Satuan"}) sudah SELESAI! Silakan diambil. Total: ${formatRupiah(order.nominal)}`,
		);
		window.open(`https://wa.me/${normalizedPhone}?text=${msg}`, "_blank");
	}

	const nextStatus: Record<OrderStatus, OrderStatus | null> = {
		PENDING: "DIPROSES",
		DIPROSES: "SELESAI",
		SELESAI: null,
	};

	function validateAndSubmit() {
		const errors: Record<string, string> = {};

		if (!form.nominal || Number(form.nominal) <= 0) {
			errors.nominal = "Masukkan harga yang valid";
		}

		if (customerMode === "existing") {
			if (!form.customerId) {
				errors.customer = "Pilih pelanggan";
			}
		} else {
			if (!newCustomer.name.trim()) {
				errors.name = "Nama pelanggan wajib diisi";
			}
			if (!newCustomer.phone.trim()) {
				errors.phone = "Nomor HP wajib diisi";
			} else if (!/^0\d{8,12}$/.test(newCustomer.phone.trim())) {
				errors.phone = "Format nomor HP tidak valid";
			}
		}

		setFormErrors(errors);
		if (Object.keys(errors).length > 0) return;

		if (customerMode === "existing") {
			createMutation.mutate({
				customerId: Number(form.customerId),
				type: form.type,
				nominal: Number(form.nominal),
			});
		} else {
			createCustomerMutation.mutate({
				name: newCustomer.name.trim(),
				phone: newCustomer.phone.trim(),
			});
		}
	}

	return (
		<div className="px-4 py-5 space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground">Pesanan</h1>
					<p className="text-sm text-muted-foreground">
						{orders.length} pesanan total
					</p>
				</div>
				<Button
					onClick={() => {
						setFormErrors({});
						setShowCreateForm(true);
					}}
					size="sm"
					className="rounded-full gap-1.5"
				>
					<Plus className="h-4 w-4" /> Pesanan Baru
				</Button>
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Cari nama pelanggan..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="pl-10 h-11 rounded-xl"
				/>
			</div>

			{/* Status Filter */}
			<div className="flex gap-2 overflow-x-auto pb-1">
				{(["ALL", "PENDING", "DIPROSES", "SELESAI"] as const).map((s) => (
					<button
						key={s}
						type="button"
						onClick={() => setFilterStatus(s)}
						className={[
							"shrink-0 text-sm font-medium px-4 py-2 rounded-full border transition-all",
							filterStatus === s
								? "bg-primary text-primary-foreground border-primary"
								: "bg-background text-muted-foreground border-border hover:border-primary/50",
						].join(" ")}
					>
						{s === "ALL" ? "Semua" : (STATUS_CONFIG[s]?.label ?? s)}
					</button>
				))}
			</div>

			{/* Order List */}
			<div className="space-y-2">
				<AnimatePresence mode="popLayout">
				{filtered.length === 0 ? (
					<div className="rounded-2xl border border-border bg-card p-10 text-center">
						<div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
							<ShoppingBag className="h-7 w-7 text-primary/40" />
						</div>
						<p className="text-sm font-semibold text-foreground">
							{search || filterStatus !== "ALL"
								? "Tidak ada pesanan ditemukan"
								: "Belum ada pesanan"}
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							{search || filterStatus !== "ALL"
								? "Coba ubah filter pencarian"
								: "Tekan tombol di atas untuk membuat pesanan pertama"}
						</p>
					</div>
				) : (
					filtered.map((order) => {
						const statusCfg = STATUS_CONFIG[order.status as OrderStatus];
						const StatusIcon = statusCfg?.icon ?? Clock;
						return (
							<motion.button
								layout
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95 }}
								whileTap={{ scale: 0.96 }}
								key={order.id}
								type="button"
								className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 w-full text-left shadow-sm hover:border-primary/40 transition-colors"
								onClick={() => setSelectedOrder(order)}
							>
								<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
									<ShoppingBag className="h-5 w-5 text-primary" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-semibold text-foreground truncate">
										{order.customerName}
									</p>
									<p className="text-xs text-muted-foreground">
										{order.type === "kiloan" ? "Cuci Kiloan" : "Cuci Satuan"}{" "}
										&middot; {formatRupiah(order.nominal)}
									</p>
									<p className="text-xs text-muted-foreground/70">
										{formatDate(order.createdAt)}
									</p>
								</div>
								<div className="flex flex-col items-end gap-1.5">
									<span
										className={[
											"text-xs font-semibold px-2.5 py-1 rounded-full border",
											statusCfg?.className,
										].join(" ")}
									>
										{statusCfg?.label ?? order.status}
									</span>
									{order.status === "SELESAI" && (
													<a
														href="#"
														onClick={(e) => {
															e.preventDefault();
															e.stopPropagation();
															handleWaNotif(order);
														}}
														className="flex items-center gap-1 text-xs text-green-600 font-medium no-underline"
													>
														<MessageCircle className="h-3.5 w-3.5" /> WA
													</a>
									)}
								</div>
							</motion.button>
						);
					})
				)}
				</AnimatePresence>
			</div>

			{/* Order Detail Sheet */}
			<Drawer
				open={!!selectedOrder}
				onOpenChange={(open) => !open && setSelectedOrder(null)}
			>
				<DrawerContent
					className="max-h-[85vh]"
				>
					<div className="overflow-y-auto px-4 pb-4 w-full">
					<DrawerHeader className="mb-2">
						<DrawerTitle>Detail Pesanan</DrawerTitle>
						<DrawerDescription>
							Informasi lengkap pesanan laundry
						</DrawerDescription>
					</DrawerHeader>

					{selectedOrder && (
						<div className="space-y-4 pb-4">
							{/* Status Progress */}
							<div className="flex items-center justify-between px-2">
								{(["PENDING", "DIPROSES", "SELESAI"] as const).map(
									(status, idx) => {
										const cfg = STATUS_CONFIG[status];
										const isActive =
											["PENDING", "DIPROSES", "SELESAI"].indexOf(
												selectedOrder.status as OrderStatus,
											) >= idx;
										const Icon = cfg.icon;
										return (
											<div key={status} className="flex items-center gap-2">
												<div
													className={[
														"flex items-center justify-center h-9 w-9 rounded-full border-2 transition-all",
														isActive
															? "bg-primary border-primary text-primary-foreground"
															: "bg-background border-border text-muted-foreground",
													].join(" ")}
												>
													<Icon className="h-4 w-4" />
												</div>
												{idx < 2 && (
													<div
														className={[
															"w-8 h-0.5 rounded-full",
															["PENDING", "DIPROSES", "SELESAI"].indexOf(
																selectedOrder.status as OrderStatus,
															) > idx
																? "bg-primary"
																: "bg-border",
														].join(" ")}
													/>
												)}
											</div>
										);
									},
								)}
							</div>

							{/* Order Details */}
							<div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3">
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Pelanggan</span>
									<span className="font-semibold text-foreground">
										{selectedOrder.customerName}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Telepon</span>
									<span className="font-semibold text-foreground">
										{selectedOrder.customerPhone}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Jenis Layanan</span>
									<span className="font-semibold text-foreground">
										{selectedOrder.type === "kiloan"
											? "Cuci Kiloan"
											: "Cuci Satuan"}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Total</span>
									<span className="font-bold text-foreground">
										{formatRupiah(selectedOrder.nominal)}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Pembayaran</span>
									<span className="font-semibold text-foreground">
										{selectedOrder.paymentMethod}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">Status</span>
									<span
										className={[
											"text-xs font-semibold px-2.5 py-1 rounded-full border",
											STATUS_CONFIG[selectedOrder.status as OrderStatus]
												?.className,
										].join(" ")}
									>
										{STATUS_CONFIG[selectedOrder.status as OrderStatus]
											?.label ?? selectedOrder.status}
									</span>
								</div>
							</div>

							{/* Actions */}
							<div className="space-y-2">
								{nextStatus[selectedOrder.status as OrderStatus] && (
									<Button
										onClick={() =>
											updateStatusMutation.mutate({
												id: selectedOrder.id,
												status:
													nextStatus[selectedOrder.status as OrderStatus]!,
											})
										}
										disabled={updateStatusMutation.isPending}
										className="w-full h-12 rounded-xl text-sm font-semibold"
									>
										{updateStatusMutation.isPending ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : null}
										Tandai{" "}
										{
											STATUS_CONFIG[
												nextStatus[selectedOrder.status as OrderStatus]!
											]?.label
										}
									</Button>
								)}
								{selectedOrder.status === "SELESAI" && (
									<Button
										variant="outline"
										onClick={() => handleWaNotif(selectedOrder)}
										className="w-full h-12 rounded-xl text-sm font-semibold gap-2"
									>
										<MessageCircle className="h-4 w-4" /> Kirim Notifikasi
										WhatsApp
									</Button>
								)}
							</div>
						</div>
					)}
					</div>
				</DrawerContent>
			</Drawer>

			{/* Create Order Sheet */}
			<Drawer
				open={showCreateForm}
				onOpenChange={(open) => {
					if (!open) {
						setShowCreateForm(false);
						setFormErrors({});
					}
				}}
			>
				<DrawerContent
					className="max-h-[85vh]"
				>
					<div className="overflow-y-auto px-4 pb-4 w-full">
					<DrawerHeader className="mb-2">
						<DrawerTitle>Pesanan Baru</DrawerTitle>
						<DrawerDescription>Isi detail pesanan laundry</DrawerDescription>
					</DrawerHeader>

					<div className="space-y-4 pb-4">
						{/* Customer Selection */}
						<div className="space-y-2">
							<Label className="text-sm font-semibold">Pelanggan</Label>
							<div className="flex bg-muted/50 p-1 rounded-xl">
								<button
									type="button"
									onClick={() => setCustomerMode("existing")}
									className={[
										"flex-1 text-sm font-medium py-2 rounded-lg transition-all",
										customerMode === "existing"
											? "bg-background shadow-sm text-foreground"
											: "text-muted-foreground",
									].join(" ")}
								>
									Pilih Lama
								</button>
								<button
									type="button"
									onClick={() => setCustomerMode("new")}
									className={[
										"flex-1 text-sm font-medium py-2 rounded-lg transition-all",
										customerMode === "new"
											? "bg-background shadow-sm text-foreground"
											: "text-muted-foreground",
									].join(" ")}
								>
									Pelanggan Baru
								</button>
							</div>

							{customerMode === "existing" ? (
								<div>
									<Select
										value={form.customerId}
										onValueChange={(val) =>
											setForm({ ...form, customerId: val })
										}
									>
										<SelectTrigger className="w-full h-11 rounded-xl">
											<SelectValue placeholder="Pilih pelanggan..." />
										</SelectTrigger>
										<SelectContent>
											{customers.map((c) => (
												<SelectItem key={c.id} value={String(c.id)}>
													{c.name} &mdash; {c.phone}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{formErrors.customer && (
										<p className="text-xs text-destructive mt-1">
											{formErrors.customer}
										</p>
									)}
								</div>
							) : (
								<div className="space-y-3">
									<div>
										<Input
											type="text"
											placeholder="Nama Pelanggan"
											value={newCustomer.name}
											onChange={(e) =>
												setNewCustomer({
													...newCustomer,
													name: e.target.value,
												})
											}
											className="h-11 rounded-xl"
										/>
										{formErrors.name && (
											<p className="text-xs text-destructive mt-1">
												{formErrors.name}
											</p>
										)}
									</div>
									<div>
										<Input
											type="tel"
											placeholder="Nomor HP (WhatsApp)"
											value={newCustomer.phone}
											onChange={(e) =>
												setNewCustomer({
													...newCustomer,
													phone: e.target.value,
												})
											}
											className="h-11 rounded-xl"
										/>
										{formErrors.phone && (
											<p className="text-xs text-destructive mt-1">
												{formErrors.phone}
											</p>
										)}
									</div>
								</div>
							)}
						</div>

						{/* Service Type */}
						<div className="space-y-2">
							<Label className="text-sm font-semibold">Jenis Layanan</Label>
							<div className="grid grid-cols-2 gap-2">
								{[
									{ value: "kiloan", label: "Cuci Kiloan", emoji: "⚖️" },
									{ value: "satuan", label: "Cuci Satuan", emoji: "👔" },
								].map((t) => (
									<button
										key={t.value}
										type="button"
										onClick={() => setForm({ ...form, type: t.value })}
										className={[
											"h-12 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-2",
											form.type === t.value
												? "bg-primary text-primary-foreground border-primary shadow-md"
												: "bg-background border-border text-muted-foreground hover:border-primary/50",
										].join(" ")}
									>
										{t.emoji} {t.label}
									</button>
								))}
							</div>
						</div>

						{/* Price */}
						<div className="space-y-2">
							<Label className="text-sm font-semibold">Total Harga</Label>
							<div className="relative">
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm pr-2 border-r border-border">
									Rp
								</span>
								<Input
									type="number"
									placeholder="15000"
									value={form.nominal}
									onChange={(e) =>
										setForm({ ...form, nominal: e.target.value })
									}
									className="pl-14 h-11 rounded-xl text-base font-bold"
								/>
							</div>
							{formErrors.nominal && (
								<p className="text-xs text-destructive">{formErrors.nominal}</p>
							)}
							<div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
								{["15000", "20000", "25000", "35000", "50000"].map((nom) => (
									<button
										key={nom}
										type="button"
										onClick={() => setForm({ ...form, nominal: nom })}
										className={[
											"shrink-0 text-xs font-medium px-3 py-2 rounded-lg border transition-all h-10",
											form.nominal === nom
												? "bg-primary text-primary-foreground border-primary"
												: "bg-background border-border text-muted-foreground hover:border-primary/50",
										].join(" ")}
									>
										{Number(nom) / 1000}k
									</button>
								))}
							</div>
						</div>

						{/* Submit */}
						<Button
							onClick={validateAndSubmit}
							disabled={
								createMutation.isPending || createCustomerMutation.isPending
							}
							className="w-full h-12 rounded-xl text-sm font-semibold"
						>
							{createMutation.isPending || createCustomerMutation.isPending ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
								</>
							) : (
								"Buat Pesanan"
							)}
						</Button>
					</div>
					</div>
				</DrawerContent>
			</Drawer>
		</div>
	);
}
