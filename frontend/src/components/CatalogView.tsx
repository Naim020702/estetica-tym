import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Instagram,
  MapPin,
  MessageCircle,
  Moon,
  Pencil,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
} from 'lucide-react';
import { CatalogItem, SiteSettings } from '../types/catalog';
import { useTheme } from '../context/ThemeContext';
import { CatalogCard } from './CatalogCard';

interface CatalogViewProps {
  settings: SiteSettings;
  items: CatalogItem[];
  isAdminRoute?: boolean;
  isEditMode?: boolean;
  onCreateItem?: () => void;
  onEditItem?: (item: CatalogItem) => void;
  onToggleVisibility?: (item: CatalogItem) => void;
  onDeleteItem?: (item: CatalogItem) => void;
  onEditSettings?: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  settings,
  items,
  isAdminRoute = false,
  isEditMode = false,
  onCreateItem,
  onEditItem,
  onToggleVisibility,
  onDeleteItem,
  onEditSettings,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedType, setSelectedType] = useState<'all' | 'service' | 'product'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // En modo Vista Previa o en la web pública, ocultamos los ítems con isVisible = false.
  // En Modo Edición (/admin), mostramos todos (incluyendo los ocultos con indicador visual).
  const displayItems = useMemo(() => {
    return items.filter((it) => (isEditMode ? true : it.isVisible));
  }, [items, isEditMode]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    displayItems.forEach((it) => {
      if (it.category) set.add(it.category);
    });
    return ['Todos', ...Array.from(set)];
  }, [displayItems]);

  const filteredItems = useMemo(() => {
    return displayItems.filter((it) => {
      const matchesCat = selectedCategory === 'Todos' || it.category === selectedCategory;
      const matchesType = selectedType === 'all' || it.itemType === selectedType;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        it.name.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q);
      return matchesCat && matchesType && matchesSearch;
    });
  }, [displayItems, selectedCategory, selectedType, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-200">
      {/* Header Principal */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 dark:border-stone-800/80 bg-white/85 dark:bg-stone-900/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rosebrand-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <Link
                to="/"
                className="font-serif text-xl font-bold tracking-tight text-stone-900 dark:text-white"
              >
                {settings.businessName || 'Estética T&M'}
              </Link>
              <p className="hidden text-xs text-stone-500 dark:text-stone-400 sm:block">
                {settings.tagline}
              </p>
            </div>
          </div>

          {/* Accesos rápidos de contacto + Tema Claro/Oscuro */}
          <div className="flex items-center gap-2">
            {isEditMode && (
              <button
                type="button"
                onClick={onEditSettings}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rosebrand-300 dark:border-rosebrand-700 bg-rosebrand-50 dark:bg-rosebrand-950/60 px-3 py-2 text-xs font-semibold text-rosebrand-700 dark:text-rosebrand-300 hover:bg-rosebrand-100 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Editar Portada y Contacto</span>
              </button>
            )}

            <a
              href={settings.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Contactar por WhatsApp"
              aria-label="WhatsApp"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
            </a>

            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Visitar Instagram Oficial"
              aria-label="Instagram"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 hover:bg-pink-500 hover:text-white transition-colors"
            >
              <Instagram className="h-4 w-4" />
            </a>

            <a
              href={settings.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Ver ubicación en Google Maps"
              aria-label="Google Maps"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500 hover:text-white transition-colors"
            >
              <MapPin className="h-4 w-4" />
            </a>

            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Alternar tema claro u oscuro"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-stone-700" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero / Carta de Presentación */}
      <section className="relative overflow-hidden border-b border-stone-200/70 dark:border-stone-800/80 bg-gradient-to-br from-rosebrand-50 via-white to-amber-50/40 dark:from-stone-900 dark:via-stone-950 dark:to-rosebrand-950/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rosebrand-100 dark:bg-rosebrand-950/90 border border-rosebrand-200 dark:border-rosebrand-800 px-3.5 py-1 text-xs font-semibold text-rosebrand-700 dark:text-rosebrand-300">
              <Sparkles className="h-3.5 w-3.5" />
              {settings.tagline}
            </span>

            <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-stone-900 dark:text-white sm:text-5xl leading-tight">
              {settings.heroTitle}
            </h1>

            <p className="mt-4 text-base sm:text-lg text-stone-600 dark:text-stone-300 leading-relaxed">
              {settings.heroSubtitle}
            </p>

            {/* Información rápida de ubicación, horarios y contacto directo */}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              {settings.addressText && (
                <a
                  href={settings.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-rosebrand-600 dark:hover:text-rosebrand-400 transition-colors"
                >
                  <MapPin className="h-4 w-4 text-rosebrand-600 dark:text-rosebrand-400 shrink-0" />
                  <span>{settings.addressText}</span>
                </a>
              )}
              {settings.openingHours && (
                <div className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-rosebrand-600 dark:text-rosebrand-400 shrink-0" />
                  <span>{settings.openingHours}</span>
                </div>
              )}
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={settings.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Consultar por WhatsApp</span>
              </a>

              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-900/80 hover:bg-stone-100 dark:hover:bg-stone-800 px-4 py-3 text-sm font-semibold text-stone-800 dark:text-stone-200 transition-colors"
              >
                <Instagram className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                <span>Instagram</span>
              </a>

              <a
                href={settings.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-900/80 hover:bg-stone-100 dark:hover:bg-stone-800 px-4 py-3 text-sm font-semibold text-stone-800 dark:text-stone-200 transition-colors"
              >
                <MapPin className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span>Cómo llegar</span>
              </a>

              {isEditMode && (
                <button
                  type="button"
                  onClick={onEditSettings}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 px-4 py-3 text-sm font-semibold text-white dark:text-stone-900 hover:opacity-90 transition-opacity"
                >
                  <Pencil className="h-4 w-4" />
                  <span>Editar Textos y Enlaces</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Sección Catálogo de Servicios y Productos */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        {/* Barra de Filtros y Buscador */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-white">
              Catálogo de Servicios y Productos
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Explorá nuestras propuestas y consultanos directamente sin compromiso.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar tratamiento o producto..."
                className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 pl-9 pr-3.5 py-2 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:border-rosebrand-500 focus:outline-none"
              />
            </div>

            {isEditMode && (
              <button
                type="button"
                onClick={onCreateItem}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rosebrand-600 hover:bg-rosebrand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Nuevo Ítem</span>
              </button>
            )}
          </div>
        </div>

        {/* Selector Tipo (Todos / Servicios / Productos) y Categorías */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  selectedCategory === cat
                    ? 'bg-rosebrand-600 text-white shadow-sm'
                    : 'bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300/70 dark:hover:bg-stone-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="inline-flex self-start rounded-xl bg-stone-200/70 dark:bg-stone-900 p-1 text-xs font-medium">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'service', label: 'Servicios' },
              { id: 'product', label: 'Productos' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id as 'all' | 'service' | 'product')}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  selectedType === tab.id
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-sm'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grilla de Tarjetas */}
        {filteredItems.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 bg-white/50 dark:bg-stone-900/40 p-12 text-center">
            <p className="text-base font-medium text-stone-700 dark:text-stone-300">
              No se encontraron servicios o productos con los filtros seleccionados.
            </p>
            {isEditMode && (
              <button
                type="button"
                onClick={onCreateItem}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rosebrand-600 hover:bg-rosebrand-500 px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar primer ítem</span>
              </button>
            )}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <CatalogCard
                key={item.id}
                item={item}
                whatsappUrl={settings.whatsappUrl}
                isEditMode={isEditMode}
                onEdit={onEditItem}
                onToggleVisibility={onToggleVisibility}
                onDelete={onDeleteItem}
              />
            ))}
          </div>
        )}
      </main>

      {/* Botón Flotante de Acceso Directo a WhatsApp (Mobile & Desktop) */}
      <a
        href={settings.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat directo por WhatsApp"
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline">WhatsApp Directo</span>
      </a>

      {/* Footer con Accesos Directos */}
      <footer className="mt-16 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-serif text-lg font-bold text-stone-900 dark:text-white">
                {settings.businessName}
              </p>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                {settings.addressText} • {settings.openingHours}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={settings.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-emerald-500 hover:text-white px-3.5 py-2 text-xs font-medium transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-pink-500 hover:text-white px-3.5 py-2 text-xs font-medium transition-colors"
              >
                <Instagram className="h-4 w-4" />
                <span>Instagram</span>
              </a>
              <a
                href={settings.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-sky-500 hover:text-white px-3.5 py-2 text-xs font-medium transition-colors"
              >
                <MapPin className="h-4 w-4" />
                <span>Google Maps</span>
              </a>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-stone-100 dark:border-stone-800 pt-6 text-xs text-stone-400">
            <span>© {new Date().getFullYear()} {settings.businessName}. Todos los derechos reservados.</span>
            {!isAdminRoute ? (
              <Link
                to="/admin"
                className="text-stone-400 hover:text-rosebrand-600 dark:hover:text-rosebrand-400 transition-colors"
              >
                Administración
              </Link>
            ) : (
              <Link
                to="/"
                className="text-stone-400 hover:text-rosebrand-600 dark:hover:text-rosebrand-400 transition-colors"
              >
                Ir a Web Pública (Live)
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
