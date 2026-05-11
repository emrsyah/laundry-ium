import { Link, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BarChart3, ClipboardList, Home, Settings, Users } from "lucide-react";
import { haptic } from "#/lib/haptic";

const navItems = [
	{ name: "Beranda", icon: Home, path: "/" },
	{ name: "Pesanan", icon: ClipboardList, path: "/orders" },
	{ name: "Pelanggan", icon: Users, path: "/customers" },
	{ name: "Analitik", icon: BarChart3, path: "/analytics" },
	{ name: "Pengaturan", icon: Settings, path: "/settings" },
];

export function BottomNav() {
	const location = useLocation();

	if (location.pathname.startsWith("/track/")) {
		return null;
	}

	return (
		<nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-background/95 backdrop-blur-lg border-t border-border/60 pb-safe">
			<div className="flex items-center justify-around h-16">
				{navItems.map((item) => {
					const isActive =
						item.path === "/"
							? location.pathname === "/"
							: location.pathname.startsWith(item.path);

					return (
						<Link
							key={item.path}
							to={item.path}
							onClick={() => haptic("light")}
							className={[
								"relative flex flex-col items-center justify-center flex-1 h-full transition-colors touch-press",
								isActive
									? "text-primary"
									: "text-muted-foreground hover:text-foreground/80",
							].join(" ")}
						>
							{isActive && (
								<motion.div
									layoutId="nav-active-indicator"
									className="absolute top-0 left-3 right-3 h-0.5 rounded-full bg-primary"
									transition={{ type: "spring", stiffness: 400, damping: 30 }}
								/>
							)}
							<motion.div
								whileTap={{ scale: 0.93 }}
								className="flex flex-col items-center justify-center h-full w-full gap-0.5"
							>
								<div
									className={[
										"flex items-center justify-center rounded-xl transition-all duration-200",
										isActive ? "h-9 w-9 bg-primary/10" : "h-9 w-9",
									].join(" ")}
								>
									<item.icon
										className="h-5 w-5"
										strokeWidth={isActive ? 2.5 : 1.8}
									/>
								</div>
								<span className="text-[11px] font-medium leading-none">
									{item.name}
								</span>
							</motion.div>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
