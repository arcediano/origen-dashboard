/**
 * Layout raíz de la aplicación
 * @description Configura el layout base para todas las páginas
 */

import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { fetchSiteStatus } from "@/lib/maintenance-server";
import { MAINTENANCE_PATH } from "@/lib/maintenance";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700", "800"] });
// Petición del humano, 2026-11-05: se retira Cormorant Garamond de la identidad de marca
// (se veía cursiva/poco legible en títulos grandes). `--font-serif` ya no carga una
// tipografía aparte: en globals.css apunta a `var(--font-sans)` (o, si este app no la
// redefine, a la de @arcediano/ux-library tras su propia actualización), así que las
// clases `font-serif` existentes siguen funcionando sin tocarlas, solo que ahora
// renderizan con Plus Jakarta Sans.

export const metadata: Metadata = {
  title: "Origen - Panel de Vendedores",
  description: "Panel de administración para vendedores del marketplace Origen",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/origen-icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
    ],
    apple: [{ url: "/apple-touch-icon-180.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#215943",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Modo mantenimiento (fail-open: si /site-status falla, la app funciona normal).
  // El middleware pasa la ruta en x-pathname para evitar bucles:
  //   - modo activo y ruta != /mantenimiento → redirect a /mantenimiento
  //   - /mantenimiento con el modo desactivado (o /site-status caído) → redirect a /
  const siteStatus = await fetchSiteStatus();
  const pathname = (await headers()).get("x-pathname") ?? "";
  const onMaintenancePage = pathname === MAINTENANCE_PATH;
  const maintenanceMode = siteStatus?.maintenanceMode === true;

  if (maintenanceMode && !onMaintenancePage) redirect(MAINTENANCE_PATH);
  if (!maintenanceMode && onMaintenancePage) redirect("/");

  return (
    <html lang="es">
      <body className={`${plusJakartaSans.variable} font-sans`}>
        {/* /mantenimiento: sin Providers (no hay sesión que cargar) ni navegación del panel */}
        {onMaintenancePage ? children : <Providers>{children}</Providers>}
      </body>
    </html>
  );
}
