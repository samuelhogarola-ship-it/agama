import { cache } from "react";

import type {
  CustomerProfile,
  OrderItem,
  OrderStatus,
  PortalConversation,
  PortalMessage,
  PortalOrder,
} from "@/lib/types";
import {
  appendMessage as appendMockMessage,
  createConversation as createMockConversation,
  createOrder as createMockOrder,
  getCustomerProfile as getMockCustomerProfile,
  getOrderById as getMockOrderById,
  listConversations as listMockConversations,
  listOrders as listMockOrders,
  updateOrderStatus as updateMockOrderStatus,
} from "@/lib/mock-store";
import { createPortalAdminClient } from "@/lib/supabase";

const PORTAL_DEMO_EMAIL = process.env.PORTAL_DEMO_CUSTOMER_EMAIL ?? "compras@plasticosdelcentro.mx";

type PortalActor = {
  customer: {
    id: string;
    legal_name: string;
    display_name: string | null;
    tax_id: string | null;
    billing_address: string | null;
    shipping_address: string | null;
    contact_preferences: string | null;
  };
  user: {
    id: string | null;
    email: string | null;
  } | null;
};

function mapOrderStatus(value?: string | null): OrderStatus {
  const valid: OrderStatus[] = [
    "Recibido",
    "En revisión",
    "En preparación",
    "Enviado",
    "Completado",
    "Cancelado",
  ];

  if (value && valid.includes(value as OrderStatus)) {
    return value as OrderStatus;
  }

  return "Recibido";
}

function mapConversationStatus(value?: string | null): PortalConversation["status"] {
  if (value === "answered") return "Respondido";
  if (value === "closed") return "Cerrado";
  return "Abierto";
}

function mapMessageSender(value?: string | null): PortalMessage["sender"] {
  if (value === "support") return "support";
  if (value === "bonny") return "bonny";
  return "customer";
}

function attachmentNameFromUrl(url?: string | null) {
  if (!url) return null;
  return url.split("/").at(-1) ?? url;
}

function makeReferenceNumber() {
  const raw = Date.now().toString().slice(-6);
  return `AG-${raw.padStart(6, "0")}`;
}

function mapOrderItem(row: {
  product_snapshot_name?: string | null;
  product_snapshot_code?: string | null;
  quantity?: number | string | null;
  unit?: string | null;
  unit_price_snapshot?: number | string | null;
}): OrderItem {
  return {
    productSlug: "",
    productName: row.product_snapshot_name ?? "Producto AGAMA",
    productCode: row.product_snapshot_code ?? "AGAMA",
    quantity: Number(row.quantity ?? 0),
    unit: row.unit ?? "kg",
    unitPrice:
      row.unit_price_snapshot == null ? null : Number(row.unit_price_snapshot),
  };
}

function mapOrderRow(
  row: {
    id: string;
    reference_number?: string | null;
    status?: string | null;
    created_at?: string | null;
    subtotal?: number | string | null;
    notes?: string | null;
    order_items?: Array<{
      product_snapshot_name?: string | null;
      product_snapshot_code?: string | null;
      quantity?: number | string | null;
      unit?: string | null;
      unit_price_snapshot?: number | string | null;
    }> | null;
  },
  customerName: string,
): PortalOrder {
  return {
    id: row.reference_number ?? row.id,
    date: row.created_at ?? new Date().toISOString(),
    status: mapOrderStatus(row.status),
    channel: "Portal",
    amount: row.subtotal == null ? null : Number(row.subtotal),
    note: row.notes ?? "Solicitud creada desde el portal de clientes.",
    customerName,
    items: (row.order_items ?? []).map(mapOrderItem),
  };
}

function mapConversationRow(row: {
  id: string;
  subject?: string | null;
  status?: string | null;
  updated_at?: string | null;
  order_id?: string | null;
  product_id?: string | null;
  messages?: Array<{
    id: string;
    sender_type?: string | null;
    body?: string | null;
    created_at?: string | null;
    attachment_url?: string | null;
  }> | null;
}): PortalConversation {
  return {
    id: row.id,
    title: row.subject ?? "Conversacion AGAMA",
    subjectType: row.order_id ? "pedido" : row.product_id ? "producto" : "general",
    relatedOrderId: row.order_id ?? null,
    relatedProductSlug: null,
    status: mapConversationStatus(row.status),
    updatedAt: row.updated_at ?? new Date().toISOString(),
    messages: (row.messages ?? []).map((message) => ({
      id: message.id,
      sender: mapMessageSender(message.sender_type),
      body: message.body ?? "",
      createdAt: message.created_at ?? new Date().toISOString(),
      attachmentName: attachmentNameFromUrl(message.attachment_url),
    })),
  };
}

