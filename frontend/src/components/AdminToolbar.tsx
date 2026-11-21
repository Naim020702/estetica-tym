import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  LogOut,
  Pencil,
  Plus,
  RotateCcw,
  Settings,
  UploadCloud,
} from 'lucide-react';

interface AdminToolbarProps {
  mode: 'edit' | 'preview';
  hasDraftDiff: boolean;
  isBusy: boolean;
  onToggleMode: (mode: 'edit' | 'preview') => void;
  onNewItem: () => void;
  onOpenSettings: () => void;
  onPublish: () => void;
  onDiscard: () => void;
  onLogout: () => void;
}

export const AdminToolbar: React.FC<AdminToolbarProps> = ({
  mode,
  hasDraftDiff,
  isBusy,
  onToggleMode,
  onNewItem,
  onOpenSettings,
  onPublish,
  onDiscard,
  onLogout,
}) => {
  return (
    <div className="sticky top-0 z-40 border-b border-stone-800 bg-stone-950 text-stone-100 shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        {/* Indicador Entorno Borrador + Interruptor Edición / Vista Previa */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                hasDraftDiff
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  hasDraftDiff ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                }`}
              />
              {hasDraftDiff ? 'Borrador con cambios sin publicar' : 'Borrador sincronizado con Live'}
            </span>
          </div>

          {/* Switch Modo Edición vs Modo Vista Previa */}
          <div className="inline-flex rounded-xl bg-stone-900 p-1 border border-stone-800">
            <button
              type="button"
              onClick={() => onToggleMode('edit')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === 'edit'
                  ? 'bg-rosebrand-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Modo Edición</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleMode('preview')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === 'preview'
                  ? 'bg-rosebrand-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Modo Vista Previa</span>
            </button>
          </div>

          {mode === 'edit' && (
            <div className="hidden lg:flex items-center gap-1.5">
              <button
                type="button"
                onClick={onNewItem}
                className="inline-flex items-center gap-1 rounded-lg bg-stone-800 hover:bg-stone-700 px-2.5 py-1.5 text-xs font-medium text-stone-200 transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-rosebrand-400" />
                <span>Agregar Ítem</span>
              </button>
              <button
                type="button"
                onClick={onOpenSettings}
                className="inline-flex items-center gap-1 rounded-lg bg-stone-800 hover:bg-stone-700 px-2.5 py-1.5 text-xs font-medium text-stone-200 transition-colors"
              >
                <Settings className="h-3.5 w-3.5 text-rosebrand-400" />
                <span>Contacto y Portada</span>
              </button>
            </div>
          )}
        </div>

        {/* Acciones Globales Transaccionales: Publicar / Descartar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isBusy || !hasDraftDiff}
            onClick={onDiscard}
            title="Restaura el borrador copiando nuevamente desde la web pública (Live)"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-700 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:pointer-events-none px-3 py-1.5 text-xs font-semibold text-stone-200 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Descartar cambios</span>
          </button>

          <button
            type="button"
            disabled={isBusy || !hasDraftDiff}
            onClick={onPublish}
            title="Ejecuta una transacción SQL que vuelca el estado Draft hacia Live"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors"
          >
            {hasDraftDiff ? (
              <UploadCloud className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>Publicar cambios</span>
          </button>

          <Link
            to="/"
            target="_blank"
            title="Abrir la versión pública (Live) en una pestaña nueva"
            className="inline-flex items-center gap-1 rounded-xl border border-stone-800 bg-stone-900 hover:bg-stone-800 px-2.5 py-1.5 text-xs text-stone-300 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Ver Live</span>
          </Link>

          <button
            type="button"
            onClick={onLogout}
            title="Cerrar sesión de PIN maestro"
            className="inline-flex items-center justify-center rounded-xl border border-stone-800 bg-stone-900 hover:bg-red-950/60 hover:text-red-300 p-1.5 text-stone-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
