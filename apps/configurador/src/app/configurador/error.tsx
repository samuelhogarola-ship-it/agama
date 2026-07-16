"use client";

export default function ConfiguratorError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page-frame section-gap">
      <section className="mx-auto max-w-xl rounded-3xl border border-line bg-white p-8 text-center shadow-[0_20px_50px_rgba(19,35,78,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Configurador temporalmente no disponible</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-graphite">No pudimos cargar el catálogo</h1>
        <p className="mt-3 text-sm leading-6 text-muted">Comprueba tu conexión y vuelve a intentarlo. Tu pedido guardado en este dispositivo no se perderá.</p>
        <button type="button" onClick={reset} className="mt-6 min-h-12 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white">Reintentar</button>
      </section>
    </main>
  );
}
