"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  CloudUpload,
  CreditCard,
  Database,
  FileSpreadsheet,
  Menu,
  MessageCircle,
  MoveUpRight,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Volleyball,
  X,
} from "lucide-react";

const courts = [
  { name: "Cancha 01", time: "18:00", status: "Libre", tone: "free" },
  { name: "Cancha 02", time: "18:00", status: "Reservada", tone: "booked" },
  { name: "Cancha 03", time: "19:30", status: "Reservada", tone: "booked" },
  { name: "Cancha 04", time: "20:00", status: "Libre", tone: "free" },
];

const dashboardRows = [
  { court: "Cancha 01", customer: "Sofía Castro", time: "18:00", status: "Confirmada", color: "bg-emerald-400" },
  { court: "Cancha 02", customer: "Juan Pérez", time: "18:30", status: "Pendiente", color: "bg-amber-400" },
  { court: "Cancha 03", customer: "Lucía Fernández", time: "19:00", status: "Confirmada", color: "bg-sky-400" },
];

const counterTarget = { operations: 1, hours: 24, doubleBookings: 0, revenue: 412850, reservations: 184, occupancy: 78 };

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(0);
  const [assistantMessages, setAssistantMessages] = useState([
    { role: "customer", text: "¿Hay una cancha disponible a las 21?" },
    { role: "ai", text: "Sí. La Cancha 03 está libre de 21:00 a 22:30." },
  ]);
  const [typing, setTyping] = useState<string | null>(null);

  const addAssistantMessage = () => {
    if (assistantMessages.length > 2) return;
    setTyping("Reservala.");
    setTimeout(() => {
      setTyping(null);
      setAssistantMessages((messages) => [
        ...messages,
        { role: "customer", text: "Reservala." },
      ]);
      setTimeout(() => {
        setTyping("Perfecto. Te llevo al pago.");
        setTimeout(() => {
          setTyping(null);
          setAssistantMessages((messages) => [
            ...messages,
            { role: "ai", text: "Perfecto. Te llevo al pago." },
          ]);
        }, 1200);
      }, 400);
    }, 900);
  };

  return (
    <div className="marketing-page min-h-svh overflow-x-hidden bg-[#f4f5f1] text-[#14221d]">
      <header className="marketing-nav fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0d1713]/80 text-white backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="group flex items-center gap-3" aria-label="SportManager/PlayHub inicio">
            <span className="relative flex size-9 items-center justify-center overflow-hidden rounded-[12px] bg-[#c9f36a] text-[#102016] shadow-[0_0_26px_rgba(201,243,106,0.25)] transition-transform group-hover:rotate-[-6deg]">
              <Volleyball className="size-5" strokeWidth={2.5} />
            </span>
            <span className="text-[17px] font-semibold tracking-[-0.04em]">SportManager<span className="text-[#c9f36a]">/PlayHub</span></span>
          </Link>

          <nav className="hidden items-center gap-8 text-[13px] text-white/60 lg:flex" aria-label="Principal">
            <a href="#producto" className="transition-colors hover:text-white">Producto</a>
            <a href="#funciones" className="transition-colors hover:text-white">Funciones</a>
            <a href="#como-funciona" className="transition-colors hover:text-white">Cómo funciona</a>
            <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link href="/login" className="rounded-full px-4 py-2 text-[13px] font-medium text-white/70 transition-colors hover:text-white">Iniciar sesión</Link>
            <a href="#demo" className="marketing-btn-primary group inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px]">
              Probar plataforma <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          <button type="button" className="marketing-btn-secondary flex size-11 items-center justify-center rounded-full sm:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen}>
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-white/10 bg-[#0d1713]/95 px-5 py-5 backdrop-blur-xl sm:hidden">
            <nav className="grid gap-4 text-sm text-white/75" aria-label="Menú móvil">
              <a href="#producto" onClick={() => setMenuOpen(false)}>Producto</a>
              <a href="#funciones" onClick={() => setMenuOpen(false)}>Funciones</a>
              <a href="#como-funciona" onClick={() => setMenuOpen(false)}>Cómo funciona</a>
              <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
              <a href="#demo" onClick={() => setMenuOpen(false)} className="marketing-btn-primary mt-2 inline-flex w-fit items-center gap-2 rounded-full px-4 py-2.5 text-[13px]">Probar plataforma <ArrowRight className="size-4" /></a>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section id="producto" className="marketing-hero relative isolate bg-[#0d1713] px-5 pb-24 pt-36 text-white sm:px-8 sm:pt-44 lg:pb-32">
          <PaddleMatch />
          <div className="marketing-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="marketing-particles" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, i) => <span key={i} />)}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(201,243,106,.08),transparent_45%)]" />
          <div className="marketing-court pointer-events-none absolute -left-32 top-1/2 hidden h-[640px] w-[1100px] -translate-y-1/2 -rotate-12 opacity-[0.12] lg:block" />
          <div className="marketing-court pointer-events-none absolute -right-40 bottom-0 hidden h-[420px] w-[720px] rotate-6 opacity-[0.10] lg:block" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
            <div className="max-w-xl">
              <div className="marketing-reveal mb-7 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/35 bg-[#d4af37]/[0.08] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#ead89b]">
                <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#d4af37] opacity-50" /><span className="relative inline-flex size-2 rounded-full bg-[#d4af37]" /></span>
                Operación en tiempo real
              </div>
              <h1 className="marketing-reveal marketing-delay-1 max-w-2xl text-[clamp(3.2rem,7vw,6.5rem)] font-semibold leading-[0.92] tracking-[-0.075em]">
                Tu complejo, <span className="bg-gradient-to-r from-[#d4af37] via-[#c9f36a] to-[#9ed04f] bg-clip-text text-transparent">en juego.</span>
              </h1>
              <p className="marketing-reveal marketing-delay-2 mt-7 max-w-lg text-base leading-7 text-white/55 sm:text-lg">
                Reservas, pagos, clientes y equipo. SportManager convierte el caos de WhatsApp y Excel en un centro de operaciones que trabaja con vos.
              </p>
              <div className="marketing-reveal marketing-delay-3 mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/reservar" className="marketing-btn-primary marketing-btn-glow group inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-6 text-sm">
                  Reservá tu turno <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="#demo" className="marketing-btn-secondary group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium">
                  Ver cómo funciona <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </a>
                <Link href="/login" className="marketing-btn-secondary group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium">
                  Iniciar sesión <MoveUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
              <div className="marketing-reveal marketing-delay-4 mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/40">
                <span className="flex items-center gap-2"><Database className="size-4 text-[#c9f36a]" /> Base de datos propia</span>
                <span className="flex items-center gap-2"><Smartphone className="size-4 text-[#c9f36a]" /> Funciona en celular y tablet</span>
                <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#c9f36a]" /> Datos protegidos</span>
              </div>
            </div>

            <div id="demo" className="marketing-reveal marketing-delay-2 marketing-float relative lg:pl-5">
              <div className="marketing-orbit pointer-events-none absolute -left-8 top-1/2 hidden size-4 rounded-full bg-[#c9f36a] shadow-[0_0_20px_#c9f36a] lg:block" />
              <div className="marketing-orbit pointer-events-none absolute -right-4 top-1/3 hidden size-3 rounded-full bg-white/30 shadow-[0_0_16px_rgba(255,255,255,.4)] lg:block" style={{ animationDuration: "28s", animationDirection: "reverse" }} />
              <HeroDashboard />
            </div>
          </div>
          <div className="relative mx-auto mt-20 grid max-w-7xl grid-cols-1 gap-6 border-t border-white/10 pt-7 sm:grid-cols-3">
            <div className="flex items-baseline gap-3"><AnimatedCounter value={counterTarget.operations} suffix="" className="marketing-counter text-2xl font-semibold tracking-[-0.02em] text-white" /><span className="text-xs uppercase tracking-[0.15em] text-white/35">centro de operación</span></div>
            <div className="flex items-baseline gap-3"><span className="marketing-counter text-2xl font-semibold tracking-[-0.02em] text-white">24/7</span><span className="text-xs uppercase tracking-[0.15em] text-white/35">visibilidad del negocio</span></div>
            <div className="flex items-baseline gap-3"><AnimatedCounter value={counterTarget.doubleBookings} suffix="" className="marketing-counter text-2xl font-semibold tracking-[-0.02em] text-white" /><span className="text-xs uppercase tracking-[0.15em] text-white/35">dobles reservas</span></div>
          </div>
        </section>

        <section className="bg-[#f4f5f1] px-5 py-20 sm:px-8 sm:py-28">
          <Reveal className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#58705a]">El problema real</p>
              <h2 className="max-w-md text-4xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-5xl">Cuando el complejo crece, el método de siempre se rompe.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[{ icon: MessageCircle, label: "WhatsApp", text: "mensajes perdidos" }, { icon: FileSpreadsheet, label: "Excel", text: "versiones distintas" }, { icon: CreditCard, label: "Pagos", text: "conciliación manual" }, { icon: Bell, label: "Llamadas", text: "interrupciones constantes" }].map(({ icon: Icon, label, text }) => (
                <div key={label} className="marketing-card-hover marketing-border-glow relative overflow-hidden rounded-2xl border border-[#d9ddd3] bg-white/80 p-5 pt-7">
                  <StrokeEdge color="#7aa04a" />
                  <Icon className="mb-8 size-5 text-[#8b9690]" />
                  <p className="marketing-label text-base font-semibold">{label}</p><p className="mt-1 text-sm text-[#758079]">{text}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <div className="mt-12"><StrokeDivider label="Una sola operación. Menos ruido." /></div>
        </section>

        <section id="funciones" className="bg-[#e8f0e4] px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <Reveal><div className="max-w-2xl"><p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#58705a]">Una plataforma, cada movimiento</p><h2 className="text-4xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-6xl">Del primer turno a la última métrica.</h2></div></Reveal>
            <div className="mt-14 grid gap-5 lg:grid-cols-12">
              <Reveal className="lg:col-span-7"><FeaturePanel eyebrow="01 / Reservas" title="Una vista clara de cada cancha." description="Disponibilidad, horarios y estados en una grilla que tu equipo entiende en segundos." tone="dark"><BookingGrid /></FeaturePanel></Reveal>
              <Reveal className="lg:col-span-5" delay><FeaturePanel eyebrow="02 / Pagos" title="Cada peso, en su lugar." description="Señas, saldos y Mercado Pago. El cliente recibe la confirmación por email o WhatsApp, según su preferencia." tone="lime"><RevenueCard /></FeaturePanel></Reveal>
              <Reveal className="lg:col-span-5" delay><FeaturePanel eyebrow="03 / Clientes" title="Conocé a quienes vuelven." description="Historial, frecuencia y preferencias para atender mejor." tone="light"><CustomerStack /></FeaturePanel></Reveal>
              <Reveal className="lg:col-span-7"><FeaturePanel eyebrow="04 / Equipo" title="Todos alineados, incluso cuando vos no estás." description="Roles, actividad y una operación que no depende de una sola persona." tone="dark"><TeamActivity /></FeaturePanel></Reveal>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="relative overflow-hidden bg-[#0d1713] px-5 py-20 text-white sm:px-8 sm:py-28">
          <div className="relative mb-16"><StrokeDivider tone="dark" /></div>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(201,243,106,.07),transparent_40%),radial-gradient(circle_at_90%_10%,rgba(255,255,255,.04),transparent_35%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <Reveal><div><p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#c9f36a]">La experiencia del jugador</p><h2 className="max-w-lg text-4xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-6xl">Reservar tiene que sentirse así de simple.</h2><p className="mt-6 max-w-md leading-7 text-white/55">Un flujo limpio para tus clientes. Menos fricción para reservar, más ocupación para tu complejo.</p><a href="#booking-demo" className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#c9f36a]">Probar demo interactiva <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></a></div></Reveal>
            <Reveal delay><BookingDemo step={bookingStep} setStep={setBookingStep} /></Reveal>
          </div>
        </section>

        <section className="bg-[#f4f5f1] px-5 py-20 sm:px-8 sm:py-28">
          <div className="mb-16"><StrokeDivider label="Históricos en un click." /></div>
          <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.85fr] lg:items-center">
            <div className="order-2 lg:order-1"><Parallax speed={0.08}><ImportFlow /></Parallax></div>
            <Reveal className="order-1 lg:order-2"><div><p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#58705a]">Históricos sin miedo</p><h2 className="max-w-xl text-4xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-6xl">Tu Excel también puede jugar a favor.</h2><p className="mt-6 max-w-lg leading-7 text-[#66736b]">Subí años de información. SportManager detecta columnas, valida datos y evita duplicados antes de tocar tu operación.</p><div className="mt-8 grid gap-3 text-sm text-[#40534a] sm:grid-cols-2"><span className="flex items-center gap-2"><Check className="size-4 text-[#6b9d3a]" /> Mapeo inteligente</span><span className="flex items-center gap-2"><Check className="size-4 text-[#6b9d3a]" /> Validación previa</span><span className="flex items-center gap-2"><Check className="size-4 text-[#6b9d3a]" /> Detección de duplicados</span><span className="flex items-center gap-2"><Check className="size-4 text-[#6b9d3a]" /> Importación segura</span></div></div></Reveal>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#d8ee98] px-5 py-20 sm:px-8 sm:py-28">
          <div className="relative mb-16"><StrokeDivider tone="lime" /></div>
          <div className="marketing-court absolute -right-20 top-1/2 h-[500px] w-[850px] -translate-y-1/2 rotate-12 opacity-40" />
          <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <Reveal><div><p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#46631f]">Atención automática</p><h2 className="max-w-xl text-4xl font-semibold leading-[0.98] tracking-[-0.06em] text-[#1b2b15] sm:text-6xl">Tu complejo no duerme cuando vos te vas.</h2><p className="mt-6 max-w-md leading-7 text-[#486035]">Un asistente que responde, encuentra disponibilidad y guía al jugador hasta el pago.</p></div></Reveal>
            <Reveal delay><AssistantDemo messages={assistantMessages} typing={typing} onContinue={addAssistantMessage} /></Reveal>
          </div>
        </section>

        <section className="bg-[#f4f5f1] px-5 py-20 sm:px-8 sm:py-28">
          <div className="mb-16"><StrokeDivider /></div>
          <div className="mx-auto max-w-7xl">
            <Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div><p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#58705a]">Vista del operador</p><h2 className="max-w-2xl text-4xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-6xl">Todo lo importante, antes de que se vuelva urgente.</h2></div>
              <span className="flex items-center gap-2 text-xs text-[#60736a]"><span className="size-2 rounded-full bg-[#70aa42]" /> Datos de demo en vivo</span>
            </Reveal>
            <Parallax speed={0.04}><DashboardPreview /></Parallax>
          </div>
        </section>

        <section id="faq" className="bg-white px-5 py-20 sm:px-8 sm:py-28">
          <div className="mb-16"><StrokeDivider label="Preguntas, respuestas." /></div>
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.7fr_1.3fr]">
            <Reveal><div><p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#58705a]">Preguntas frecuentes</p><h2 className="text-4xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-5xl">Menos dudas.<br />Más operación.</h2></div></Reveal>
            <Reveal delay><div className="divide-y divide-[#e0e4dd]">{[{ q: "¿SportManager sirve para más de una sede?", a: "Sí. La arquitectura es multi-complejo y separa equipos, canchas, clientes y métricas por sede." }, { q: "¿Qué pasa con mis históricos de Excel?", a: "Los subís desde el importador: se detectan hojas, se mapean columnas y se validan duplicados antes de importar." }, { q: "¿Cómo se confirman los pagos?", a: "Mercado Pago confirma mediante webhook. La reserva nunca se marca como pagada por una acción del frontend." }, { q: "¿El cliente puede elegir email o WhatsApp?", a: "Sí. Cada cliente tiene un canal preferido. Cuando el pago se aprueba, la confirmación se envía por ese canal automáticamente." }, { q: "¿Dónde quedan guardados mis datos?", a: "En tu base de datos propia, moderna y siempre disponible. Trabaja en segundo plano de forma continua y la manejás directo desde el dashboard, con acceso para tu equipo, desde la computadora, el celular o la tablet." }].map((item) => <details key={item.q} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium tracking-[-0.02em] transition-colors hover:text-[#3a5d42]"><span>{item.q}</span><ChevronDown className="size-5 shrink-0 text-[#738078] transition-transform group-open:rotate-180" /></summary><p className="max-w-2xl pt-3 text-sm leading-6 text-[#6d7972]">{item.a}</p></details>)}</div></Reveal>
          </div>
        </section>

        <section className="bg-[#0d1713] px-5 py-20 text-white sm:px-8 sm:py-28">
          <Reveal className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_80%_0%,rgba(201,243,106,0.18),transparent_34%),#13221a] px-6 py-14 pt-16 text-center shadow-[0_30px_90px_rgba(0,0,0,0.25)] sm:px-12 sm:py-20 sm:pt-24">
              <StrokeEdge color="#c9f36a" />
              <Sparkles className="mx-auto mb-6 size-6 text-[#c9f36a]" />
              <h2 className="mx-auto max-w-3xl text-4xl font-semibold leading-[0.98] tracking-[-0.07em] sm:text-6xl">Operá tu complejo como si ya fuera el próximo.</h2>
              <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/55">La cancha es tu negocio. SportManager es la forma de hacerlo crecer sin perder el control.</p>
              <a href="#demo" className="marketing-btn-primary marketing-btn-glow mt-9 inline-flex min-h-12 items-center gap-3 rounded-full px-6 text-sm">Ver la plataforma <ArrowRight className="size-4" /></a>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#0d1713] px-5 py-8 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 text-xs text-white/45 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm font-semibold text-white"><span className="flex size-7 items-center justify-center rounded-lg bg-[#c9f36a] text-[#102016]"><Volleyball className="size-4" /></span>SportManager<span className="text-[#c9f36a]">/PlayHub</span></div>
          <p>El sistema operativo digital de tu centro deportivo.</p>
          <p>© 2026 SportManager · PlayHub</p>
        </div>
      </footer>
    </div>
  );
}

function AnimatedCounter({ value, suffix = "", prefix = "", className }: { value: number; suffix?: string; prefix?: string; className?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      if (!entry.isIntersecting) return;
      const duration = 1400;
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setDisplay(Math.floor(eased * value));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);
  return <span ref={ref} className={className}>{prefix}{display.toLocaleString("es-AR")}{suffix}</span>;
}

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) setTriggered(true);
    }, { threshold: 0.08, rootMargin: "0px 0px 60px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, triggered };
}

