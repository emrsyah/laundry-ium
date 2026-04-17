import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ChevronRight,
	Clock,
	PlusCircle,
	ShoppingBag,
	TrendingUp,
	UserPlus,
	Wallet,
} from "lucide-react";
import {
	analyticsSummary,
	ordersList,
} from "#/lib/server-fns";

export const Route = createFileRoute("/")({
	component: BerandaPage,
});

import { formatRupiah, formatRupiahCompact } from "#/lib/utils";

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

export const analyticsSummaryQueryOptions = queryOptions({
	queryKey: ["analytics", "summary"],
	queryFn: () => analyticsSummary(),
});

export const ordersListQueryOptions = queryOptions({
	queryKey: ["orders", "list"],
	queryFn: () => ordersList(),
});

function BerandaPage() {
	const { data: summary } = useSuspenseQuery(analyticsSummaryQueryOptions);
	const { data: orders } = useSuspenseQuery(ordersListQueryOptions);
	const recentOrders = orders
		?.filter((o) => o.status !== "BATAL")
		.slice(0, 5) ?? [];

	const pendingCount =
		orders?.filter((o) => o.status === "PENDING").length ?? 0;

	return (
		<div className="px-4 py-5 space-y-5">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm font-semibold text-primary">Selamat Datang</p>
					<h1 className="text-2xl font-bold text-foreground mt-0.5">
						LaundryKu
					</h1>
				</div>
				<div className="h-11 w-11 rounded-full bg-primary flex items-center justify-center shadow-md">
					<span className="text-primary-foreground font-bold text-sm">LK</span>
				</div>
			</div>

			{/* Summary Cards */}
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-3">
				<div className="rounded-2xl bg-primary p-4 text-primary-foreground shadow-lg">
					<div className="flex items-center gap-2 mb-1.5">
						<ShoppingBag className="h-4 w-4" />
						<span className="text-xs font-semibold opacity-90">
							Pesanan Hari Ini
						</span>
					</div>
					<p className="text-3xl font-bold leading-tight">
						{summary?.ordersToday ?? 0}
					</p>
					{pendingCount > 0 && (
						<p className="text-xs opacity-80 mt-1">
							{pendingCount} menunggu diproses
						</p>
					)}
				</div>
				<div className="rounded-2xl bg-primary/90 p-4 text-primary-foreground shadow-lg">
					<div className="flex items-center gap-2 mb-1.5">
						<Wallet className="h-4 w-4" />
						<span className="text-xs font-semibold opacity-90">Pendapatan</span>
					</div>
					<p className="text-xl font-bold leading-tight">
						{formatRupiahCompact(summary?.revenueToday ?? 0)}
					</p>
					<p className="text-xs opacity-80 mt-1">hari ini</p>
				</div>
			</div>
			<div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4 shadow-sm">
				<div className="flex items-center gap-2 mb-1.5">
					<Wallet className="h-4 w-4 text-red-600" />
					<span className="text-xs font-semibold text-red-700">
						Belum Bayar
					</span>
				</div>
				<p className="text-2xl font-bold text-red-700 leading-tight">
					{formatRupiahCompact(summary?.unpaidToday ?? 0)}
				</p>
				<p className="text-xs text-red-600 opacity-80 mt-1">hari ini</p>
			</div>
		</div>

			{/* Quick Actions */}
			<div>
				<h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
					Aksi Cepat
				</h2>
				<div className="grid grid-cols-2 gap-3">
					<Link
						to="/orders"
						className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition-colors no-underline"
					>
						<div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
							<PlusCircle className="h-5 w-5 text-primary" />
						</div>
						<div>
							<p className="text-sm font-semibold text-foreground">+ Pesanan</p>
							<p className="text-xs text-muted-foreground">Buat pesanan baru</p>
						</div>
					</Link>
					<Link
						to="/customers"
						className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition-colors no-underline"
					>
						<div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
							<UserPlus className="h-5 w-5 text-primary" />
						</div>
						<div>
							<p className="text-sm font-semibold text-foreground">
								+ Pelanggan
							</p>
							<p className="text-xs text-muted-foreground">
								Tambah member baru
							</p>
						</div>
					</Link>
				</div>
			</div>

			{/* Recent Orders */}
			<div>
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
						<Clock className="h-3.5 w-3.5" />
						Aktivitas Terakhir
					</h2>
					<Link
						to="/orders"
						className="text-xs text-primary font-semibold flex items-center gap-0.5 no-underline"
					>
						Lihat semua <ChevronRight className="h-3.5 w-3.5" />
					</Link>
				</div>

				{recentOrders.length === 0 ? (
					<div className="rounded-2xl border border-border bg-card p-8 text-center">
						<div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
							<ShoppingBag className="h-7 w-7 text-primary/50" />
						</div>
						<p className="text-sm font-semibold text-foreground">
							Belum ada pesanan
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							Tekan tombol "+ Pesanan" untuk memulai
						</p>
					</div>
				) : (
					<div className="space-y-2">
						{recentOrders.map((order) => {
							const statusCfg = STATUS_CONFIG[order.status];
							return (
								<div
									key={order.id}
									className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5"
								>
									<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
										{order.status === "SELESAI" ? (
											<TrendingUp className="h-5 w-5 text-green-600" />
										) : (
											<ShoppingBag className="h-5 w-5 text-primary" />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-semibold text-foreground truncate">
											{order.customerName}
										</p>
										<p className="text-xs text-muted-foreground">
											{order.notes?.slice(0, 30) || "Catatan kosong"}
											{order.notes && order.notes.length > 30 ? "..." : ""} &middot;{" "}
											{formatRupiah(order.nominal)}
										</p>
									</div>
									<span
										className={[
											"text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0",
											statusCfg?.className,
										].join(" ")}
									>
										{statusCfg?.label ?? order.status}
									</span>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