async function resolvePortalActor() {
  const client = createPortalAdminClient();
  if (!client) return null;

  const userQuery = await client
    .from("users")
    .select("id,email,customer_id")
    .eq("email", PORTAL_DEMO_EMAIL)
    .limit(1)
    .maybeSingle();

  if (userQuery.data?.customer_id) {
    const customerQuery = await client
      .from("customers")
      .select("id,legal_name,display_name,tax_id,billing_address,shipping_address,contact_preferences")
      .eq("id", userQuery.data.customer_id)
      .maybeSingle();

    if (customerQuery.data) {
      return {
        customer: customerQuery.data,
        user: {
          id: userQuery.data.id,
          email: userQuery.data.email,
        },
      } satisfies PortalActor;
    }
  }

  const firstCustomer = await client
    .from("customers")
    .select("id,legal_name,display_name,tax_id,billing_address,shipping_address,contact_preferences")
    .limit(1)
    .maybeSingle();

  if (!firstCustomer.data) return null;

  return {
    customer: firstCustomer.data,
    user: userQuery.data
      ? {
          id: userQuery.data.id,
          email: userQuery.data.email,
        }
      : null,
  } satisfies PortalActor;
}

export const getPortalCustomerProfile = cache(async (): Promise<CustomerProfile> => {
  try {
    const actor = await resolvePortalActor();
    if (!actor) return getMockCustomerProfile();

    return {
      company: actor.customer.display_name ?? actor.customer.legal_name,
      contactName: actor.user?.email ? "Contacto portal" : "Contacto AGAMA",
      email: actor.user?.email ?? PORTAL_DEMO_EMAIL,
      phone: getMockCustomerProfile().phone,
      billingAddress: actor.customer.billing_address ?? getMockCustomerProfile().billingAddress,
      shippingAddress: actor.customer.shipping_address ?? getMockCustomerProfile().shippingAddress,
      taxId: actor.customer.tax_id ?? getMockCustomerProfile().taxId,
      contactPreference:
        actor.customer.contact_preferences ?? getMockCustomerProfile().contactPreference,
    };
  } catch {
    return getMockCustomerProfile();
  }
});

export async function listPortalOrders(): Promise<PortalOrder[]> {
  try {
    const actor = await resolvePortalActor();
    const client = createPortalAdminClient();
    if (!actor || !client) return listMockOrders();

    const { data, error } = await client
      .from("orders")
      .select(
        "id,reference_number,status,created_at,subtotal,notes,order_items(product_snapshot_name,product_snapshot_code,quantity,unit,unit_price_snapshot)",
      )
      .eq("customer_id", actor.customer.id)
      .order("created_at", { ascending: false });

    if (error || !data?.length) return listMockOrders();

    const customerName = actor.customer.display_name ?? actor.customer.legal_name;
    return data.map((row) => mapOrderRow(row, customerName));
  } catch {
    return listMockOrders();
  }
}

export async function getPortalOrderById(id: string): Promise<PortalOrder | null> {
  const orders = await listPortalOrders();
  return orders.find((order) => order.id === id) ?? getMockOrderById(id);
}

export async function createPortalOrder(input: {
  productSlug: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice?: number | null;
}) {
  try {
    const actor = await resolvePortalActor();
    const client = createPortalAdminClient();
    if (!actor || !client) return createMockOrder(input);

    const reference_number = makeReferenceNumber();
    const subtotal = input.unitPrice == null ? null : input.unitPrice * input.quantity;

    const orderInsert = await client
      .from("orders")
      .insert({
        customer_id: actor.customer.id,
        created_by_user_id: actor.user?.id ?? null,
        status: "Recibido",
        order_type: "draft",
        reference_number,
        subtotal,
        notes: "Solicitud creada desde el portal de clientes.",
      })
      .select("id,reference_number,status,created_at,subtotal,notes")
      .single();

    if (orderInsert.error || !orderInsert.data) return createMockOrder(input);

    await client.from("order_items").insert({
      order_id: orderInsert.data.id,
      product_snapshot_name: input.productName,
      product_snapshot_code: input.productCode,
      quantity: input.quantity,
      unit: "kg",
      unit_price_snapshot: input.unitPrice ?? null,
      line_total: subtotal,
    });

    return mapOrderRow(
      {
        ...orderInsert.data,
        order_items: [
          {
            product_snapshot_name: input.productName,
            product_snapshot_code: input.productCode,
            quantity: input.quantity,
            unit: "kg",
            unit_price_snapshot: input.unitPrice ?? null,
          },
        ],
      },
      actor.customer.display_name ?? actor.customer.legal_name,
    );
  } catch {
    return createMockOrder(input);
  }
}

