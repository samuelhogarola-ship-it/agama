export default function ConfiguratorLoading() {
  return (
    <main className="page-frame section-gap" aria-busy="true" aria-label="Cargando configurador">
      <div className="studio-panel min-h-[70vh] animate-pulse rounded-3xl border border-white/70 bg-white/90 p-6">
        <div className="h-12 w-72 max-w-full rounded-xl bg-[#e8edf5]" />
        <div className="mt-8 grid gap-5 md:grid-cols-[24rem_minmax(0,1fr)]">
          <div className="h-[34rem] rounded-2xl bg-[#eef2f7]" />
          <div className="h-[34rem] rounded-2xl bg-[#eef2f7]" />
        </div>
      </div>
    </main>
  );
}
