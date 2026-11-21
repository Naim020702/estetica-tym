# Estética T&M — Catálogo Digital Autoadministrable (MVP)

Aplicación web full-stack para el centro **Estética T&M** diseñada como carta de presentación y catálogo digital autoadministrable con flujo de aislamiento transaccional **Borrador (`Draft`) vs. Web Pública (`Live`)**.

---

## 1. Arquitectura y Estructura del Proyecto

La arquitectura está organizada en capas limpias y desacopladas para facilitar la futura incorporación de turnos, agendas o cuentas de usuario sin rehacer la base existente.

```text
estetica-tym/
├── .env.example                     # Plantilla de variables de entorno (BD, PIN maestro, enlaces)
├── .gitignore                       # Reglas de exclusión para Go, Node, .env y datos locales
├── docker-compose.yml               # Instancia local de PostgreSQL 16 lista para usar
├── README.md                        # Documentación general y guía paso a paso de pruebas
├── GUIA_PRUEBAS.txt                 # Guía rápida en texto plano para ejecución y validación
├── backend/                         # API REST en Golang (arquitectura modular por capas)
│   ├── cmd/
│   │   └── api/
│   │       └── main.go              # Punto de entrada del servidor HTTP
│   ├── internal/
│   │   ├── config/
│   │   │   └── config.go            # Lectura de .env y variables de entorno
│   │   ├── database/
│   │   │   └── db.go                # Conexión a PostgreSQL, migraciones automáticas y seed inicial
│   │   ├── models/
│   │   │   └── models.go            # Entidades de dominio (SiteSettings, CatalogItem, CatalogPayload)
│   │   ├── repository/
│   │   │   └── catalog_repo.go      # Consultas SQL y transacciones atómicas Draft <-> Live
│   │   ├── service/
│   │   │   └── catalog_service.go   # Lógica de negocio, validaciones y sanitización
│   │   ├── handlers/
│   │   │   └── api.go               # Controladores HTTP REST
│   │   └── middleware/
│   │       └── middleware.go        # CORS y protección por PIN maestro (X-Admin-Pin)
│   └── migrations/
│       └── 001_init.sql             # Esquema SQL de PostgreSQL (site_settings y catalog_items)
└── frontend/                        # SPA en React 18 + TypeScript + Tailwind CSS (Vite)
    ├── index.html
    ├── package.json
    ├── tailwind.config.js           # Configuración de tema y modo oscuro (darkMode: 'class')
    └── src/
        ├── types/
        │   └── catalog.ts           # Contratos TypeScript sincronizados con el backend
        ├── services/
        │   └── api.ts               # Cliente HTTP para endpoints públicos y de administración
        ├── context/
        │   └── ThemeContext.tsx     # Modo Claro / Oscuro con persistencia en localStorage
        ├── components/
        │   ├── CatalogView.tsx      # Interfaz única reutilizada en "/" (Live) y "/admin" (Draft)
        │   ├── CatalogCard.tsx      # Tarjeta de servicio/producto con controles superpuestos en edición
        │   ├── AdminToolbar.tsx     # Barra superior fija (Modo Edición / Vista Previa / Publicar / Descartar)
        │   ├── ItemFormModal.tsx    # Modal para Crear / Modificar ítems en Borrador
        │   └── SettingsFormModal.tsx# Modal para editar portada y enlaces de WhatsApp, Instagram y Maps
        └── pages/
            ├── PublicPage.tsx       # Ruta pública "/" (sin login, consume exclusivamente Live)
            └── AdminPage.tsx        # Ruta "/admin" (protegida por PIN, opera sobre Draft)
```

---

## 2. Esquema de Base de Datos y Sincronización Transaccional (`Draft` -> `Live`)

