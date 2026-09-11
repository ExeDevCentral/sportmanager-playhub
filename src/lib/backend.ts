/**
 * Cliente HTTP del backend mock (SportManager/PlayHub · :4000).
 *
 * - Server-side: consulta directo a process.env.BACKEND_URL (o localhost:4000).
 * - Browser: pasa por la API route /api/backend/* de Next (misma-origen, sin CORS).
 *
 * Nunca lanza: devuelve null si el backend no responde, para que los servicios
 * de demo puedan caer al generador local y el dashboard siga funcionando.
 */
export async function fetchBackend<T>(path: string, init?: RequestInit): Promise<T | null> {
  const isServer = typeof window === "undefined";
  const url = isServer
    ? `${process.env.BACKEND_URL ?? "http://127.0.0.1:4000"}/api${path}`
    : `/api/backend${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function isBackendConfigured(): boolean {
  return Boolean(process.env.BACKEND_URL);
}