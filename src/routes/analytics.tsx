import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Shirt, ShoppingBag, TrendingUp } from "lucide-react";
import {
	analyticsSummary,
	analyticsWeeklyRevenue,
	analyticsServiceBreakdown,
} from "#/lib/server-fns";
import { formatRupiahCompact } from "#/lib/utils";

export const Route = createFileRoute("/analytics")({
	component: AnalyticsPage,
});


export const analyticsSummaryQueryOptions = queryOptions({
	queryKey: ["analytics", "summary"],
	queryFn: () => analyticsSummary(),
});

export const analyticsWeeklyRevenueQueryOptions = queryOptions({
	queryKey: ["analytics", "weeklyRevenue"],
	queryFn: () => analyticsWeeklyRevenue(),
});

export const analyticsServiceBreakdownQueryOptions = queryOptions({
	queryKey: ["analytics", "serviceBreakdown"],
	queryFn: () => analyticsServiceBreakdown(),
});

function AnalyticsPage() {
	const { data: summary } = useSuspenseQuery(analyticsSummaryQueryOptions);
	const { data: weekly = [] } = useSuspenseQuery(analyticsWeeklyRevenueQueryOptions);
	const { data: services = [] } = useSuspenseQuery(analyticsServiceBreakdownQueryOptions);

	const maxRevenue = Math.max(...weekly.map((d) => d.revenue), 1);
	const totalRevenue = weekly.reduce((acc, d) => acc + d.revenue, 0);
	const totalOrders = weekly.reduce((acc, d) => acc + d.count, 0);

	const kiloan = services.find((s) => s.type === "kiloan");
	const satuan = services.find((s) => s.type === "satuan");
	const totalServiceOrders = (kiloan?.count ?? 0) + (satuan?.count ?? 0);

	return (
		<div className="px-4 py-5 space-y-5">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-foreground">Analitik</h1>
				<p className="text-sm text-muted-foreground">
					Ringkasan 7 hari terakhir
				</p>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-2 gap-3">
				<div className="rounded-2xl bg-primary p-4 text-primary-foreground shadow-lg">
					<div className="flex items-center gap-2 mb-1.5">
						<TrendingUp className="h-4 w-4" />
						<span className="text-xs font-semibold opacity-90">
							Total Pendapatan
						</span>
					</div>
					<p className="text-xl font-bold leading-tight">
						{formatRupiahCompact(totalRevenue)}
					</p>
					<p className="text-xs opacity-80 mt-0.5">7 hari terakhir</p>
				</div>
				<div className="rounded-2xl bg-primary/90 p-4 text-primary-foreground shadow-lg">
					<div className="flex items-center gap-2 mb-1.5">
						<ShoppingBag className="h-4 w-4" />
						<span className="text-xs font-semibold opacity-90">
							Total Pesanan
						</span>
					</div>
					<p className="text-xl font-bold leading-tight">{totalOrders}</p>
					<p className="text-xs opacity-80 mt-0.5">7 hari terakhir</p>
				</div>
			</div>

			{/* Weekly Bar Chart */}
			<div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
				<div className="flex items-center gap-2 mb-4">
					<BarChart3 className="h-4 w-4 text-primary" />
					<h2 className="text-sm font-bold text-foreground">
						Pendapatan 7 Hari
					</h2>
				</div>
				<div className="flex items-end gap-1.5 h-44 pt-6">
					{weekly.map((day, i) => {
						const heightPct =
							maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
						return (
							<div
								key={day.label}
								className="flex-1 flex flex-col items-center h-full"
							>
								{/* Bar Container */}
								<div className="flex-1 w-full flex flex-col justify-end items-center gap-1">
									{day.revenue > 0 && (
										<span className="text-[10px] text-muted-foreground font-bold whitespace-nowrap">
											{formatRupiahCompact(day.revenue)}
										</span>
									)}
									<div
										className="w-full rounded-t-lg bg-primary transition-all duration-500 min-h-[4px]"
										style={{ height: `${Math.max(heightPct, 4)}%` }}
									/>
								</div>
								{/* X-Axis Label */}
								<span className="text-[11px] text-muted-foreground font-medium capitalize mt-1.5">
									{day.label}
								</span>
							</div>
						);
					})}
				</div>
				{maxRevenue === 1 && (
					<p className="text-center text-sm text-muted-foreground mt-3">
						Belum ada data pendapatan minggu ini
					</p>
				)}
			</div>

			{/* Service Breakdown */}
			<div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
				<div className="flex items-center gap-2 mb-4">
					<Shirt className="h-4 w-4 text-primary" />
					<h2 className="text-sm font-bold text-foreground">Jenis Layanan</h2>
				</div>

				{totalServiceOrders === 0 ? (
					<p className="text-sm text-muted-foreground text-center py-4">
						Belum ada data layanan
					</p>
				) : (
					<div className="space-y-3">
						{[
							{
								label: "Cuci Kiloan",
								data: kiloan,
							},
							{
								label: "Cuci Satuan",
								data: satuan,
							},
						].map(({ label, data }) => {
							const pct =
								totalServiceOrders > 0
									? ((data?.count ?? 0) / totalServiceOrders) * 100
									: 0;
							return (
								<div key={label}>
									<div className="flex justify-between text-sm mb-1.5">
										<span className="font-medium text-foreground">{label}</span>
										<span className="text-muted-foreground text-xs">
											{data?.count ?? 0} pesanan &middot; {pct.toFixed(0)}%
										</span>
									</div>
									<div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
										<div
											className="h-full rounded-full bg-primary transition-all duration-700"
											style={{ width: `${pct}%` }}
										/>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Today Stats */}
			<div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
				<h2 className="text-sm font-bold text-foreground mb-3">Hari Ini</h2>
				<div className="grid grid-cols-2 gap-4">
					<div className="text-center">
						<p className="text-2xl font-bold text-foreground">
							{summary?.ordersToday ?? 0}
						</p>
						<p className="text-xs text-muted-foreground">Pesanan</p>
					</div>
					<div className="text-center">
						<p className="text-2xl font-bold text-foreground">
							{formatRupiahCompact(summary?.revenueToday ?? 0)}
						</p>
						<p className="text-xs text-muted-foreground">Pendapatan</p>
					</div>
				</div>
			</div>
		</div>
	);
}
