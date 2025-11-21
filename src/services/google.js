const axios = require('axios');
const config = require('../config');

class GooglePlacesService {
  constructor() {
    this.apiKey = config.GOOGLE.apiKey;
    this.baseUrl = config.GOOGLE.baseUrl;
    this.enabled = config.GOOGLE.enabled;
    this.timeout = config.GOOGLE.timeout || 5000;
    this.maxResults = config.GOOGLE.maxResults || 10;
  }

  isEnabled() {
    if (!this.enabled || !this.apiKey) {
      console.log('⚠️  Google Places API is not configured');
      return false;
    }
    return true;
  }

  /**
   * MAIN: Search Google Places API
   * ✅ CRITICAL: Always query Google in ENGLISH for best results
   * 
   * @param {string} queryInEnglish - Query ALREADY TRANSLATED to English by DeepL
   * @param {string} userLanguage - User's original language (for logging/metadata)
   * @returns {Object} Formatted results (in English, to be translated by DeepL)
   */
  async searchPlaces(queryInEnglish, userLanguage = 'en') {
    console.log(`\n🌐 GOOGLE PLACES API SEARCH:`);
    console.log(`   Query (English): "${queryInEnglish}"`);
    console.log(`   User Language: ${userLanguage}`);
    if (userLanguage !== 'en') {
      console.log(`   ℹ️  Note: Query was translated to English by DeepL before calling Google`);
    }

    if (!this.isEnabled()) {
      return {
        success: false,
        results: [],
        error: 'Google Places API not configured',
        source: 'google'
      };
    }

    const startTime = Date.now();

    try {
      // ✅ ALWAYS use English for Google API
      const params = {
        query: queryInEnglish,
        key: this.apiKey,
        language: 'en' // ✅ FIXED: Always English, never ar/es
      };

      console.log(`   Calling Google API (language: en)...`);

      const response = await axios.get(this.baseUrl, {
        params,
        timeout: this.timeout
      });

      const responseTime = Date.now() - startTime;

      if (response.data.status === 'ZERO_RESULTS') {
        console.log(`   ⚠️  Google returned no results`);
        return {
          success: true,
          results: [],
          total: 0,
          responseTime,
          source: 'google',
          googleStatus: 'ZERO_RESULTS'
        };
      }

      if (response.data.status !== 'OK') {
        console.log(`   ❌ Google API error: ${response.data.status}`);
        return {
          success: false,
          results: [],
          error: `Google API returned: ${response.data.status}`,
          responseTime,
          source: 'google'
        };
      }

      const googleResults = response.data.results.slice(0, this.maxResults);
      const formattedResults = await this.formatGoogleResults(
        googleResults, 
        userLanguage,
        queryInEnglish
      );

      console.log(`   ✅ Found ${googleResults.length} results (in English)`);
      console.log(`   ℹ️  These will be translated to ${userLanguage} by DeepL in Step 9`);
      console.log(`   Response Time: ${responseTime}ms\n`);

      return {
        success: true,
        results: formattedResults,
        total: googleResults.length,
        responseTime,
        source: 'google',
        googleStatus: 'OK',
        userLanguage: userLanguage, // ✅ Store for translation
        rawGoogleData: googleResults
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`   ❌ Google API error: ${error.message}\n`);

      return {
        success: false,
        results: [],
        error: error.message,
        responseTime,
        source: 'google'
      };
    }
  }

