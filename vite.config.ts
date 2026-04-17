import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const config = defineConfig({
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		tailwindcss(),
		tanstackStart(),
		nitro(),
		viteReact(),
		VitePWA({
			// Manifest generation only — SW is built via post-build script
			// (TanStack Start sets ssr:true for both builds, breaking VitePWA's SW generation)
			registerType: "prompt",
			injectRegister: false,
			includeAssets: [
				"favicon.ico",
				"robots.txt",
				"logo192.png",
				"logo512.png",
			],
			manifest: {
				name: "LaundryKu - CRM Laundry",
				short_name: "LaundryKu",
				description: "Aplikasi CRM untuk bisnis laundry Anda",
				theme_color: "#f95d85",
				background_color: "#ffffff",
				display: "standalone",
				start_url: "/",
				scope: "/",
				icons: [
					{
						src: "favicon.ico",
						sizes: "64x64 32x32 24x24 16x16",
						type: "image/x-icon",
					},
					{
						src: "logo192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "logo512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "any maskable",
					},
				],
			},
			workbox: {
				// Ignored in TanStack Start prod builds — kept for dev mode only
				globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
			},
			devOptions: {
				enabled: false,
			},
		}),
	],
});

export default config;