function Reveal({ children, className, delay = false }: { children: React.ReactNode; className?: string; delay?: boolean }) {
  const { ref, triggered } = useReveal();
  return <div ref={ref} className={`${className ?? ""} ${delay ? "marketing-section-reveal marketing-delay-2" : "marketing-section-reveal"} ${triggered ? "marketing-in-view" : ""}`}>{children}</div>;
}

function Parallax({ children, speed = 0.05 }: { children: React.ReactNode; speed?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const y = (window.innerHeight - rect.top) * speed;
      ref.current.style.transform = `translateY(${y}px)`;
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, [speed]);
  return <div ref={ref} className="marketing-parallax will-change-transform">{children}</div>;
}

function useStrokeReplay() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("drawn");
      return;
    }
    const play = () => {
      el.classList.remove("drawn");
      void el.offsetWidth;
      el.classList.add("drawn");
    };
    const stop = () => el.classList.remove("drawn");
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      if (entry.isIntersecting) play();
      else stop();
    }, { threshold: 0.35 });
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);
  return ref;
}

function StrokeLine({ reverse = false, color = "currentColor" }: { reverse?: boolean; color?: string }) {
  return (
    <div className="relative h-[10px] min-w-0 flex-1 overflow-visible" style={{ color }}>
      <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="absolute inset-x-0 top-1/2 h-[4px] w-full -translate-y-1/2">
        <line
          x1={reverse ? "100" : "0"}
          y1="2"
          x2={reverse ? "0" : "100"}
          y2="2"
          pathLength="1"
          className="marketing-stroke-line"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <span className={`marketing-comet ${reverse ? "reverse" : ""}`} />
    </div>
  );
}

