// Edge function "academy-assistant" — la IA de la plataforma (Bony Pellet / Atenea).
// Proxy seguro hacia la API de Anthropic: la clave nunca llega al navegador.
//
// Despliegue:
//   supabase functions deploy academy-assistant
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//   supabase secrets set ASSISTANT_NAME="Bony Pellet"   # cambiar a "Atenea" cuando toque
//   supabase secrets set ASSISTANT_MODEL=claude-opus-4-8  # opcional

import Anthropic from "npm:@anthropic-ai/sdk";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AssistantRequest {
  messages: ChatMessage[];
  context?: { note?: string; userName?: string | null };
}

function buildSystemPrompt(context: AssistantRequest["context"]): string {
  const name = Deno.env.get("ASSISTANT_NAME") ?? "Bony Pellet";
  const parts = [
    `Eres ${name}, la asistente de formación integrada en la academia interna de formación para nuevos colaboradores de AGAMA.`,
    "Tu misión: guiar al colaborador durante su formación, resolver dudas sobre las lecciones, los sistemas internos y los procesos de la empresa, y animarle a completar el itinerario en orden.",
    "Normas:",
    "- Responde siempre en español, con tono cercano y profesional.",
    "- Sé breve y concreta: respuestas de 2 a 5 frases salvo que pidan más detalle.",
    "- Si la pregunta no tiene relación con la formación o el trabajo en AGAMA, redirige amablemente al temario.",
    "- Si no sabes algo específico de AGAMA, dilo con claridad y sugiere consultar al responsable de formación.",
  ];
  if (context?.userName) parts.push(`El colaborador se llama ${context.userName}.`);
  if (context?.note) parts.push(`Contexto de navegación: ${context.note}`);
  return parts.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Falta el secret ANTHROPIC_API_KEY" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  try {
    const body = (await req.json()) as AssistantRequest;
    const messages = (body.messages ?? [])
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-20); // limitar historial
    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return new Response(JSON.stringify({ error: "Petición inválida" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: Deno.env.get("ASSISTANT_MODEL") ?? "claude-opus-4-8",
      max_tokens: 1024,
      system: buildSystemPrompt(body.context),
      messages,
    });

    if (response.stop_reason === "refusal") {
      return new Response(
        JSON.stringify({ reply: "No puedo ayudarte con eso. ¿Tienes alguna duda sobre tu formación?" }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const reply = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return new Response(JSON.stringify({ reply }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("assistant error:", error);
    return new Response(JSON.stringify({ error: "Error interno del asistente" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
