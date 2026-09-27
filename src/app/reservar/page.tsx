import type { Metadata } from "next";
import Link from "next/link";
import { getPublicBookingData, nextBookingDays } from "@/services/public";
import { ReservarClient } from "./reservar-client";

export const metadata: Metadata = {
  title: "Reservá tu turno",
};

export const dynamic = "force-dynamic";

export default async function ReservarPage() {
  const data = await getPublicBookingData(localToday());
  const days = nextBookingDays(data.maxAdvanceDays);
  return (
    <div className="min-h-svh bg-[#f2f7ee] text-[#1c2a22]">
      <header className="border-b border-emerald-900/10 bg-[#0d1713] text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5 text-lg font-bold tracking-tight">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#c9f36a] text-sm font-black text-[#0d1713] transition-transform group-hover:scale-105">S</span>
            <span>{data.complexName}</span>
          </Link>
          <nav className="flex items-center gap-2.5 text-xs sm:text-sm">
            <Link href="/" className="rounded-full px-3 py-1.5 text-white/70 transition-colors hover:text-white">
              ← Inicio
            </Link>
            <Link href="/login" className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20">
              Panel Admin Demo →
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <ReservarClient
          complexName={data.complexName}
          spaces={data.slots}
          promotions={data.promotions}
          slotDuration={data.slotDuration}
          requireOnlinePayment={data.requireOnlinePayment}
          days={days}
        />
      </main>
    </div>
  );
}

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}