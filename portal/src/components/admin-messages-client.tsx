"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import type { PortalConversation } from "@/lib/types";

export function AdminMessagesClient({
  initialConversations,
}: {
  initialConversations: PortalConversation[];
}) {
  const [activeId, setActiveId] = useState(initialConversations[0]?.id ?? "");

  const activeConversation =
    initialConversations.find((conversation) => conversation.id === activeId) ??
    initialConversations[0];

  return (
    <div className="admin-grid">
      <div className="rounded-[1.7rem] border border-line bg-white p-5 shadow-[0_18px_40px_rgba(20,57,171,0.08)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="label-kicker">Inbox comercial</p>
            <h1 className="mt-2 text-2xl font-bold text-graphite">Mensajes de clientes</h1>
          </div>
          <Badge variant="brand">Bonny solo lectura</Badge>
        </div>

        <div className="space-y-3">
          {initialConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setActiveId(conversation.id)}
              className={`w-full rounded-[1.35rem] border p-4 text-left transition ${
                activeConversation?.id === conversation.id
                  ? "border-brand bg-brand-soft"
                  : "border-line bg-surface-soft hover:border-brand/35"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-graphite">{conversation.title}</p>
                <Badge variant="graphite">{conversation.status}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                {conversation.messages.at(-1)?.body ?? "Sin actividad"}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.7rem] border border-line bg-white p-5 shadow-[0_18px_40px_rgba(20,57,171,0.08)]">
        {activeConversation ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-brand">{activeConversation.title}</p>
                <p className="text-sm text-muted">Revision interna y trazabilidad de soporte</p>
              </div>
              <Badge variant="hot">Transcript Bonny</Badge>
            </div>
            <div className="space-y-3">
              {activeConversation.messages.map((message) => (
                <div key={message.id} className="rounded-[1.3rem] border border-line bg-surface-soft p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                    {message.sender}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-graphite">{message.body}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
