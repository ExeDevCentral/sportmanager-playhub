import type { Metadata } from "next";
import { Geist, Geist_Mono, Oswald } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "SportManager/PlayHub · Gestión de centros deportivos",
    template: "%s · SportManager/PlayHub",
  },
  description:
    "Reservas online, pagos, calendario multi-espacio, CRM, históricos de Excel y analítica para tu centro deportivo: pádel, tenis, tenis de mesa, squash, fútbol, rugby, hockey, básquet, vóley, handball, natación, kayak, remo, atletismo, running, golf, funcional y más.",
  openGraph: {
    type: "website",
    locale: "es_AR",
    title: "SportManager/PlayHub · Gestión de centros deportivos",
    description:
      "Reservas online, pagos, calendario multi-espacio, CRM y analítica en tiempo real para tu centro deportivo.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SportManager/PlayHub · Gestión de centros deportivos",
    description:
      "Reservas online, pagos, calendario multi-espacio, CRM y analítica en tiempo real para tu centro deportivo.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
