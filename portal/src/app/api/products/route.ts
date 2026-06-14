import { NextResponse } from "next/server";

import { getPortalProducts } from "@/lib/portal-data";

export async function GET() {
  const products = await getPortalProducts();
  return NextResponse.json(products);
}
