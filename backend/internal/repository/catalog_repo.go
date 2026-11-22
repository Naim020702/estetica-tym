package repository

import (
	"context"
	"database/sql"
	"fmt"

	"estetica-tym/backend/internal/models"
)

type CatalogRepository struct {
	db *sql.DB
}

func NewCatalogRepository(db *sql.DB) *CatalogRepository {
	return &CatalogRepository{db: db}
}

func (r *CatalogRepository) GetSettings(ctx context.Context, env models.EnvType) (models.SiteSettings, error) {
	var s models.SiteSettings
	query := `
		SELECT env, business_name, tagline, hero_title, hero_subtitle,
		       whatsapp_url, instagram_url, maps_url, pinterest_url, address_text, opening_hours, updated_at
		FROM site_settings
		WHERE env = $1
	`
	err := r.db.QueryRowContext(ctx, query, string(env)).Scan(
		&s.Env,
		&s.BusinessName,
		&s.Tagline,
		&s.HeroTitle,
		&s.HeroSubtitle,
		&s.WhatsAppURL,
		&s.InstagramURL,
		&s.MapsURL,
		&s.PinterestURL,
		&s.AddressText,
		&s.OpeningHours,
		&s.UpdatedAt,
	)
	return s, err
}

func (r *CatalogRepository) UpdateDraftSettings(ctx context.Context, s models.SiteSettings) (models.SiteSettings, error) {
	query := `
		UPDATE site_settings
		SET business_name = $1,
		    tagline = $2,
		    hero_title = $3,
		    hero_subtitle = $4,
		    whatsapp_url = $5,
		    instagram_url = $6,
		    maps_url = $7,
		    pinterest_url = $8,
		    address_text = $9,
		    opening_hours = $10,
		    updated_at = NOW()
		WHERE env = 'draft'
		RETURNING env, business_name, tagline, hero_title, hero_subtitle,
		          whatsapp_url, instagram_url, maps_url, pinterest_url, address_text, opening_hours, updated_at
	`
	var updated models.SiteSettings
	err := r.db.QueryRowContext(
		ctx,
		query,
		s.BusinessName,
		s.Tagline,
		s.HeroTitle,
		s.HeroSubtitle,
		s.WhatsAppURL,
		s.InstagramURL,
		s.MapsURL,
		s.PinterestURL,
		s.AddressText,
		s.OpeningHours,
	).Scan(
		&updated.Env,
		&updated.BusinessName,
		&updated.Tagline,
		&updated.HeroTitle,
		&updated.HeroSubtitle,
		&updated.WhatsAppURL,
		&updated.InstagramURL,
		&updated.MapsURL,
		&updated.PinterestURL,
		&updated.AddressText,
		&updated.OpeningHours,
		&updated.UpdatedAt,
	)
	return updated, err
}

func (r *CatalogRepository) ListItems(ctx context.Context, env models.EnvType, onlyVisible bool) ([]models.CatalogItem, error) {
	query := `
		SELECT id, env, item_type, category, name, description, price, duration,
		       image_url, is_visible, sort_order, updated_at
		FROM catalog_items
		WHERE env = $1
	`
	if onlyVisible {
		query += ` AND is_visible = TRUE`
	}
	query += ` ORDER BY sort_order ASC, id ASC`

	rows, err := r.db.QueryContext(ctx, query, string(env))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.CatalogItem, 0)
	for rows.Next() {
		var it models.CatalogItem
		if err := rows.Scan(
			&it.ID,
			&it.Env,
			&it.ItemType,
			&it.Category,
			&it.Name,
			&it.Description,
			&it.Price,
			&it.Duration,
			&it.ImageURL,
			&it.IsVisible,
			&it.SortOrder,
			&it.UpdatedAt,
		); err != nil {
			return nil, err
		}
		items = append(items, it)
	}
	return items, rows.Err()
}

