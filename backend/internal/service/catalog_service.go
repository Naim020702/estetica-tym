package service

import (
	"context"
	"errors"
	"strings"

	"estetica-tym/backend/internal/models"
	"estetica-tym/backend/internal/repository"
)

type CatalogService struct {
	repo *repository.CatalogRepository
}

func NewCatalogService(repo *repository.CatalogRepository) *CatalogService {
	return &CatalogService{repo: repo}
}

func (s *CatalogService) GetPublicCatalog(ctx context.Context) (models.CatalogPayload, error) {
	settings, err := s.repo.GetSettings(ctx, models.EnvLive)
	if err != nil {
		return models.CatalogPayload{}, err
	}
	items, err := s.repo.ListItems(ctx, models.EnvLive, true)
	if err != nil {
		return models.CatalogPayload{}, err
	}
	return models.CatalogPayload{
		Settings:       settings,
		Items:          items,
		HasDraftDiff:   false,
		LiveItemsCount: len(items),
	}, nil
}

func (s *CatalogService) GetDraftCatalog(ctx context.Context) (models.CatalogPayload, error) {
	settings, err := s.repo.GetSettings(ctx, models.EnvDraft)
	if err != nil {
		return models.CatalogPayload{}, err
	}
	items, err := s.repo.ListItems(ctx, models.EnvDraft, false)
	if err != nil {
		return models.CatalogPayload{}, err
	}
	hasDiff, liveCount, err := s.repo.CheckHasDraftDiff(ctx)
	if err != nil {
		return models.CatalogPayload{}, err
	}
	return models.CatalogPayload{
		Settings:       settings,
		Items:          items,
		HasDraftDiff:   hasDiff,
		LiveItemsCount: liveCount,
	}, nil
}

func (s *CatalogService) CreateDraftItem(ctx context.Context, item models.CatalogItem) (models.CatalogItem, error) {
	item = sanitizeItem(item)
	if err := validateItem(item); err != nil {
		return models.CatalogItem{}, err
	}
	return s.repo.CreateDraftItem(ctx, item)
}

func (s *CatalogService) UpdateDraftItem(ctx context.Context, id int, item models.CatalogItem) (models.CatalogItem, error) {
	item = sanitizeItem(item)
	if err := validateItem(item); err != nil {
		return models.CatalogItem{}, err
	}
	return s.repo.UpdateDraftItem(ctx, id, item)
}

func (s *CatalogService) ToggleDraftVisibility(ctx context.Context, id int) (models.CatalogItem, error) {
	return s.repo.ToggleDraftVisibility(ctx, id)
}

func (s *CatalogService) DeleteDraftItem(ctx context.Context, id int) error {
	return s.repo.DeleteDraftItem(ctx, id)
}

func (s *CatalogService) UpdateDraftSettings(ctx context.Context, settings models.SiteSettings) (models.SiteSettings, error) {
	settings.BusinessName = strings.TrimSpace(settings.BusinessName)
	settings.Tagline = strings.TrimSpace(settings.Tagline)
	settings.HeroTitle = strings.TrimSpace(settings.HeroTitle)
	settings.HeroSubtitle = strings.TrimSpace(settings.HeroSubtitle)
	settings.WhatsAppURL = strings.TrimSpace(settings.WhatsAppURL)
	settings.InstagramURL = strings.TrimSpace(settings.InstagramURL)
	settings.MapsURL = strings.TrimSpace(settings.MapsURL)
	settings.PinterestURL = strings.TrimSpace(settings.PinterestURL)
	settings.AddressText = strings.TrimSpace(settings.AddressText)
	settings.OpeningHours = strings.TrimSpace(settings.OpeningHours)

	if settings.BusinessName == "" {
		return models.SiteSettings{}, errors.New("el nombre del centro de estética es obligatorio")
	}
	return s.repo.UpdateDraftSettings(ctx, settings)
}

func (s *CatalogService) PublishDraft(ctx context.Context) (models.CatalogPayload, error) {
	if err := s.repo.PublishDraftToLive(ctx); err != nil {
		return models.CatalogPayload{}, err
	}
	return s.GetDraftCatalog(ctx)
}

func (s *CatalogService) DiscardDraft(ctx context.Context) (models.CatalogPayload, error) {
	if err := s.repo.DiscardDraftFromLive(ctx); err != nil {
		return models.CatalogPayload{}, err
	}
	return s.GetDraftCatalog(ctx)
}

func sanitizeItem(item models.CatalogItem) models.CatalogItem {
	item.Name = strings.TrimSpace(item.Name)
	item.Category = strings.TrimSpace(item.Category)
	item.Description = strings.TrimSpace(item.Description)
	item.Duration = strings.TrimSpace(item.Duration)
	item.ImageURL = strings.TrimSpace(item.ImageURL)
	item.ItemType = strings.ToLower(strings.TrimSpace(item.ItemType))
	if item.ItemType != "product" {
		item.ItemType = "service"
	}
	return item
}

func validateItem(item models.CatalogItem) error {
	if item.Name == "" {
		return errors.New("el nombre del servicio o producto es obligatorio")
	}
	if item.Category == "" {
		return errors.New("la categoría es obligatoria")
	}
	if item.Price < 0 {
		return errors.New("el precio no puede ser negativo")
	}
	return nil
}
