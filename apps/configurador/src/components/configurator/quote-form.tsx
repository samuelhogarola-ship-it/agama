"use client";

import { useState } from "react";
import { Check, LoaderCircle, MessageCircle } from "lucide-react";

import type { QuoteRequestItem, QuoteResponse } from "@/lib/quote-contract";
import { emitConfiguratorAnalyticsEvent } from "@/lib/configurator-analytics";

type QuoteFormProps = {
  items: QuoteRequestItem[];
  configurationUrl: string;
  whatsappUrl: string;
  onSubmitted?: (quoteId: string) => void;
};

const fieldClassName = "mt-2 h-11 w-full rounded-xl border border-line bg-white px-3 !text-[16px] text-graphite transition focus:border-brand";

export function QuoteForm({ items, configurationUrl, whatsappUrl, onSubmitted }: QuoteFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [quoteId, setQuoteId] = useState("");
  const [submittedAtLabel, setSubmittedAtLabel] = useState("");
  const [savedEmail, setSavedEmail] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("submitting");
    setMessage("");
    const totalKg = items.reduce((sum, item) => sum + item.quantityKg, 0);
    emitConfiguratorAnalyticsEvent("quote_started", { itemCount: items.length, totalKg });

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contactName: data.get("contactName"),
          contactEmail: data.get("contactEmail"),
          contactPhone: data.get("contactPhone"),
          contactCompany: data.get("contactCompany"),
          notes: data.get("notes"),
          consent: data.get("consent") === "on",
          source: "configurador",
          configurationUrl,
          website: data.get("website"),
          items,
        }),
      });
      const result = await response.json() as QuoteResponse;
      if (!response.ok || !result.ok) throw new Error(result.ok ? "No pudimos enviar la solicitud." : result.message);

      setQuoteId(result.quoteId);
      setSavedEmail(result.contactEmail);
      setSubmittedAtLabel(new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(result.submittedAt)));
      setStatus("success");
      emitConfiguratorAnalyticsEvent("quote_succeeded", { itemCount: items.length, totalKg, quoteId: result.quoteId });
      onSubmitted?.(result.quoteId);
      form.reset();
    } catch (error) {
      setStatus("error");
      const errorMessage = error instanceof Error ? error.message : "No pudimos enviar la solicitud.";
      setMessage(errorMessage);
      emitConfiguratorAnalyticsEvent("quote_failed", { itemCount: items.length, totalKg, reason: errorMessage });
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-[#9dd9b1] bg-[#f2fff5] p-5" role="status">
        <div className="flex items-center gap-2 font-semibold text-[#12663b]"><Check className="size-5" /> Solicitud recibida</div>
        <p className="mt-2 text-sm leading-6 text-[#315d42]">Ventas ya puede revisar tu configuración. Referencia: <strong>{quoteId}</strong>.</p>
        <p className="mt-1 text-sm leading-6 text-[#315d42]">Histórico guardado el <strong>{submittedAtLabel}</strong> con el email <strong>{savedEmail}</strong>.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-line bg-white p-5" aria-busy={status === "submitting"}>
      <h3 className="text-lg font-bold tracking-[-0.03em] text-graphite">Datos para la cotización</h3>
      <p className="mt-1 text-sm leading-6 text-muted">Un asesor revisará disponibilidad, precio y condiciones antes de confirmar.</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-graphite">Nombre completo *
          <input name="contactName" autoComplete="name" required maxLength={100} className={fieldClassName} />
        </label>
        <label className="text-sm font-semibold text-graphite">Empresa *
          <input name="contactCompany" autoComplete="organization" required maxLength={120} className={fieldClassName} />
        </label>
        <label className="text-sm font-semibold text-graphite">Email *
          <input name="contactEmail" type="email" autoComplete="email" required maxLength={160} className={fieldClassName} />
        </label>
        <label className="text-sm font-semibold text-graphite">Teléfono
          <input name="contactPhone" type="tel" autoComplete="tel" maxLength={24} className={fieldClassName} />
        </label>
      </div>
      <p className="mt-2 text-xs text-muted">El email es obligatorio y se usa como referencia del histórico comercial.</p>

      <label className="mt-4 block text-sm font-semibold text-graphite">Notas
        <textarea name="notes" rows={3} maxLength={1000} className="mt-2 w-full rounded-xl border border-line bg-white px-3 py-2 !text-[16px] text-graphite transition focus:border-brand" />
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" className="absolute -left-[10000px]" aria-hidden="true" />

      <label className="mt-4 flex items-start gap-3 text-sm leading-5 text-muted">
        <input name="consent" type="checkbox" required className="mt-1 size-4 accent-[#0a3d91]" />
        <span>Acepto que AGAMA use estos datos para gestionar esta solicitud comercial.</span>
      </label>

      {status === "error" ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          {message} <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Continuar cotizacion por WhatsApp" className="font-semibold underline">Continuar por WhatsApp</a>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="submit" disabled={status === "submitting" || items.length === 0} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:opacity-60">
          {status === "submitting" ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {status === "submitting" ? "Enviando..." : "Enviar solicitud"}
        </button>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Enviar pedido por WhatsApp" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#25d366]/40 bg-[#f2fff5] px-4 py-3 text-sm font-semibold text-[#12663b]">
          <MessageCircle className="size-4" /> WhatsApp
        </a>
      </div>
    </form>
  );
}
