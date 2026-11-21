package main

import (
	"fmt"
	"log"
	"net/http"

	"estetica-tym/backend/internal/config"
	"estetica-tym/backend/internal/database"
	"estetica-tym/backend/internal/handlers"
	"estetica-tym/backend/internal/middleware"
	"estetica-tym/backend/internal/repository"
	"estetica-tym/backend/internal/service"
)

func main() {
	cfg := config.Load()

	db, err := database.ConnectAndMigrate(cfg)
	if err != nil {
		log.Fatalf("Error inicializando base de datos: %v", err)
	}
	defer db.Close()

	repo := repository.NewCatalogRepository(db)
	svc := service.NewCatalogService(repo)
	api := handlers.NewAPIHandler(svc, cfg)

	mux := http.NewServeMux()
	api.RegisterRoutes(mux)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Servidor Backend (Estética T&M) escuchando en http://localhost%s", addr)
	if err := http.ListenAndServe(addr, middleware.CORS(mux)); err != nil {
		log.Fatalf("Error en el servidor HTTP: %v", err)
	}
}
