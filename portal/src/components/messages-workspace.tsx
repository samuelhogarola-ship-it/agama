"use client";

import { startTransition, useMemo, useState } from "react";
import { Clock3, Paperclip, Plus, Send, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PortalConversation } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function MessagesWorkspace({
  initialConversations,
}: {
  initialConversations: PortalConversation[];
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeId, setActiveId] = useState(initialConversations[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId) ?? conversations[0],
    [activeId, conversations],
  );

  async function sendMessage() {
    if (!draft.trim() || !activeConversation) return;

    startTransition(async () => {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          sender: "customer",
          body: draft.trim(),
          attachmentName,
        }),
      });

      if (!response.ok) return;

      const message = await response.json();
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === activeConversation.id
            ? {
                ...conversation,
                updatedAt: new Date().toISOString(),
                messages: [...conversation.messages, message],
              }
            : conversation,
        ),
      );
      setDraft("");
      setAttachmentName(null);
    });
  }

  async function openGuidedConversation(type: "producto" | "pedido") {
    startTransition(async () => {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: type === "producto" ? "Nueva consulta de producto" : "Nueva consulta de pedido",
          subjectType: type,
        }),
      });

      if (!response.ok) return;

      const conversation = (await response.json()) as PortalConversation;
      setConversations((current) => [conversation, ...current]);
      setActiveId(conversation.id);
    });
  }

  return (
    <section className="page-frame section-gap">
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        <aside className="rounded-[1.7rem] border border-line bg-white p-4 shadow-[0_16px_36px_rgba(20,57,171,0.08)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="label-kicker">Conversaciones</p>
              <h1 className="mt-2 text-2xl font-bold text-graphite">Mensajes</h1>
            </div>
            <Button variant="soft" size="sm" onClick={() => openGuidedConversation("producto")}>
              <Plus className="size-4" />
              Nueva
            </Button>
          </div>
          <div className="space-y-3">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setActiveId(conversation.id)}
                className={`w-full rounded-[1.35rem] border p-4 text-left transition ${
                  activeConversation?.id === conversation.id
                    ? "border-brand bg-brand-soft"
                    : "border-line bg-surface-soft hover:border-brand/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-graphite">{conversation.title}</p>
                  <Badge variant="graphite">{conversation.status}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {conversation.messages.at(-1)?.body ?? "Sin mensajes todavia"}
                </p>
                <p className="mt-3 text-xs font-medium text-muted">{formatDate(conversation.updatedAt)}</p>
              </button>
            ))}
          </div>
        </aside>

        <div className="rounded-[1.7rem] border border-line bg-white p-4 shadow-[0_16px_36px_rgba(20,57,171,0.08)]">
          {activeConversation ? (
            <>
              <div className="border-b border-line pb-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold text-graphite">{activeConversation.title}</h2>
                    <Badge variant="brand">{activeConversation.subjectType}</Badge>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand">
                    <Clock3 className="size-3.5" />
                    Ultima actualizacion {formatDate(activeConversation.updatedAt)}
                  </div>
                </div>
              </div>

              <div className="flex min-h-[420px] flex-col gap-4 bg-[linear-gradient(180deg,#fff,#f7f9fe)] py-5">
                {activeConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[86%] rounded-[1.4rem] border px-4 py-3 shadow-[0_10px_24px_rgba(20,57,171,0.04)] ${
                      message.sender === "customer"
                        ? "ml-auto border-brand bg-brand text-white"
                        : message.sender === "bonny"
                          ? "border-brand/10 bg-brand-soft text-brand"
                          : "border-line bg-white text-graphite"
                    }`}
                  >
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] opacity-75">
                      {message.sender === "customer"
                        ? "Tu mensaje"
                        : message.sender === "bonny"
                          ? "Bonny"
                          : "Soporte AGAMA"}
                    </p>
                    <p className="text-sm leading-6">{message.body}</p>
                    {message.attachmentName ? (
                      <p className="mt-2 text-xs font-semibold opacity-80">{message.attachmentName}</p>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-line pt-4">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={4}
                  placeholder="Escribe tu mensaje o deja que Bonny te ayude a redactarlo..."
                  className="w-full rounded-[1.4rem] border border-line bg-[linear-gradient(180deg,#fff,#f7f9fe)] px-4 py-3 text-sm text-graphite outline-none transition placeholder:text-muted focus:border-brand focus:ring-4 focus:ring-brand/10"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-muted hover:border-brand hover:text-brand">
                    <Paperclip className="size-4" />
                    {attachmentName ?? "Adjuntar archivo"}
                    <input
                      type="file"
                      className="hidden"
                      onChange={(event) => setAttachmentName(event.target.files?.[0]?.name ?? null)}
                    />
                  </label>
                  <Button onClick={sendMessage}>
                    <Send className="size-4" />
                    Enviar consulta
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <aside className="rounded-[1.7rem] border border-line bg-white p-4 shadow-[0_16px_36px_rgba(20,57,171,0.08)]">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-soft p-3 text-brand">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand">Bonny Pellet</p>
              <p className="text-sm text-muted">Solo visible en esta seccion</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <Badge variant="hot">Asistente para redactar consultas y aclarar dudas frecuentes</Badge>
            <Button variant="secondary" className="w-full justify-center" onClick={() => openGuidedConversation("pedido")}>
              Nueva consulta de pedido
            </Button>
            <Button variant="secondary" className="w-full justify-center" onClick={() => openGuidedConversation("producto")}>
              Nueva consulta de producto
            </Button>
          </div>

          <div className="mt-5 rounded-[1.4rem] bg-brand px-4 py-4 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/75">
              Mejor uso
            </p>
            <p className="mt-2 text-sm leading-6 text-white/90">
              Si compartes codigo, cantidad y resina, soporte responde mas rapido y con menos ida y vuelta.
            </p>
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-line bg-surface-soft p-4">
            <div className="rounded-[1.3rem] border border-dashed border-brand/25 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Bonny guiado</p>
              <h3 className="mt-2 text-lg font-bold text-graphite">Ayuda contextual sin invadir toda la web</h3>
              <p className="mt-3 text-sm leading-6 text-muted">
                Bonny queda aislado en Mensajes. Aqui sugiere estructura de consulta, resume dudas
                frecuentes y te envia al panel asistido cuando necesites una conversacion mas amplia.
              </p>
              <div className="mt-4 grid gap-2">
                {[
                  "Define cantidad, resina y destino antes de cotizar.",
                  "Resume el historial del pedido para soporte comercial.",
                  "Convierte una duda tecnica en consulta accionable.",
                ].map((tip) => (
                  <div key={tip} className="rounded-2xl bg-brand-soft px-3 py-2 text-sm font-medium text-brand">
                    {tip}
                  </div>
                ))}
              </div>
              <Button className="mt-5 w-full justify-center" asChild>
                <a
                  href="https://www.chatbase.co/syhmjssLBRg1bJZYYj3ag/help"
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir Bonny en panel seguro
                </a>
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
