import { NextRequest, NextResponse } from "next/server";

import { createPortalOrder, listPortalOrders } from "@/lib/portal-repository";

export async function GET() {
  return NextResponse.json(await listPortalOrders());
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const order = await createPortalOrder({
    productSlug: payload.productSlug,
    productName: payload.productName,
    productCode: payload.productCode,
    quantity: Number(payload.quantity ?? 25),
    unitPrice: payload.unitPrice ?? null,
  });

  return NextResponse.json(order, { status: 201 });
}
