import {
	queryOptions,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
	Calendar,
	ChevronLeft,
	Clock,
	Edit,
	Loader2,
	MapPin,
	MessageCircle,
	Phone,
	ShoppingBag,
	Trash2,
	TrendingUp,
	Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	customersDelete,
	customersGet,
	customersUpdate,
} from "#/lib/server-fns";
import { formatDate, formatRupiah, formatRupiahCompact } from "#/lib/utils";
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

export const Route = createFileRoute("/customers/$customerId")({
	component: CustomerDetailPage,
	loader: ({ params }) => {
		const id = Number(params.customerId);
		return { id };
	},
});

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
	PENDING: {
		label: "Menunggu",
		className: "bg-yellow-100 text-yellow-700 border-yellow-200",
	},
	DIPROSES: {
		label: "Diproses",
		className: "bg-blue-100 text-blue-700 border-blue-200",
	},
	SELESAI: {
		label: "Selesai",
		className: "bg-green-100 text-green-700 border-green-200",
	},
	DIAMBIL: {
		label: "Diambil",
		className: "bg-indigo-100 text-indigo-700 border-indigo-200",
	},
	BATAL: {
		label: "Batal",
		className: "bg-gray-100 text-gray-500 border-gray-200",
	},
};

const PAYMENT_STATUS_CONFIG: Record<
	string,
	{ label: string; className: string }
> = {
	LUNAS: {
		label: "Lunas",
		className: "bg-green-100 text-green-700 border-green-200",
	},
	BELUM_BAYAR: {
		label: "Belum Bayar",
		className: "bg-red-100 text-red-700 border-red-200",
	},
	SEBAGIAN: {
		label: "Sebagian",
		className: "bg-orange-100 text-orange-700 border-orange-200",
	},
};

