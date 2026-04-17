import {
	queryOptions,
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ChevronRight,
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
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "../components/ui/drawer";
import { Textarea } from "../components/ui/textarea";
import {
	customersList,
	customersCreate,
} from "#/lib/server-fns";
import { formatRupiahCompact } from "#/lib/utils";

export const Route = createFileRoute("/customers/")({
	component: CustomersListPage,
});

export const customersListQueryOptions = queryOptions({
	queryKey: ["customers", "list"],
	queryFn: () => customersList(),
});

function CustomersListPage() {
	const queryClient = useQueryClient();
	const { data: customers = [] } = useSuspenseQuery(customersListQueryOptions);

	const [search, setSearch] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [form, setForm] = useState({ name: "", phone: "", address: "" });
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	const createMutation = useMutation({
		mutationFn: (data: { name: string; phone: string; address?: string }) =>
			customersCreate({ data }),
		onSuccess: (data) => {
			queryClient.invalidateQueries(customersListQueryOptions);
			setShowForm(false);
			setForm({ name: "", phone: "", address: "" });
			setFormErrors({});
			toast.success(`Pelanggan "${data.name}" berhasil ditambahkan`);
		},
		onError: () => {
			toast.error("Gagal menambah pelanggan. Coba lagi.");
		},
	});

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
						<Link
							key={customer.id}
							to="/customers/$customerId"
							params={{ customerId: String(customer.id) }}
							className="block rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition-colors no-underline group"
						>
							<div className="flex items-start gap-3">
								<div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow group-hover:scale-105 transition-transform">
									<span className="text-primary-foreground font-bold text-base">
										{customer.name.charAt(0).toUpperCase()}
									</span>
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between">
										<p className="font-semibold text-foreground truncate text-sm">
											{customer.name}
										</p>
										<ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
									</div>
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
								<div className="rounded-xl bg-primary/5 p-2.5 flex items-center gap-2 border border-transparent group-hover:border-primary/10 transition-colors">
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
								<div className="rounded-xl bg-primary/5 p-2.5 flex items-center gap-2 border border-transparent group-hover:border-primary/10 transition-colors">
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
						</Link>
					))
				)}
			</div>

			{/* Add Customer Drawer */}
			<Drawer
				open={showForm}
				onOpenChange={(open) => {
					setShowForm(open);
					if (!open) {
						setFormErrors({});
					}
				}}
			>
				<DrawerContent>
					<div className="mx-auto w-full max-w-lg">
						<DrawerHeader className="text-left px-4 pt-6">
							<DrawerTitle>Tambah Pelanggan</DrawerTitle>
							<DrawerDescription>Masukkan data pelanggan baru</DrawerDescription>
						</DrawerHeader>

						<div className="space-y-4 px-4 pb-8 pt-2">
							<div className="space-y-2">
								<Label htmlFor="customer-name" className="text-sm font-semibold text-foreground/80">
									Nama Lengkap <span className="text-destructive font-black">*</span>
								</Label>
								<Input
									id="customer-name"
									type="text"
									placeholder="Budi Santoso"
									value={form.name}
									onChange={(e) => setForm({ ...form, name: e.target.value })}
									className="h-12 rounded-2xl bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all"
								/>
								{formErrors.name && (
									<p className="text-xs font-bold text-destructive pl-1">{formErrors.name}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="customer-phone" className="text-sm font-semibold text-foreground/80">
									Nomor HP (WhatsApp) <span className="text-destructive font-black">*</span>
								</Label>
								<Input
									id="customer-phone"
									type="tel"
									placeholder="08123456789"
									value={form.phone}
									onChange={(e) => setForm({ ...form, phone: e.target.value })}
									className="h-12 rounded-2xl bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all"
								/>
								{formErrors.phone && (
									<p className="text-xs font-bold text-destructive pl-1">{formErrors.phone}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label
									htmlFor="customer-address"
									className="text-sm font-semibold text-foreground/80"
								>
									Alamat
								</Label>
								<Textarea
									id="customer-address"
									placeholder="Jl. Contoh No. 1, Kota..."
									value={form.address}
									onChange={(e) => setForm({ ...form, address: e.target.value })}
									rows={2}
									className="rounded-2xl bg-muted/30 border-muted-foreground/10 focus:border-primary/30 transition-all resize-none"
								/>
							</div>

							<Button
								onClick={validateAndSubmit}
								disabled={createMutation.isPending}
								className="w-full h-13 rounded-2xl text-sm font-black shadow-lg shadow-primary/20 mt-2 hover:scale-[1.01] active:scale-[0.98] transition-all"
							>
								{createMutation.isPending ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin mr-2" /> Menyimpan...
									</>
								) : (
									"Simpan Pelanggan"
								)}
							</Button>
						</div>
					</div>
				</DrawerContent>
			</Drawer>
		</div>
	);
}
