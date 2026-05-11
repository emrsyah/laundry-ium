import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Lock, Store, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { authClient } from "#/lib/auth-client";
import { haptic } from "#/lib/haptic";
import { getAuthSession } from "#/lib/server-fns";

export const Route = createFileRoute("/login")({
	beforeLoad: async () => {
		const session = await getAuthSession();
		if (session && session.session) {
			throw redirect({ to: "/" });
		}
	},
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	const [password, setPassword] = useState("");

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!password) {
			haptic("error");
			toast.error("Silakan isi PIN/Password");
			return;
		}

		setIsLoading(true);
		try {
			const { data, error } = await authClient.signIn.username({
				username: "erna",
				password,
			});

			if (error) {
				haptic("error");
				toast.error("Login gagal, periksa PIN");
			} else {
				haptic("success");
				toast.success("Berhasil Masuk");
				navigate({ to: "/" });
			}
		} catch (err) {
			toast.error("Terjadi kesalahan sistem");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex flex-col min-h-screen relative overflow-hidden bg-background p-4 pt-12 items-center justify-center">
			{/* Background Decor */}
			<div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-500/10 dark:bg-pink-500/20 blur-[100px] rounded-full pointer-events-none" />
			<div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />

			{/* Main Form container */}
			<div className="w-full max-w-sm z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-16">
				<div className="text-center mb-8 space-y-2">
					<div className="mx-auto bg-card p-4 rounded-3xl shadow-sm border mb-4 inline-flex items-center justify-center text-primary w-16 h-16 transform transition-transform hover:scale-105">
						<Store className="w-8 h-8" />
					</div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">
						LaundryKu
					</h1>
					<p className="text-muted-foreground text-sm">Aplikasi CRM Laundry</p>
				</div>

				<Card className="border shadow-lg bg-card/80 backdrop-blur-md rounded-3xl">
					<form onSubmit={handleLogin}>
						<CardHeader className="pb-2 pt-8 text-center">
							<CardTitle className="text-2xl font-bold">
								Halo Erna! 👋
							</CardTitle>
							<CardDescription className="text-sm mt-2">
								Masukkan PIN untuk mulai kasir.
							</CardDescription>
						</CardHeader>
						<CardContent className="pt-6 pb-8 px-6">
							<div className="relative py-2">
								<Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground z-10" />
								<Input
									id="login-password"
									type="password"
									placeholder="••••••"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className="pl-14 h-16 text-center text-2xl tracking-[0.3em] bg-background border-input rounded-2xl shadow-sm transition-all focus-visible:ring-2"
									autoComplete="current-password"
									required
								/>
							</div>
						</CardContent>
						<CardFooter className="px-6 pb-8">
							<Button
								type="submit"
								disabled={isLoading}
								className="w-full h-14 text-lg rounded-2xl font-bold shadow-md active:scale-[0.98] transition-transform"
							>
								{isLoading ? "Memproses..." : "Masuk"}
							</Button>
						</CardFooter>
					</form>
				</Card>
			</div>
		</div>
	);
}
