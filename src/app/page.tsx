import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/landing-page";

export const metadata: Metadata = {
  title: "El sistema operativo digital de tu centro deportivo",
  description:
    "SportManager/PlayHub centraliza reservas, pagos, clientes, equipo e históricos de Excel en una plataforma para operar tu centro deportivo: pádel, tenis, fútbol, natación y más.",
  openGraph: {
    title: "SportManager/PlayHub · Tu centro, en juego",
    description: "Reservas, pagos y operación de tu centro deportivo desde un solo lugar.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SportManager/PlayHub · Tu centro, en juego",
    description: "El sistema operativo digital de tu centro deportivo.",
  },
};

export default function Home() {
  return <LandingPage />;
}
