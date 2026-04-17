import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { Suspense } from "react";
import type { TRPCRouter } from "#/integrations/trpc/router";
import { BottomNav } from "../components/BottomNav";
import { Skeleton } from "../components/ui/skeleton";
import { Toaster } from "../components/ui/sonner";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
	trpc: TRPCOptionsProxy<TRPCRouter>;
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover",
			},
			{
				name: "theme-color",
				content: "#f95d85",
			},
			{
				name: "description",
				content: "LaundryKu - Aplikasi CRM untuk bisnis laundry Anda",
			},
			{
				title: "LaundryKu - CRM Laundry",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
	component: RootComponent,
});

function PageFallback() {
	return (
		<div className="px-4 py-6 space-y-4">
			<Skeleton className="h-8 w-40" />
			<div className="grid grid-cols-2 gap-3">
				<Skeleton className="h-24 rounded-2xl" />
				<Skeleton className="h-24 rounded-2xl" />
			</div>
			<Skeleton className="h-12 w-48" />
			<div className="space-y-2">
				<Skeleton className="h-16 rounded-2xl" />
				<Skeleton className="h-16 rounded-2xl" />
				<Skeleton className="h-16 rounded-2xl" />
			</div>
		</div>
	);
}

function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
			<div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
				<span className="text-2xl">!</span>
			</div>
			<h2 className="text-lg font-bold text-foreground mb-1">
				Terjadi Kesalahan
			</h2>
			<p className="text-sm text-muted-foreground mb-4 max-w-[240px]">
				Maaf, ada yang tidak beres. Silakan coba lagi.
			</p>
			<button
				type="button"
				onClick={reset}
				className="h-11 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
			>
				Coba Lagi
			</button>
		</div>
	);
}

function RootComponent() {
	return (
		<Suspense fallback={<PageFallback />}>
			<Outlet />
		</Suspense>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="id" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<HeadContent />
			</head>
			<body className="font-sans antialiased bg-background text-foreground">
				<div className="relative mx-auto min-h-screen max-w-md shadow-2xl overflow-hidden bg-background">
					<main className="pb-20">{children}</main>
					<BottomNav />
				</div>
				<Toaster position="top-center" richColors closeButton />
				<Scripts />
			</body>
		</html>
	);
}
