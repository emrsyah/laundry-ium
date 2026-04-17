import {
	queryOptions,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
	CheckCircle2,
	Clock,
	Edit,
	Loader2,
	MessageCircle,
	Minus,
	Package,
	Plus,
	Search,
	ShoppingBag,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import {
	analyticsSummary,
	customersCreate,
	customersList,
	ordersCreate,
	ordersDelete,
	ordersGet,
	ordersList,
	ordersUpdate,
	servicesList,
} from "#/lib/server-fns";
import { formatDate, formatRupiah } from "#/lib/utils";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Skeleton } from "../components/ui/skeleton";
import { z } from "zod";

export const Route = createFileRoute("/orders")({
	component: OrdersPage,
	validateSearch: z.object({
		viewItem: z.number().optional().catch(undefined),
	}),
});

export const analyticsSummaryQueryOptions = queryOptions({
	queryKey: ["analytics", "summary"],
	queryFn: () => analyticsSummary(),
});

export const ordersListQueryOptions = queryOptions({
	queryKey: ["orders", "list"],
	queryFn: () => ordersList(),
});

export const servicesListQueryOptions = queryOptions({
	queryKey: ["services", "list"],
	queryFn: () => servicesList(),
});

export const customersListQueryOptions = queryOptions({
	queryKey: ["customers", "list"],
	queryFn: () => customersList(),
});

type OrderStatus = "PENDING" | "DIPROSES" | "SELESAI" | "DIAMBIL" | "BATAL";
type PaymentStatus = "LUNAS" | "BELUM_BAYAR" | "SEBAGIAN";

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
	DIAMBIL: {
		label: "Diambil",
		icon: Package,
		className: "bg-indigo-100 text-indigo-700 border-indigo-200",
	},
	BATAL: {
		label: "Batal",
		icon: X,
		className: "bg-gray-100 text-gray-500 border-gray-200",
	},
};

const PAYMENT_STATUS_CONFIG: Record<
	PaymentStatus,
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

const STATUS_STEPS: OrderStatus[] = [
	"PENDING",
	"DIPROSES",
	"SELESAI",
	"DIAMBIL",
];

type OrderItem = {
	serviceId?: number;
	serviceName: string;
	quantity: number;
	unitPrice: number;
};

