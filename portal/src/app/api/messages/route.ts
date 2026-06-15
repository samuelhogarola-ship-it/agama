import { NextRequest, NextResponse } from "next/server";

import { appendPortalMessage } from "@/lib/portal-repository";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const message = await appendPortalMessage({
    conversationId: payload.conversationId,
    sender: payload.sender,
    body: payload.body,
    attachmentName: payload.attachmentName ?? null,
  });

  return NextResponse.json(message, { status: 201 });
}