El esquema en [001_init.sql](file:///c:/Users/Ntorres/Desktop/My/estetica-tym/backend/migrations/001_init.sql) consta de dos tablas particionadas por la columna `env` (`'live'` | `'draft'`):

1. **`site_settings`**: Guarda el nombre del centro, lema, textos de portada y enlaces directos de **WhatsApp**, **Instagram**, **Google Maps**, dirección y horarios para cada entorno (`live` y `draft`).
2. **`catalog_items`**: Guarda los servicios y productos con `item_type` (`service` | `product`), `category`, `name`, `description`, `price`, `duration`, `image_url`, `is_visible` y `sort_order`.

### ¿Cómo funciona el aislamiento `Draft` vs. `Live`?
- **Lectura Pública (`/`)**: Consulta únicamente `WHERE env = 'live' AND is_visible = TRUE`.
- **Edición en Administración (`/admin`)**: Todas las altas, bajas, modificaciones y cambios de visibilidad impactan únicamente sobre `WHERE env = 'draft'`. La web pública permanece intacta.
- **Publicar cambios (`POST /api/admin/publish`)**: Abre una transacción SQL (`BEGIN ... COMMIT`) que actualiza `site_settings` (`live` <- `draft`), limpia los registros `live` de `catalog_items` e inserta una copia exacta del estado `draft`.
- **Descartar cambios (`POST /api/admin/discard`)**: Abre una transacción SQL inversa que restaura `draft` copiando los datos vigentes en `live`.

---

## 3. Endpoints REST del Backend

| Método | Ruta | Protección | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Pública | Estado del servidor backend |
| `GET` | `/api/public/catalog` | Pública | Obtiene configuración e ítems visibles del entorno **`live`** |
| `POST` | `/api/admin/verify-pin` | Pública | Valida el PIN maestro (`{"pin": "1234"}`) |
| `GET` | `/api/admin/catalog` | `X-Admin-Pin` | Obtiene configuración, todos los ítems del entorno **`draft`** e indicador `hasDraftDiff` |
| `POST` | `/api/admin/items` | `X-Admin-Pin` | Crea un nuevo servicio o producto en **`draft`** |
| `PUT` | `/api/admin/items/{id}` | `X-Admin-Pin` | Modifica un servicio o producto existente en **`draft`** |
| `PATCH` | `/api/admin/items/{id}/visibility` | `X-Admin-Pin` | Alterna `is_visible` (Mostrar / Ocultar sin borrar) en **`draft`** |
| `DELETE` | `/api/admin/items/{id}` | `X-Admin-Pin` | Elimina un ítem de **`draft`** |
| `PUT` | `/api/admin/settings` | `X-Admin-Pin` | Actualiza textos y enlaces de WhatsApp, Instagram y Google Maps en **`draft`** |
| `POST` | `/api/admin/publish` | `X-Admin-Pin` | **Transacción SQL**: Publica todo el estado `draft` hacia `live` |
| `POST` | `/api/admin/discard` | `X-Admin-Pin` | **Transacción SQL**: Descarta cambios de `draft` restaurando desde `live` |

---

## 4. Guía Paso a Paso de Ejecución y Pruebas

### Requisitos Previos
- **Go** 1.22+
- **Node.js** 18+ y **npm**
- **PostgreSQL** 14+ (o **Docker** para levantarlo con un comando)

### Paso 1: Configurar Variables de Entorno
Copiá el archivo `.env.example` a `.env` en la raíz del proyecto:

```powershell
Copy-Item .env.example .env
```

*(Por defecto el PIN maestro configurado en `ADMIN_PIN` es **`1234`**).*

### Paso 2: Levantar PostgreSQL
Si tenés Docker instalado, ejecutá en la raíz del proyecto:

```powershell
docker compose up -d
```

> Si utilizás una instancia local propia de PostgreSQL sin Docker, asegurate de crear la base de datos `estetica_tym` y ajustar `DB_USER`, `DB_PASSWORD` y `DB_PORT` en tu archivo `.env`.

### Paso 3: Iniciar el Backend en Go (Migraciones y Seed Automáticos)
Al iniciar, el backend ejecuta automáticamente `backend/migrations/001_init.sql` y, si la base está vacía, carga un catálogo inicial de ejemplo sincronizado en `live` y `draft`:

```powershell
cd backend
go run ./cmd/api
```

El servidor quedará escuchando en `http://localhost:8080`.

### Paso 4: Iniciar el Frontend en React
En otra terminal, instalá las dependencias e iniciá el servidor de desarrollo de Vite:

```powershell
cd frontend
npm install
npm run dev
```

Abrí en el navegador: **`http://localhost:5173`**

---

## 5. Flujo Completo de Prueba (Checklist Funcional)

1. **Vista Pública (`/`)**:
   - Ingresá a `http://localhost:5173/`.
   - Verificá que se visualizan los tratamientos faciales, corporales y productos activos sin pedir inicio de sesión.
   - Probá el botón de **Modo Claro / Oscuro** (ícono Sol/Luna en la esquina superior derecha) y recargá la página para comprobar que recuerda tu elección.
   - Probá los filtros por categoría, tipo (`Todos`, `Servicios`, `Productos`), el buscador y los botones de acceso directo a **WhatsApp**, **Instagram** y **Google Maps**.

2. **Acceso a Administración (`/admin`)**:
   - Ingresá a `http://localhost:5173/admin` (o hacé clic en el enlace *"Administración"* en el pie de página).
   - Ingresá el PIN maestro por defecto: **`1234`**.

3. **Edición en Borrador (`Draft`) y Aislamiento respecto a `Live`**:
   - En la barra superior verás el estado **"Borrador sincronizado con Live"** y el interruptor en **"Modo Edición"**.
   - Creá un nuevo servicio con el botón **"Nuevo Ítem"**, editá el precio de un servicio existente u ocultá uno con el botón **"Ocultar"** sobre la tarjeta.
   - Verás que el indicador superior cambia a **"Borrador con cambios sin publicar"**.
   - Abrí `http://localhost:5173/` en otra pestaña (o hacé clic en **"Ver Live"** en la barra superior): comprobarás que **la web pública sigue intacta** y no muestra aún los cambios en progreso.

4. **Modo Vista Previa**:
   - En `/admin`, cambiá el interruptor superior de **"Modo Edición"** a **"Modo Vista Previa"**.
   - Los controles de edición y los ítems marcados como ocultos desaparecen para que puedas navegar la página tal como la verán los clientes una vez publicada.

5. **Descartar o Publicar Cambios**:
   - Si presionás **"Descartar cambios"**, el borrador se restaura inmediatamente desde la versión `Live`.
   - Si presionás **"Publicar cambios"**, se ejecuta la transacción en PostgreSQL volcando `Draft -> Live`. Al refrescar la pestaña pública (`/`), los cambios aparecen publicados al instante.