export async function repeatPortalOrder(orderId: string) {
  const source = await getPortalOrderById(orderId);
  if (!source) return null;

  return createPortalOrder({
    productSlug: source.items[0]?.productSlug ?? "",
    productName: source.items[0]?.productName ?? "Producto AGAMA",
    productCode: source.items[0]?.productCode ?? "AGAMA",
    quantity: source.items[0]?.quantity ?? 25,
    unitPrice: source.items[0]?.unitPrice ?? null,
  });
}

export async function updatePortalOrderStatus(orderId: string, status: OrderStatus) {
  try {
    const client = createPortalAdminClient();
    if (!client) return updateMockOrderStatus(orderId, status);

    const byReference = await client
      .from("orders")
      .update({ status })
      .eq("reference_number", orderId)
      .select("id")
      .maybeSingle();

    if (!byReference.error && byReference.data) {
      return getPortalOrderById(orderId);
    }

    const byId = await client
      .from("orders")
      .update({ status })
      .eq("id", orderId)
      .select("reference_number")
      .maybeSingle();

    if (!byId.error && byId.data) {
      return getPortalOrderById(byId.data.reference_number ?? orderId);
    }

    return updateMockOrderStatus(orderId, status);
  } catch {
    return updateMockOrderStatus(orderId, status);
  }
}

export async function listPortalConversations(): Promise<PortalConversation[]> {
  try {
    const actor = await resolvePortalActor();
    const client = createPortalAdminClient();
    if (!actor || !client) return listMockConversations();

    const { data, error } = await client
      .from("conversations")
      .select(
        "id,subject,status,updated_at,order_id,product_id,messages(id,sender_type,body,created_at,attachment_url)",
      )
      .eq("customer_id", actor.customer.id)
      .order("updated_at", { ascending: false });

    if (error || !data?.length) return listMockConversations();

    return data.map(mapConversationRow);
  } catch {
    return listMockConversations();
  }
}

export async function createPortalConversation(input: {
  title: string;
  subjectType: "producto" | "pedido" | "general";
  relatedOrderId?: string | null;
  relatedProductSlug?: string | null;
}) {
  try {
    const actor = await resolvePortalActor();
    const client = createPortalAdminClient();
    if (!actor || !client) return createMockConversation(input);

    let orderId: string | null = null;
    if (input.relatedOrderId) {
      const orderLookup = await client
        .from("orders")
        .select("id")
        .eq("reference_number", input.relatedOrderId)
        .maybeSingle();
      orderId = orderLookup.data?.id ?? null;
    }

    let productId: string | null = null;
    if (input.relatedProductSlug) {
      const productLookup = await client
        .from("products")
        .select("id")
        .eq("slug", input.relatedProductSlug)
        .maybeSingle();
      productId = productLookup.data?.id ?? null;
    }

    const insert = await client
      .from("conversations")
      .insert({
        customer_id: actor.customer.id,
        created_by_user_id: actor.user?.id ?? null,
        subject: input.title,
        status: "open",
        order_id: orderId,
        product_id: productId,
        last_message_at: new Date().toISOString(),
      })
      .select("id,subject,status,updated_at,order_id,product_id")
      .single();

    if (insert.error || !insert.data) return createMockConversation(input);

    return mapConversationRow({ ...insert.data, messages: [] });
  } catch {
    return createMockConversation(input);
  }
}

export async function appendPortalMessage(input: {
  conversationId: string;
  sender: "customer" | "support" | "bonny";
  body: string;
  attachmentName?: string | null;
}) {
  try {
    const actor = await resolvePortalActor();
    const client = createPortalAdminClient();
    if (!actor || !client) return appendMockMessage(input);

    const insert = await client
      .from("messages")
      .insert({
        conversation_id: input.conversationId,
        sender_type: input.sender,
        sender_user_id: actor.user?.id ?? null,
        body: input.body,
        attachment_url: input.attachmentName ?? null,
      })
      .select("id,sender_type,body,created_at,attachment_url")
      .single();

    if (insert.error || !insert.data) return appendMockMessage(input);

    await client
      .from("conversations")
      .update({
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
        status: "open",
      })
      .eq("id", input.conversationId);

    return {
      id: insert.data.id,
      sender: mapMessageSender(insert.data.sender_type),
      body: insert.data.body ?? "",
      createdAt: insert.data.created_at ?? new Date().toISOString(),
      attachmentName: attachmentNameFromUrl(insert.data.attachment_url),
    } satisfies PortalMessage;
  } catch {
    return appendMockMessage(input);
  }
}
