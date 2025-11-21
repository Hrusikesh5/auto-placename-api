



async function search(req, res) {
  try {
    const { q, lang = 'en', size = 10 } = req.query;

    // Validate
    if (!q) {
      return res.status(400).json({
        error: 'Missing query parameter: q',
        example: '/api/search?q=london%20hilton&lang=en&size=10'
      });
    }

    if (!['en', 'ar', 'es'].includes(lang)) {
      return res.status(400).json({
        error: 'Invalid language. Supported: en, ar, es'
      });
    }

    const elasticsearchService = require('./services/elasticsearch');

    // Execute search
    const result = await elasticsearchService.search(q, lang, parseInt(size));

    res.json(result);

  } catch (error) {
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
}


async function getStatus(req, res) {
  try {
    const esService = require('./services/elasticsearch');
    const cacheService = require('./services/cache');

    let esStats = null;
    let esConnected = false;

    if (esService.isConnected()) {
      esConnected = true;
      try {
        esStats = await esService.getStats();
      } catch (error) {
        esStats = { error: error.message };
      }
    }

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        elasticsearch: {
          connected: esConnected,
          stats: esStats
        },
        redis: {
          connected: cacheService.isConnected()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Status check failed',
      message: error.message
    });
  }
}


async function testDeepL(req, res) {
  try {
    const translationService = require('./services/translation');
    
    const result = await translationService.testConnection();
    
    res.json({
      deepl: result,
      cacheStats: translationService.getCacheStats()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
}



async function saveGoogleResult(req, res) {
  try {
    const { result } = req.body;

    // Validate input
    if (!result) {
      return res.status(400).json({
        success: false,
        error: "Result object is required"
      });
    }

    if (!result.location || !result.location.lat || !result.location.lng) {
      return res.status(400).json({
        success: false,
        error: "Result must have location with lat/lng"
      });
    }

    if (!result.names || !result.names.en) {
      return res.status(400).json({
        success: false,
        error: "Result must have names with English name"
      });
    }

    const esSyncService = require("./services/es-sync");
    const translationService = require("./services/translation");

    console.log(`\n📍 USER CLICKED RESULT:`);
    console.log(`   Name: "${result.names.en}"`);
    console.log(`   Source: ${result.source}`);

    // Build translations object
    let translations = {
      en: result.names.en,
      ar: result.names.ar,
      es: result.names.es
    };

    // Generate missing translations
    if (!translations.ar || !translations.es) {
      console.log(`   🌍 Generating missing translations...`);
      const fullTranslations =
        await translationService.translatePlaceToAllLanguages(
          translations.en
        );

      translations = {
        ...translations,
        ...fullTranslations
      };
    }

    // Save to Elasticsearch
    const saveResult = await esSyncService.saveGoogleResult(
      result,
      translations
    );

    if (saveResult.success) {
      return res.json({
        success: true,
        message: "Successfully saved to Elasticsearch",
        esId: saveResult.esId,
        document: saveResult.document
      });
    }

    // Duplicate result
    if (saveResult.reason === "duplicate") {
      return res.json({
        success: false,
        reason: "duplicate",
        message: "Location already exists in database",
        duplicate: saveResult.duplicate
      });
    }

    // Other save failure
    return res.status(500).json({
      success: false,
      reason: saveResult.reason,
      error: saveResult.error || "Failed to save to Elasticsearch"
    });

  } catch (error) {
    console.error("Save Google result error:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}


// -----------------------------
// Get Sync Statistics Controller
// -----------------------------
async function getSyncStats(req, res) {
  try {
    const esSyncService = require("./services/es-sync");
    const stats = await esSyncService.getSyncStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}


module.exports = {
  saveGoogleResult,
  getSyncStats,
  search,
  getStatus,
  testDeepL
};