function StrokeDivider({ label, tone = "light" }: { label?: string; tone?: "light" | "dark" | "lime" }) {
  const ref = useStrokeReplay();
  const color = tone === "dark" ? "#c9f36a" : tone === "lime" ? "#3d5c1c" : "#7aa04a";
  const text = tone === "dark" ? "text-[#c9f36a]/80" : tone === "lime" ? "text-[#3d5c1c]" : "text-[#54705b]";
  return (
    <div ref={ref} className="marketing-stroke mx-auto flex max-w-7xl items-center gap-4 px-5 sm:px-8">
      <StrokeLine reverse color={color} />
      {label ? (
        <span className={`marketing-stroke-label shrink-0 text-sm font-medium ${text}`}>
          {label}
        </span>
      ) : null}
      <StrokeLine color={color} />
    </div>
  );
}

function StrokeEdge({ color = "#c9f36a" }: { color?: string }) {
  const ref = useStrokeReplay();
  return (
    <div ref={ref} className="marketing-stroke pointer-events-none absolute inset-x-4 top-0 h-[10px] overflow-visible" style={{ color }} aria-hidden="true">
      <svg viewBox="0 0 100 4" preserveAspectRatio="none" className="absolute inset-x-0 top-3 h-[4px] w-full">
        <line x1="0" y1="2" x2="100" y2="2" pathLength="1" className="marketing-stroke-line" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="marketing-comet" style={{ top: "14px" }} />
    </div>
  );
}

