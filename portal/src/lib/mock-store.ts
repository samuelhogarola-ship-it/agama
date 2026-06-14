import type {
  CustomerProfile,
  OrderStatus,
  PortalConversation,
  PortalOrder,
} from "@/lib/types";

const now = new Date();

const initialProfile: CustomerProfile = {
  company: "Plasticos del Centro S.A. de C.V.",
  contactName: "Carlos Mendoza",
  email: "compras@plasticosdelcentro.mx",
  phone: "+52 55 7351 5156",
  billingAddress: "Av. Lerma 320-MZ 019, Santa Maria, San Isidro, Toluca, Estado de Mexico",
  shippingAddress: "Bodega 7, Parque Industrial Lerma, Estado de Mexico",
  taxId: "PCE240417TG3",
  contactPreference: "WhatsApp y correo",
};

let orders: PortalOrder[] = [
  {
    id: "AG-000156",
    date: new Date(now.getTime() - 1000 * 60 * 60 * 28).toISOString(),
    status: "En preparación",
    channel: "Portal",
    amount: 28450,
    note: "Entrega coordinada en Toluca con prioridad de linea.",
    customerName: initialProfile.company,
    items: [
      {
        productSlug: "mb-119-mb-rosa-solferino",
        productName: "MB-119 MB ROSA SOLFERINO",
        productCode: "MB-119",
        quantity: 300,
        unit: "kg",
        unitPrice: 95,
      },
      {
        productSlug: "mb-106-mb-azul-rey",
        productName: "MB-106 MB AZUL REY",
        productCode: "MB-106",
        quantity: 120,
        unit: "kg",
        unitPrice: 80,
      },
    ],
  },
  {
    id: "AG-000151",
    date: new Date(now.getTime() - 1000 * 60 * 60 * 92).toISOString(),
    status: "Enviado",
    channel: "WhatsApp",
    amount: 12700,
    note: "Pedido recurrente con guia compartida al cliente.",
    customerName: initialProfile.company,
    items: [
      {
        productSlug: "ad-318-purga",
        productName: "AD-318 PURGA",
        productCode: "AD-318",
        quantity: 25,
        unit: "kg",
        unitPrice: null,
      },
    ],
  },
  {
    id: "AG-000148",
    date: new Date(now.getTime() - 1000 * 60 * 60 * 172).toISOString(),
    status: "Completado",
    channel: "Soporte comercial",
    amount: 9300,
    note: "Cambio de tonalidad validado por cliente antes de surtir.",
    customerName: initialProfile.company,
    items: [
      {
        productSlug: "mb-116-mb-rojo-bandera",
        productName: "MB-116 MB ROJO BANDERA",
        productCode: "MB-116",
        quantity: 80,
        unit: "kg",
        unitPrice: 116,
      },
    ],
  },
];

let conversations: PortalConversation[] = [
  {
    id: "conv-001",
    title: "Cotizacion linea rosa premium",
    subjectType: "producto",
    relatedProductSlug: "mb-119-mb-rosa-solferino",
    status: "Abierto",
    updatedAt: new Date(now.getTime() - 1000 * 60 * 14).toISOString(),
    messages: [
      {
        id: "msg-001",
        sender: "customer",
        body: "Necesito confirmar tiempo de entrega para 300 kg de Rosa Solferino.",
        createdAt: new Date(now.getTime() - 1000 * 60 * 35).toISOString(),
      },
      {
        id: "msg-002",
        sender: "support",
        body: "Estamos revisando inventario y te confirmamos hoy mismo.",
        createdAt: new Date(now.getTime() - 1000 * 60 * 24).toISOString(),
      },
      {
        id: "msg-003",
        sender: "bonny",
        body: "Si quieres, puedo ayudarte a redactar una consulta con cantidad, resina y destino final.",
        createdAt: new Date(now.getTime() - 1000 * 60 * 20).toISOString(),
      },
    ],
  },
  {
    id: "conv-002",
    title: "Seguimiento pedido AG-000156",
    subjectType: "pedido",
    relatedOrderId: "AG-000156",
    status: "Respondido",
    updatedAt: new Date(now.getTime() - 1000 * 60 * 66).toISOString(),
    messages: [
      {
        id: "msg-004",
        sender: "customer",
        body: "Podemos cambiar la direccion de descarga del pedido AG-000156?",
        createdAt: new Date(now.getTime() - 1000 * 60 * 70).toISOString(),
      },
      {
        id: "msg-005",
        sender: "support",
        body: "Si, ya actualizamos la descarga al Parque Industrial Lerma.",
        createdAt: new Date(now.getTime() - 1000 * 60 * 66).toISOString(),
      },
    ],
  },
  {
    id: "conv-003",
    title: "Purga para cambio de corrida",
    subjectType: "producto",
    relatedProductSlug: "ad-318-purga",
    status: "Cerrado",
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 18).toISOString(),
    messages: [
      {
        id: "msg-006",
        sender: "customer",
        body: "Que presentacion recomiendan para purgar linea de inyeccion?",
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 19).toISOString(),
      },
      {
        id: "msg-007",
        sender: "support",
        body: "Te compartimos la ficha y el procedimiento recomendado para tu linea.",
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 18).toISOString(),
        attachmentName: "AD-318 Purga.pdf",
      },
    ],
  },
];