function CustomerDetailPage() {
	const { id } = Route.useLoaderData();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const { data: customer } = useSuspenseQuery(
		queryOptions({
			queryKey: ["customers", "detail", id],
			queryFn: () => customersGet({ data: id }),
		}),
	);

	const [showEditDrawer, setShowEditDrawer] = useState(false);
	const [form, setForm] = useState({ name: "", phone: "", address: "" });
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});
	const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

	const updateMutation = useMutation({
		mutationFn: (data: {
			id: number;
			name?: string;
			phone?: string;
			address?: string;
		}) => customersUpdate({ data }),
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: ["customers", "detail", id],
			});
			queryClient.invalidateQueries({ queryKey: ["customers", "list"] });
			setShowEditDrawer(false);
			setFormErrors({});
			toast.success(`Pelanggan "${data.name}" berhasil diperbarui`);
		},
		onError: () => {
			toast.error("Gagal memperbarui pelanggan. Coba lagi.");
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (customerId: number) => customersDelete({ data: { id: customerId } }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["customers", "list"] });
			toast.success("Pelanggan berhasil dihapus");
			navigate({ to: "/customers" });
		},
		onError: () => {
			toast.error("Gagal menghapus pelanggan. Coba lagi.");
		},
	});

	if (!customer) {
		return (
			<div className="p-10 text-center space-y-4">
				<div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
					<ChevronLeft className="h-8 w-8 text-muted-foreground" />
				</div>
				<div>
					<h2 className="text-xl font-bold">Pelanggan tidak ditemukan</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Data yang Anda cari mungkin sudah dihapus
					</p>
				</div>
				<Button asChild variant="outline" className="rounded-full">
					<Link to="/customers">Kembali ke Daftar</Link>
				</Button>
			</div>
		);
	}

	function handleEdit() {
		if (!customer) return;
		setForm({
			name: customer.name || "",
			phone: customer.phone || "",
			address: customer.address || "",
		});
		setFormErrors({});
		setShowEditDrawer(true);
	}

	function handleDelete() {
		if (!customer) return;
		if (
			window.confirm(
				`Apakah Anda yakin ingin menghapus pelanggan "${customer.name}"?`,
			)
		) {
			deleteMutation.mutate(customer.id);
		}
	}

	function validateAndSubmit() {
		if (!customer) return;
		const errors: Record<string, string> = {};
		if (!form.name.trim()) errors.name = "Nama wajib diisi";
		if (!form.phone.trim()) {
			errors.phone = "Nomor HP wajib diisi";
		} else if (!/^0\d{8,12}$/.test(form.phone.trim())) {
			errors.phone = "Format nomor HP tidak valid (contoh: 08123456789)";
		}
		setFormErrors(errors);
		if (Object.keys(errors).length > 0) return;
		updateMutation.mutate({
			id: customer.id,
			name: form.name.trim() || undefined,
			phone: form.phone.trim() || undefined,
			address: form.address.trim() || undefined,
		});
	}

	function toggleOrderExpand(orderId: number) {
		setExpandedOrders((prev) => {
			const next = new Set(prev);
			if (next.has(orderId)) {
				next.delete(orderId);
			} else {
				next.add(orderId);
			}
			return next;
		});
	}

	const handleWa = () => {
		if (!customer) return;
		const phone = customer.phone.replace(/\D/g, "");
		const normalizedPhone = phone.startsWith("0")
			? `62${phone.slice(1)}`
			: phone;
		window.open(`https://wa.me/${normalizedPhone}`, "_blank");
	};

	const hasBalance =
		customer.balance !== undefined &&
		customer.balance !== null &&
		customer.balance !== 0;

	return (
		<div className="pb-12 min-h-screen bg-background">
			{/* Sticky Top Header */}
			<div className="px-4 pt-6 pb-4 flex items-center gap-3 sticky top-0 bg-background/80 backdrop-blur-md z-20 border-b border-transparent">
				<Button
					asChild
					variant="ghost"
					size="icon"
					className="h-10 w-10 rounded-full border border-border bg-card shadow-sm shrink-0"
				>
					<Link to="/customers">
						<ChevronLeft className="h-5 w-5 text-foreground" />
					</Link>
				</Button>
				<h1 className="text-lg font-bold text-foreground truncate">
					Profil Pelanggan
				</h1>
			</div>

			<div className="px-4 space-y-6 mt-2">
				{/* Modern Profile Card */}
				<div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm relative overflow-hidden group">
					<div className="absolute top-0 right-0 p-8 opacity-[0.04] scale-[4] rotate-12 pointer-events-none group-hover:scale-[4.5] transition-transform duration-700">
						<TrendingUp className="h-12 w-12 text-primary" />
					</div>

					{/* Edit/Delete buttons */}
					<div className="flex items-center justify-end gap-1.5 mb-4 relative z-10">
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 rounded-full hover:bg-primary/10"
							onClick={handleEdit}
						>
							<Edit className="h-3.5 w-3.5 text-muted-foreground" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 rounded-full hover:bg-destructive/10"
							onClick={handleDelete}
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending ? (
								<Loader2 className="h-3.5 w-3.5 text-destructive animate-spin" />
							) : (
								<Trash2 className="h-3.5 w-3.5 text-destructive" />
							)}
						</Button>
					</div>

					<div className="flex flex-col items-center text-center relative z-10">
						<div className="h-24 w-24 rounded-3xl bg-primary flex items-center justify-center shadow-xl mb-5 transform group-hover:rotate-3 transition-transform">
							<span className="text-primary-foreground font-black text-4xl">
								{customer.name.charAt(0).toUpperCase()}
							</span>
						</div>
						<h2 className="text-2xl font-black text-foreground tracking-tight">
							{customer.name}
						</h2>
						<div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground px-4 py-1.5 bg-muted/50 rounded-full">
							<Phone className="h-3.5 w-3.5" />
							<span className="text-xs font-bold tracking-wide">
								{customer.phone}
							</span>
						</div>
					</div>

					{/* Balance Display */}
					{hasBalance && (
						<div
							className={`mt-5 mx-auto w-fit flex items-center gap-2 px-4 py-2 rounded-2xl border ${
								customer.balance < 0
									? "bg-destructive/5 border-destructive/20"
									: "bg-emerald-50 border-emerald-200"
							}`}
						>
							<Wallet
								className={`h-4 w-4 ${
									customer.balance < 0 ? "text-destructive" : "text-emerald-600"
								}`}
							/>
							<span
								className={`text-sm font-bold ${
									customer.balance < 0 ? "text-destructive" : "text-emerald-600"
								}`}
							>
								{customer.balance < 0 ? "Hutang" : "Saldo"}:{" "}
								{formatRupiah(Math.abs(customer.balance))}
							</span>
						</div>
					)}

					{/* Quick Stats Grid */}
					<div className="mt-6 grid grid-cols-2 gap-4">
						<div className="rounded-2xl bg-primary/5 p-4 border border-primary/10">
							<div className="flex items-center gap-2 mb-2">
								<div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
									<ShoppingBag className="h-3.5 w-3.5 text-primary" />
								</div>
								<span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
									Total Pesanan
								</span>
							</div>
							<p className="text-3xl font-black text-foreground leading-none">
								{customer.totalOrders}
							</p>
						</div>
						<div className="rounded-2xl bg-primary/5 p-4 border border-primary/10">
							<div className="flex items-center gap-2 mb-2">
								<div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
									<Wallet className="h-3.5 w-3.5 text-primary" />
								</div>
								<span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
									Total Belanja
								</span>
							</div>
							<p className="text-2xl font-black text-foreground leading-none">
								{formatRupiahCompact(customer.totalSpent)}
							</p>
						</div>
					</div>

					{/* Info Sections */}
					<div className="mt-6 pt-6 border-t border-border/60 space-y-4">
						<div className="flex items-start gap-4">
							<div className="mt-1 h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
								<MapPin className="h-4 w-4 text-muted-foreground" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
									Alamat Pengiriman
								</p>
								<p className="text-sm text-foreground font-medium leading-relaxed">
									{customer.address || "Belum melengkapi alamat"}
								</p>
							</div>
						</div>
						<div className="flex items-start gap-4">
							<div className="mt-0.5 h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
								<Calendar className="h-4 w-4 text-muted-foreground" />
							</div>
							<div>
								<p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
									Terdaftar Aktif
								</p>
								<p className="text-sm text-foreground font-medium">
									{formatDate(customer.createdAt)}
								</p>
							</div>
						</div>
					</div>

					<Button
						onClick={handleWa}
						className="w-full mt-8 h-12 rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
					>
						<MessageCircle className="h-5 w-5" /> Hubungi via WhatsApp
					</Button>
				</div>

				{/* Order History */}
				<div className="space-y-4">
					<div className="flex items-center justify-between px-1">
						<h3 className="text-base font-black text-foreground flex items-center gap-2 uppercase tracking-tight">
							<Clock className="h-4 w-4 text-primary" /> Riwayat Pesanan
						</h3>
						<div className="bg-primary/10 text-primary text-[11px] font-black px-2.5 py-1 rounded-full border border-primary/20">
							{customer.orders.length}
						</div>
					</div>

					{customer.orders.length === 0 ? (
						<div className="rounded-[2rem] border-2 border-dashed border-border bg-card/40 p-12 text-center">
							<div className="h-14 w-14 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
								<ShoppingBag className="h-7 w-7 text-muted-foreground/30" />
							</div>
							<p className="text-sm font-bold text-muted-foreground">
								Belum ada aktivitas pesanan
							</p>
							<p className="text-xs text-muted-foreground/60 mt-1">
								Pesanan baru akan muncul di sini
							</p>
						</div>
					) : (
						<div className="space-y-3">
							{customer.orders.map((order) => {
								const statusCfg = STATUS_CONFIG[order.status];
								const paymentCfg = PAYMENT_STATUS_CONFIG[order.paymentStatus];
								const isExpanded = expandedOrders.has(order.id);

								return (
									<div
										key={order.id}
										className="rounded-[1.5rem] border border-border bg-card p-4 transition-all hover:border-primary/30"
									>
										<Link
											to="/orders"
											search={{ viewItem: order.id }}
											className="flex items-center gap-4 no-underline group"
										>
											<div className="h-12 w-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 shadow-sm group-hover:bg-primary/10 transition-colors">
												<ShoppingBag className="h-5 w-5 text-primary" />
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between mb-0.5">
													<p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
														{formatRupiah(order.nominal)}
													</p>
													<span
														className={[
															"text-[10px] font-black px-2.5 py-1 rounded-full border tracking-wide uppercase",
															statusCfg?.className,
														].join(" ")}
													>
														{statusCfg?.label ?? order.status}
													</span>
												</div>
												<div className="flex items-center justify-between">
													<p className="text-[11px] font-bold text-muted-foreground/70">
														{formatDate(order.createdAt)}
													</p>
													{paymentCfg && (
														<span
															className={[
																"text-[9px] font-black px-2 py-0.5 rounded-full border tracking-wide",
																paymentCfg.className,
															].join(" ")}
														>
															{paymentCfg.label}
														</span>
													)}
												</div>
											</div>
										</Link>

										{/* Notes */}
										{order.notes && (
											<p className="mt-2 text-[11px] text-muted-foreground italic pl-16">
												{order.notes}
											</p>
										)}

										{/* Expandable items */}
										{order.items && order.items.length > 0 && (
											<div className="mt-2 pl-16">
												<button
													type="button"
													onClick={() => toggleOrderExpand(order.id)}
													className="text-[11px] font-bold text-primary hover:underline"
												>
													{isExpanded
														? "Sembunyikan detail"
														: `Lihat ${order.items.length} item`}
												</button>
												{isExpanded && (
													<div className="mt-2 space-y-1">
														{order.items.map((item) => (
															<div
																key={item.id}
																className="flex justify-between text-[11px] text-muted-foreground"
															>
																<span>
																	{item.serviceName} x {item.quantity}
																</span>
																<span className="font-semibold">
																	{formatRupiah(item.subtotal)}
																</span>
															</div>
														))}
													</div>
												)}
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>

			{/* Edit Customer Drawer */}
			<Drawer
				open={showEditDrawer}
				onOpenChange={(open) => {
					setShowEditDrawer(open);
					if (!open) setFormErrors({});
				}}
			>
				<DrawerContent>
					<div className="mx-auto w-full max-w-lg flex flex-col max-h-[85dvh]">
						<DrawerHeader className="text-left px-4 pt-6 shrink-0">
							<DrawerTitle>Edit Pelanggan</DrawerTitle>
							<DrawerDescription>Perbarui data pelanggan</DrawerDescription>
						</DrawerHeader>
						<div className="space-y-4 px-4 pb-8 pt-2 overflow-y-auto shrink">
							<div className="space-y-2">
								<Label className="text-sm font-semibold text-foreground/80">
									Nama Lengkap{" "}
									<span className="text-destructive font-black">*</span>
								</Label>
								<Input
									type="text"
									autoComplete="name"
									placeholder="Budi Santoso"
									value={form.name}
									onChange={(e) => setForm({ ...form, name: e.target.value })}
									className="h-12 rounded-2xl bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all"
								/>
								{formErrors.name && (
									<p className="text-xs font-bold text-destructive pl-1">
										{formErrors.name}
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label className="text-sm font-semibold text-foreground/80">
									Nomor HP (WhatsApp){" "}
									<span className="text-destructive font-black">*</span>
								</Label>
								<Input
									type="tel"
									inputMode="tel"
									autoComplete="tel"
									placeholder="08123456789"
									value={form.phone}
									onChange={(e) => setForm({ ...form, phone: e.target.value })}
									className="h-12 rounded-2xl bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all"
								/>
								{formErrors.phone && (
									<p className="text-xs font-bold text-destructive pl-1">
										{formErrors.phone}
									</p>
								)}
							</div>
							<div className="space-y-2">
								<Label className="text-sm font-semibold text-foreground/80">
									Alamat
								</Label>
								<Textarea
									placeholder="Jl. Contoh No. 1, Kota..."
									value={form.address}
									onChange={(e) =>
										setForm({ ...form, address: e.target.value })
									}
									rows={2}
									className="rounded-2xl bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all resize-none"
								/>
							</div>
							<Button
								onClick={validateAndSubmit}
								disabled={updateMutation.isPending}
								className="w-full h-13 rounded-2xl text-sm font-black shadow-lg shadow-primary/20 mt-2 hover:scale-[1.01] active:scale-[0.98] transition-all"
							>
								{updateMutation.isPending ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
										Menyimpan...
									</>
								) : (
									"Simpan Perubahan"
								)}
							</Button>
						</div>
					</div>
				</DrawerContent>
			</Drawer>
		</div>
	);
}
