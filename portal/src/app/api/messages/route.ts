import { NextRequest, NextResponse } from "next/server";

import { appendMessage } from "@/lib/mock-store";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const message = appendMessage({
    conversationId: payload.conversationId,
    sender: payload.sender,
    body: payload.body,
    attachmentName: payload.attachmentName ?? null,
  });

  return NextResponse.json(message, { status: 201 });
}