  /**
   * FORMAT GOOGLE RESULTS
   * ✅ Results are in ENGLISH (Google's response language)
   * ✅ Will be translated by DeepL in Step 9
   */
// async formatGoogleResults(googleResults, userLanguage, originalQuery) {
//   const formattedResults = [];

//   for (let i = 0; i < googleResults.length; i++) {
//     const place = googleResults[i];
//     const placeType = this.detectPlaceType(place.types || []);
//     const nameComponents = this.extractNameComponents(place);

//     const formattedResult = {
//       rank: i + 1,
//       score: this.calculateGoogleScore(place, originalQuery, i),
//       scorePercentage: Math.round(((10 - i) / 10) * 100),

//       // ✅ FIXED: Use ES-format name
//       names: {
//         en: nameComponents.esFormatName, // "The Slate Phuket,Phuket,Thailand"
//         ar: null,  // Will be translated by DeepL
//         es: null,  // Will be translated by DeepL
//       },

//       location: {
//         lat: place.geometry.location.lat,
//         lng: place.geometry.location.lng
//       },

//       type: placeType,
//       iata: null,
//       postcode: this.extractPostcode(place),

//       quality: i === 0 ? 'EXCELLENT' : (i < 3 ? 'GOOD' : 'FAIR'),
//       matched: 'google',

//       googleMetadata: {
//         placeId: place.place_id,
//         address: place.formatted_address,
//         types: place.types,
//         rating: place.rating || null,
//         userRatingsTotal: place.user_ratings_total || null,
//         businessStatus: place.business_status || null,
//         priceLevel: place.price_level || null,
//         // ✅ Store name components for future use
//         nameComponents: nameComponents
//       },

//       needsTranslation: userLanguage !== 'en',
//       targetLanguage: userLanguage,
//       needsESSync: true,
//       source: 'google'
//     };

//     formattedResults.push(formattedResult);
//   }

//   return formattedResults;
// }

async formatGoogleResults(googleResults, userLanguage, originalQuery) {
  const formattedResults = [];

  for (let i = 0; i < googleResults.length; i++) {
    const place = googleResults[i];
    const placeType = this.detectPlaceType(place.types || []);
    const nameComponents = this.extractNameComponents(place);

    const formattedResult = {
      rank: i + 1,
      score: this.calculateGoogleScore(place, originalQuery, i),
      scorePercentage: Math.round(((10 - i) / 10) * 100),

      names: {
        en: nameComponents.esFormatName,
        ar: null,
        es: null,
      },

      // ✅ NEW: Add detailed address at top level
      detailedAddress: place.formatted_address || null,

      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },

      type: placeType,
      iata: null,
      postcode: this.extractPostcode(place),

      quality: i === 0 ? 'EXCELLENT' : (i < 3 ? 'GOOD' : 'FAIR'),
      matched: 'google',

      googleMetadata: {
        placeId: place.place_id,
        address: place.formatted_address,
        types: place.types,
        rating: place.rating || null,
        userRatingsTotal: place.user_ratings_total || null,
        businessStatus: place.business_status || null,
        priceLevel: place.price_level || null,
        nameComponents: nameComponents
      },

      needsTranslation: userLanguage !== 'en',
      targetLanguage: userLanguage,
      needsESSync: true,
      source: 'google'
    };

    formattedResults.push(formattedResult);
  }

  return formattedResults;
}

  detectPlaceType(googleTypes) {
    const airportTypes = ['airport'];
    if (googleTypes.some(t => airportTypes.includes(t))) {
      return 'airport';
    }

    const hotelTypes = [
      'lodging', 'hotel', 'motel', 'resort', 
      'hostel', 'inn', 'guest_house', 'bed_and_breakfast'
    ];
    if (googleTypes.some(t => hotelTypes.includes(t))) {
      return 'hotel';
    }

    if (googleTypes.includes('establishment')) {
      return 'hotel';
    }

    return 'hotel';
  }

  extractNameComponents(place) {
    const name = place.name;
    const address = place.formatted_address || '';
    const addressParts = address.split(',').map(p => p.trim());
    const country = addressParts[addressParts.length - 1] || '';
    // const city = addressParts[addressParts.length - 2] || addressParts[0] || '';

    let city = '';
    if (addressParts.length >= 2) {
        const beforeCountry = addressParts[addressParts.length - 2];
        city = beforeCountry.replace(/\d{4,}/g, '').trim();

        if (!city || city.length < 3) {
            city = addressParts[0] || '';
        }
    }
    const esFormatName = `${name},${city},${country}`;

    return {
      name,
      city,
      country,
      fullAddress: address,
      esFormatName 
    };
  }

  extractPostcode(place) {
    if (!place.address_components) {
      return 'UNKNOWN';
    }

    const postalCode = place.address_components.find(
      component => component.types.includes('postal_code')
    );

    return postalCode ? postalCode.long_name : 'UNKNOWN';
  }

  calculateGoogleScore(place, query, rank) {
    let score = 50000;
    score -= (rank * 3000);

    const queryLower = query.toLowerCase();
    const nameLower = place.name.toLowerCase();
    if (nameLower.includes(queryLower) || queryLower.includes(nameLower)) {
      score += 10000;
    }

    if (place.rating) {
      score += (place.rating * 1000);
    }

    if (place.user_ratings_total > 100) {
      score += 2000;
    }

    return Math.round(score);
  }

  prepareForESSync(googleResult, translations) {
    return {
      placenameEN: translations.en || googleResult.names.en,
      placenameAR: translations.ar || null,
      placenameES: translations.es || null,
      lat: googleResult.location.lat,
      lng: googleResult.location.lng,
      location: {
        lat: googleResult.location.lat,
        lon: googleResult.location.lng
      },
      type: googleResult.type,
      iata: null,
      postcode: googleResult.postcode,
      source: 'google_api',
      googlePlaceId: googleResult.googleMetadata.placeId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async isDuplicate(lat, lng, elasticsearchClient) {
    const DUPLICATE_THRESHOLD_METERS = 100;

    try {
      const response = await elasticsearchClient.search({
        index: config.ELASTICSEARCH.index,
        body: {
          query: {
            bool: {
              filter: {
                geo_distance: {
                  distance: `${DUPLICATE_THRESHOLD_METERS}m`,
                  location: {
                    lat: lat,
                    lon: lng
                  }
                }
              }
            }
          }
        }
      });

      return response.hits.hits.length > 0;
    } catch (error) {
      console.error('Error checking for duplicates:', error.message);
      return false;
    }
  }
}

module.exports = new GooglePlacesService();