function PremiumRacket({ side }: { side: "left" | "right" }) {
  return (
    <svg viewBox="0 0 220 420" fill="none" className="h-full w-full">
      <defs>
        <linearGradient id={`frame-${side}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2f3a31" />
          <stop offset="50%" stopColor="#151b17" />
          <stop offset="100%" stopColor="#0a0e0b" />
        </linearGradient>
        <linearGradient id={`limeEdge-${side}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c9f36a" stopOpacity="0.08" />
          <stop offset="50%" stopColor="#c9f36a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#c9f36a" stopOpacity="0.08" />
        </linearGradient>
        <radialGradient id={`gloss-${side}`} cx="0.3" cy="0.2" r="0.75">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <pattern id={`carbon-${side}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#141a16" />
          <path d="M0 8L8 0M-1 1L1 -1M7 9L9 7" stroke="#1f2923" strokeWidth="0.8" />
        </pattern>
        <filter id={`shadow-${side}`} x="-50%" y="-20%" width="200%" height="150%">
          <feDropShadow dx="0" dy="18" stdDeviation="24" floodColor="#000000" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Grip */}
      <path
        d="M96 268 L92 388 C91 400 100 408 110 408 C120 408 129 400 128 388 L124 268 Z"
        fill="#0f1411"
        stroke="#252f29"
        strokeWidth="1.5"
      />
      {/* Grip tape lines */}
      {Array.from({ length: 5 }).map((_, i) => (
        <line
          key={i}
          x1={94 + i * 0.5}
          y1={290 + i * 20}
          x2={126 - i * 0.5}
          y2={290 + i * 20}
          stroke="#2a352d"
          strokeWidth="1.2"
          opacity="0.55"
        />
      ))}
      {/* Grip cap */}
      <ellipse cx="110" cy="400" rx="19" ry="6" fill="#090c0a" stroke="#2f3b33" strokeWidth="1" />

      {/* Throat */}
      <path
        d="M74 175 C66 210 84 255 96 268 L124 268 C136 255 154 210 146 175 L130 155 L90 155 Z"
        fill={`url(#frame-${side})`}
        stroke="#25302a"
        strokeWidth="1"
      />

      {/* Main frame / head */}
      <path
        d="M110 20 C55 20 28 72 28 128 C28 188 58 224 110 224 C162 224 192 188 192 128 C192 72 165 20 110 20 Z"
        fill={`url(#frame-${side})`}
        stroke={`url(#limeEdge-${side})`}
        strokeWidth="2.5"
        filter={`url(#shadow-${side})`}
      />

      {/* Face inset */}
      <path
        d="M110 38 C68 38 46 80 46 128 C46 180 68 208 110 208 C152 208 174 180 174 128 C174 80 152 38 110 38 Z"
        fill={`url(#carbon-${side})`}
        stroke="#1d2721"
        strokeWidth="1"
      />
      <path
        d="M110 38 C68 38 46 80 46 128 C46 180 68 208 110 208 C152 208 174 180 174 128 C174 80 152 38 110 38 Z"
        fill={`url(#gloss-${side})`}
        opacity="0.5"
        style={{ mixBlendMode: "screen" }}
      />

      {/* Minimal holes pattern */}
      {[
        [78, 72], [110, 64], [142, 72],
        [66, 104], [94, 100], [126, 100], [154, 104],
        [78, 136], [110, 132], [142, 136],
        [94, 168], [126, 168],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3.5" fill="#0a100c" opacity="0.75" />
      ))}

      {/* Subtle top accent */}
      <path d="M85 24 C85 24 110 18 135 24" stroke="#c9f36a" strokeWidth="1.5" strokeLinecap="round" opacity="0.22" />
    </svg>
  );
}

function playBallHit() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const t = ctx.currentTime;

    // Synthetic paddle-ball "pop": short noise burst + freq-drop ping
    const bufferSize = ctx.sampleRate * 0.08;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-8 * i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    noise.connect(noiseGain).connect(ctx.destination);
    noise.start(t);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.07);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.22, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(oscGain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  } catch {
    // ignore audio errors
  }
}

