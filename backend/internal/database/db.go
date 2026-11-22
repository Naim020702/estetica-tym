package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"estetica-tym/backend/internal/config"
	_ "github.com/lib/pq"
)

func ConnectAndMigrate(cfg *config.Config) (*sql.DB, error) {
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("error abriendo conexión postgres: %w", err)
	}

	db.SetMaxOpenConns(15)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("no se pudo conectar a PostgreSQL (%s): %w", cfg.DatabaseURL, err)
	}

	if err := runMigrations(db); err != nil {
		return nil, err
	}

	if err := seedInitialData(db, cfg); err != nil {
		return nil, err
	}

	return db, nil
}

func runMigrations(db *sql.DB) error {
	candidates := []string{
		"migrations/001_init.sql",
		"backend/migrations/001_init.sql",
		filepath.Join("..", "migrations", "001_init.sql"),
		filepath.Join("..", "..", "migrations", "001_init.sql"),
	}

	var sqlBytes []byte
	var err error
	for _, path := range candidates {
		sqlBytes, err = os.ReadFile(path)
		if err == nil {
			break
		}
	}
	if err != nil {
		return fmt.Errorf("no se encontró el archivo de migración 001_init.sql: %w", err)
	}

	if _, execErr := db.Exec(string(sqlBytes)); execErr != nil {
		return fmt.Errorf("error ejecutando migración 001_init.sql: %w", execErr)
	}
	return nil
}

func seedInitialData(db *sql.DB, cfg *config.Config) error {
	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM site_settings`).Scan(&count); err != nil {
		return fmt.Errorf("error verificando site_settings: %w", err)
	}

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if count == 0 {
		insertSettings := `
			INSERT INTO site_settings (
				env, business_name, tagline, hero_title, hero_subtitle,
				whatsapp_url, instagram_url, maps_url, pinterest_url, address_text, opening_hours
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		`
		for _, env := range []string{"live", "draft"} {
			_, err := tx.Exec(
				insertSettings,
				env,
				cfg.SiteName,
				"Bienestar, Dermocosmética & Cuidado Personal",
				"Realzá tu belleza natural en un espacio pensado para vos",
				"Conocé nuestra carta de tratamientos faciales, corporales, belleza de manos y productos seleccionados de gabinete.",
				cfg.WhatsAppURL,
				cfg.InstagramURL,
				cfg.MapsURL,
				cfg.PinterestURL,
				"Av. Santa Fe 2450, Palermo, CABA",
				"Martes a Sábados de 9:30 a 20:00 hs",
			)
			if err != nil {
				return fmt.Errorf("error insertando site_settings (%s): %w", env, err)
			}
		}
	}

	var itemCount int
	if err := tx.QueryRow(`SELECT COUNT(*) FROM catalog_items`).Scan(&itemCount); err != nil {
		return fmt.Errorf("error verificando catalog_items: %w", err)
	}

	if itemCount == 0 {
		type seedItem struct {
			itemType    string
			category    string
			name        string
			description string
			price       float64
			duration    string
			imageURL    string
			sortOrder   int
		}

		initialItems := []seedItem{
			{
				itemType:    "service",
				category:    "Tratamientos Faciales",
				name:        "Limpieza Facial Profunda + Punta de Diamante",
				description: "Higiene integral con extracciones suaves, microdermoabrasión con punta de diamante, máscara descongestiva e hidratación con ácido hialurónico.",
				price:       28500,
				duration:    "60 min",
				imageURL:    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80",
				sortOrder:   1,
			},
			{
				itemType:    "service",
				category:    "Tratamientos Faciales",
				name:        "Dermaplaning & Glow Vitaminado",
				description: "Exfoliación física segura que elimina células muertas y vello facial fino, combinada con shock de Vitamina C pura para luminosidad inmediata.",
				price:       32000,
				duration:    "50 min",
				imageURL:    "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=900&q=80",
				sortOrder:   2,
			},
			{
				itemType:    "service",
				category:    "Masajes & Corporal",
				name:        "Masaje Descontracturante & Piedras Calientes",
				description: "Terapia manual focalizada en espalda, cuello y cervicales combinada con termoterapia de piedras volcánicas para liberar tensión muscular profunda.",
				price:       26000,
				duration:    "55 min",
				imageURL:    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80",
				sortOrder:   3,
			},
			{
				itemType:    "service",
				category:    "Masajes & Corporal",
				name:        "Drenaje Linfático Manual Corporal",
				description: "Maniobras suaves y rítmicas que favorecen la eliminación de líquidos retenidos, mejoran la circulación y brindan alivio en piernas cansadas.",
				price:       27500,
				duration:    "60 min",
				imageURL:    "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=900&q=80",
				sortOrder:   4,
			},
			{
				itemType:    "service",
				category:    "Cejas, Pestañas & Manos",
				name:        "Lifting Nutritivo de Pestañas + Tinte",
				description: "Arqueado natural desde la raíz con keratina y vitaminas que realza la mirada por 6 a 8 semanas sin dañar tus pestañas naturales.",
				price:       21000,
				duration:    "45 min",
				imageURL:    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80",
				sortOrder:   5,
			},
			{
				itemType:    "service",
				category:    "Cejas, Pestañas & Manos",
				name:        "Kapping Gel + Esmaltado Semipermanente",
				description: "Baño protector de gel fortificador sobre uña natural ideal para uñas quebradizas, finalizado con color semipermanente de larga duración.",
				price:       19500,
				duration:    "60 min",
				imageURL:    "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80",
				sortOrder:   6,
			},
			{
				itemType:    "product",
				category:    "Dermocosmética en Casa",
				name:        "Sérum Concentrado Ácido Hialurónico B5 (30ml)",
				description: "Fórmula ultra hidratante de rápida absorción con ácido hialurónico de bajo y alto peso molecular y provitamina B5 reparadora.",
				price:       24900,
				duration:    "Uso diario",
				imageURL:    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80",
				sortOrder:   7,
			},
			{
				itemType:    "product",
				category:    "Dermocosmética en Casa",
				name:        "Emulsión Limpiadora Micelar Botánica (200ml)",
				description: "Limpiador diario libre de sulfatos con extractos de manzanilla, té verde y niacinamida. Apto para pieles sensibles y con rosácea.",
				price:       18200,
				duration:    "200 ml",
				imageURL:    "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80",
				sortOrder:   8,
			},
		}

		insertItem := `
			INSERT INTO catalog_items (
				env, item_type, category, name, description, price, duration, image_url, is_visible, sort_order
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9)
		`

		for _, env := range []string{"live", "draft"} {
			for _, it := range initialItems {
				if _, err := tx.Exec(
					insertItem,
					env,
					it.itemType,
					it.category,
					it.name,
					it.description,
					it.price,
					it.duration,
					it.imageURL,
					it.sortOrder,
				); err != nil {
					return fmt.Errorf("error insertando seed item (%s - %s): %w", env, it.name, err)
				}
			}
		}
	}

	return tx.Commit()
}
