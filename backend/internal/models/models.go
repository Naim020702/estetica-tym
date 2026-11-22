package models

import "time"

type EnvType string

const (
	EnvLive  EnvType = "live"
	EnvDraft EnvType = "draft"
)

type SiteSettings struct {
	Env          EnvType   `json:"env"`
	BusinessName string    `json:"businessName"`
	Tagline      string    `json:"tagline"`
	HeroTitle    string    `json:"heroTitle"`
	HeroSubtitle string    `json:"heroSubtitle"`
	WhatsAppURL  string    `json:"whatsappUrl"`
	InstagramURL string    `json:"instagramUrl"`
	MapsURL      string    `json:"mapsUrl"`
	PinterestURL string    `json:"pinterestUrl"`
	AddressText  string    `json:"addressText"`
	OpeningHours string    `json:"openingHours"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type CatalogItem struct {
	ID          int       `json:"id"`
	Env         EnvType   `json:"env"`
	ItemType    string    `json:"itemType"` // "service" | "product"
	Category    string    `json:"category"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Price       float64   `json:"price"`
	Duration    string    `json:"duration"`
	ImageURL    string    `json:"imageUrl"`
	IsVisible   bool      `json:"isVisible"`
	SortOrder   int       `json:"sortOrder"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type CatalogPayload struct {
	Settings       SiteSettings  `json:"settings"`
	Items          []CatalogItem `json:"items"`
	HasDraftDiff   bool          `json:"hasDraftDiff"`
	LiveItemsCount int           `json:"liveItemsCount"`
}
