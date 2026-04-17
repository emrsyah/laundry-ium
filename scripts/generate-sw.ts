import { generateSW } from "workbox-build";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// TanStack Start outputs client assets here
const clientDist = resolve(__dirname, "../.output/public");

async function generateServiceWorker() {
  console.log("🔧 Generating service worker...");

  const { count, size, warnings } = await generateSW({
    swDest: resolve(clientDist, "sw.js"),
    globDirectory: clientDist,
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
    globIgnores: ["sw.js"],
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4MB
    runtimeCaching: [
      // Navigation requests: NetworkFirst for SSR pages
      {
        urlPattern: /\.(?:html|json)$/,
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-cache",
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
        },
      },
      // Static assets (JS, CSS, fonts): StaleWhileRevalidate
      {
        urlPattern: /\.(?:js|css|woff2)$/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-assets-v1",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      // Images: CacheFirst
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "images-v1",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
    ],
  });

  if (warnings.length > 0) {
    console.warn("⚠️  Warnings:", warnings.join("\n"));
  }

  console.log(
    `✅ Service worker generated: ${count} files precached (${(size / 1024).toFixed(1)} KB)`,
  );
}

generateServiceWorker().catch((error) => {
  console.error("❌ Failed to generate service worker:", error);
  process.exit(1);
});
