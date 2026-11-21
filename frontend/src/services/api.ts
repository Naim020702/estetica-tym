import { CatalogItem, CatalogItemInput, CatalogPayload, SiteSettings } from '../types/catalog';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options: RequestInit = {}, adminPin?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (adminPin) {
    headers['X-Admin-Pin'] = adminPin;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Error HTTP ${response.status}`);
  }
  return data as T;
}

export const catalogApi = {
  getPublicCatalog: () => request<CatalogPayload>('/public/catalog'),

  verifyPin: (pin: string) =>
    request<{ authenticated: boolean; message: string }>('/admin/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),

  getDraftCatalog: (pin: string) =>
    request<CatalogPayload>('/admin/catalog', { method: 'GET' }, pin),

  createDraftItem: (pin: string, item: CatalogItemInput) =>
    request<CatalogItem>(
      '/admin/items',
      {
        method: 'POST',
        body: JSON.stringify(item),
      },
      pin
    ),

  updateDraftItem: (pin: string, id: number, item: CatalogItemInput) =>
    request<CatalogItem>(
      `/admin/items/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(item),
      },
      pin
    ),

  toggleDraftVisibility: (pin: string, id: number) =>
    request<CatalogItem>(
      `/admin/items/${id}/visibility`,
      {
        method: 'PATCH',
      },
      pin
    ),

  deleteDraftItem: (pin: string, id: number) =>
    request<{ message: string }>(
      `/admin/items/${id}`,
      {
        method: 'DELETE',
      },
      pin
    ),

  updateDraftSettings: (pin: string, settings: SiteSettings) =>
    request<SiteSettings>(
      '/admin/settings',
      {
        method: 'PUT',
        body: JSON.stringify(settings),
      },
      pin
    ),

  publishDraft: (pin: string) =>
    request<CatalogPayload>(
      '/admin/publish',
      {
        method: 'POST',
      },
      pin
    ),

  discardDraft: (pin: string) =>
    request<CatalogPayload>(
      '/admin/discard',
      {
        method: 'POST',
      },
      pin
    ),
};
