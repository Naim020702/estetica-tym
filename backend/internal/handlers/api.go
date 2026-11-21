package handlers

import (
	"crypto/subtle"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"estetica-tym/backend/internal/config"
	"estetica-tym/backend/internal/middleware"
	"estetica-tym/backend/internal/models"
	"estetica-tym/backend/internal/service"
)

type APIHandler struct {
	svc *service.CatalogService
	cfg *config.Config
}

func NewAPIHandler(svc *service.CatalogService, cfg *config.Config) *APIHandler {
	return &APIHandler{svc: svc, cfg: cfg}
}

func (h *APIHandler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/health", h.handleHealth)
	mux.HandleFunc("GET /api/public/catalog", h.handleGetPublicCatalog)

	// Verificación de PIN maestro
	mux.HandleFunc("POST /api/admin/verify-pin", h.handleVerifyPIN)

	// Rutas protegidas por PIN maestro (entorno Draft)
	pinGuard := func(fn http.HandlerFunc) http.HandlerFunc {
		return middleware.RequireAdminPIN(h.cfg.AdminPIN, fn)
	}

	mux.HandleFunc("GET /api/admin/catalog", pinGuard(h.handleGetDraftCatalog))
	mux.HandleFunc("POST /api/admin/items", pinGuard(h.handleCreateDraftItem))
	mux.HandleFunc("PUT /api/admin/items/{id}", pinGuard(h.handleUpdateDraftItem))
	mux.HandleFunc("PATCH /api/admin/items/{id}/visibility", pinGuard(h.handleToggleDraftVisibility))
	mux.HandleFunc("DELETE /api/admin/items/{id}", pinGuard(h.handleDeleteDraftItem))
	mux.HandleFunc("PUT /api/admin/settings", pinGuard(h.handleUpdateDraftSettings))

	// Acciones transaccionales globales (Draft <-> Live)
	mux.HandleFunc("POST /api/admin/publish", pinGuard(h.handlePublishDraft))
	mux.HandleFunc("POST /api/admin/discard", pinGuard(h.handleDiscardDraft))
}

func (h *APIHandler) handleHealth(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *APIHandler) handleGetPublicCatalog(w http.ResponseWriter, r *http.Request) {
	payload, err := h.svc.GetPublicCatalog(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, payload)
}

func (h *APIHandler) handleVerifyPIN(w http.ResponseWriter, r *http.Request) {
	var body struct {
		PIN string `json:"pin"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Formato JSON inválido")
		return
	}

	provided := strings.TrimSpace(body.PIN)
	if provided == "" || subtle.ConstantTimeCompare([]byte(provided), []byte(h.cfg.AdminPIN)) != 1 {
		writeError(w, http.StatusUnauthorized, "PIN maestro incorrecto")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"authenticated": true,
		"message":       "Acceso concedido al panel de administración",
	})
}

func (h *APIHandler) handleGetDraftCatalog(w http.ResponseWriter, r *http.Request) {
	payload, err := h.svc.GetDraftCatalog(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, payload)
}

func (h *APIHandler) handleCreateDraftItem(w http.ResponseWriter, r *http.Request) {
	var item models.CatalogItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		writeError(w, http.StatusBadRequest, "Datos de ítem inválidos")
		return
	}

	created, err := h.svc.CreateDraftItem(r.Context(), item)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, created)
}

func (h *APIHandler) handleUpdateDraftItem(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "ID de ítem inválido")
		return
	}

	var item models.CatalogItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		writeError(w, http.StatusBadRequest, "Datos de ítem inválidos")
		return
	}

	updated, err := h.svc.UpdateDraftItem(r.Context(), id, item)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "Ítem no encontrado en el borrador")
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

func (h *APIHandler) handleToggleDraftVisibility(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "ID de ítem inválido")
		return
	}

	updated, err := h.svc.ToggleDraftVisibility(r.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "Ítem no encontrado en el borrador")
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

func (h *APIHandler) handleDeleteDraftItem(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "ID de ítem inválido")
		return
	}

	if err := h.svc.DeleteDraftItem(r.Context(), id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "Ítem no encontrado en el borrador")
			return
		}
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Ítem eliminado del borrador"})
}

func (h *APIHandler) handleUpdateDraftSettings(w http.ResponseWriter, r *http.Request) {
	var settings models.SiteSettings
	if err := json.NewDecoder(r.Body).Decode(&settings); err != nil {
		writeError(w, http.StatusBadRequest, "Datos de configuración inválidos")
		return
	}

	updated, err := h.svc.UpdateDraftSettings(r.Context(), settings)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, updated)
}

func (h *APIHandler) handlePublishDraft(w http.ResponseWriter, r *http.Request) {
	payload, err := h.svc.PublishDraft(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, payload)
}

func (h *APIHandler) handleDiscardDraft(w http.ResponseWriter, r *http.Request) {
	payload, err := h.svc.DiscardDraft(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, payload)
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}
