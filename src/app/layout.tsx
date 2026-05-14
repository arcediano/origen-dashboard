/**
 * Layout raíz de la aplicación
 * @description Configura el layout base para todas las páginas
 */

import type { Metadata } from "next";
import { Manrope, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
// ⚠️ TEMPORAL: eliminar cuando se use plan de pago en Render o UptimeRobot externo
import { DevKeepAlive } from "@/components/dev/DevKeepAlive";
import { Providers } from "@/components/providers/Providers";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700", "800"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-serif", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Origen - Panel de Vendedores",
  description: "Panel de administración para vendedores del marketplace Origen",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${manrope.variable} ${cormorant.variable} font-sans`}>
        <Providers>
          {children}
          {/* ⚠️ TEMPORAL — keep-alive para Render free tier. Eliminar al pasar a plan de pago. */}
          {process.env.NEXT_PUBLIC_DEV_KEEPALIVE === 'true' && <DevKeepAlive />}
        </Providers>
      </body>
    </html>
  );
}
