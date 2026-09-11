"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Lock, MapPin, Snowflake, Sun, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPublicReservation, getSlotsForDate, type PublicBookingResult } from "@/lib/booking/actions";
import type { PromotionView, SpaceSlots, PublicSlot } from "@/services/public";
import { cn } from "@/lib/utils";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
}

export type Day = { date: string; weekday: string; day: string; month: string };

type ReservarClientProps = {
  complexName: string;
  spaces: SpaceSlots[];
  promotions: PromotionView[];
  slotDuration: number;
  requireOnlinePayment: boolean;
  days: Day[];
};

export function ReservarClient({ complexName, spaces, slotDuration, days }: ReservarClientProps) {
  const [slots, setSlots] = useState<SpaceSlots[]>(spaces);
  const [selectedDate, setSelectedDate] = useState(days[0]?.date ?? "");
  const [loadingDate, setLoadingDate] = useState(false);
  const [selected, setSelected] = useState<{ courtId: string; slot: PublicSlot } | null>(null);
  const [state, action, pending] = useActionState<PublicBookingResult | null, FormData>(createPublicReservation, null);
  const router = useRouter();

  const chosenSpace = selected ? slots.find((s) => s.id === selected.courtId) : null;

  async function pickDate(date: string) {
    setSelectedDate(date);
    setSelected(null);
    setLoadingDate(true);
    try {
      setSlots(await getSlotsForDate(date));
    } catch {
      toast.error("No pudimos actualizar los turnos");
    } finally {
      setLoadingDate(false);
    }
  }

  if (state?.ok) {
    return (
      <BookingSuccess
        result={state}
        onReset={() => {
          setSelected(null);
          window.scrollTo({ top: 0, behavior: "smooth" });
          router.replace("/reservar");
        }}
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div>
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/70">SportManager/PlayHub</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-[#0d1713]">Reservá tu turno en {complexName}</h1>
          <p className="mt-2 text-sm text-emerald-900/60">
            Elegí el día, el espacio y el horario. La confirmación te llega por email.
          </p>
        </div>

        <label className="mb-2 block text-sm font-medium text-emerald-900/70">Elegí el día</label>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {days.map((d) => (
            <button
              key={d.date}
              type="button"
              onClick={() => pickDate(d.date)}
              className={cn(
                "flex min-w-16 flex-col items-center rounded-xl border px-3 py-2 transition-colors",
                selectedDate === d.date
                  ? "border-emerald-700 bg-[#0d1713] text-white"
                  : "border-emerald-900/10 bg-white text-[#1c2a22] hover:border-emerald-700/40"
              )}
            >
              <span className="text-[10px] font-medium uppercase tracking-wide opacity-60">{d.weekday}</span>
              <span className="text-lg font-bold">{d.day}</span>
              <span className="text-[10px] opacity-60">{d.month}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm font-semibold text-emerald-900/80">
            {loadingDate ? "Cargando turnos…" : `Turnos de ${slotDuration} min`}
          </p>
          {loadingDate && <Loader2 className="size-4 animate-spin text-emerald-700" />}
        </div>

        <div className="mt-3 grid gap-4">
          {slots.map((s) => (
            <article key={s.id} className="rounded-2xl border border-emerald-900/10 bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-[#0d1713]">{s.name}</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                  {s.surface ?? "Superficie estándar"}
                </span>
                {s.is_indoor ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-800">
                    <Snowflake className="size-3" /> Techada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                    <Sun className="size-3" /> Aire libre
                  </span>
                )}
                {s.has_lighting ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-800">
                    <Zap className="size-3" /> Con luces
                  </span>
                ) : null}
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {s.slots.map((slot) => {
                  const isSelected = selected?.courtId === s.id && selected.slot.starts_at === slot.starts_at;
                  return (
                    <button
                      key={slot.starts_at}
                      type="button"
                      disabled={!slot.is_available || loadingDate}
                      onClick={() => setSelected({ courtId: s.id, slot })}
                      className={cn(
                        "flex flex-col items-start rounded-xl border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                        isSelected
                          ? "border-emerald-700 bg-emerald-700 text-white"
                          : slot.is_available
                            ? "border-emerald-600/25 bg-emerald-50/60 hover:border-emerald-700/50"
                            : "border-emerald-900/5 bg-emerald-900/[0.03] opacity-50"
                      )}
                    >
                      <span className={cn("text-sm font-bold", isSelected ? "text-white" : "text-[#0d1713]")}>
                        {slot.starts_at.slice(11, 16)}
                      </span>
                      <span className={cn("text-[12px]", isSelected ? "text-white/80" : "text-emerald-900/60")}>
                        {slot.is_available ? (
                          <>
                            {slot.promo_label && slot.price < slot.original_price ? (
                              <>
                                <s className="mr-1 text-emerald-900/40">{formatPrice(slot.original_price)}</s>
                                {formatPrice(slot.price)}
                              </>
                            ) : (
                              formatPrice(slot.price)
                            )}
                          </>
                        ) : (
                          "Ocupado"
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border border-emerald-900/10 bg-white p-5">
          {chosenSpace && selected ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/70">Tu turno</p>
              <h3 className="mt-1 text-xl font-bold text-[#0d1713]">{chosenSpace.name}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-emerald-900/70">
                <MapPin className="size-4" />
                {selectedDateLabel()} · {selected.slot.starts_at.slice(11, 16)}–{selected.slot.ends_at.slice(11, 16)}
              </p>
              <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm">
                <div className="flex items-baseline justify-between">
                  <span className="text-emerald-900/70">Precio</span>
                  <span className="font-bold text-[#0d1713]">{formatPrice(selected.slot.price)}</span>
                </div>
                {selected.slot.promo_label && selected.slot.price < selected.slot.original_price ? (
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-emerald-900/70">Precio original</span>
                    <s className="text-emerald-900/50">{formatPrice(selected.slot.original_price)}</s>
                  </div>
                ) : null}
                {selected.slot.promo_label ? (
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2 py-0.5 text-[11px] font-medium text-white">
                    <Zap className="size-3" /> {selected.slot.promo_label}
                  </p>
                ) : null}
              </div>

              <form action={action} className="mt-4 grid gap-3">
                <input type="hidden" name="court_id" value={selected.courtId} />
                <input type="hidden" name="starts_at" value={selected.slot.starts_at} />
                {state && !state.ok && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {state.error}
                  </p>
                )}
                <div className="grid gap-1.5">
                  <Label htmlFor="pk-name">Nombre completo</Label>
                  <Input id="pk-name" name="customer_name" placeholder="Ej: Martina Lago" required autoComplete="name" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="pk-email">Email</Label>
                  <Input id="pk-email" name="email" type="email" placeholder="tu@email.com" required autoComplete="email" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="pk-phone">Teléfono</Label>
                  <Input id="pk-phone" name="phone" type="tel" placeholder="Ej: 11 5555 1234" required autoComplete="tel" />
                </div>
                <SubmitButton pending={pending} />
                <p className="flex items-center gap-1.5 text-[11px] text-emerald-900/50">
                  <Lock className="size-3" />
                  La confirmación de pago se coordina por email o WhatsApp.
                </p>
              </form>
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-emerald-900/60">Todavía no elegiste turno</p>
              <p className="mt-1 text-sm text-emerald-900/40">Seleccioná un horario libre de la izquierda para continuar.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );

  function selectedDateLabel(): string {
    const d = new Date(`${selectedDate}T12:00:00`);
    return d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
  }
}

function SubmitButton({ pending }: { pending: boolean }) {
  const { pending: parentPending } = useFormStatus();
  const busy = pending || parentPending;
  return (
    <Button type="submit" disabled={busy} className="w-full">
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
      {busy ? "Reservando…" : "Confirmar reserva"}
    </Button>
  );
}

function BookingSuccess({ result, onReset }: { result: Extract<PublicBookingResult, { ok: true }>; onReset: () => void }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-emerald-900/10 bg-white p-8 text-center">
      <CheckCircle2 className="mx-auto size-14 text-emerald-600" />
      <h2 className="mt-4 text-2xl font-bold text-[#0d1713]">¡Turno solicitado!</h2>
      <p className="mt-1 text-sm text-emerald-900/60">Tu referencia es {result.reference}</p>
      <div className="mt-6 grid gap-2 rounded-xl bg-emerald-50 p-4 text-left text-sm">
        <Row label="Espacio" value={result.court} />
        <Row label="Fecha" value={result.date} />
        <Row label="Hora" value={`${result.time} hs`} />
        <Row label="Precio" value={formatPrice(result.price)} />
        <Row
          label="Estado"
          value={result.status === "confirmed" ? "Confirmado" : "A confirmar tras el pago"}
        />
        <Row label="Email" value={result.email} />
      </div>
      <p className="mt-4 text-sm text-emerald-900/60">
        {result.emailed
          ? `Te enviamos la confirmación a ${result.email}.`
          : "Estamos confirmando tu turno; te avisamos por email o WhatsApp."}
      </p>
      <Button onClick={onReset} className="mt-6">
        Reservar otro turno
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-emerald-900/60">{label}</span>
      <span className="font-semibold text-[#0d1713]">{value}</span>
    </div>
  );
}