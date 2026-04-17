import { formatDate, formatRupiah } from "#/lib/utils";

type ReceiptProps = {
	order: {
		id: number;
		customerName: string;
		customerPhone: string;
		nominal: number;
		paymentStatus: string;
		paymentMethod: string | null;
		createdAt: Date | string;
		estimatedCompletion?: Date | string | null;
		items: {
			id: number;
			serviceName: string;
			quantity: number;
			unitPrice: number;
			subtotal: number;
		}[];
	};
	settings: {
		name: string;
		address: string;
	};
};

export function ReceiptTemplate({ order, settings }: ReceiptProps) {
	return (
		<div
			className="w-[380px] bg-white p-8 text-slate-800 font-sans leading-tight border"
			style={{ minHeight: "600px" }}
		>
			{/* Logo/Store Name */}
			<div className="text-center space-y-2 mb-8">
				<h1 className="text-2xl font-black tracking-tight text-primary uppercase">
					{settings.name || "LAUNDRYKU"}
				</h1>
				<p className="text-xs text-slate-500 max-w-[200px] mx-auto leading-relaxed">
					{settings.address || "Jln. Kebahagiaan No. 88, Jakarta Selatan"}
				</p>
			</div>

			<div className="h-px w-full bg-slate-200 my-4 border-dashed border-t" />

			{/* Order Header */}
			<div className="space-y-3 mb-6">
				<div className="flex justify-between items-baseline">
					<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
						Order ID
					</span>
					<span className="text-sm font-black text-slate-900">
						#{order.id.toString().padStart(4, "0")}
					</span>
				</div>
				<div className="flex justify-between items-baseline">
					<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
						Tanggal
					</span>
					<span className="text-sm font-medium">
						{formatDate(order.createdAt)}
					</span>
				</div>
				<div className="flex justify-between items-baseline">
					<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
						Pelanggan
					</span>
					<span className="text-sm font-bold text-slate-900">
						{order.customerName}
					</span>
				</div>
			</div>

			<div className="h-px w-full bg-slate-200 my-4 border-dashed border-t" />

			{/* Items Table */}
			<table className="w-full mb-6 text-sm">
				<thead className="text-left border-b border-slate-100">
					<tr>
						<th className="py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
							Layanan
						</th>
						<th className="py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">
							Total
						</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-slate-50">
					{order.items.map((item) => (
						<tr key={item.id}>
							<td className="py-3 pr-4">
								<p className="font-bold text-slate-900 leading-none mb-1">
									{item.serviceName}
								</p>
								<p className="text-[11px] text-slate-500">
									{item.quantity} x {formatRupiah(item.unitPrice)}
								</p>
							</td>
							<td className="py-3 text-right font-bold text-slate-900 align-top">
								{formatRupiah(item.subtotal)}
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<div className="bg-slate-50 rounded-xl p-4 space-y-2 mb-6 border border-slate-100">
				<div className="flex justify-between items-center text-sm">
					<span className="font-medium text-slate-500">Total Tagihan</span>
					<span className="text-lg font-black text-primary">
						{formatRupiah(order.nominal)}
					</span>
				</div>
				<div className="flex justify-between items-center text-xs">
					<span className="font-medium text-slate-500">Status Bayar</span>
					<span
						className={`font-black tracking-wider uppercase ${order.paymentStatus === "LUNAS" ? "text-emerald-600" : "text-amber-600"}`}
					>
						{order.paymentStatus.replace("_", " ")}
					</span>
				</div>
				{order.paymentMethod && (
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/50">
                        <span className="font-medium text-slate-500">Metode</span>
                        <span className="font-bold text-slate-700">{order.paymentMethod}</span>
                    </div>
                )}
			</div>

			{order.estimatedCompletion && (
				<div className="text-center p-3 border-2 border-primary/10 rounded-2xl bg-primary/[0.02] mb-8">
					<p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
						Estimasi Selesai
					</p>
					<p className="text-sm font-black text-primary">
						{formatDate(order.estimatedCompletion)}
					</p>
				</div>
			)}

			{/* Footer */}
			<div className="text-center space-y-4">
				<div className="inline-block p-1 bg-slate-50 rounded-lg border border-slate-100">
					{/* Placeholder for QR Code if we want one in the struck */}
                    <div className="text-[9px] font-bold text-slate-400 px-4 py-1">
                        DIGITAL RECEIPT
                    </div>
				</div>
				<p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
					Terima Kasih
				</p>
                <div className="flex justify-center gap-1">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                        <div key={i} className="h-1 w-1 rounded-full bg-slate-200" />
                    ))}
                </div>
			</div>
		</div>
	);
}
