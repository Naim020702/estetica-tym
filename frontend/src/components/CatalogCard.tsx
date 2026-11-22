import React from 'react';
import {
  Clock,
  Eye,
  EyeOff,
  MessageCircle,
  Package,
  Pencil,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { CatalogItem } from '../types/catalog';

interface CatalogCardProps {
  item: CatalogItem;
  whatsappUrl: string;
  isEditMode: boolean;
  onEdit?: (item: CatalogItem) => void;
  onToggleVisibility?: (item: CatalogItem) => void;
  onDelete?: (item: CatalogItem) => void;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80';

export const CatalogCard: React.FC<CatalogCardProps> = ({
  item,
  whatsappUrl,
  isEditMode,
  onEdit,
  onToggleVisibility,
  onDelete,
}) => {
  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(item.price);

  const buildConsultLink = () => {
    try {
      const base = whatsappUrl.split('?')[0] || 'https://wa.me/';
      const msg = encodeURIComponent(
        `Hola! Quisiera consultar por: ${item.name} (${formattedPrice}).`
      );
      return `${base}?text=${msg}`;
    } catch {
      return whatsappUrl;
    }
  };

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white dark:bg-stone-900 shadow-sm hover:shadow-md transition-all duration-300 ${
        !item.isVisible
          ? 'border-amber-400/70 dark:border-amber-500/60 opacity-75'
          : 'border-stone-200/80 dark:border-stone-800'
      }`}
    >
      {/* Superposición de Controles en Modo Edición (/admin) */}
      {isEditMode && (
        <div className="z-20 flex items-center justify-between gap-2 bg-stone-900/90 dark:bg-stone-950/95 px-3 py-2 text-xs text-white backdrop-blur-sm border-b border-stone-700">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium ${
              item.isVisible
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}
          >
            {item.isVisible ? (
              <>
                <Eye className="h-3.5 w-3.5" /> Visible en web
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5" /> Oculto en web
              </>
            )}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onToggleVisibility?.(item)}
              title={item.isVisible ? 'Ocultar ítem sin borrarlo' : 'Mostrar ítem en el catálogo'}
              className="inline-flex items-center gap-1 rounded-lg bg-stone-800 hover:bg-stone-700 px-2.5 py-1.5 text-stone-200 transition-colors"
            >
              {item.isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span>{item.isVisible ? 'Ocultar' : 'Mostrar'}</span>
            </button>

            <button
              type="button"
              onClick={() => onEdit?.(item)}
              title="Modificar ítem"
              className="inline-flex items-center gap-1 rounded-lg bg-rosebrand-600 hover:bg-rosebrand-500 px-2.5 py-1.5 text-white transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Editar</span>
            </button>

            <button
              type="button"
              onClick={() => onDelete?.(item)}
              title="Eliminar ítem del borrador"
              className="inline-flex items-center rounded-lg bg-red-600/80 hover:bg-red-600 p-1.5 text-white transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Imagen del servicio / producto */}
      <div className="relative h-52 w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
        <img
          src={item.imageUrl || FALLBACK_IMAGE}
          alt={item.name}
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
          }}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-md px-3 py-1 text-xs font-medium text-stone-800 dark:text-stone-200 shadow-sm">
            {item.itemType === 'product' ? (
              <>
                <Package className="h-3.5 w-3.5 text-rosebrand-600 dark:text-rosebrand-400" />
                Producto
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-rosebrand-600 dark:text-rosebrand-400" />
                Servicio
              </>
            )}
          </span>

          <span className="rounded-full bg-rosebrand-600/90 backdrop-blur-md px-3 py-1 text-xs font-medium text-white shadow-sm">
            {item.category}
          </span>
        </div>

        {item.duration && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 text-xs text-white">
            <Clock className="h-3.5 w-3.5 text-rosebrand-300" />
            <span>{item.duration}</span>
          </div>
        )}
      </div>

      {/* Cuerpo de la tarjeta */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100 leading-snug">
            {item.name}
          </h3>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
            {item.description}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-stone-100 dark:border-stone-800 pt-4">
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-stone-400 dark:text-stone-500">
              Valor
            </span>
            <span className="text-xl font-bold text-rosebrand-700 dark:text-rosebrand-400">
              {formattedPrice}
            </span>
          </div>

          {whatsappUrl?.trim() && (
            <a
              href={buildConsultLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 hover:bg-rosebrand-600 dark:bg-stone-800 dark:hover:bg-rosebrand-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Consultar</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
};