function OrdersPage() {
	const searchParams = Route.useSearch();
	const navigate = useNavigate({ from: "/orders" });
	const queryClient = useQueryClient();
	const { data: orders = [] } = useSuspenseQuery(ordersListQueryOptions);
	const { data: customers = [] } = useSuspenseQuery(customersListQueryOptions);
	const { data: services = [] } = useSuspenseQuery(servicesListQueryOptions);

	const [search, setSearch] = useState("");
	const [filterStatus, setFilterStatus] = useState<OrderStatus | "ALL">("ALL");
	const [selectedOrder, setSelectedOrder] = useState<(typeof orders)[0] | null>(
		null,
	);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [showEditForm, setShowEditForm] = useState(false);

	// Create form state
	const [customerId, setCustomerId] = useState("");
	const [customerMode, setCustomerMode] = useState<"existing" | "new">(
		"existing",
	);
	const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
	const [formItems, setFormItems] = useState<OrderItem[]>([]);
	const [selectedServiceId, setSelectedServiceId] = useState("");
	const [itemQty, setItemQty] = useState(1);
	const [paymentMethod, setPaymentMethod] = useState("");
	const [notes, setNotes] = useState("");
	const [estimatedCompletion, setEstimatedCompletion] = useState("");
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	// Edit form state
	const [editItems, setEditItems] = useState<OrderItem[]>([]);
	const [editItemsModified, setEditItemsModified] = useState(false);
	const [editPaymentMethod, setEditPaymentMethod] = useState("");
	const [editNotes, setEditNotes] = useState("");
	const [editEstimatedCompletion, setEditEstimatedCompletion] = useState("");
	const [editSelectedServiceId, setEditSelectedServiceId] = useState("");
	const [editItemQty, setEditItemQty] = useState(1);
	const [editPaymentStatus, setEditPaymentStatus] = useState<
		PaymentStatus | ""
	>("");
	const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>(
		{},
	);

	const [orderDetail, setOrderDetail] = useState<{ items?: { id: number; serviceId?: number | null; serviceName: string; quantity: number; unitPrice: number; subtotal: number }[] } | null>(null);
	const [loadingDetail, setLoadingDetail] = useState(false);

	const lastViewedParamRef = useRef<number | null>(null);

	useEffect(() => {
		if (searchParams.viewItem && !selectedOrder && orders.length > 0) {
			if (lastViewedParamRef.current !== searchParams.viewItem) {
				const target = orders.find((o) => o.id === searchParams.viewItem);
				if (target) {
					lastViewedParamRef.current = searchParams.viewItem;
					openOrderDetail(target);
				}
			}
		} else if (!searchParams.viewItem) {
			lastViewedParamRef.current = null;
		}
	}, [searchParams.viewItem, orders, selectedOrder]);

	const createMutation = useMutation({
		mutationFn: (data: {
			customerId: number;
			items: OrderItem[];
			paymentMethod?: string;
			notes?: string;
			estimatedCompletion?: string;
		}) => ordersCreate({ data }),
		onSuccess: () => {
			queryClient.invalidateQueries(ordersListQueryOptions);
			queryClient.invalidateQueries(analyticsSummaryQueryOptions);
			resetCreateForm();
			setShowCreateForm(false);
			toast.success("Pesanan berhasil dibuat!");
		},
		onError: () => {
			toast.error("Gagal membuat pesanan. Coba lagi.");
		},
	});

	const createCustomerMutation = useMutation({
		mutationFn: (data: { name: string; phone: string; address?: string }) =>
			customersCreate({ data }),
		onSuccess: (data) => {
			queryClient.invalidateQueries(customersListQueryOptions);
			toast.success(`Pelanggan "${data.name}" berhasil ditambahkan`);
			createMutation.mutate({
				customerId: data.id,
				items: formItems,
				paymentMethod: paymentMethod || undefined,
				notes: notes || undefined,
				estimatedCompletion: estimatedCompletion || undefined,
			});
		},
		onError: () => {
			toast.error("Gagal menambah pelanggan. Coba lagi.");
		},
	});

	const updateStatusMutation = useMutation({
		mutationFn: (data: {
			id: number;
			status: OrderStatus;
			paymentStatus?: PaymentStatus;
		}) => ordersUpdate({ data }),
		onSuccess: () => {
			queryClient.invalidateQueries(ordersListQueryOptions);
			queryClient.invalidateQueries(analyticsSummaryQueryOptions);
			setSelectedOrder(null);
			setOrderDetail(null);
			toast.success("Pesanan diperbarui");
		},
		onError: () => {
			toast.error("Gagal memperbarui pesanan. Coba lagi.");
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => ordersDelete({ data: { id } }),
		onSuccess: () => {
			queryClient.invalidateQueries(ordersListQueryOptions);
			queryClient.invalidateQueries(analyticsSummaryQueryOptions);
			setSelectedOrder(null);
			setOrderDetail(null);
			setShowEditForm(false);
			toast.success("Pesanan berhasil dihapus");
		},
		onError: () => {
			toast.error("Gagal menghapus pesanan. Coba lagi.");
		},
	});

	const editMutation = useMutation({
		mutationFn: (data: {
			id: number;
			items?: OrderItem[];
			paymentMethod?: string;
			notes?: string;
			estimatedCompletion?: string | null;
			paymentStatus?: PaymentStatus;
		}) => ordersUpdate({ data }),
		onSuccess: () => {
			queryClient.invalidateQueries(ordersListQueryOptions);
			queryClient.invalidateQueries(analyticsSummaryQueryOptions);
			setShowEditForm(false);
			setSelectedOrder(null);
			setOrderDetail(null);
			toast.success("Pesanan berhasil diperbarui");
		},
		onError: () => {
			toast.error("Gagal memperbarui pesanan. Coba lagi.");
		},
	});

	const filtered = orders.filter((o) => {
		const matchSearch = o.customerName
			.toLowerCase()
			.includes(search.toLowerCase());
		const matchStatus = filterStatus === "ALL" || o.status === filterStatus;
		return matchSearch && matchStatus;
	});

	const totalFormPrice = formItems.reduce(
		(sum, item) => sum + item.quantity * item.unitPrice,
		0,
	);
	const totalEditPrice = editItems.reduce(
		(sum, item) => sum + item.quantity * item.unitPrice,
		0,
	);

	function resetCreateForm() {
		setCustomerId("");
		setCustomerMode("existing");
		setNewCustomer({ name: "", phone: "" });
		setFormItems([]);
		setSelectedServiceId("");
		setItemQty(1);
		setPaymentMethod("");
		setNotes("");
		setEstimatedCompletion("");
		setFormErrors({});
	}

	function handleWaNotif(order: (typeof orders)[0]) {
		const phone = order.customerPhone.replace(/\D/g, "");
		const normalizedPhone = phone.startsWith("0")
			? `62${phone.slice(1)}`
			: phone;
		const msg = encodeURIComponent(
			`Halo ${order.customerName}, pesanan laundry Anda sudah SELESAI! Silakan diambil. Total: ${formatRupiah(order.nominal)}`,
		);
		window.open(`https://wa.me/${normalizedPhone}?text=${msg}`, "_blank");
	}

	function addFormItem() {
		const svc = services.find((s) => String(s.id) === selectedServiceId);
		if (!svc || itemQty < 1) return;
		setFormItems((prev) => [
			...prev,
			{
				serviceId: svc.id,
				serviceName: svc.name,
				quantity: itemQty,
				unitPrice: svc.price,
			},
		]);
		setSelectedServiceId("");
		setItemQty(1);
	}

	function removeFormItem(index: number) {
		setFormItems((prev) => prev.filter((_, i) => i !== index));
	}

	function addEditItem() {
		const svc = services.find((s) => String(s.id) === editSelectedServiceId);
		if (!svc || editItemQty < 1) return;
		setEditItems((prev) => [
			...prev,
			{
				serviceId: svc.id,
				serviceName: svc.name,
				quantity: editItemQty,
				unitPrice: svc.price,
			},
		]);
		setEditItemsModified(true);
		setEditSelectedServiceId("");
		setEditItemQty(1);
	}

	function removeEditItem(index: number) {
		setEditItems((prev) => prev.filter((_, i) => i !== index));
		setEditItemsModified(true);
	}

	function validateAndSubmitCreate() {
		const errors: Record<string, string> = {};
		if (formItems.length === 0) {
			errors.items = "Tambahkan minimal 1 item layanan";
		}
		if (customerMode === "existing") {
			if (!customerId) errors.customer = "Pilih pelanggan";
		} else {
			if (!newCustomer.name.trim()) errors.name = "Nama pelanggan wajib diisi";
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
				customerId: Number(customerId),
				items: formItems,
				paymentMethod: paymentMethod || undefined,
				notes: notes || undefined,
				estimatedCompletion: estimatedCompletion || undefined,
			});
		} else {
			createCustomerMutation.mutate({
				name: newCustomer.name.trim(),
				phone: newCustomer.phone.trim(),
			});
		}
	}

	function validateAndSubmitEdit() {
		const errors: Record<string, string> = {};
		if (editItemsModified && editItems.length === 0) {
			errors.items = "Tambahkan minimal 1 item layanan";
		}
		setEditFormErrors(errors);
		if (Object.keys(errors).length > 0) return;

		if (!selectedOrder) return;
		editMutation.mutate({
			id: selectedOrder.id,
			items: editItemsModified ? editItems : undefined,
			paymentMethod: editPaymentMethod || undefined,
			notes: editNotes || undefined,
			estimatedCompletion: editEstimatedCompletion || null,
			paymentStatus: editPaymentStatus || undefined,
		});
	}

	async function openOrderDetail(order: (typeof orders)[0]) {
		setSelectedOrder(order);
		setOrderDetail(null);
		setLoadingDetail(true);
		try {
			const detail = await ordersGet({ data: order.id });
			setOrderDetail(detail);
		} catch {
			// keep orderDetail null, list data will be used
		} finally {
			setLoadingDetail(false);
		}
	}

	function openEditDrawer() {
		if (!selectedOrder) return;
		const detail = orderDetail;
		setEditItems(
			detail?.items?.length
				? detail.items.map((i) => ({
						serviceId: i.serviceId || undefined,
						serviceName: i.serviceName,
						quantity: i.quantity,
						unitPrice: i.unitPrice,
					}))
				: [],
		);
		setEditPaymentMethod(selectedOrder.paymentMethod || "");
		setEditNotes(selectedOrder.notes || "");
		setEditEstimatedCompletion(
			selectedOrder.estimatedCompletion
				? new Date(selectedOrder.estimatedCompletion).toISOString().slice(0, 16)
				: "",
		);
		setEditPaymentStatus((selectedOrder.paymentStatus as PaymentStatus) || "");
		setEditItemsModified(false);
		setEditFormErrors({});
		setShowEditForm(true);
	}

	function handleDeleteOrder() {
		if (!selectedOrder) return;
		if (window.confirm("Hapus pesanan ini secara permanen?")) {
			deleteMutation.mutate(selectedOrder.id);
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
						resetCreateForm();
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
			<div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
				{(
					["ALL", "PENDING", "DIPROSES", "SELESAI", "DIAMBIL", "BATAL"] as const
				).map((s) => (
					<button
						key={s}
						type="button"
						onClick={() => setFilterStatus(s)}
						className={[
							"shrink-0 snap-start text-sm font-medium px-4 py-2 rounded-full border transition-all",
							filterStatus === s
								? "bg-primary text-primary-foreground border-primary shadow-sm"
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
							const payCfg =
								PAYMENT_STATUS_CONFIG[order.paymentStatus as PaymentStatus];
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
									onClick={() => openOrderDetail(order)}
								>
									<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
										<ShoppingBag className="h-5 w-5 text-primary" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-semibold text-foreground truncate">
											{order.customerName}
										</p>
										<p className="text-xs text-muted-foreground">
											{formatRupiah(order.nominal)}
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
										{payCfg && order.paymentStatus !== "LUNAS" && (
											<span
												className={[
													"text-[9px] font-semibold px-2 py-0.5 rounded-full border",
													payCfg.className,
												].join(" ")}
											>
												{payCfg.label}
											</span>
										)}
										{order.status === "SELESAI" && (
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													handleWaNotif(order);
												}}
												className="flex items-center gap-1 text-xs text-green-600 font-medium"
											>
												<MessageCircle className="h-3.5 w-3.5" /> WA
											</button>
										)}
									</div>
								</motion.button>
							);
						})
					)}
				</AnimatePresence>
			</div>

			{/* Order Detail Drawer */}
			<Drawer
				open={!!selectedOrder}
				onOpenChange={(open) => {
					if (!open) {
						setSelectedOrder(null);
						setOrderDetail(null);
						navigate({ search: {}, replace: true });
					}
				}}
			>
				<DrawerContent className="max-h-[85dvh] flex flex-col">
					<DrawerHeader className="mb-2 shrink-0">
						<DrawerTitle>Detail Pesanan</DrawerTitle>
						<DrawerDescription>
							Informasi lengkap pesanan laundry
						</DrawerDescription>
					</DrawerHeader>

					<div className="overflow-y-auto px-4 pb-4 w-full shrink">
						{selectedOrder && (
							<div className="space-y-4 pb-4">
								{/* Status Progress Bar */}
								{selectedOrder.status === "BATAL" ? (
									<div className="flex items-center justify-center gap-3 px-4 py-3 rounded-2xl bg-muted/50 border border-border">
										<X className="h-5 w-5 text-muted-foreground" />
										<span className="text-sm font-semibold text-muted-foreground">
											Pesanan Dibatalkan
										</span>
									</div>
								) : (
									<div className="flex items-center justify-between px-2">
										{STATUS_STEPS.map((status, idx) => {
											const cfg = STATUS_CONFIG[status];
											const isActive =
												STATUS_STEPS.indexOf(
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
													{idx < STATUS_STEPS.length - 1 && (
														<div
															className={[
																"w-8 h-0.5 rounded-full",
																STATUS_STEPS.indexOf(
																	selectedOrder.status as OrderStatus,
																) > idx
																	? "bg-primary"
																	: "bg-border",
															].join(" ")}
														/>
													)}
												</div>
											);
										})}
									</div>
								)}

								{/* Order Info */}
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
										<span className="text-muted-foreground">Tanggal</span>
										<span className="font-semibold text-foreground">
											{formatDate(selectedOrder.createdAt)}
										</span>
									</div>
									{selectedOrder.paymentMethod && (
										<div className="flex justify-between text-sm">
											<span className="text-muted-foreground">Pembayaran</span>
											<span className="font-semibold text-foreground">
												{selectedOrder.paymentMethod}
											</span>
										</div>
									)}
									<div className="flex justify-between text-sm">
										<span className="text-muted-foreground">Total</span>
										<span className="font-bold text-foreground">
											{formatRupiah(selectedOrder.nominal)}
										</span>
									</div>
									<div className="flex justify-between text-sm items-center h-10">
										<span className="text-muted-foreground">
											Status Pesanan
										</span>
										<Select
											value={selectedOrder.status}
											onValueChange={(val) =>
												updateStatusMutation.mutate({
													id: selectedOrder.id,
													status: val as OrderStatus,
												})
											}
											disabled={updateStatusMutation.isPending}
										>
											<SelectTrigger
												className={[
													"h-8 w-auto px-3 rounded-full text-xs font-semibold border focus:ring-0 ring-offset-0 focus:ring-offset-0 transition-opacity",
													STATUS_CONFIG[selectedOrder.status as OrderStatus]
														?.className,
													updateStatusMutation.isPending ? "opacity-50" : "",
												].join(" ")}
											>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="PENDING">Menunggu</SelectItem>
												<SelectItem value="DIPROSES">Diproses</SelectItem>
												<SelectItem value="SELESAI">Selesai</SelectItem>
												<SelectItem value="DIAMBIL">Diambil</SelectItem>
												<SelectItem value="BATAL">Batal</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="flex justify-between text-sm items-center h-10">
										<span className="text-muted-foreground">Status Bayar</span>
										<Select
											value={selectedOrder.paymentStatus}
											onValueChange={(val) =>
												updateStatusMutation.mutate({
													id: selectedOrder.id,
													status: selectedOrder.status as OrderStatus,
													paymentStatus: val as PaymentStatus,
												})
											}
											disabled={updateStatusMutation.isPending}
										>
											<SelectTrigger
												className={[
													"h-8 w-auto px-3 rounded-full text-xs font-semibold border focus:ring-0 ring-offset-0 focus:ring-offset-0 transition-opacity",
													PAYMENT_STATUS_CONFIG[
														selectedOrder.paymentStatus as PaymentStatus
													]?.className,
													updateStatusMutation.isPending ? "opacity-50" : "",
												].join(" ")}
											>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="BELUM_BAYAR">Belum Bayar</SelectItem>
												<SelectItem value="SEBAGIAN">Sebagian</SelectItem>
												<SelectItem value="LUNAS">Lunas</SelectItem>
											</SelectContent>
										</Select>
									</div>
									{(selectedOrder.amountPaid ?? 0) > 0 && (
										<div className="flex justify-between text-sm">
											<span className="text-muted-foreground">Dibayar</span>
											<span className="font-semibold text-foreground">
												{formatRupiah(selectedOrder.amountPaid ?? 0)}
											</span>
										</div>
									)}
								</div>

								{/* Order Items */}
								{loadingDetail ? (
									<div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-4">
										<Skeleton className="h-3 w-1/3" />
										<div className="space-y-3">
											<div className="flex justify-between">
												<Skeleton className="h-4 w-1/2" />
												<Skeleton className="h-4 w-1/4" />
											</div>
											<div className="flex justify-between">
												<Skeleton className="h-4 w-2/5" />
												<Skeleton className="h-4 w-1/4" />
											</div>
										</div>
									</div>
								) : orderDetail?.items?.length ? (
									<div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
										<p className="text-xs font-semibold text-muted-foreground mb-2">
											Item Pesanan
										</p>
										{orderDetail.items.map((item) => (
											<div
												key={item.id}
												className="flex justify-between text-sm"
											>
												<span className="text-foreground">
													{item.serviceName} x {item.quantity}
												</span>
												<span className="font-semibold text-foreground">
													{formatRupiah(item.subtotal)}
												</span>
											</div>
										))}
									</div>
								) : null}

								{/* Notes */}
								{selectedOrder.notes && (
									<div className="rounded-2xl border border-border bg-muted/30 p-4">
										<p className="text-xs font-semibold text-muted-foreground mb-1">
											Catatan
										</p>
										<p className="text-sm text-foreground">
											{selectedOrder.notes}
										</p>
									</div>
								)}

								{/* Estimated Completion */}
								{selectedOrder.estimatedCompletion && (
									<div className="rounded-2xl border border-border bg-muted/30 p-4">
										<div className="flex justify-between text-sm">
											<span className="text-muted-foreground">
												Estimasi Selesai
											</span>
											<span className="font-semibold text-foreground">
												{formatDate(selectedOrder.estimatedCompletion)}
											</span>
										</div>
									</div>
								)}

								{/* Actions */}
								<div className="grid grid-cols-2 gap-2 pt-2">
									{/* WA notification */}
									{(selectedOrder.status === "SELESAI" ||
										selectedOrder.status === "DIAMBIL") && (
										<Button
											onClick={() => handleWaNotif(selectedOrder)}
											className="col-span-2 h-12 rounded-xl text-sm font-semibold gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-sm"
										>
											<MessageCircle className="h-5 w-5" /> Kirim WhatsApp
										</Button>
									)}

									{/* Edit button */}
									{selectedOrder.status !== "BATAL" && (
										<Button
											variant="outline"
											onClick={openEditDrawer}
											disabled={loadingDetail || !orderDetail}
											className="h-12 rounded-xl text-sm font-semibold gap-2 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
										>
											{loadingDetail || !orderDetail ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<Edit className="h-4 w-4" />
											)}
											Edit
										</Button>
									)}

									{/* Delete button */}
									<Button
										variant="outline"
										onClick={handleDeleteOrder}
										disabled={deleteMutation.isPending}
										className={[
											"h-12 rounded-xl text-sm font-semibold gap-2 text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/5",
											selectedOrder.status === "BATAL" ? "col-span-2" : "",
										].join(" ")}
									>
										{deleteMutation.isPending ? (
											<Loader2 className="h-4 w-4 animate-spin" />
										) : (
											<Trash2 className="h-4 w-4" />
										)}
										Hapus
									</Button>
								</div>
							</div>
						)}
					</div>
				</DrawerContent>
			</Drawer>

			{/* Create Order Drawer */}
			<Drawer
				open={showCreateForm}
				onOpenChange={(open) => {
					if (!open) {
						setShowCreateForm(false);
						setFormErrors({});
					}
				}}
			>
				<DrawerContent className="max-h-[85dvh] flex flex-col">
					<DrawerHeader className="mb-2 shrink-0">
						<DrawerTitle>Pesanan Baru</DrawerTitle>
						<DrawerDescription>Isi detail pesanan laundry</DrawerDescription>
					</DrawerHeader>

					<div className="overflow-y-auto px-4 pb-4 w-full shrink">
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
											value={customerId}
											onValueChange={(val) => setCustomerId(val)}
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

							{/* Add Items */}
							<div className="space-y-2">
								<Label className="text-sm font-semibold">Item Layanan</Label>
								{services.length > 0 && (
									<div className="space-y-2">
										<Select
											value={selectedServiceId}
											onValueChange={(val) => setSelectedServiceId(val)}
										>
											<SelectTrigger className="w-full h-11 rounded-xl">
												<SelectValue placeholder="Pilih layanan..." />
											</SelectTrigger>
											<SelectContent>
												{services
													.filter((s) => s.active)
													.map((s) => (
														<SelectItem key={s.id} value={String(s.id)}>
															{s.name} — {formatRupiah(s.price)}/{s.unit}
														</SelectItem>
													))}
											</SelectContent>
										</Select>
										<div className="flex items-center gap-2">
											<div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3">
												<button
													type="button"
													onClick={() => setItemQty(Math.max(1, itemQty - 1))}
													className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
												>
													<Minus className="h-4 w-4" />
												</button>
												<Input
													type="number"
													min={1}
													value={itemQty}
													onChange={(e) =>
														setItemQty(Math.max(1, Number(e.target.value) || 1))
													}
													className="w-16 h-8 text-center text-sm rounded-lg border-0 p-0 focus-visible:ring-0"
												/>
												<button
													type="button"
													onClick={() => setItemQty(itemQty + 1)}
													className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
												>
													<Plus className="h-4 w-4" />
												</button>
											</div>
											<Button
												type="button"
												size="sm"
												variant="outline"
												onClick={addFormItem}
												disabled={!selectedServiceId}
												className="rounded-xl"
											>
												<Plus className="h-4 w-4" /> Tambah
											</Button>
										</div>
									</div>
								)}

								{formItems.length > 0 && (
									<div className="space-y-1.5 mt-2">
										{formItems.map((item, idx) => (
											<div
												key={`${item.serviceName}-${item.quantity}-${idx}`}
												className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2"
											>
												<span className="text-sm text-foreground">
													{item.serviceName} x {item.quantity}
												</span>
												<div className="flex items-center gap-2">
													<span className="text-sm font-semibold text-foreground">
														{formatRupiah(item.quantity * item.unitPrice)}
													</span>
													<button
														type="button"
														onClick={() => removeFormItem(idx)}
														className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
													>
														<X className="h-3.5 w-3.5" />
													</button>
												</div>
											</div>
										))}
										<div className="flex justify-between items-center pt-2 border-t border-border">
											<span className="text-sm font-semibold text-muted-foreground">
												Total
											</span>
											<span className="text-base font-bold text-foreground">
												{formatRupiah(totalFormPrice)}
											</span>
										</div>
									</div>
								)}
								{formErrors.items && (
									<p className="text-xs text-destructive">{formErrors.items}</p>
								)}
							</div>

							{/* Payment Method */}
							<div className="space-y-2">
								<Label className="text-sm font-semibold">
									Metode Pembayaran
								</Label>
								<Select
									value={paymentMethod}
									onValueChange={(val) => setPaymentMethod(val)}
								>
									<SelectTrigger className="w-full h-11 rounded-xl">
										<SelectValue placeholder="Pilih metode..." />
									</SelectTrigger>
									<SelectContent>
										{["TUNAI", "TRANSFER", "QRIS", "OVO", "GOPAY", "DANA"].map(
											(m) => (
												<SelectItem key={m} value={m}>
													{m}
												</SelectItem>
											),
										)}
									</SelectContent>
								</Select>
							</div>

							{/* Notes */}
							<div className="space-y-2">
								<Label className="text-sm font-semibold">Catatan</Label>
								<Textarea
									placeholder="Catatan tambahan (opsional)"
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
									rows={2}
									className="rounded-xl resize-none"
								/>
							</div>

							{/* Estimated Completion */}
							<div className="space-y-2">
								<Label className="text-sm font-semibold">
									Estimasi Selesai
								</Label>
								<Input
									type="datetime-local"
									value={estimatedCompletion}
									onChange={(e) => setEstimatedCompletion(e.target.value)}
									className="h-11 rounded-xl"
								/>
							</div>

							{/* Submit */}
							<Button
								onClick={validateAndSubmitCreate}
								disabled={
									createMutation.isPending || createCustomerMutation.isPending
								}
								className="w-full h-12 rounded-xl text-sm font-semibold"
							>
								{createMutation.isPending ||
								createCustomerMutation.isPending ? (
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

			{/* Edit Order Drawer */}
			<Drawer
				open={showEditForm}
				onOpenChange={(open) => {
					if (!open) {
						setShowEditForm(false);
						setEditFormErrors({});
					}
				}}
			>
				<DrawerContent className="max-h-[85dvh] flex flex-col">
					<DrawerHeader className="mb-2 shrink-0">
						<DrawerTitle>Edit Pesanan</DrawerTitle>
						<DrawerDescription>
							Perbarui detail pesanan laundry
						</DrawerDescription>
					</DrawerHeader>

					<div className="overflow-y-auto px-4 pb-4 w-full shrink">
						<div className="space-y-4 pb-4">
							{/* Edit Items */}
							<div className="space-y-2">
								<Label className="text-sm font-semibold">Item Layanan</Label>
								{services.length > 0 && (
									<div className="space-y-2">
										<Select
											value={editSelectedServiceId}
											onValueChange={(val) => setEditSelectedServiceId(val)}
										>
											<SelectTrigger className="w-full h-11 rounded-xl">
												<SelectValue placeholder="Tambah layanan..." />
											</SelectTrigger>
											<SelectContent>
												{services
													.filter((s) => s.active)
													.map((s) => (
														<SelectItem key={s.id} value={String(s.id)}>
															{s.name} — {formatRupiah(s.price)}/{s.unit}
														</SelectItem>
													))}
											</SelectContent>
										</Select>
										<div className="flex items-center gap-2">
											<div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3">
												<button
													type="button"
													onClick={() =>
														setEditItemQty(Math.max(1, editItemQty - 1))
													}
													className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
												>
													<Minus className="h-4 w-4" />
												</button>
												<Input
													type="number"
													min={1}
													value={editItemQty}
													onChange={(e) =>
														setEditItemQty(
															Math.max(1, Number(e.target.value) || 1),
														)
													}
													className="w-16 h-8 text-center text-sm rounded-lg border-0 p-0 focus-visible:ring-0"
												/>
												<button
													type="button"
													onClick={() => setEditItemQty(editItemQty + 1)}
													className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
												>
													<Plus className="h-4 w-4" />
												</button>
											</div>
											<Button
												type="button"
												size="sm"
												variant="outline"
												onClick={addEditItem}
												disabled={!editSelectedServiceId}
												className="rounded-xl"
											>
												<Plus className="h-4 w-4" /> Tambah
											</Button>
										</div>
									</div>
								)}

								{editItems.length > 0 && (
									<div className="space-y-1.5 mt-2">
										{editItems.map((item, idx) => (
											<div
												key={`${item.serviceName}-${item.quantity}-${idx}`}
												className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2"
											>
												<span className="text-sm text-foreground">
													{item.serviceName} x {item.quantity}
												</span>
												<div className="flex items-center gap-2">
													<span className="text-sm font-semibold text-foreground">
														{formatRupiah(item.quantity * item.unitPrice)}
													</span>
													<button
														type="button"
														onClick={() => removeEditItem(idx)}
														className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
													>
														<X className="h-3.5 w-3.5" />
													</button>
												</div>
											</div>
										))}
										<div className="flex justify-between items-center pt-2 border-t border-border">
											<span className="text-sm font-semibold text-muted-foreground">
												Total
											</span>
											<span className="text-base font-bold text-foreground">
												{formatRupiah(totalEditPrice)}
											</span>
										</div>
									</div>
								)}
								{editFormErrors.items && (
									<p className="text-xs text-destructive">
										{editFormErrors.items}
									</p>
								)}
							</div>

							{/* Payment Method */}
							<div className="space-y-2">
								<Label className="text-sm font-semibold">
									Metode Pembayaran
								</Label>
								<Select
									value={editPaymentMethod}
									onValueChange={(val) => setEditPaymentMethod(val)}
								>
									<SelectTrigger className="w-full h-11 rounded-xl">
										<SelectValue placeholder="Pilih metode..." />
									</SelectTrigger>
									<SelectContent>
										{["TUNAI", "TRANSFER", "QRIS", "OVO", "GOPAY", "DANA"].map(
											(m) => (
												<SelectItem key={m} value={m}>
													{m}
												</SelectItem>
											),
										)}
									</SelectContent>
								</Select>
							</div>

							{/* Payment Status */}
							<div className="space-y-2">
								<Label className="text-sm font-semibold">
									Status Pembayaran
								</Label>
								<Select
									value={editPaymentStatus}
									onValueChange={(val) =>
										setEditPaymentStatus(val as PaymentStatus)
									}
								>
									<SelectTrigger className="w-full h-11 rounded-xl">
										<SelectValue placeholder="Pilih status..." />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="BELUM_BAYAR">Belum Bayar</SelectItem>
										<SelectItem value="SEBAGIAN">Sebagian</SelectItem>
										<SelectItem value="LUNAS">Lunas</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{/* Notes */}
							<div className="space-y-2">
								<Label className="text-sm font-semibold">Catatan</Label>
								<Textarea
									placeholder="Catatan tambahan (opsional)"
									value={editNotes}
									onChange={(e) => setEditNotes(e.target.value)}
									rows={2}
									className="rounded-xl resize-none"
								/>
							</div>

							{/* Estimated Completion */}
							<div className="space-y-2">
								<Label className="text-sm font-semibold">
									Estimasi Selesai
								</Label>
								<Input
									type="datetime-local"
									value={editEstimatedCompletion}
									onChange={(e) => setEditEstimatedCompletion(e.target.value)}
									className="h-11 rounded-xl"
								/>
							</div>

							{/* Submit */}
							<Button
								onClick={validateAndSubmitEdit}
								disabled={editMutation.isPending}
								className="w-full h-12 rounded-xl text-sm font-semibold"
							>
								{editMutation.isPending ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
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
