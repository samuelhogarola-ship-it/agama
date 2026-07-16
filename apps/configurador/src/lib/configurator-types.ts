export type AgamaColorValidationStatus = "validated" | "pending";
export type AgamaColorLine = "masterbatch" | "pigmentos";
export type AgamaSwatchSource = "product-image" | "sheet-image";
export type AgamaColorFamily =
  | "amarillos"
  | "azules"
  | "verdes"
  | "naranjas"
  | "rojos"
  | "rosas"
  | "morados"
  | "negros"
  | "blancos"
  | "grises"
  | "naturales"
  | "transparentes"
  | "cafes"
  | "ambar"
  | "metalicos";

export type AgamaColor = {
  code: string;
  name: string;
  family: AgamaColorFamily;
  hex: string | null;
  validationStatus: AgamaColorValidationStatus;
  line: AgamaColorLine;
  slug: string;
  finish: string | null;
  swatchAssetUrl: string | null;
  swatchSource: AgamaSwatchSource | null;
  sourceSheetUrl: string | null;
  sourceImageUrl: string | null;
};

export type AgamaColorGenerated = Omit<AgamaColor, "hex" | "validationStatus"> & {
  hex: null;
  validationStatus: "pending";
};

export type AgamaColorValidation = {
  hex: string;
  notes?: string;
  validatedAt?: string;
};

export type AgamaColorValidationMap = Partial<Record<string, AgamaColorValidation>>;

export type RenderableAssetKind = "svg-placeholder" | "png-cutout" | "hybrid";

export type RenderableProductAsset = {
  kind: RenderableAssetKind;
  source: string | null;
  supportsTint: boolean;
  supportsEmboss: boolean;
};

export type AgamaConfiguratorProductId =
  | "bucket"
  | "lid"
  | "bottle"
  | "cup"
  | "chair"
  | "container";

export type AgamaConfiguratorProduct = {
  id: AgamaConfiguratorProductId;
  name: string;
  category: "industrial" | "component" | "consumer" | "furniture" | "storage";
  placeholderLabel: string;
  baseImage: string | null;
  maskImage: string | null;
  supportsTint: boolean;
  asset: RenderableProductAsset;
  status: "placeholder";
};

export type ConfiguratorActiveSlot = "a" | "b";

export type ConfiguratorState = {
  productId: AgamaConfiguratorProductId;
  primaryColorCode: string | null;
  compareColorCode: string | null;
  activeSlot: ConfiguratorActiveSlot;
  compareEnabled: boolean;
};

export type RenderColorSlot = {
  code: string;
  name: string;
  hex: string | null;
  validatedHex: string | null;
  validationStatus: AgamaColorValidationStatus;
  line: AgamaColorLine;
  swatchAssetUrl: string | null;
};

export type RenderModel = {
  product: AgamaConfiguratorProduct;
  asset: RenderableProductAsset;
  embossLogoSrc: string;
  primaryColor: RenderColorSlot | null;
  compareColor: RenderColorSlot | null;
  activeSlot: ConfiguratorActiveSlot;
  selectedColor: RenderColorSlot | null;
  previewImageUrl: string | null;
  previewUsesFixedRender: boolean;
  showRenderPending: boolean;
  tintHex: string | null;
  tintEnabled: boolean;
  previewSwatchUrl: string | null;
  hasSelectedColor: boolean;
  showPendingState: boolean;
};

export type ProductRendererAdapter = {
  buildRenderModel(input: {
    product: AgamaConfiguratorProduct;
    primaryColor: AgamaColor | null;
    compareColor: AgamaColor | null;
    activeSlot: ConfiguratorActiveSlot;
  }): RenderModel;
};

export type ConfigurationDraft = {
  configurationId: string;
  productId: AgamaConfiguratorProductId;
  colorCode: string;
  compareColorCode?: string | null;
};

export type ConfigurationLineItem = {
  configurationId: string;
  quantityKg?: number;
  pricePerKg?: number | null;
  estimatedAmount?: number | null;
};

export type CommercialRequestDraft = {
  productId: AgamaConfiguratorProductId;
  colorCode: string;
  quantityKg?: number;
  notes?: string;
};

// Future commerce integration contracts:
// - CRM availability by store/sucursal
// - shared payment gateway with the main AGAMA store
export type StoreAvailabilityStatus = "in_stock" | "low_stock" | "out_of_stock" | "unknown";

export type StoreInventorySnapshot = {
  storeId: string;
  storeName: string;
  sku: string;
  availableUnits: number | null;
  status: StoreAvailabilityStatus;
  updatedAt: string | null;
};

export type CrmAvailabilityRecord = {
  productId: AgamaConfiguratorProductId;
  colorCode: string;
  stores: StoreInventorySnapshot[];
  source: "crm-api";
};

export type PaymentGatewayStatus = "not_connected" | "ready" | "disabled";

export type PaymentGatewayConfig = {
  provider: string;
  status: PaymentGatewayStatus;
  checkoutBaseUrl: string | null;
  sharedWithMainStore: boolean;
};

export type CheckoutDraft = {
  configurationIds: string[];
  paymentGateway: PaymentGatewayConfig | null;
  crmAvailability: CrmAvailabilityRecord | null;
};

export type ConfiguratorAnalyticsEventName =
  | "color_selected"
  | "product_selected"
  | "compare_started"
  | "cart_item_added"
  | "quote_started"
  | "quote_succeeded"
  | "quote_failed"
  | "png_downloaded"
  | "share_generated";

export type ConfiguratorAnalyticsEventPayloadMap = {
  color_selected: {
    colorCode: string;
    productId: AgamaConfiguratorProductId;
    slot: ConfiguratorActiveSlot;
    validationStatus: AgamaColorValidationStatus;
  };
  product_selected: {
    productId: AgamaConfiguratorProductId;
    activeColorCode: string | null;
  };
  compare_started: {
    productId: AgamaConfiguratorProductId;
    primaryColorCode: string | null;
  };
  cart_item_added: {
    productId: AgamaConfiguratorProductId;
    colorCode: string;
    quantityKg: number;
  };
  quote_started: { itemCount: number; totalKg: number };
  quote_succeeded: { itemCount: number; totalKg: number; quoteId: string };
  quote_failed: { itemCount: number; totalKg: number; reason: string };
  png_downloaded: {
    productId: AgamaConfiguratorProductId;
    colorCode: string | null;
    exportReady: boolean;
  };
  share_generated: {
    productId: AgamaConfiguratorProductId;
    colorCode: string | null;
    compareColorCode: string | null;
  };
};

export type ConfiguratorAnalyticsDetail<TName extends ConfiguratorAnalyticsEventName> = {
  name: TName;
  payload: ConfiguratorAnalyticsEventPayloadMap[TName];
  emittedAt: string;
};
