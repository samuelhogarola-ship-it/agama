import { NextRequest, NextResponse } from "next/server";

import { updateOrderStatus } from "@/lib/mock-store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const payload = await request.json();
  const order = updateOrderStatus(id, payload.status);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}
