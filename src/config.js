require("dotenv").config();

module.exports = {
  PORT: parseInt(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",

  ELASTICSEARCH: {
    url: process.env.ES_URL || "http://localhost:9200",
    index: "places",
    timeout: 30000,
  },

  REDIS: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || null,
  },

  GOOGLE: {
    apiKey: process.env.GOOGLE_API_KEY || "",
    baseUrl: "https://maps.googleapis.com/maps/api/place/textsearch/json",
    enabled: !!process.env.GOOGLE_API_KEY,
    timeout: 5000,
    maxResults: 10,
  },

  DEEPL: {
    apiKey: process.env.DEEPL_API_KEY || "",
    baseUrl: "https://api-free.deepl.com/v2",
    enabled: !!process.env.DEEPL_API_KEY,
  },

  CACHE: {
    enabled: process.env.CACHE_ENABLED !== "false",
    ttl: 86400,
    prefix: "search:",
  },

  LANGUAGES: {
    SUPPORTED: ["en", "ar", "es"],
    FIELDS: {
      en: "placenameEN",
      ar: "placenameAR",
      es: "placenameES",
    },
    DEFAULT: "en",
  },

  SEARCH: {
    defaultSize: 10,
    googleTrigger: {
      enabled: true,
      onZeroResults: true,
      onPoorQuality: true,
      onTypeMismatch: true,
      onLowConfidence: true,
      minScoreThreshold: 10000,
      minWordCount: 2,
      confidenceThreshold: 0.2,
    },
    autoSaveToES: {
      enabled: process.env.AUTO_SAVE_GOOGLE_TO_ES === "true",
      duplicateCheckRadius: 100,
    },
  },
};