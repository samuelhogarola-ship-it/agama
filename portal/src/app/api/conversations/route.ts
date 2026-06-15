import { NextRequest, NextResponse } from "next/server";

import { createPortalConversation } from "@/lib/portal-repository";

export async function POST(request: NextRequest) {
  const payload = await request.json();

  const conversation = await createPortalConversation({
    title: payload.title,
    subjectType: payload.subjectType,
    relatedOrderId: payload.relatedOrderId ?? null,
    relatedProductSlug: payload.relatedProductSlug ?? null,
  });

  return NextResponse.json(conversation, { status: 201 });
}
