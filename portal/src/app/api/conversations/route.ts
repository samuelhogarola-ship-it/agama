import { NextRequest, NextResponse } from "next/server";

import { createConversation } from "@/lib/mock-store";

export async function POST(request: NextRequest) {
  const payload = await request.json();

  const conversation = createConversation({
    title: payload.title,
    subjectType: payload.subjectType,
    relatedOrderId: payload.relatedOrderId ?? null,
    relatedProductSlug: payload.relatedProductSlug ?? null,
  });

  return NextResponse.json(conversation, { status: 201 });
}
