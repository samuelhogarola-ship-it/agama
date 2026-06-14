export type ProductCategorySlug =
  | "pigmentos"
  | "masterbatch"
  | "aditivos"
  | "desmoldantes"
  | "purgas"
  | "productos-especiales";

export type OrderStatus =
  | "Recibido"
  | "En revisión"
  | "En preparación"
  | "Enviado"
  | "Completado"
  | "Cancelado";

export type PortalCategory = {
  slug: ProductCategorySlug;
  name: string;
  shortName: string;
  description: string;
  accent: string;
};

export type RawProduct = {
  id?: string;
  slug: string;
  nombre: string;
  tipo_producto?: string | null;
  tipo?: string | null;
  acabado?: string | null;
  color?: string | null;
  precio?: number | null;
  descripcion?: string | null;
  informacion?: string | null;
  ficha_tecnica?: string | null;
  portada?: string | null;
  galeria?: string | null;
  category_id?: string | null;
  code?: string | null;
  minimum_order_qty?: number | null;
  applications?: string[] | null;
  is_quote_only?: boolean | null;
  is_featured?: boolean | null;
  sort_order?: number | null;
};

export type PortalProduct = {
  id: string;
  slug: string;
  name: string;
  code: string;
  type: string;
  family: string;
  finish: string | null;
  color: string | null;
  price: number | null;
  description: string;
  longDescription: string;
  cover: string | null;
  gallery: string[];
  techSheetUrl: string | null;
  minOrderQty: string;
  applications: string[];
  isQuoteOnly: boolean;
  isFeatured: boolean;
  categorySlugs: ProductCategorySlug[];
  accent: string;
};

export type CustomerProfile = {
  company: string;
  contactName: string;
  email: string;
  phone: string;
  billingAddress: string;
  shippingAddress: string;
  taxId: string;
  contactPreference: string;
};

export type OrderItem = {
  productSlug: string;
  productName: string;
  productCode: string;
  quantity: number;
  unit: string;
  unitPrice: number | null;
};

export type PortalOrder = {
  id: string;
  date: string;
  status: OrderStatus;
  channel: string;
  amount: number | null;
  note: string;
  customerName: string;
  items: OrderItem[];
};

export type PortalMessage = {
  id: string;
  sender: "customer" | "support" | "bonny";
  body: string;
  createdAt: string;
  attachmentName?: string | null;
};

export type PortalConversation = {
  id: string;
  title: string;
  subjectType: "producto" | "pedido" | "general";
  relatedOrderId?: string | null;
  relatedProductSlug?: string | null;
  status: "Abierto" | "Respondido" | "Cerrado";
  updatedAt: string;
  messages: PortalMessage[];
};