function PaddleMatch() {
  const ballRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const lastHitRef = useRef<"left" | "right" | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const ballStateRef = useRef<{ x: number; y: number; rotate: number }>({ x: 0, y: 0, rotate: 0 });
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    sectionRef.current = document.getElementById("producto");
    if (!sectionRef.current || !ballRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (!inside) {
        mouseRef.current.active = false;
        return;
      }
      mouseRef.current.active = true;
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      if (!sectionRef.current || !ballRef.current) return;
      if (e.target instanceof Element && e.target.closest("a,button,input,select,textarea")) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (!inside) return;

      // Hit nearest racket based on click position
      const centerX = rect.width / 2;
      const side: "left" | "right" = e.clientX - rect.left < centerX ? "left" : "right";
      const target = side === "left" ? leftRef.current : rightRef.current;
      if (target) {
        target.classList.remove("hit");
        void target.offsetWidth;
        target.classList.add("hit");
      }
      playBallHit();
    };

    const loop = () => {
      if (!ballRef.current || !sectionRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const rect = sectionRef.current.getBoundingClientRect();
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? window.scrollY / docHeight : 0;

      // Scroll-driven base position (in px relative to center)
      const normalized = progress * 8 * Math.PI;
      const baseXPx = Math.sin(normalized) * (rect.width * 0.38);
      const baseYPx = Math.cos(normalized * 2) * 18 + Math.sin(normalized * 3) * 8;
      const baseRotate = progress * 720;

      // Mouse target position: ball follows cursor precisely
      let targetXPx = baseXPx;
      let targetYPx = baseYPx;
      let targetRotate = baseRotate;
      if (mouseRef.current.active) {
        const centerX = rect.width / 2;
        const centerY = rect.height * 0.28;
        targetXPx = mouseRef.current.x - centerX;
        targetYPx = mouseRef.current.y - centerY;
        targetRotate += (mouseRef.current.x - centerX) * 0.05;
      }

      // Smooth interpolation (iPhone-like lag)
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      const speed = mouseRef.current.active ? 0.28 : 0.06;
      ballStateRef.current.x = lerp(ballStateRef.current.x, targetXPx, speed);
      ballStateRef.current.y = lerp(ballStateRef.current.y, targetYPx, speed);
      ballStateRef.current.rotate = lerp(ballStateRef.current.rotate, targetRotate, 0.08);

      ballRef.current.style.transform = `translate3d(calc(-50% + ${ballStateRef.current.x}px), ${ballStateRef.current.y}px, 0) rotate(${ballStateRef.current.rotate}deg)`;

      // Trigger racket hit animation when ball passes near a racket
      if (!mouseRef.current.active && Math.abs(ballStateRef.current.x) > rect.width * 0.34 && lastHitRef.current !== (ballStateRef.current.x > 0 ? "right" : "left")) {
        lastHitRef.current = ballStateRef.current.x > 0 ? "right" : "left";
        const target = ballStateRef.current.x > 0 ? rightRef.current : leftRef.current;
        if (target) {
          target.classList.remove("hit");
          void target.offsetWidth;
          target.classList.add("hit");
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleClick, { passive: true });
    sectionRef.current.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleClick);
      sectionRef.current?.removeEventListener("mouseleave", handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] hidden overflow-hidden lg:block" aria-hidden="true">
      {/* Left racket */}
      <div
        ref={leftRef}
        className="marketing-racket-left absolute left-[-2%] top-[6%] h-[520px] w-[280px] opacity-[0.18] xl:left-[1%] xl:h-[600px] xl:w-[320px]"
        style={{ transform: "rotate(-12deg)" }}
      >
        <PremiumRacket side="left" />
      </div>

      {/* Right racket */}
      <div
        ref={rightRef}
        className="marketing-racket-right absolute right-[-2%] top-[14%] h-[520px] w-[280px] opacity-[0.18] xl:right-[1%] xl:h-[600px] xl:w-[320px]"
        style={{ transform: "rotate(12deg) scaleX(-1)" }}
      >
        <PremiumRacket side="right" />
      </div>

      {/* Ball cursor */}
      <div
        ref={ballRef}
        className="marketing-ball pointer-events-none absolute left-1/2 top-[28%] z-20 size-5 rounded-full bg-[#dfff3d] shadow-[0_0_24px_rgba(201,243,106,.6)]"
      />
    </div>
  );
}

function HeroDashboard() {
  return <div className="rounded-[24px] border border-white/15 bg-[#16231c]/90 p-2 shadow-[0_30px_90px_rgba(0,0,0,0.35)]"><div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#f5f7f2] text-[#183020]"><div className="flex items-center justify-between border-b border-[#dfe5dc] bg-white px-4 py-3"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#74af42]" /><span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#617169]">SportManager / Live overview</span></div><span className="rounded-full bg-[#edf6db] px-2 py-1 text-[10px] font-medium text-[#5f8135]">Demo data</span></div><div className="grid gap-3 p-4 sm:p-5"><div className="flex items-end justify-between"><div><p className="text-[11px] font-medium text-[#78857d]">Buenos días, Martina</p><p className="mt-1 text-xl font-semibold tracking-[-0.05em]">Resumen de hoy</p></div><span className="rounded-lg border border-[#dfe5dc] px-2.5 py-1.5 text-[10px] text-[#64736a]">Lun, 09 Sep</span></div><div className="grid grid-cols-3 gap-2"><MiniMetric label="Reservas" value="28" delta="+18%" /><MiniMetric label="Ingresos" value="$412k" delta="+24%" /><MiniMetric label="Ocupación" value="78%" delta="+9%" /></div><div className="grid gap-3 sm:grid-cols-[1.15fr_0.85fr]"><div className="rounded-xl border border-[#e0e6dc] bg-white p-3"><div className="mb-3 flex items-center justify-between"><span className="text-[11px] font-semibold">Estado de canchas</span><span className="text-[10px] text-[#78857d]">Ahora</span></div>{courts.map((court) => <div key={court.name} className="flex items-center gap-2 border-t border-[#eef1ec] py-2 text-[10px]"><span className={`size-1.5 rounded-full ${court.tone === "free" ? "bg-[#83b84b]" : "bg-[#e3ad48]"}`} /><span className="flex-1 font-medium">{court.name}</span><span className="text-[#88948d]">{court.time}</span><span className={court.tone === "free" ? "text-[#6e9b3b]" : "text-[#b07d25]"}>{court.status}</span></div>)}</div><div className="rounded-xl bg-[#15301f] p-3 text-white"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold">Ingresos</span><BarChart3 className="size-3.5 text-[#c9f36a]" /></div><p className="mt-4 text-2xl font-semibold tracking-[-0.06em]">$1.24M</p><p className="mt-1 text-[10px] text-[#c9f36a]">+24.8% este mes</p><div className="mt-5 flex h-14 items-end gap-1">{[28, 35, 26, 43, 38, 51, 47, 62, 58, 72, 68, 86].map((height, i) => <span key={i} className={`flex-1 rounded-t-sm ${i === 11 ? "bg-[#c9f36a]" : "bg-white/20"}`} style={{ height: `${height}%` }} />)}</div></div></div></div></div></div>;
}

function MiniMetric({ label, value, delta }: { label: string; value: string; delta: string }) { return <div className="rounded-xl border border-[#e0e6dc] bg-white p-3"><p className="text-[9px] text-[#78857d]">{label}</p><p className="mt-1 text-lg font-semibold tracking-[-0.05em]">{value}</p><p className="mt-1 text-[9px] font-medium text-[#70a53d]">{delta}</p></div>; }

function FeaturePanel({ eyebrow, title, description, tone, className, children }: { eyebrow: string; title: string; description: string; tone: "dark" | "lime" | "light"; className?: string; children: React.ReactNode }) { const styles = tone === "dark" ? "bg-[#13221a] text-white" : tone === "lime" ? "bg-[#c9f36a] text-[#1d2d18]" : "border border-[#d9e1d5] bg-white text-[#193022]"; const edge = tone === "dark" ? "#c9f36a" : tone === "lime" ? "#3d5c1c" : "#7aa04a"; return <article className={`relative overflow-hidden rounded-[26px] p-6 pt-8 sm:p-8 sm:pt-10 ${styles} ${className ?? ""}`}><StrokeEdge color={edge} /><p className={`marketing-label text-[10px] font-semibold ${tone === "dark" ? "text-[#c9f36a]" : "text-[#688353]"}`}>{eyebrow}</p><h3 className="mt-4 max-w-lg text-[2rem] font-bold leading-[1] tracking-[-0.01em]">{title}</h3><p className={`mt-3 max-w-md text-sm leading-6 ${tone === "dark" ? "text-white/55" : "text-[#5d6e62]"}`}>{description}</p><div className="mt-8">{children}</div></article>; }

function BookingGrid() { return <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3"><div className="mb-3 grid grid-cols-[90px_repeat(3,1fr)] gap-1 text-[9px] text-white/40"><span />{["18:00", "19:00", "20:00"].map((time) => <span key={time} className="text-center">{time}</span>)}</div>{["Cancha 01", "Cancha 02", "Cancha 03", "Cancha 04"].map((court, i) => <div key={court} className="grid grid-cols-[90px_repeat(3,1fr)] gap-1 border-t border-white/10 py-1.5 text-[10px]"><span className="flex items-center text-white/60">{court}</span>{[0, 1, 2].map((slot) => <span key={slot} className={`flex h-8 items-center justify-center rounded-md transition-colors ${i === 1 && slot === 1 ? "bg-[#c9f36a] font-semibold text-[#102016]" : i === 2 && slot !== 2 ? "bg-sky-400/20 text-sky-200" : "bg-white/[0.06] text-white/30"}`}>{i === 1 && slot === 1 ? "Juan" : i === 2 && slot !== 2 ? "Reservada" : "Libre"}</span>)}</div>)}</div>; }

function RevenueCard() { return <div className="rounded-2xl bg-[#15301f] p-5 text-white"><div className="flex items-center justify-between"><div><p className="text-xs text-white/50">Ingresos confirmados</p><p className="mt-2 text-3xl font-semibold tracking-[-0.07em]">$412.850</p></div><span className="flex size-9 items-center justify-center rounded-full bg-[#c9f36a] text-[#15301f]"><CreditCard className="size-4" /></span></div><div className="mt-7 h-20"><svg viewBox="0 0 320 80" className="h-full w-full" role="img" aria-label="Tendencia ascendente de ingresos"><path d="M0 66 C24 60 34 61 54 48 S91 59 108 45 S145 50 165 37 S201 45 220 27 S260 38 278 17 S305 21 320 5" fill="none" stroke="#c9f36a" strokeWidth="3" /><path d="M0 66 C24 60 34 61 54 48 S91 59 108 45 S145 50 165 37 S201 45 220 27 S260 38 278 17 S305 21 320 5 V80 H0Z" fill="url(#revenueFill)" opacity=".18" /><defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#c9f36a" /><stop offset="1" stopColor="#c9f36a" stopOpacity="0" /></linearGradient></defs></svg></div><div className="mt-3 flex justify-between text-[10px] text-white/40"><span>01 Sep</span><span>09 Sep</span><span>Hoy</span></div></div>; }

function CustomerStack() { return <div className="relative min-h-[180px] rounded-2xl border border-[#e0e6dc] bg-[#f6f8f3] p-4"><div className="absolute right-4 top-4 rounded-full bg-[#e4f4be] px-2 py-1 text-[10px] font-semibold text-[#577c32]">+42 nuevos</div>{["Sofía Castro", "Juan Pérez", "Lucía Fernández"].map((name, i) => <div key={name} className="flex items-center gap-3 border-b border-[#e2e8df] py-3 last:border-0"><span className={`flex size-8 items-center justify-center rounded-full text-[10px] font-semibold ${["bg-[#d4e8bc] text-[#527338]", "bg-[#d5e3f0] text-[#4f6f91]", "bg-[#ead8bb] text-[#906e37]"][i]}`}>{name.split(" ").map((part) => part[0]).join("")}</span><span className="flex-1 text-xs font-medium">{name}</span><span className="text-[10px] text-[#839087]">{["24 reservas", "18 reservas", "12 reservas"][i]}</span></div>)}</div>; }

function TeamActivity() { return <div className="grid gap-2 sm:grid-cols-3">{[{ icon: Users, title: "Staff activo", value: "08" }, { icon: Clock3, title: "Turno actual", value: "17:00–23:00" }, { icon: Bell, title: "Alertas", value: "03" }].map(({ icon: Icon, title, value }) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition-colors hover:bg-white/[0.10]"><Icon className="size-4 text-[#c9f36a]" /><p className="mt-6 text-[10px] text-white/45">{title}</p><p className="mt-1 text-lg font-semibold tracking-[-0.04em]">{value}</p></div>)}</div>; }

function BookingDemo({ step, setStep }: { step: number; setStep: (step: number) => void }) { const labels = ["Elegí una cancha", "Elegí un horario", "Confirmá y pagá", "Reserva confirmada"]; return <div id="booking-demo" className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[#13221a] p-4 pt-8 shadow-2xl sm:p-6 sm:pt-10"><StrokeEdge color="#c9f36a" /><div className="flex items-center justify-between border-b border-white/10 pb-4"><div className="flex items-center gap-2 text-xs font-medium text-white/65"><CalendarDays className="size-4 text-[#c9f36a]" /> Nueva reserva</div><span className="text-[10px] text-white/35">Paso {Math.min(step + 1, 4)} de 4</span></div><div className="mt-5 flex gap-1">{[0, 1, 2, 3].map((item) => <span key={item} className={`h-1 flex-1 rounded-full transition-colors ${item <= step ? "bg-[#c9f36a]" : "bg-white/10"}`} />)}</div><div className="min-h-[250px] pt-7">{step === 0 && <div><p className="text-lg font-semibold">{labels[0]}</p><p className="mt-1 text-xs text-white/45">Todas están a un toque de distancia.</p><div className="mt-6 grid grid-cols-2 gap-2">{["Cancha 01", "Cancha 02", "Cancha 03", "Cancha 04"].map((court, i) => <button type="button" key={court} onClick={() => setStep(1)} className={`group rounded-xl border p-4 text-left transition-all ${i === 2 ? "border-[#c9f36a] bg-[#c9f36a]/10 shadow-[0_0_20px_rgba(201,243,106,.12)]" : "border-white/10 bg-white/[0.04] hover:border-[#c9f36a]/60 hover:bg-white/[0.08]"}`}><Volleyball className="size-4 text-[#c9f36a] transition-transform group-hover:rotate-12" /><p className="mt-5 text-xs font-semibold">{court}</p><p className="mt-1 text-[10px] text-white/40">Indoor · Vidrio</p></button>)}</div></div>}{step === 1 && <div><p className="text-lg font-semibold">{labels[1]}</p><div className="mt-6 grid grid-cols-3 gap-2">{["18:00", "19:30", "21:00"].map((time) => <button type="button" key={time} onClick={() => setStep(2)} className="group rounded-xl border border-white/10 bg-white/[0.04] px-3 py-4 text-center text-sm font-medium transition-all hover:border-[#c9f36a] hover:bg-white/[0.08] hover:text-[#c9f36a]">{time}<span className="mt-1 block text-[10px] font-normal text-white/35 group-hover:text-white/50">90 min</span></button>)}</div></div>}{step === 2 && <div><p className="text-lg font-semibold">{labels[2]}</p><div className="mt-5 rounded-xl border border-white/10 bg-white/[0.06] p-4"><div className="flex justify-between text-sm"><span className="text-white/55">Cancha 03 · 21:00</span><span>$18.000</span></div><div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-xs"><span className="text-white/45">Seña para confirmar</span><span className="font-semibold text-[#c9f36a]">$9.000</span></div></div><button type="button" onClick={() => setStep(3)} className="marketing-btn-primary mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm">Continuar al pago <ArrowRight className="size-4" /></button></div>}{step === 3 && <div className="flex min-h-[220px] flex-col items-center justify-center text-center"><span className="flex size-14 items-center justify-center rounded-full bg-[#c9f36a] text-[#102016] shadow-[0_0_40px_rgba(201,243,106,.35)]"><Check className="size-7" /></span><p className="mt-5 text-xl font-semibold">Reserva confirmada</p><p className="mt-2 text-sm text-white/45">Cancha 03 · Hoy, 21:00–22:30</p><button type="button" onClick={() => setStep(0)} className="mt-6 text-xs text-[#c9f36a] transition-colors hover:text-[#dfff85]">Hacer otra reserva</button></div>}</div></div>; }

function ImportFlow() { return <div className="marketing-card-hover marketing-border-glow relative overflow-hidden rounded-[26px] border border-[#dbe3d6] bg-white p-5 pt-8 shadow-[0_20px_60px_rgba(33,58,39,0.08)] sm:p-7 sm:pt-10"><StrokeEdge color="#7aa04a" /><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-semibold"><FileSpreadsheet className="size-4 text-[#6e9f3c]" /> clientes_agosto.xlsx</div><span className="rounded-full bg-[#e7f3d3] px-2 py-1 text-[10px] font-medium text-[#608238]">Listo</span></div><div className="relative mt-8 space-y-5">{[{ icon: CloudUpload, title: "Archivo recibido", desc: "248 filas detectadas" }, { icon: Check, title: "Datos validados", desc: "236 filas listas · 12 para revisar" }, { icon: Database, title: "Base actualizada", desc: "Clientes disponibles en CRM" }].map(({ icon: Icon, title, desc }, i) => <div key={title} className="relative flex items-center gap-4">{i < 2 && <span className="absolute left-[15px] top-9 h-7 w-px bg-[#dbe5d5]" />}<span className={`relative z-10 flex size-8 items-center justify-center rounded-full transition-transform hover:scale-110 ${i === 2 ? "bg-[#c9f36a] text-[#21351b]" : "bg-[#eaf3df] text-[#699341]"}`}><Icon className="size-4" /></span><div><p className="text-sm font-medium">{title}</p><p className="mt-0.5 text-xs text-[#7b887f]">{desc}</p></div><Check className="ml-auto size-4 text-[#77a746]" /></div>)}</div><div className="mt-8 rounded-xl bg-[#f1f5ed] p-3 text-xs text-[#607168]">Importación inteligente · columnas mapeadas automáticamente</div></div>; }

function AssistantDemo({ messages, typing, onContinue }: { messages: { role: string; text: string }[]; typing: string | null; onContinue: () => void }) { return <div className="relative overflow-hidden rounded-[26px] border border-[#aecd78] bg-[#f5f9ed] p-4 pt-8 shadow-[0_24px_70px_rgba(56,83,28,0.12)] sm:p-6 sm:pt-10"><StrokeEdge color="#3d5c1c" /><div className="flex items-center gap-3 border-b border-[#dce9c5] pb-4"><span className="flex size-9 items-center justify-center rounded-xl bg-[#18351f] text-[#c9f36a]"><Sparkles className="size-4" /></span><div><p className="text-sm font-semibold text-[#20371b]">SportManager Assistant</p><p className="text-[10px] text-[#6c8460]">En línea · responde al instante</p></div><span className="ml-auto size-2 rounded-full bg-[#80b34a]" /></div><div className="min-h-[230px] space-y-4 py-5">{messages.map((message, i) => <div key={`${message.text}-${i}`} className={`flex ${message.role === "customer" ? "justify-end" : "justify-start"}`}><div className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-5 transition-all ${message.role === "customer" ? "rounded-br-sm bg-[#dfeec2] text-[#36512b]" : "rounded-bl-sm bg-[#18351f] text-white"}`}>{message.text}</div></div>)}{typing && <div className="flex justify-start"><div className="marketing-typing max-w-[82%] rounded-2xl rounded-bl-sm bg-[#18351f] px-4 py-3 text-xs leading-5 text-white">{typing}</div></div>}</div><button type="button" onClick={onContinue} disabled={messages.length > 2} className="marketing-btn-primary flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm disabled:cursor-default disabled:opacity-60">{messages.length > 2 ? "Reserva lista para pagar" : "Continuar conversación"}<ArrowRight className="size-4" /></button></div>; }

function DashboardPreview() { return <div className="relative mt-12 overflow-hidden rounded-[26px] border border-[#d7ded2] bg-[#e8eee4] p-2 pt-6 shadow-[0_24px_80px_rgba(30,56,34,0.12)] sm:p-3 sm:pt-8"><StrokeEdge color="#7aa04a" /><div className="grid min-h-[430px] overflow-hidden rounded-[20px] border border-[#dfe7da] bg-[#f8faf6] lg:grid-cols-[190px_1fr]"><aside className="hidden border-r border-[#e1e8dd] bg-[#f1f5ee] p-5 lg:block"><div className="flex items-center gap-2 text-sm font-semibold"><span className="flex size-7 items-center justify-center rounded-lg bg-[#18351f] text-[#c9f36a]"><Volleyball className="size-4" /></span>SportManager/PlayHub</div><p className="mt-10 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8c998e]">Workspace</p><div className="mt-3 space-y-1">{[[BarChart3, "Overview"], [CalendarDays, "Calendario"], [Users, "Clientes"], [CreditCard, "Pagos"], [FileSpreadsheet, "Importar"]].map(([Icon, name], i) => { const Component = Icon as typeof BarChart3; return <div key={name as string} className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] transition-colors ${i === 0 ? "bg-white font-semibold text-[#23422a] shadow-sm" : "text-[#7c897f] hover:bg-white/60"}`}><Component className="size-3.5" />{name as string}</div>; })}</div></aside><div className="min-w-0 p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="text-[10px] text-[#849188]">Monday, September 09</p><h3 className="mt-1 text-xl font-semibold tracking-[-0.05em]">Good morning, Martina</h3></div><span className="hidden rounded-lg border border-[#dde5da] bg-white px-3 py-2 text-[10px] text-[#738078] sm:block">Demo workspace</span></div><div className="mt-7 grid gap-3 sm:grid-cols-3">{[{ label: "Revenue", value: "$412,850", delta: "+24.8%" }, { label: "Reservations", value: "184", delta: "+18.2%" }, { label: "Occupancy", value: "78.4%", delta: "+9.4%" }].map((item) => <div key={item.label} className="rounded-xl border border-[#e1e8dd] bg-white p-4 transition-transform hover:-translate-y-1 hover:shadow-md"><p className="text-[10px] text-[#839087]">{item.label}</p><p className="mt-2 text-xl font-semibold tracking-[-0.05em]">{item.value}</p><p className="mt-2 text-[10px] font-medium text-[#76a143]">{item.delta} vs last period</p></div>)}</div><div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_0.8fr]"><div className="rounded-xl border border-[#e1e8dd] bg-white p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold">Reservations this week</p><span className="text-[10px] text-[#829087]">Last 7 days</span></div><div className="mt-5 flex h-36 items-end gap-2">{[38, 48, 42, 63, 55, 76, 68, 88, 74, 95, 82, 100, 89, 78].map((height, i) => <div key={i} className="flex flex-1 flex-col items-center gap-2"><span className={`w-full rounded-t-sm transition-all ${i > 9 ? "bg-[#8dbb53]" : "bg-[#dce9d1] hover:bg-[#c9f36a]"}`} style={{ height: `${height}%` }} /><span className="text-[8px] text-[#9aa69c]">{["M", "T", "W", "T", "F", "S", "S"][i % 7]}</span></div>)}</div></div><div className="rounded-xl border border-[#e1e8dd] bg-white p-4"><p className="text-xs font-semibold">Recent activity</p><div className="mt-4 space-y-3">{dashboardRows.map((row) => <div key={row.customer} className="flex items-center gap-2 text-[10px]"><span className={`size-2 rounded-full ${row.color}`} /><span className="flex-1 truncate text-[#526259]">{row.customer} reserved {row.court}</span><span className="text-[#87948a]">{row.time}</span></div>)}</div></div></div></div></div></div>; }
