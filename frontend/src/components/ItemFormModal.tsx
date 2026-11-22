import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { CatalogItem, CatalogItemInput, ItemType } from '../types/catalog';
import { ImageUploadCropper } from './ImageUploadCropper';

interface ItemFormModalProps {
  isOpen: boolean;
  initialItem?: CatalogItem | null;
  existingCategories: string[];
  onClose: () => void;
  onSave: (data: CatalogItemInput) => Promise<void>;
}

const DEFAULT_FORM: CatalogItemInput = {
  itemType: 'service',
  category: 'Tratamientos Faciales',
  name: '',
  description: '',
  price: 25000,
  duration: '50 min',
  imageUrl: '',
  isVisible: true,
  sortOrder: 0,
};

export const ItemFormModal: React.FC<ItemFormModalProps> = ({
  isOpen,
  initialItem,
  existingCategories,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<CatalogItemInput>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialItem) {
      setForm({
        itemType: initialItem.itemType,
        category: initialItem.category,
        name: initialItem.name,
        description: initialItem.description,
        price: initialItem.price,
        duration: initialItem.duration,
        imageUrl: initialItem.imageUrl,
        isVisible: initialItem.isVisible,
        sortOrder: initialItem.sortOrder,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setError(null);
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando el ítem');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 px-6 py-4">
          <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white">
            {initialItem ? 'Modificar Ítem (en Borrador)' : 'Nuevo Ítem en Catálogo (Borrador)'}
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
                Tipo
              </label>
              <select
                value={form.itemType}
                onChange={(e) => setForm({ ...form, itemType: e.target.value as ItemType })}
                className="mt-1.5 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-white focus:border-rosebrand-500 focus:outline-none"
              >
                <option value="service">Servicio / Tratamiento</option>
                <option value="product">Producto Cosmético</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Categoría
              </label>
              <input
                type="text"
                list="categories-datalist"
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Ej. Tratamientos Faciales"
                className="mt-1.5 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-white focus:border-rosebrand-500 focus:outline-none"
              />
              <datalist id="categories-datalist">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Nombre del Servicio o Producto
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ej. Limpieza Facial Profunda"
              className="mt-1.5 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-white focus:border-rosebrand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Descripción
            </label>
            <textarea
              rows={3}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describí en qué consiste y sus beneficios principales..."
              className="mt-1.5 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-white focus:border-rosebrand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Precio (ARS)
              </label>
              <input
                type="number"
                min={0}
                step="100"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="mt-1.5 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-white focus:border-rosebrand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Duración / Presentación
              </label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="Ej. 60 min o 30 ml"
                className="mt-1.5 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-white focus:border-rosebrand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Orden visual
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                className="mt-1.5 w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-white focus:border-rosebrand-500 focus:outline-none"
              />
            </div>
          </div>

          <ImageUploadCropper
            currentImageUrl={form.imageUrl}
            onImageChange={(dataUrl) => setForm((prev) => ({ ...prev, imageUrl: dataUrl }))}
          />

          <div className="flex items-center gap-2.5 pt-1">
            <input
              id="item-visible-checkbox"
              type="checkbox"
              checked={form.isVisible}
              onChange={(e) => setForm({ ...form, isVisible: e.target.checked })}
              className="h-4 w-4 rounded border-stone-300 text-rosebrand-600 focus:ring-rosebrand-500"
            />
            <label
              htmlFor="item-visible-checkbox"
              className="text-sm font-medium text-stone-700 dark:text-stone-300"
            >
              Visible en el catálogo público al publicar
            </label>
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
