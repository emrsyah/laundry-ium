import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  ChevronLeft, 
  MapPin, 
  Phone, 
  ShoppingBag, 
  Wallet, 
  Calendar,
  Clock,
  MessageCircle,
  TrendingUp
} from "lucide-react";
import { customersGet } from "#/lib/server-fns";
import { formatRupiahCompact } from ".";
import { Button } from "../components/ui/button";

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
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | Date | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function CustomerDetailPage() {
  const { id } = Route.useLoaderData();
  const { data: customer } = useSuspenseQuery(
    queryOptions({
      queryKey: ["customers", "detail", id],
      queryFn: () => customersGet({ data: id }),
    })
  );

  if (!customer) {
    return (
      <div className="p-10 text-center space-y-4">
        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <ChevronLeft className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Pelanggan tidak ditemukan</h2>
          <p className="text-sm text-muted-foreground mt-1">Data yang Anda cari mungkin sudah dihapus</p>
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/customers">Kembali ke Daftar</Link>
        </Button>
      </div>
    );
  }

  const handleWa = () => {
    const phone = customer.phone.replace(/\D/g, "");
    const normalizedPhone = phone.startsWith("0") ? `62${phone.slice(1)}` : phone;
    window.open(`https://wa.me/${normalizedPhone}`, "_blank");
  };

  return (
    <div className="pb-12 min-h-screen bg-background">
      {/* Sticky Top Header */}
      <div className="px-4 pt-6 pb-4 flex items-center gap-3 sticky top-0 bg-background/80 backdrop-blur-md z-20 border-b border-transparent">
        <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-border bg-card shadow-sm shrink-0">
          <Link to="/customers">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </Link>
        </Button>
        <h1 className="text-lg font-bold text-foreground truncate">Profil Pelanggan</h1>
      </div>

      <div className="px-4 space-y-6 mt-2">
        {/* Modern Profile Card */}
        <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm relative overflow-hidden group">
          {/* Subtle Background Accent */}
          <div className="absolute top-0 right-0 p-8 opacity-[0.04] scale-[4] rotate-12 pointer-events-none group-hover:scale-[4.5] transition-transform duration-700">
            <TrendingUp className="h-12 w-12 text-primary" />
          </div>
          
          <div className="flex flex-col items-center text-center relative z-10">
            <div className="h-24 w-24 rounded-3xl bg-primary flex items-center justify-center shadow-xl mb-5 transform group-hover:rotate-3 transition-transform">
              <span className="text-primary-foreground font-black text-4xl">
                {customer.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">{customer.name}</h2>
            <div className="flex items-center gap-1.5 mt-1.5 text-muted-foreground px-4 py-1.5 bg-muted/50 rounded-full">
              <Phone className="h-3.5 w-3.5" />
              <span className="text-xs font-bold tracking-wide">{customer.phone}</span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="mt-8 grid grid-cols-2 gap-4">
             <div className="rounded-2xl bg-primary/5 p-4 border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Pesanan</span>
                </div>
                <p className="text-3xl font-black text-foreground leading-none">{customer.totalOrders}</p>
             </div>
             <div className="rounded-2xl bg-primary/5 p-4 border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Wallet className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Belanja</span>
                </div>
                <p className="text-2xl font-black text-foreground leading-none">{formatRupiahCompact(customer.totalSpent)}</p>
             </div>
          </div>

          {/* Info Sections */}
          <div className="mt-6 pt-6 border-t border-border/60 space-y-4">
             <div className="flex items-start gap-4">
                <div className="mt-1 h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Alamat Pengiriman</p>
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
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Terdaftar Aktif</p>
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

        {/* Dynamic Order History */}
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
               <p className="text-sm font-bold text-muted-foreground">Belum ada aktivitas pesanan</p>
               <p className="text-xs text-muted-foreground/60 mt-1">Pesanan baru akan muncul di sini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customer.orders.map((order) => {
                const statusCfg = STATUS_CONFIG[order.status];
                return (
                  <div 
                    key={order.id}
                    className="rounded-[1.5rem] border border-border bg-card p-4 flex items-center gap-4 active:scale-[0.98] transition-all hover:border-primary/30"
                  >
                    <div className="h-12 w-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 shadow-sm">
                      <ShoppingBag className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-black text-foreground">
                          {order.type === "kiloan" ? "Cuci Kiloan" : "Cuci Satuan"}
                        </p>
                        <span className="text-sm font-black text-primary">
                          {formatRupiah(order.nominal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                         <p className="text-[11px] font-bold text-muted-foreground/70">
                            {formatDate(order.createdAt)}
                         </p>
                         <span className={[
                            "text-[10px] font-black px-2.5 py-1 rounded-full border tracking-wide uppercase",
                            statusCfg?.className
                         ].join(" ")}>
                            {statusCfg?.label ?? order.status}
                         </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