export function getCustomerProfile() {
  return initialProfile;
}

export function listOrders() {
  return [...orders].sort((left, right) => right.date.localeCompare(left.date));
}

export function getOrderById(id: string) {
  return orders.find((order) => order.id === id) ?? null;
}

export function createOrder(input: {
  productSlug: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice?: number | null;
}) {
  const orderId = `AG-${String(orders.length + 157).padStart(6, "0")}`;
  const unitPrice = input.unitPrice ?? null;
  const amount = unitPrice ? unitPrice * input.quantity : null;

  const order: PortalOrder = {
    id: orderId,
    date: new Date().toISOString(),
    status: "Recibido",
    channel: "Portal",
    amount,
    note: "Solicitud creada desde el portal de clientes.",
    customerName: initialProfile.company,
    items: [
      {
        productSlug: input.productSlug,
        productName: input.productName,
        productCode: input.productCode,
        quantity: input.quantity,
        unit: "kg",
        unitPrice,
      },
    ],
  };

  orders = [order, ...orders];
  return order;
}

export function repeatOrder(orderId: string) {
  const source = getOrderById(orderId);
  if (!source) return null;

  const clone: PortalOrder = {
    ...source,
    id: `AG-${String(orders.length + 157).padStart(6, "0")}`,
    date: new Date().toISOString(),
    status: "Recibido",
    note: `Repeticion del pedido ${source.id} desde el portal.`,
  };

  orders = [clone, ...orders];
  return clone;
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  const order = getOrderById(orderId);
  if (!order) return null;

  orders = orders.map((item) => (item.id === orderId ? { ...item, status } : item));
  return orders.find((item) => item.id === orderId) ?? null;
}

export function listConversations() {
  return [...conversations].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function createConversation(input: {
  title: string;
  subjectType: "producto" | "pedido" | "general";
  relatedOrderId?: string | null;
  relatedProductSlug?: string | null;
}) {
  const conversation: PortalConversation = {
    id: `conv-${String(conversations.length + 1).padStart(3, "0")}`,
    title: input.title,
    subjectType: input.subjectType,
    relatedOrderId: input.relatedOrderId ?? null,
    relatedProductSlug: input.relatedProductSlug ?? null,
    status: "Abierto",
    updatedAt: new Date().toISOString(),
    messages: [],
  };

  conversations = [conversation, ...conversations];
  return conversation;
}

export function appendMessage(input: {
  conversationId: string;
  sender: "customer" | "support" | "bonny";
  body: string;
  attachmentName?: string | null;
}) {
  const message = {
    id: `msg-${String(Date.now()).slice(-6)}`,
    sender: input.sender,
    body: input.body,
    createdAt: new Date().toISOString(),
    attachmentName: input.attachmentName ?? null,
  } as const;

  conversations = conversations.map((conversation) => {
    if (conversation.id !== input.conversationId) return conversation;

    return {
      ...conversation,
      updatedAt: new Date().toISOString(),
      status: "Abierto",
      messages: [...conversation.messages, message],
    };
  });

  return message;
}