func (r *CatalogRepository) CreateDraftItem(ctx context.Context, item models.CatalogItem) (models.CatalogItem, error) {
	if item.SortOrder == 0 {
		_ = r.db.QueryRowContext(ctx, `SELECT COALESCE(MAX(sort_order), 0) + 1 FROM catalog_items WHERE env = 'draft'`).Scan(&item.SortOrder)
	}
	query := `
		INSERT INTO catalog_items (
			env, item_type, category, name, description, price, duration, image_url, is_visible, sort_order, updated_at
		) VALUES (
			'draft', $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
		)
		RETURNING id, env, item_type, category, name, description, price, duration, image_url, is_visible, sort_order, updated_at
	`
	var created models.CatalogItem
	err := r.db.QueryRowContext(
		ctx,
		query,
		item.ItemType,
		item.Category,
		item.Name,
		item.Description,
		item.Price,
		item.Duration,
		item.ImageURL,
		item.IsVisible,
		item.SortOrder,
	).Scan(
		&created.ID,
		&created.Env,
		&created.ItemType,
		&created.Category,
		&created.Name,
		&created.Description,
		&created.Price,
		&created.Duration,
		&created.ImageURL,
		&created.IsVisible,
		&created.SortOrder,
		&created.UpdatedAt,
	)
	return created, err
}

func (r *CatalogRepository) UpdateDraftItem(ctx context.Context, id int, item models.CatalogItem) (models.CatalogItem, error) {
	query := `
		UPDATE catalog_items
		SET item_type = $1,
		    category = $2,
		    name = $3,
		    description = $4,
		    price = $5,
		    duration = $6,
		    image_url = $7,
		    is_visible = $8,
		    sort_order = $9,
		    updated_at = NOW()
		WHERE id = $10 AND env = 'draft'
		RETURNING id, env, item_type, category, name, description, price, duration, image_url, is_visible, sort_order, updated_at
	`
	var updated models.CatalogItem
	err := r.db.QueryRowContext(
		ctx,
		query,
		item.ItemType,
		item.Category,
		item.Name,
		item.Description,
		item.Price,
		item.Duration,
		item.ImageURL,
		item.IsVisible,
		item.SortOrder,
		id,
	).Scan(
		&updated.ID,
		&updated.Env,
		&updated.ItemType,
		&updated.Category,
		&updated.Name,
		&updated.Description,
		&updated.Price,
		&updated.Duration,
		&updated.ImageURL,
		&updated.IsVisible,
		&updated.SortOrder,
		&updated.UpdatedAt,
	)
	return updated, err
}

func (r *CatalogRepository) ToggleDraftVisibility(ctx context.Context, id int) (models.CatalogItem, error) {
	query := `
		UPDATE catalog_items
		SET is_visible = NOT is_visible,
		    updated_at = NOW()
		WHERE id = $1 AND env = 'draft'
		RETURNING id, env, item_type, category, name, description, price, duration, image_url, is_visible, sort_order, updated_at
	`
	var updated models.CatalogItem
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&updated.ID,
		&updated.Env,
		&updated.ItemType,
		&updated.Category,
		&updated.Name,
		&updated.Description,
		&updated.Price,
		&updated.Duration,
		&updated.ImageURL,
		&updated.IsVisible,
		&updated.SortOrder,
		&updated.UpdatedAt,
	)
	return updated, err
}

