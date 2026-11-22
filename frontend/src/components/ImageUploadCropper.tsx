import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ImagePlus, Move, RotateCcw, Trash2, Upload, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageUploadCropperProps {
  currentImageUrl: string;
  onImageChange: (dataUrl: string) => void;
}

// Aspect ratio exacto de la tarjeta (ej. ~380x208 => 16:9 / ~1.8:1)
const OUTPUT_WIDTH = 900;
const OUTPUT_HEIGHT = 500;

export const ImageUploadCropper: React.FC<ImageUploadCropperProps> = ({
  currentImageUrl,
  onImageChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Imagen cruda seleccionada desde el dispositivo para recortar/encuadrar
  const [rawImageObj, setRawImageObj] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isEditingCrop, setIsEditingCrop] = useState<boolean>(false);

  // Dibuja la imagen en el canvas con el zoom y desplazamiento (pan) actuales
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !rawImageObj) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

    // Escala base para cubrir ("cover") todo el canvas
    const scaleX = OUTPUT_WIDTH / rawImageObj.width;
    const scaleY = OUTPUT_HEIGHT / rawImageObj.height;
    const baseScale = Math.max(scaleX, scaleY);
    const finalScale = baseScale * zoom;

    const drawWidth = rawImageObj.width * finalScale;
    const drawHeight = rawImageObj.height * finalScale;

    // Limitar el desplazamiento para no dejar bordes vacíos si la imagen cubre el recuadro
    const maxOffsetX = Math.max(0, (drawWidth - OUTPUT_WIDTH) / 2);
    const maxOffsetY = Math.max(0, (drawHeight - OUTPUT_HEIGHT) / 2);

    const clampedX = Math.min(maxOffsetX, Math.max(-maxOffsetX, offset.x));
    const clampedY = Math.min(maxOffsetY, Math.max(-maxOffsetY, offset.y));

    const x = (OUTPUT_WIDTH - drawWidth) / 2 + clampedX;
    const y = (OUTPUT_HEIGHT - drawHeight) / 2 + clampedY;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(rawImageObj, x, y, drawWidth, drawHeight);
  }, [rawImageObj, zoom, offset]);

  useEffect(() => {
    if (isEditingCrop && rawImageObj) {
      drawCanvas();
    }
  }, [isEditingCrop, rawImageObj, drawCanvas]);

  const loadImageForCrop = (src: string, autoApply = false) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setRawImageObj(img);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setIsEditingCrop(true);
      if (autoApply) {
        // También genera un dataURL inicial por si el usuario guarda el formulario directo sin tocar "Aplicar encuadre"
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = OUTPUT_WIDTH;
        tempCanvas.height = OUTPUT_HEIGHT;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          const baseScale = Math.max(OUTPUT_WIDTH / img.width, OUTPUT_HEIGHT / img.height);
          const drawW = img.width * baseScale;
          const drawH = img.height * baseScale;
          ctx.drawImage(img, (OUTPUT_WIDTH - drawW) / 2, (OUTPUT_HEIGHT - drawH) / 2, drawW, drawH);
          onImageChange(tempCanvas.toDataURL('image/jpeg', 0.85));
        }
      }
    };
    img.src = src;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        loadImageForCrop(reader.result, true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const applyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
    onImageChange(dataUrl);
    setIsEditingCrop(false);
  };

  // Eventos de arrastre (Mouse + Touch)
  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging || !rawImageObj || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    // Factor entre el tamaño real del canvas (900px) y su ancho visual en pantalla
    const ratio = OUTPUT_WIDTH / (rect.width || OUTPUT_WIDTH);

    const deltaX = (clientX - dragStart.x - offset.x) * ratio;
    const deltaY = (clientY - dragStart.y - offset.y) * ratio;

    const baseScale = Math.max(OUTPUT_WIDTH / rawImageObj.width, OUTPUT_HEIGHT / rawImageObj.height);
    const finalScale = baseScale * zoom;
    const maxOffsetX = Math.max(0, (rawImageObj.width * finalScale - OUTPUT_WIDTH) / 2);
    const maxOffsetY = Math.max(0, (rawImageObj.height * finalScale - OUTPUT_HEIGHT) / 2);

    const nextX = Math.min(maxOffsetX, Math.max(-maxOffsetX, offset.x + deltaX));
    const nextY = Math.min(maxOffsetY, Math.max(-maxOffsetY, offset.y + deltaY));

    setOffset({ x: nextX, y: nextY });
    setDragStart({ x: clientX - nextX, y: clientY - nextY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          Imagen del Servicio / Producto (Desde tu dispositivo)
        </label>

        {currentImageUrl && !isEditingCrop && (
          <button
            type="button"
            onClick={() => onImageChange('')}
            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-500 dark:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Quitar imagen</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Editor interactivo de encuadre y zoom */}
      {isEditingCrop && rawImageObj ? (
        <div className="rounded-2xl border border-rosebrand-300 dark:border-rosebrand-800 bg-stone-100 dark:bg-stone-950 p-3.5 space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-300">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Move className="h-3.5 w-3.5 text-rosebrand-600 dark:text-rosebrand-400" />
              Arrastrá la imagen para encuadrarla en la tarjeta
            </span>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setOffset({ x: 0, y: 0 });
              }}
              className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Centrar</span>
            </button>
          </div>

          {/* Lienzo con la proporción exacta de la Card (h-52 equivalente) */}
          <div className="relative overflow-hidden rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-900 shadow-inner select-none">
            <canvas
              ref={canvasRef}
              width={OUTPUT_WIDTH}
              height={OUTPUT_HEIGHT}
              onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
              onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={(e) => {
                const t = e.touches[0];
                if (t) handlePointerDown(t.clientX, t.clientY);
              }}
              onTouchMove={(e) => {
                const t = e.touches[0];
                if (t) handlePointerMove(t.clientX, t.clientY);
              }}
              onTouchEnd={handlePointerUp}
              className="w-full h-48 sm:h-52 object-cover cursor-grab active:cursor-grabbing touch-none"
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/20 rounded-xl" />
          </div>

          {/* Control de Zoom */}
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-stone-500 shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.02}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-rosebrand-600 cursor-pointer"
            />
            <ZoomIn className="h-4 w-4 text-stone-500 shrink-0" />
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Elegir otra foto</span>
            </button>

            <button
              type="button"
              onClick={applyCrop}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Confirmar encuadre</span>
            </button>
          </div>
        </div>
      ) : currentImageUrl ? (
        /* Vista previa de la imagen ya cargada */
        <div className="relative overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800">
          <img
            src={currentImageUrl}
            alt="Vista previa de tarjeta"
            className="h-48 w-full object-cover"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-900/85 px-3.5 py-2.5 text-xs text-white backdrop-blur-sm">
            <span className="text-stone-300">Así se verá en la tarjeta del catálogo</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadImageForCrop(currentImageUrl, false)}
                className="inline-flex items-center gap-1 rounded-lg bg-stone-700 hover:bg-stone-600 px-2.5 py-1 font-medium text-white transition-colors"
              >
                <Move className="h-3.5 w-3.5" />
                <span>Ajustar encuadre</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-lg bg-rosebrand-600 hover:bg-rosebrand-500 px-2.5 py-1 font-medium text-white transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Cambiar foto</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Botón para subir desde el dispositivo cuando no hay imagen */
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-800/40 hover:border-rosebrand-500 dark:hover:border-rosebrand-500 hover:bg-rosebrand-50/30 dark:hover:bg-rosebrand-950/20 px-4 py-7 text-center transition-colors"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rosebrand-100 dark:bg-rosebrand-950 text-rosebrand-600 dark:text-rosebrand-400">
            <ImagePlus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              Subir imagen desde este dispositivo
            </p>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              JPG, PNG o WebP • Podrás acercar y mover la foto para encuadrarla en la tarjeta
            </p>
          </div>
        </button>
      )}
    </div>
  );
};
