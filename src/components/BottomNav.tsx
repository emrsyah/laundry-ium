import { Home, ClipboardList, Users, PieChart, Settings } from "lucide-react"
import { Link, useLocation } from "@tanstack/react-router"

export function BottomNav() {
  const location = useLocation()
  
  const navItems = [
    { name: "Beranda", icon: Home, path: "/" },
    { name: "Pesanan", icon: ClipboardList, path: "/orders" },
    { name: "Pelanggan", icon: Users, path: "/customers" },
    { name: "Analitik", icon: PieChart, path: "/analytics" },
    { name: "Pengaturan", icon: Settings, path: "/settings" },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 bg-card border-t border-border/50 pb-safe max-w-md mx-auto px-2">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
        
        return (
          <Link
            key={item.name}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <item.icon className={`h-5 w-5 ${isActive ? "fill-primary/20 bg-primary/10 rounded-full p-1 h-8 w-8" : ""}`} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium tracking-wide">
              {item.name}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
