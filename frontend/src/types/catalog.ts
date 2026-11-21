export type EnvType = 'live' | 'draft';
export type ItemType = 'service' | 'product';

export interface SiteSettings {
  env: EnvType;
  businessName: string;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  whatsappUrl: string;
  instagramUrl: string;
  mapsUrl: string;
  addressText: string;
  openingHours: string;
  updatedAt?: string;
}

export interface CatalogItem {
  id: number;
  env: EnvType;
  itemType: ItemType;
  category: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  imageUrl: string;
  isVisible: boolean;
  sortOrder: number;
  updatedAt?: string;
}

export interface CatalogPayload {
  settings: SiteSettings;
  items: CatalogItem[];
  hasDraftDiff: boolean;
  liveItemsCount: number;
}

export type CatalogItemInput = Omit<CatalogItem, 'id' | 'env' | 'updatedAt'>;
