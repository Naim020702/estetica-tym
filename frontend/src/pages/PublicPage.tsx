import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { CatalogView } from '../components/CatalogView';
import { catalogApi } from '../services/api';
import { CatalogPayload } from '../types/catalog';

export const PublicPage: React.FC = () => {
  const [data, setData] = useState<CatalogPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await catalogApi.getPublicCatalog();
      setData(payload);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo cargar el catálogo publicado. Verificá que el backend esté iniciado.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalog();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-400">
        <Loader2 className="h-8 w-8 animate-spin text-rosebrand-600" />
        <p className="text-sm font-medium">Cargando catálogo de Estética T&amp;M...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 p-6">
        <div className="max-w-md rounded-2xl border border-red-200 dark:border-red-900 bg-white dark:bg-stone-900 p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <h2 className="mt-3 font-serif text-lg font-bold text-stone-900 dark:text-white">
            No se pudo conectar con el servidor
          </h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{error}</p>
          <button
            type="button"
            onClick={() => void loadCatalog()}
            className="mt-4 rounded-xl bg-rosebrand-600 hover:bg-rosebrand-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <CatalogView
      settings={data.settings}
      items={data.items}
      isAdminRoute={false}
      isEditMode={false}
    />
  );
};
