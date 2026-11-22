package config

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

type Config struct {
	Port         string
	DatabaseURL  string
	AdminPIN     string
	SiteName     string
	WhatsAppURL  string
	InstagramURL string
	MapsURL      string
	PinterestURL string
}

// Load carga variables desde .env (si existe en el directorio actual, padre o abuelo) y luego lee el entorno.
func Load() *Config {
	loadEnvFile(".env")
	loadEnvFile("../.env")
	loadEnvFile("../../.env")

	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "estetica")
	dbPass := getEnv("DB_PASSWORD", "estetica123")
	dbName := getEnv("DB_NAME", "estetica_tym")
	dbSSL := getEnv("DB_SSLMODE", "disable")

	defaultDSN := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		dbUser, dbPass, dbHost, dbPort, dbName, dbSSL)

	return &Config{
		Port:         getEnv("PORT", "8080"),
		DatabaseURL:  getEnv("DATABASE_URL", defaultDSN),
		AdminPIN:     getEnv("ADMIN_PIN", "1234"),
		SiteName:     getEnv("SITE_NAME", "Estética T&M"),
		WhatsAppURL:  getEnv("WHATSAPP_URL", "https://wa.me/5491100000000?text=Hola!%20Quisiera%20consultar%20por%20un%20turno%20o%20servicio."),
		InstagramURL: getEnv("INSTAGRAM_URL", "https://instagram.com/esteticatym"),
		MapsURL:      getEnv("MAPS_URL", "https://maps.google.com/?q=Obelisco,Buenos+Aires"),
		PinterestURL: getEnv("PINTEREST_URL", ""),
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok && strings.TrimSpace(val) != "" {
		return strings.TrimSpace(val)
	}
	return fallback
}

func loadEnvFile(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		val := strings.TrimSpace(parts[1])
		val = strings.Trim(val, `"'`)
		if _, exists := os.LookupEnv(key); !exists {
			_ = os.Setenv(key, val)
		}
	}
}
