import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound, Loader2, Lock, Sparkles } from 'lucide-react';
import { AdminToolbar } from '../components/AdminToolbar';
import { CatalogView } from '../components/CatalogView';
import { ItemFormModal } from '../components/ItemFormModal';
import { SettingsFormModal } from '../components/SettingsFormModal';
import { catalogApi } from '../services/api';
import { CatalogItem, CatalogItemInput, CatalogPayload, SiteSettings } from '../types/catalog';

const PIN_STORAGE_KEY = 'estetica_tym_admin_pin';

export const AdminPage: React.FC = () => {
  const [pin, setPin] = useState<string>(() => localStorage.getItem(PIN_STORAGE_KEY) || '');
  const [pinInput, setPinInput] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);

  const [data, setData] = useState<CatalogPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [toast, setToast] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(
    null
  );

  const [itemModalOpen, setItemModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);

  const showToast = (type: 'success' | 'info' | 'error', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const fetchDraftCatalog = useCallback(async (activePin: string) => {
    setLoading(true);
    try {
      const payload = await catalogApi.getDraftCatalog(activePin);
      setData(payload);
      setIsAuthenticated(true);
    } catch (err) {
      localStorage.removeItem(PIN_STORAGE_KEY);
      setPin('');
      setIsAuthenticated(false);
      setAuthError(err instanceof Error ? err.message : 'Sesión de PIN inválida');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pin) {
      void fetchDraftCatalog(pin);
    }
  }, [pin, fetchDraftCatalog]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setVerifying(true);
    try {
      const cleanPin = pinInput.trim();
      await catalogApi.verifyPin(cleanPin);
      localStorage.setItem(PIN_STORAGE_KEY, cleanPin);
      setPin(cleanPin);
      setPinInput('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'PIN maestro incorrecto');
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(PIN_STORAGE_KEY);
    setPin('');
    setIsAuthenticated(false);
    setData(null);
  };

  const handleSaveItem = async (input: CatalogItemInput) => {
    if (editingItem) {
      await catalogApi.updateDraftItem(pin, editingItem.id, input);
      showToast('success', 'Ítem actualizado en el borrador (Draft).');
    } else {
      await catalogApi.createDraftItem(pin, input);
      showToast('success', 'Nuevo ítem creado en el borrador (Draft).');
    }
    const refreshed = await catalogApi.getDraftCatalog(pin);
    setData(refreshed);
  };

  const handleToggleVisibility = async (item: CatalogItem) => {
    setIsBusy(true);
    try {
      await catalogApi.toggleDraftVisibility(pin, item.id);
      const refreshed = await catalogApi.getDraftCatalog(pin);
      setData(refreshed);
      showToast(
        'info',
        item.isVisible
          ? `"${item.name}" ocultado en el borrador.`
          : `"${item.name}" marcado como visible en el borrador.`
      );
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'No se pudo cambiar la visibilidad');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteItem = async (item: CatalogItem) => {
    if (!window.confirm(`¿Eliminar "${item.name}" del borrador?`)) {
      return;
    }
    setIsBusy(true);
    try {
      await catalogApi.deleteDraftItem(pin, item.id);
      const refreshed = await catalogApi.getDraftCatalog(pin);
      setData(refreshed);
      showToast('info', `"${item.name}" eliminado del borrador.`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'No se pudo eliminar el ítem');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveSettings = async (settings: SiteSettings) => {
    await catalogApi.updateDraftSettings(pin, settings);
    const refreshed = await catalogApi.getDraftCatalog(pin);
    setData(refreshed);
    showToast('success', 'Portada y enlaces actualizados en el borrador (Draft).');
  };

  const handlePublish = async () => {
    if (
      !window.confirm(
        '¿Publicar todos los cambios del borrador (Draft) hacia la web pública (Live)? Impactará al instante.'
      )
    ) {
      return;
    }
    setIsBusy(true);
    try {
      const updated = await catalogApi.publishDraft(pin);
      setData(updated);
      showToast('success', '¡Cambios publicados en vivo (Live) exitosamente!');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Error al publicar cambios');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDiscard = async () => {
    if (
      !window.confirm(
        '¿Descartar todos los cambios pendientes del borrador? Se restaurará una copia exacta de la web pública actual (Live).'
      )
    ) {
      return;
    }
    setIsBusy(true);
    try {
      const restored = await catalogApi.discardDraft(pin);
      setData(restored);
      showToast('info', 'Cambios descartados. Borrador restaurado desde Live.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Error al descartar cambios');
    } finally {
      setIsBusy(false);
    }
  };

  const existingCategories = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.items.map((i) => i.category).filter(Boolean)));
  }, [data]);

  // Pantalla de Solicitud de PIN Maestro
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-100 dark:bg-stone-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-8 shadow-xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rosebrand-600 text-white shadow-sm">
            <Lock className="h-6 w-6" />
          </div>

          <h1 className="mt-4 text-center font-serif text-2xl font-bold text-stone-900 dark:text-white">
            Panel de Administración
          </h1>
          <p className="mt-1 text-center text-xs text-stone-500 dark:text-stone-400">
            Ingresá la clave o PIN maestro para gestionar el catálogo en entorno Borrador (Draft).
          </p>

          <form onSubmit={handlePinSubmit} className="mt-6 space-y-4">
            {authError && (
              <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 p-3 text-center text-xs font-medium text-red-600 dark:text-red-300">
                {authError}
              </div>
            )}

            <div>
              <label
                htmlFor="admin-pin-input"
                className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400"
              >
                PIN Maestro
              </label>
              <div className="relative mt-1.5">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  id="admin-pin-input"
                  type="password"
                  required
                  autoFocus
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Ingresá el PIN (ej. 1234)"
                  className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 pl-10 pr-4 py-2.5 text-sm text-stone-900 dark:text-white focus:border-rosebrand-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={verifying || loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rosebrand-600 hover:bg-rosebrand-500 disabled:opacity-50 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
            >
              {(verifying || loading) && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Ingresar al Entorno Borrador</span>
            </button>
          </form>

          <div className="mt-6 border-t border-stone-100 dark:border-stone-800 pt-4 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-rosebrand-600 dark:text-stone-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver a la web pública (Live)</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-400">
        <Loader2 className="h-8 w-8 animate-spin text-rosebrand-600" />
        <p className="text-sm font-medium">Cargando entorno Borrador (Draft)...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Barra Superior Fija de Administración */}
      <AdminToolbar
        mode={mode}
        hasDraftDiff={data.hasDraftDiff}
        isBusy={isBusy}
        onToggleMode={setMode}
        onNewItem={() => {
          setEditingItem(null);
          setItemModalOpen(true);
        }}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onPublish={() => void handlePublish()}
        onDiscard={() => void handleDiscard()}
        onLogout={handleLogout}
      />

      {/* Notificación flotante (Toast) */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-lg border ${
              toast.type === 'success'
                ? 'bg-emerald-950 text-emerald-200 border-emerald-700'
                : toast.type === 'error'
                ? 'bg-red-950 text-red-200 border-red-700'
                : 'bg-stone-900 text-stone-100 border-stone-700'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-rosebrand-400" />
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Reutilización del mismo componente visual de la web pública */}
      <CatalogView
        settings={data.settings}
        items={data.items}
        isAdminRoute={true}
        isEditMode={mode === 'edit'}
        onCreateItem={() => {
          setEditingItem(null);
          setItemModalOpen(true);
        }}
        onEditItem={(item) => {
          setEditingItem(item);
          setItemModalOpen(true);
        }}
        onToggleVisibility={(item) => void handleToggleVisibility(item)}
        onDeleteItem={(item) => void handleDeleteItem(item)}
        onEditSettings={() => setSettingsModalOpen(true)}
      />

      {/* Modales de Edición en Borrador */}
      <ItemFormModal
        isOpen={itemModalOpen}
        initialItem={editingItem}
        existingCategories={existingCategories}
        onClose={() => setItemModalOpen(false)}
        onSave={handleSaveItem}
      />

      <SettingsFormModal
        isOpen={settingsModalOpen}
        initialSettings={data.settings}
        onClose={() => setSettingsModalOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
};
