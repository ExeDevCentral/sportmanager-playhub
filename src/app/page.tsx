import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/landing-page";

export const metadata: Metadata = {
  title: "El sistema operativo digital de tu complejo de pádel",
  description:
    "SportManager/PlayHub centraliza reservas, pagos, clientes, equipo e históricos de Excel en una plataforma para operar complejos de pádel.",
  openGraph: {
    title: "SportManager/PlayHub · Tu complejo, en juego",
    description: "Reservas, pagos y operación de tu complejo de pádel desde un solo lugar.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SportManager/PlayHub · Tu complejo, en juego",
    description: "El sistema operativo digital de tu complejo de pádel.",
  },
};

export default function Home() {
  return <LandingPage />;
}
