const config = require('../config');

class ESSyncService {
  constructor() {
    this.client = null;
  }

  setClient(client) {
    this.client = client;
  }

  /**
   * CHECK FOR DUPLICATE
   * Only checks if place name already exists (ignores location)
   */
  async checkDuplicate(lat, lng, name) {
    if (!this.client) {
      throw new Error('Elasticsearch client not set');
    }

    console.log(`\n🔍 CHECKING FOR DUPLICATE:`);
    console.log(`   Name: "${name}"`);

    try {
      const response = await this.client.search({
        index: config.ELASTICSEARCH.index,
        body: {
          query: {
            match: {
              placenameEN: {
                query: name,
                operator: 'and',
                fuzziness: 0
              }
            }
          },
          size: 1,
          _source: ['placenameEN', 'lat', 'lng', 'type', 'source']
        }
      });

      if (response.hits.hits.length > 0) {
        const existingPlace = response.hits.hits[0]._source;
        console.log(`   ⚠️  DUPLICATE FOUND:`);
        console.log(`      Existing: "${existingPlace.placenameEN}"`);
        console.log(`      Location: ${existingPlace.lat}, ${existingPlace.lng}`);
        console.log(`      Source: ${existingPlace.source}\n`);

        return {
          isDuplicate: true,
          existing: existingPlace
        };
      }

      console.log(`   ✅ No duplicate found\n`);
      return {
        isDuplicate: false
      };

    } catch (error) {
      console.error(`   ❌ Duplicate check error: ${error.message}`);
      return {
        isDuplicate: false,
        error: error.message
      };
    }
  }

  /**
   * SAVE GOOGLE RESULT TO ES
   */
  async saveGoogleResult(googleResult, translations) {
    if (!this.client) {
      throw new Error('Elasticsearch client not set');
    }

    console.log(`\n💾 SAVING GOOGLE RESULT TO ES:`);
    console.log(`   Name (EN): "${translations.en}"`);
    console.log(`   Location: ${googleResult.location.lat}, ${googleResult.location.lng}`);
    console.log(`   Type: ${googleResult.type}`);

    const duplicateCheck = await this.checkDuplicate(
      googleResult.location.lat,
      googleResult.location.lng,
      translations.en
    );

    if (duplicateCheck.isDuplicate) {
      console.log(`   ⚠️  Duplicate name detected, skipping save\n`);
      return {
        success: false,
        reason: 'duplicate',
        message: 'A place with this name already exists',
        existing: duplicateCheck.existing
      };
    }

    const esDocument = {
      placenameEN: translations.en,
      placenameAR: translations.ar,
      placenameES: translations.es,
      lat: googleResult.location.lat,
      lng: googleResult.location.lng,
      location: {
        lat: googleResult.location.lat,
        lon: googleResult.location.lng
      },
      type: googleResult.type,
      iata: null,
      postcode: googleResult.postcode || 'UNKNOWN',
      source: 'google_api',
      googlePlaceId: googleResult.googleMetadata?.placeId || null,
      createdAt: new Date().toISOString(),
      addedViaUserClick: true
    };

    try {
      const response = await this.client.index({
        index: config.ELASTICSEARCH.index,
        body: esDocument,
        refresh: 'wait_for'
      });

      console.log(`   ✅ Saved to ES with ID: ${response._id}`);
      console.log(`   Index refreshed, immediately searchable\n`);

      return {
        success: true,
        esId: response._id,
        document: esDocument
      };

    } catch (error) {
      console.error(`   ❌ ES save error: ${error.message}\n`);
      return {
        success: false,
        reason: 'es_error',
        error: error.message
      };
    }
  }

  /**
   * CALCULATE DISTANCE (kept for reference)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * GET SYNC STATISTICS
   */
  async getSyncStats() {
    if (!this.client) {
      throw new Error('Elasticsearch client not set');
    }

    try {
      const response = await this.client.count({
        index: config.ELASTICSEARCH.index,
        body: {
          query: {
            term: {
              source: 'google_api'
            }
          }
        }
      });

      return {
        totalGoogleResults: response.count
      };

    } catch (error) {
      return {
        error: error.message
      };
    }
  }
}

module.exports = new ESSyncService();