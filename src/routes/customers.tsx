import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Loader2,
	MapPin,
	Phone,
	Search,
	ShoppingBag,
	UserPlus,
	Users,
	Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "../components/ui/sheet";
import { Textarea } from "../components/ui/textarea";
import { useTRPC } from "../integrations/trpc/react";

export const Route = createFileRoute("/customers")({
	component: CustomersPage,
});

function formatRupiahCompact(amount: number) {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
		notation: "compact",
	}).format(amount);
}

function CustomersPage() {
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const { data: customers = [] } = useSuspenseQuery(
		trpc.customers.list.queryOptions(),
	);

	const [search, setSearch] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState({ name: "", phone: "", address: "" });
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const createMutation = useMutation(
		trpc.customers.create.mutationOptions({
			onSuccess: (data) => {
				queryClient.invalidateQueries(trpc.customers.list.queryOptions());
				setShowForm(false);
				setForm({ name: "", phone: "", address: "" });
				setFormErrors({});
				toast.success(`Pelanggan "${data.name}" berhasil ditambahkan`);
			},
			onError: () => {
				toast.error("Gagal menambah pelanggan. Coba lagi.");
			},
		}),
	);

	const filtered = customers.filter(
		(c) =>
			c.name.toLowerCase().includes(search.toLowerCase()) ||
			c.phone.includes(search),
	);

	function validateAndSubmit() {
		const errors: Record<string, string> = {};

		if (!form.name.trim()) {
			errors.name = "Nama wajib diisi";
		}
		if (!form.phone.trim()) {
			errors.phone = "Nomor HP wajib diisi";
		} else if (!/^0\d{8,12}$/.test(form.phone.trim())) {
			errors.phone = "Format nomor HP tidak valid (contoh: 08123456789)";
		}

		setFormErrors(errors);
		if (Object.keys(errors).length > 0) return;

		createMutation.mutate({
			name: form.name.trim(),
			phone: form.phone.trim(),
			address: form.address.trim(),
		});
	}

	return (
		<div className="px-4 py-5 space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground">Pelanggan</h1>
					<p className="text-sm text-muted-foreground">
						{customers.length} member terdaftar
					</p>
				</div>
				<Button
					onClick={() => {
						setFormErrors({});
						setShowForm(true);
					}}
					size="sm"
					className="rounded-full gap-1.5"
				>
					<UserPlus className="h-4 w-4" /> Tambah
				</Button>
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Cari nama atau nomor HP..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="pl-10 h-11 rounded-xl"
				/>
			</div>

			{/* Customer List */}
			<div className="space-y-3">
				{filtered.length === 0 ? (
					<div className="rounded-2xl border border-border bg-card p-10 text-center">
						<div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
							<Users className="h-7 w-7 text-primary/40" />
						</div>
						<p className="text-sm font-semibold text-foreground">
							{search ? "Tidak ada pelanggan ditemukan" : "Belum ada pelanggan"}
						</p>
						<p className="text-xs text-muted-foreground mt-1">
							{search
								? "Coba ubah pencarian"
								: "Tambahkan pelanggan pertama Anda"}
						</p>
						{!search && (
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowForm(true)}
								className="mt-3 rounded-full"
							>
								<UserPlus className="h-4 w-4 mr-1" /> Tambah Pelanggan
							</Button>
						)}
					</div>
				) : (
					filtered.map((customer) => (
						<div
							key={customer.id}
							className="rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition-colors"
						>
							<div className="flex items-start gap-3">
								<div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow">
									<span className="text-primary-foreground font-bold text-base">
										{customer.name.charAt(0).toUpperCase()}
									</span>
								</div>
								<div className="flex-1 min-w-0">
									<p className="font-semibold text-foreground truncate text-sm">
										{customer.name}
									</p>
									<div className="flex items-center gap-1 mt-0.5">
										<Phone className="h-3.5 w-3.5 text-muted-foreground" />
										<p className="text-xs text-muted-foreground">
											{customer.phone}
										</p>
									</div>
									{customer.address && (
										<div className="flex items-center gap-1 mt-0.5">
											<MapPin className="h-3.5 w-3.5 text-muted-foreground" />
											<p className="text-xs text-muted-foreground truncate">
												{customer.address}
											</p>
										</div>
									)}
								</div>
							</div>

							{/* Stats */}
							<div className="mt-3 grid grid-cols-2 gap-2">
								<div className="rounded-xl bg-primary/5 p-2.5 flex items-center gap-2">
									<ShoppingBag className="h-4 w-4 text-primary" />
									<div>
										<p className="text-[11px] text-muted-foreground">
											Total Pesanan
										</p>
										<p className="text-sm font-bold text-foreground">
											{customer.totalOrders ?? 0}
										</p>
									</div>
								</div>
								<div className="rounded-xl bg-primary/5 p-2.5 flex items-center gap-2">
									<Wallet className="h-4 w-4 text-primary" />
									<div>
										<p className="text-[11px] text-muted-foreground">
											Total Belanja
										</p>
										<p className="text-sm font-bold text-foreground">
											{formatRupiahCompact(customer.totalSpent ?? 0)}
										</p>
									</div>
								</div>
							</div>
						</div>
					))
				)}
			</div>

			{/* Add Customer Sheet */}
			<Sheet
				open={showForm}
				onOpenChange={(open) => {
					if (!open) {
						setShowForm(false);
						setFormErrors({});
					}
				}}
			>
				<SheetContent side="bottom" className="rounded-t-3xl">
					<SheetHeader className="mb-2">
						<SheetTitle>Tambah Pelanggan</SheetTitle>
						<SheetDescription>Masukkan data pelanggan baru</SheetDescription>
					</SheetHeader>

					<div className="space-y-4 pb-4">
						<div className="space-y-2">
							<Label htmlFor="customer-name" className="text-sm font-semibold">
								Nama Lengkap <span className="text-destructive">*</span>
							</Label>
							<Input
								id="customer-name"
								type="text"
								placeholder="Budi Santoso"
								value={form.name}
								onChange={(e) => setForm({ ...form, name: e.target.value })}
								className="h-11 rounded-xl"
							/>
							{formErrors.name && (
								<p className="text-xs text-destructive">{formErrors.name}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="customer-phone" className="text-sm font-semibold">
								Nomor HP (WhatsApp) <span className="text-destructive">*</span>
							</Label>
							<Input
								id="customer-phone"
								type="tel"
								placeholder="08123456789"
								value={form.phone}
								onChange={(e) => setForm({ ...form, phone: e.target.value })}
								className="h-11 rounded-xl"
							/>
							{formErrors.phone && (
								<p className="text-xs text-destructive">{formErrors.phone}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label
								htmlFor="customer-address"
								className="text-sm font-semibold"
							>
								Alamat
							</Label>
							<Textarea
								id="customer-address"
								placeholder="Jl. Contoh No. 1, Kota..."
								value={form.address}
								onChange={(e) => setForm({ ...form, address: e.target.value })}
								rows={2}
								className="rounded-xl resize-none"
							/>
						</div>

						<Button
							onClick={validateAndSubmit}
							disabled={createMutation.isPending}
							className="w-full h-12 rounded-xl text-sm font-semibold"
						>
							{createMutation.isPending ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
								</>
							) : (
								"Simpan Pelanggan"
							)}
						</Button>
					</div>
				</SheetContent>
			</Sheet>
		</div>
	);
}