func (r *CatalogRepository) DeleteDraftItem(ctx context.Context, id int) error {
	res, err := r.db.ExecContext(ctx, `DELETE FROM catalog_items WHERE id = $1 AND env = 'draft'`, id)
	if err != nil {
		return err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// PublishDraftToLive ejecuta una transacción SQL atómica que vuelca todo el estado Draft hacia Live.
func (r *CatalogRepository) PublishDraftToLive(ctx context.Context) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Sincronizar configuración del sitio (Draft -> Live)
	_, err = tx.ExecContext(ctx, `
		UPDATE site_settings AS live
		SET business_name = draft.business_name,
		    tagline       = draft.tagline,
		    hero_title    = draft.hero_title,
		    hero_subtitle = draft.hero_subtitle,
		    whatsapp_url  = draft.whatsapp_url,
		    instagram_url = draft.instagram_url,
		    maps_url      = draft.maps_url,
		    pinterest_url = draft.pinterest_url,
		    address_text  = draft.address_text,
		    opening_hours = draft.opening_hours,
		    updated_at    = NOW()
		FROM site_settings AS draft
		WHERE live.env = 'live' AND draft.env = 'draft'
	`)
	if err != nil {
		return fmt.Errorf("error publicando site_settings: %w", err)
	}

	// 2. Reemplazar catálogo Live con el contenido actual de Draft
	if _, err := tx.ExecContext(ctx, `DELETE FROM catalog_items WHERE env = 'live'`); err != nil {
		return fmt.Errorf("error limpiando catalog_items live: %w", err)
	}

	_, err = tx.ExecContext(ctx, `
		INSERT INTO catalog_items (
			env, item_type, category, name, description, price, duration, image_url, is_visible, sort_order, updated_at
		)
		SELECT
			'live', item_type, category, name, description, price, duration, image_url, is_visible, sort_order, NOW()
		FROM catalog_items
		WHERE env = 'draft'
		ORDER BY sort_order ASC, id ASC
	`)
	if err != nil {
		return fmt.Errorf("error copiando catalog_items draft a live: %w", err)
	}

	return tx.Commit()
}

// DiscardDraftFromLive ejecuta una transacción SQL atómica que restaura Draft copiando desde Live.
func (r *CatalogRepository) DiscardDraftFromLive(ctx context.Context) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Restaurar configuración del sitio (Live -> Draft)
	_, err = tx.ExecContext(ctx, `
		UPDATE site_settings AS draft
		SET business_name = live.business_name,
		    tagline       = live.tagline,
		    hero_title    = live.hero_title,
		    hero_subtitle = live.hero_subtitle,
		    whatsapp_url  = live.whatsapp_url,
		    instagram_url = live.instagram_url,
		    maps_url      = live.maps_url,
		    pinterest_url = live.pinterest_url,
		    address_text  = live.address_text,
		    opening_hours = live.opening_hours,
		    updated_at    = NOW()
		FROM site_settings AS live
		WHERE draft.env = 'draft' AND live.env = 'live'
	`)
	if err != nil {
		return fmt.Errorf("error restaurando site_settings: %w", err)
	}

	// 2. Reemplazar catálogo Draft con copia de Live
	if _, err := tx.ExecContext(ctx, `DELETE FROM catalog_items WHERE env = 'draft'`); err != nil {
		return fmt.Errorf("error limpiando catalog_items draft: %w", err)
	}

	_, err = tx.ExecContext(ctx, `
		INSERT INTO catalog_items (
			env, item_type, category, name, description, price, duration, image_url, is_visible, sort_order, updated_at
		)
		SELECT
			'draft', item_type, category, name, description, price, duration, image_url, is_visible, sort_order, NOW()
		FROM catalog_items
		WHERE env = 'live'
		ORDER BY sort_order ASC, id ASC
	`)
	if err != nil {
		return fmt.Errorf("error copiando catalog_items live a draft: %w", err)
	}

	return tx.Commit()
}

// CheckHasDraftDiff compara si existen diferencias entre el estado Draft y Live.
func (r *CatalogRepository) CheckHasDraftDiff(ctx context.Context) (bool, int, error) {
	var liveVisibleCount int
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM catalog_items WHERE env = 'live' AND is_visible = TRUE`).Scan(&liveVisibleCount); err != nil {
		return false, 0, err
	}

	// Comparamos settings entre live y draft
	var settingsDiff int
	err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM (
			SELECT business_name, tagline, hero_title, hero_subtitle, whatsapp_url, instagram_url, maps_url, pinterest_url, address_text, opening_hours
			FROM site_settings WHERE env = 'draft'
			EXCEPT
			SELECT business_name, tagline, hero_title, hero_subtitle, whatsapp_url, instagram_url, maps_url, pinterest_url, address_text, opening_hours
			FROM site_settings WHERE env = 'live'
		) AS diff
	`).Scan(&settingsDiff)
	if err != nil {
		return false, liveVisibleCount, err
	}
	if settingsDiff > 0 {
		return true, liveVisibleCount, nil
	}

	// Comparamos items entre draft y live (en ambas direcciones con EXCEPT ALL)
	var itemsDiff int
	err = r.db.QueryRowContext(ctx, `
		SELECT COUNT(*)
		FROM (
			(
				SELECT item_type, category, name, description, price, duration, image_url, is_visible, sort_order
				FROM catalog_items WHERE env = 'draft'
				EXCEPT ALL
				SELECT item_type, category, name, description, price, duration, image_url, is_visible, sort_order
				FROM catalog_items WHERE env = 'live'
			)
			UNION ALL
			(
				SELECT item_type, category, name, description, price, duration, image_url, is_visible, sort_order
				FROM catalog_items WHERE env = 'live'
				EXCEPT ALL
				SELECT item_type, category, name, description, price, duration, image_url, is_visible, sort_order
				FROM catalog_items WHERE env = 'draft'
			)
		) AS diff
	`).Scan(&itemsDiff)
	if err != nil {
		return false, liveVisibleCount, err
	}

	return itemsDiff > 0, liveVisibleCount, nil
}
