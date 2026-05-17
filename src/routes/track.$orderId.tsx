import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
	CheckCircle2,
	CreditCard,
	Loader2,
	PackageSearch,
	Receipt,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { generateReceiptPDF } from "#/lib/pdf-utils";
import { ordersGet, settingsGet } from "#/lib/server-fns";
import { formatDate, formatRupiah } from "#/lib/utils";
import { Skeleton } from "../components/ui/skeleton";

export const Route = createFileRoute("/track/$orderId")({
	loader: ({ params }) => {
		return { id: Number(params.orderId) };
	},
	component: OrderTrackingPage,
	pendingComponent: () => (
		<div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col p-4 space-y-6">
			<Skeleton className="h-12 w-3/4 self-center mt-6" />
			<Skeleton className="h-40 w-full rounded-2xl mt-8" />
			<Skeleton className="h-40 w-full rounded-2xl" />
			<Skeleton className="h-40 w-full rounded-2xl" />
		</div>
	),
	errorComponent: () => (
		<div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-center">
			<PackageSearch className="h-16 w-16 text-muted-foreground mb-4" />
			<h2 className="text-xl font-bold mb-2 text-foreground">
				Pesanan Tidak Ditemukan
			</h2>
			<p className="text-muted-foreground">
				Tautan ini salah atau pesanan Anda mungkin sudah dihapus.
			</p>
		</div>
	),
});

export const trackOrderQueryOptions = (id: number) =>
	queryOptions({
		queryKey: ["orders", "track", id],
		queryFn: () => ordersGet({ data: id }),
	});

export const settingsQueryOptions = queryOptions({
	queryKey: ["settings"],
	queryFn: () => settingsGet(),
});

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> =
	{
		PENDING: {
			label: "Menunggu",
			bg: "bg-yellow-100 dark:bg-yellow-500/10",
			text: "text-yellow-700 dark:text-yellow-500",
		},
		DIPROSES: {
			label: "Sedang Diproses",
			bg: "bg-blue-100 dark:bg-blue-500/10",
			text: "text-blue-700 dark:text-blue-500",
		},
		SELESAI: {
			label: "Selesai",
			bg: "bg-green-100 dark:bg-green-500/10",
			text: "text-green-700 dark:text-green-500",
		},
		DIAMBIL: {
			label: "Sudah Diambil",
			bg: "bg-indigo-100 dark:bg-indigo-500/10",
			text: "text-indigo-700 dark:text-indigo-400",
		},
		BATAL: {
			label: "Dibatalkan",
			bg: "bg-gray-100 dark:bg-slate-800",
			text: "text-gray-500 dark:text-slate-400",
		},
	};

