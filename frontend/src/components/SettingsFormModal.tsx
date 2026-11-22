import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { SiteSettings } from '../types/catalog';

interface SettingsFormModalProps {
  isOpen: boolean;
  initialSettings: SiteSettings;
  onClose: () => void;
  onSave: (settings: SiteSettings) => Promise<void>;
}

export const SettingsFormModal: React.FC<SettingsFormModalProps> = ({
  isOpen,
  initialSettings,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<SiteSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(initialSettings);
    setError(null);
  }, [initialSettings, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 px-6 py-4">
          <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white">
            Configuración de Portada y Accesos Directos (Borrador)
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-3 text-xs text-red-600 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Nombre de la Estética
              </label>
              <input
                type="text"
                required
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-white focus:border-rosebrand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Lema / Subtítulo corto
              </label>
              <input
                type="text"
                required
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-white focus:border-rosebrand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Título Principal de Portada (Hero)
            </label>
            <input
              type="text"
              required
              value={form.heroTitle}
              onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-white focus:border-rosebrand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Bajada de Portada
            </label>
            <textarea
              rows={2}
              required
              value={form.heroSubtitle}
              onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-white focus:border-rosebrand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Dirección Visible
              </label>
              <input
                type="text"
                value={form.addressText}
                onChange={(e) => setForm({ ...form, addressText: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-white focus:border-rosebrand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Horarios de Atención
              </label>
              <input
                type="text"
                value={form.openingHours}
                onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-white focus:border-rosebrand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Enlace Directo de WhatsApp (Opcional)
            </label>
            <input
              type="url"
              value={form.whatsappUrl}
              onChange={(e) => setForm({ ...form, whatsappUrl: e.target.value })}
              placeholder="https://wa.me/54911... (Dejar vacío para ocultar)"
              className="mt-1.5 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-white focus:border-rosebrand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Enlace de Instagram Oficial (Opcional)
            </label>
            <input
              type="url"
              value={form.instagramUrl}
              onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
              placeholder="https://instagram.com/... (Dejar vacío para ocultar)"
              className="mt-1.5 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-white focus:border-rosebrand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Enlace de Ubicación en Google Maps (Opcional)
            </label>
            <input
              type="url"
              value={form.mapsUrl}
              onChange={(e) => setForm({ ...form, mapsUrl: e.target.value })}
              placeholder="https://maps.google.com/?q=... (Dejar vacío para ocultar)"
              className="mt-1.5 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-white focus:border-rosebrand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Enlace de Colección de Pinterest / Nails Inspo (Opcional)
            </label>
            <input
              type="url"
              value={form.pinterestUrl || ''}
              onChange={(e) => setForm({ ...form, pinterestUrl: e.target.value })}
              placeholder="https://pinterest.com/... (Dejar vacío para ocultar)"
              className="mt-1.5 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-white focus:border-rosebrand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-stone-200 dark:border-stone-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-rosebrand-600 hover:bg-rosebrand-500 disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white shadow-sm"
            >
              {saving ? 'Guardando en Borrador...' : 'Guardar en Borrador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
