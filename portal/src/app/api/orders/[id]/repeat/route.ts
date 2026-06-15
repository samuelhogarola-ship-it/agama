import { NextResponse } from "next/server";

import { repeatPortalOrder } from "@/lib/portal-repository";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await repeatPortalOrder(id);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}