function OrderTrackingPage() {
	const { id } = Route.useLoaderData();
	const { data: order } = useSuspenseQuery(trackOrderQueryOptions(id));
	const { data: settings } = useSuspenseQuery(settingsQueryOptions);
	const [isPrinting, setIsPrinting] = useState(false);

	const handlePrint = async () => {
		setIsPrinting(true);
		const tid = toast.loading("Menyiapkan struk...");
		try {
			await generateReceiptPDF(id, null, {
				order: {
					...order,
					items: order.items.map((i) => ({
						...i,
						subtotal: Number(i.subtotal),
					})),
				},
				settings: {
					name: settings.name ?? "LaundryKu",
					address: settings.address ?? "",
				},
			});
			toast.success("Struk berhasil diunduh", { id: tid });
		} catch (err) {
			console.error("Print error:", err);
			toast.error("Gagal mengunduh struk", { id: tid });
		} finally {
			setIsPrinting(false);
		}
	};

	if (!order) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-center">
				<PackageSearch className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
				<h2 className="text-xl font-bold mb-2 text-foreground">
					Tidak Ditemukan
				</h2>
				<p className="text-muted-foreground">
					Data pesanan tidak ditemukan di sistem.
				</p>
			</div>
		);
	}

	const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.PENDING;

	return (
		<div className="min-h-[100dvh] bg-slate-50/50 dark:bg-slate-950 pb-safe flex flex-col items-center">
			{/* Top Header */}
			<div className="bg-primary text-primary-foreground w-full px-6 pt-12 pb-16 rounded-b-[2rem] shadow-md content-center text-center border-b border-primary/10 dark:border-slate-800">
				<h1 className="text-2xl font-bold tracking-tight mb-1">LaundryKu</h1>
				<p className="opacity-80 text-sm font-medium">Lacak Pesanan Anda</p>
			</div>

			{/* Main Card */}
			<div className="w-full max-w-md px-4 -mt-10 mb-8">
				<motion.div
					initial={{ opacity: 0, y: 20, scale: 0.96 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{
						type: "spring",
						stiffness: 200,
						damping: 20,
						delay: 0.1,
					}}
					className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-6 space-y-6 border border-slate-100 dark:border-slate-800"
				>
					{/* Status Hero */}
					<div className="text-center space-y-3">
						<div
							className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-bold tracking-wide ${statusInfo.bg} ${statusInfo.text}`}
						>
							{statusInfo.label}
						</div>
						<h2 className="text-3xl font-black tracking-tight flex items-center justify-center text-foreground">
							<span className="text-muted-foreground font-medium text-lg mr-2 uppercase">
								#
							</span>
							{order.id.toString().padStart(4, "0")}
						</h2>
					</div>

					<div className="h-px w-full bg-slate-100 dark:bg-slate-800" />

					{/* Customer Masked Info */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
								Tanggal Masuk
							</p>
							<p className="text-sm font-medium text-slate-800 dark:text-slate-200">
								{formatDate(order.createdAt)}
							</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
								Estimasi Selesai
							</p>
							<p className="text-sm font-medium text-slate-800 dark:text-slate-200">
								{order.estimatedCompletion
									? formatDate(order.estimatedCompletion)
									: "-"}
							</p>
						</div>
					</div>

					<div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-3">
						<p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
							<Receipt className="w-4 h-4 text-primary" /> Rincian Layanan
						</p>
						<div className="space-y-2">
							{order.items.map((item) => (
								<div
									key={item.id}
									className="flex justify-between items-start text-sm"
								>
									<div className="font-medium text-slate-600 dark:text-slate-400">
										{item.serviceName}
										<span className="text-xs text-muted-foreground block mt-0.5">
											{item.quantity} x {formatRupiah(item.unitPrice)}
										</span>
									</div>
									<span className="font-semibold text-slate-700 dark:text-slate-300">
										{formatRupiah(item.quantity * item.unitPrice)}
									</span>
								</div>
							))}
						</div>

						<div className="h-px w-full bg-slate-200 dark:bg-slate-700 my-2" />

						<div className="flex justify-between items-center pt-1">
							<span className="font-bold text-slate-800 dark:text-slate-200">
								Total Tagihan
							</span>
							<span className="text-lg font-black text-primary">
								{formatRupiah(order.nominal)}
							</span>
						</div>
					</div>

					{/* Payment Status */}
					<div className="flex bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 items-center gap-4">
						<div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
							<CreditCard className="w-5 h-5" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
								Status Pembayaran
							</p>
							{order.paymentStatus === "LUNAS" ? (
								<p className="flex items-center text-sm font-bold text-emerald-600 dark:text-emerald-500 gap-1.5">
									<CheckCircle2 className="w-4 h-4" /> LUNAS
								</p>
							) : (
								<p className="text-sm font-bold text-amber-600 dark:text-amber-500">
									BELUM LUNAS
								</p>
							)}
						</div>
					</div>

					{/* Print Button */}
					<button
						type="button"
						onClick={handlePrint}
						disabled={isPrinting}
						className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-sm shadow-lg shadow-slate-200 dark:shadow-none hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
					>
						{isPrinting ? (
							<Loader2 className="w-4 h-4 animate-spin" />
						) : (
							<Receipt className="w-4 h-4" />
						)}
						Unduh Struk (PDF)
					</button>
				</motion.div>

				<p className="text-xs text-center text-muted-foreground mt-8 mb-4">
					Terima kasih telah mempercayakan pakaian Anda di LaundryKu.
				</p>
			</div>

		</div>
	);
}
