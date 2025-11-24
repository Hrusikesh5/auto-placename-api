
// const { Client } = require('@elastic/elasticsearch');
// const config = require('../config');

// class ElasticsearchService {
//   constructor() {
//     this.client = null;
//     this.connected = false;
//   }

//   async connect() {
//     try {
//       console.log('📡 Connecting to Elasticsearch...');
      
//       this.client = new Client({
//         node: config.ELASTICSEARCH.url,
//         requestTimeout: config.ELASTICSEARCH.timeout
//       });

//       // Test connection
//       const health = await this.client.cluster.health();
//       this.connected = true;

//       console.log('✓ Elasticsearch connected');
//       console.log(`  Status: ${health.status}`);
//       console.log(`  Active shards: ${health.active_shards}`);
//       console.log(`  Nodes: ${health.number_of_nodes}`);

//       return true;
//     } catch (error) {
//       console.error('✗ Elasticsearch connection failed:', error.message);
//       this.connected = false;
//       return false;
//     }
//   }

//   isConnected() {
//     return this.connected;
//   }

// async search(query, language = 'en', size = 10) {
//   if (!this.isConnected()) {
//     throw new Error('Elasticsearch not connected');
//   }

//   const queryBuilder = require('./elasticsearch-query-builder');
//   const startTime = Date.now();

//   try {
//     // Build intelligent query
//     const esQuery = queryBuilder.buildQuery(query, language, size);

//     // Execute search
//     const response = await this.client.search({
//       index: config.ELASTICSEARCH.index,
//       body: esQuery
//     });

//     // Format results
//     const results = queryBuilder.formatResults(response, language, query);
//     const responseTime = Date.now() - startTime;

//     // Calculate quality of results
//     const quality = this.assessResultQuality(results);

//     return {
//       success: true,
//       query: query,
//       language: language,
//       results: results,
//       total: response.hits.total.value,
//       quality: quality,
//       responseTime: responseTime,
//       source: 'elasticsearch'
//     };

//   } catch (error) {
//     console.error('Search error:', error.message);
//     return {
//       success: false,
//       query: query,
//       error: error.message,
//       results: [],
//       responseTime: Date.now() - startTime
//     };
//   }
// }

// assessResultQuality(results) {
//   if (results.length === 0) {
//     return 'POOR'; // No results at all
//   }

//   const topResult = results[0];
//   const topScore = topResult.score;

//   // If top result is EXCELLENT (>95%), results are GOOD
//   if (topResult.quality === 'EXCELLENT') {
//     return 'GOOD';
//   }

//   // If top result is GOOD (>80%), results are FAIR
//   if (topResult.quality === 'GOOD') {
//     return 'FAIR';
//   }

//   // If top result is less than 80%, results are POOR
//   return 'POOR';
// }


//   async getHealth() {
//     try {
//       return await this.client.cluster.health();
//     } catch (error) {
//       throw error;
//     }
//   }

//   async getStats() {
//     try {
//       const health = await this.getHealth();
//       const indexStats = await this.client.indices.stats({
//         index: 'places'
//       });

//       const count = await this.client.count({
//         index: 'places'
//       });

//       return {
//         health: health.status,
//         nodes: health.number_of_nodes,
//         activeShards: health.active_shards,
//         documentCount: count.count,
//         indexSize: indexStats.indices.places.primaries.store.size_in_bytes
//       };
//     } catch (error) {
//       throw error;
//     }
//   }

//   async disconnect() {
//     if (this.client) {
//       await this.client.close();
//       this.connected = false;
//       console.log('✓ Elasticsearch disconnected');
//     }
//   }
// }

// module.exports = new ElasticsearchService();






// const { Client } = require('@elastic/elasticsearch');
// const config = require('../config');
// const googleService = require('./google');
// const translationService = require('./translation'); 
// const esSyncService = require('./es-sync');
// const suggester = require('./elasticsearch-suggester')

// class ElasticsearchService {
//   constructor() {
//     this.client = null;
//     this.connected = false;
//   }

//   async connect() {
//     try {
//       console.log('📡 Connecting to Elasticsearch...');
      
//       this.client = new Client({
//         node: config.ELASTICSEARCH.url,
//         requestTimeout: config.ELASTICSEARCH.timeout
//       });

//       const health = await this.client.cluster.health();
//       this.connected = true;

//       // ✅ Initialize services
//       esSyncService.setClient(this.client);
//       suggester.setClient(this.client); // ✅ ADD THIS

//       console.log('✓ Elasticsearch connected');
//       console.log(`  Status: ${health.status}`);
//       console.log(`  Active shards: ${health.active_shards}`);
//       console.log(`  Nodes: ${health.number_of_nodes}`);

//       return true;
//     } catch (error) {
//       console.error('✗ Elasticsearch connection failed:', error.message);
//       this.connected = false;
//       return false;
//     }
//   }

//   isConnected() {
//     return this.connected;
//   }

// const IATA_CACHE = new Map();

// async validateIATAToken(token) {
//   if (IATA_CACHE.has(token)) {
//     return IATA_CACHE.get(token);
//   }

//   try {
//     const response = await this.client.search({
//       index: config.ELASTICSEARCH.index,
//       size: 0,
//       query: {
//         bool: {
//           must: [
//             { term: { type: 'airport' } },
//             { term: { iata: token.toUpperCase() } }
//           ]
//         }
//       }
//     });

//     const exists = response.hits.total.value > 0;
//     IATA_CACHE.set(token, exists);
//     return exists;
//   } catch (error) {
//     console.error(`   ⚠️  IATA validation error: ${error.message}`);
//     return false;
//   }
// }
  

//   async search(query, language = 'en', size = 10) {
//     if (!this.isConnected()) {
//       throw new Error('Elasticsearch not connected');
//     }

//     const queryBuilder = require('./elasticsearch-query-builder');
//     const startTime = Date.now();

//     try {
//       const analysis = queryBuilder.analyzeQuery(query, language);
      
//       console.log(`\n🔍 ELASTICSEARCH SEARCH:`);
//       console.log(`   Query: "${query}"`);
//       console.log(`   Language: ${language}`);
//       console.log(`   Word Count: ${analysis.words.length} words`);

//       // ✅ STEP 1: Check suggester FIRST (proactive correction)
//       let correctedQuery = query;
//       let suggestionUsed = null;
      
//       if (analysis.words.length >= 2) {
//         const suggestion = await suggester.getSuggestions(query, language);
        
//         if (suggestion.hasSuggestions && 
//             suggestion.corrected !== query && 
//             suggestion.confidence > 0.6) {
          
//           console.log(`   ✅ Using corrected query: "${suggestion.corrected}"`);
//           correctedQuery = suggestion.corrected;
//           suggestionUsed = suggestion;
//         }
//       }
      
//       // ✅ STEP 2: Run ES search (with corrected query if available)
//       const searchAnalysis = queryBuilder.analyzeQuery(correctedQuery, language);
//       const esQuery = queryBuilder.buildQuery(correctedQuery, language, size);
      
//       const response = await this.client.search({
//         index: config.ELASTICSEARCH.index,
//         body: esQuery
//       });

//       const results = queryBuilder.formatResults(response, language, correctedQuery, searchAnalysis);
//       const esResponseTime = Date.now() - startTime;

//       // ✅ STEP 3: Quality check
//       const qualityAssessment = queryBuilder.assessResultQuality(results, searchAnalysis);
//       const triggerDecision = this.shouldTriggerGoogle(qualityAssessment, searchAnalysis, results);

//       console.log(`\n📊 ES RESULTS: ${results.length} found, Quality: ${qualityAssessment.quality}`);
//       if (suggestionUsed) {
//         console.log(`   🔤 Correction: "${suggestionUsed.original}" → "${suggestionUsed.corrected}"`);
//       }
//       console.log(`🎯 GOOGLE TRIGGER: ${triggerDecision.shouldTrigger ? ' YES' : 'NO'}`);

//       // ✅ STEP 4: Google API fallback
//       let googleResults = null;
//       let finalResults = results;
//       let totalResponseTime = esResponseTime;

//       if (triggerDecision.shouldTrigger && googleService.isEnabled()) {
//         let queryForGoogle = correctedQuery;
        
//         if (language !== 'en' && translationService.isEnabled()) {
//           queryForGoogle = await translationService.translateQuery(correctedQuery, language);
//         }

//         console.log(`\n🌐 Calling Google API with: "${queryForGoogle}"`);
//         googleResults = await googleService.searchPlaces(queryForGoogle, language);
//         totalResponseTime += googleResults.responseTime || 0;

//         // ✅ Parallel translations
//         if (googleResults.success && googleResults.results.length > 0) {
//           console.log(`\n🌍 Translating ${googleResults.results.length} results (parallel)...`);
          
//           const tranStart = Date.now();
//           const englishNames = googleResults.results.map(r => r.names.en);
          
//           const [arabicNames, spanishNames] = await Promise.all([
//             translationService.translateBatch(englishNames, 'en', 'ar'),
//             translationService.translateBatch(englishNames, 'en', 'es')
//           ]);
          
//           for (let i = 0; i < googleResults.results.length; i++) {
//             googleResults.results[i].names.ar = arabicNames[i];
//             googleResults.results[i].names.es = spanishNames[i];
//           }
          
//           console.log(`   ✅ Translations done in ${Date.now() - tranStart}ms\n`);

//           finalResults = [
//             ...googleResults.results,
//             ...results.slice(0, Math.max(0, size - googleResults.results.length))
//           ];
          
//           console.log(`📊 MERGED: ${googleResults.results.length} Google + ${results.length} ES`);
//         }
//       }

//       console.log(`⏱️  Total: ${totalResponseTime}ms\n`);

//       return {
//         success: true,
//         query: correctedQuery,
//         originalQuery: query !== correctedQuery ? query : undefined,
//         language,
//         results: finalResults,
//         total: finalResults.length,
//         quality: qualityAssessment.quality,
        
//         suggestion: suggestionUsed ? {
//           original: suggestionUsed.original,
//           corrected: suggestionUsed.corrected,
//           confidence: suggestionUsed.confidence,
//           type: suggestionUsed.type
//         } : null,
        
//         googleTrigger: {
//           ...triggerDecision,
//           triggered: googleResults !== null
//         },
//         responseTime: totalResponseTime,
//         sources: {
//           elasticsearch: { count: results.length, responseTime: esResponseTime },
//           google: googleResults ? {
//             count: googleResults.results.length,
//             responseTime: googleResults.responseTime,
//             status: googleResults.googleStatus
//           } : null
//         },
//         analysis: {
//           isIATA: searchAnalysis.isIATA,
//           typeKeyword: searchAnalysis.typeKeyword,
//           wordCount: searchAnalysis.words.length,
//           words: searchAnalysis.words
//         }
//       };

//     } catch (error) {
//       console.error('❌ Search error:', error.message);
//       return {
//         success: false,
//         query,
//         error: error.message,
//         results: [],
//         responseTime: Date.now() - startTime
//       };
//     }
//   }

//   shouldTriggerGoogle(qualityAssessment, analysis, results) {
//     const triggers = config.SEARCH.googleTrigger;
    
//     if (!triggers.enabled) {
//       return {
//         shouldTrigger: false,
//         reasons: ['GOOGLE_TRIGGER_DISABLED'],
//         confidence: 0,
//         decision: 'Google trigger is disabled in config'
//       };
//     }

//     const reasons = [];
//     let shouldTrigger = false;

//     // No results
//     if (triggers.onZeroResults && results.length === 0) {
//       reasons.push('NO_RESULTS');
//       shouldTrigger = true;
//     }

//     // Poor quality (stricter thresholds)
//     if (triggers.onPoorQuality && results.length > 0) {
//       const topScore = results[0].score;
//       let threshold = triggers.minScoreThreshold;
      
//       if (analysis.wordCount >= 3) {
//         threshold = 20000;
//       } else if (analysis.wordCount === 2) {
//         threshold = 15000;
//       }
      
//       if (topScore < threshold) {
//         reasons.push(`LOW_SCORE (${Math.round(topScore)} < ${threshold})`);
//         shouldTrigger = true;
//       }
//     }

//     // Type mismatch
//     if (triggers.onTypeMismatch && analysis.typeKeyword && results.length > 0) {
//       const topResult = results[0];
//       if (topResult.type !== analysis.typeKeyword) {
//         reasons.push(`TYPE_MISMATCH (wanted: ${analysis.typeKeyword}, got: ${topResult.type})`);
//         shouldTrigger = true;
//       }
//     }

//     let decision;
//     let confidence = 0;

//     if (shouldTrigger) {
//       decision = `Google API will be called. Reasons: ${reasons.join(', ')}`;
//       confidence = 0.1;
//     } else {
//       decision = 'Elasticsearch results are sufficient. Google API not needed.';
//       if (results.length > 0) {
//         const topScore = results[0].score;
//         confidence = Math.min(1.0, topScore / 50000);
//       }
//     }

//     return {
//       shouldTrigger,
//       reasons,
//       confidence: Math.round(confidence * 100) / 100,
//       decision
//     };
//   }




//   async getHealth() {
//     try {
//       return await this.client.cluster.health();
//     } catch (error) {
//       throw error;
//     }
//   }

//   async getStats() {
//     try {
//       const health = await this.getHealth();
//       const indexStats = await this.client.indices.stats({
//         index: 'places'
//       });

//       const count = await this.client.count({
//         index: 'places'
//       });

//       return {
//         health: health.status,
//         nodes: health.number_of_nodes,
//         activeShards: health.active_shards,
//         documentCount: count.count,
//         indexSize: indexStats.indices.places.primaries.store.size_in_bytes
//       };
//     } catch (error) {
//       throw error;
//     }
//   }

//   async disconnect() {
//     if (this.client) {
//       await this.client.close();
//       this.connected = false;
//       console.log('✓ Elasticsearch disconnected');
//     }
//   }
// }

// module.exports = new ElasticsearchService();





const { Client } = require('@elastic/elasticsearch');
const config = require('../config');
const googleService = require('./google');
const translationService = require('./translation'); 
const esSyncService = require('./es-sync');
const suggester = require('./elasticsearch-suggester');

class ElasticsearchService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.iataCache = new Map();  // ✅ MOVED INSIDE CLASS
  }

  async connect() {
    try {
      console.log('📡 Connecting to Elasticsearch...');
      
      this.client = new Client({
        node: config.ELASTICSEARCH.url,
        requestTimeout: config.ELASTICSEARCH.timeout
      });

      const health = await this.client.cluster.health();
      this.connected = true;

      esSyncService.setClient(this.client);
      suggester.setClient(this.client);

      console.log('✓ Elasticsearch connected');
      console.log(`  Status: ${health.status}`);
      console.log(`  Active shards: ${health.active_shards}`);
      console.log(`  Nodes: ${health.number_of_nodes}`);

      return true;
    } catch (error) {
      console.error('✗ Elasticsearch connection failed:', error.message);
      this.connected = false;
      return false;
    }
  }

  isConnected() {
    return this.connected;
  }

  // ✅ MOVED INSIDE CLASS
  async validateIATAToken(token) {
    if (this.iataCache.has(token)) {
      return this.iataCache.get(token);
    }

    try {
      const response = await this.client.search({
        index: config.ELASTICSEARCH.index,
        size: 0,
        query: {
          bool: {
            must: [
              { term: { type: 'airport' } },
              { term: { iata: token.toUpperCase() } }
            ]
          }
        }
      });

      const exists = response.hits.total.value > 0;
      this.iataCache.set(token, exists);
      
      console.log(`   ${exists ? '✅' : '❌'} IATA validation: ${token} = ${exists}`);
      
      return exists;
    } catch (error) {
      console.error(`   ⚠️  IATA validation error: ${error.message}`);
      return false;
    }
  }

  async search(query, language = 'en', size = 10) {
    if (!this.isConnected()) {
      throw new Error('Elasticsearch not connected');
    }

    const queryBuilder = require('./elasticsearch-query-builder');
    const startTime = Date.now();

    try {
      const analysis = queryBuilder.analyzeQuery(query, language);
      
      console.log(`\n🔍 ELASTICSEARCH SEARCH:`);
      console.log(`   Query: "${query}"`);
      console.log(`   Language: ${language}`);
      console.log(`   Word Count: ${analysis.words.length} words`);

      // ✅ STEP 1: Check suggester FIRST
      let correctedQuery = query;
      let suggestionUsed = null;
      
      if (analysis.words.length >= 2) {
        const suggestion = await suggester.getSuggestions(query, language);
        
        if (suggestion.hasSuggestions && 
            suggestion.corrected !== query && 
            suggestion.confidence > 0.6) {
          
          console.log(`   ✅ Using corrected query: "${suggestion.corrected}"`);
          correctedQuery = suggestion.corrected;
          suggestionUsed = suggestion;
        }
      }
      
      // ✅ STEP 2: Validate IATA tokens (NEW!)
      const searchAnalysis = queryBuilder.analyzeQuery(correctedQuery, language);
      const validIATATokens = [];
      
      if (searchAnalysis.iataTokens && searchAnalysis.iataTokens.length > 0) {
        console.log(`\n📍 Validating IATA tokens: ${searchAnalysis.iataTokens.join(', ')}`);
        
        for (const token of searchAnalysis.iataTokens) {
          const isValid = await this.validateIATAToken(token);
          if (isValid) {
            validIATATokens.push(token);
          }
        }
      }
      
      // Attach validated tokens to analysis
      searchAnalysis.validIATATokens = validIATATokens;
      
      // ✅ STEP 3: Build ES query
      const esQuery = queryBuilder.buildQuery(correctedQuery, language, size, searchAnalysis);
      
      const response = await this.client.search({
        index: config.ELASTICSEARCH.index,
        body: esQuery
      });

      const results = queryBuilder.formatResults(response, language, correctedQuery, searchAnalysis);
      const esResponseTime = Date.now() - startTime;

      // ✅ STEP 4: Quality check + Google trigger
      const qualityAssessment = queryBuilder.assessResultQuality(results, searchAnalysis);
      
      // ✅ SHORT-CIRCUIT: Skip Google if exact IATA match found
      const hasExactIATAMatch = validIATATokens.length > 0 && 
        results.some(r => 
          r.type === 'airport' && 
          r.iata && 
          validIATATokens.includes(r.iata.toUpperCase())
        );
      
      let triggerDecision;
      if (hasExactIATAMatch) {
        console.log(`   ✅ Exact IATA match found - skipping Google`);
        triggerDecision = {
          shouldTrigger: false,
          reasons: ['IATA_MATCH_PRESENT'],
          confidence: 1,
          decision: 'Exact IATA match in ES. Google API not needed.'
        };
      } else {
        triggerDecision = this.shouldTriggerGoogle(qualityAssessment, searchAnalysis, results);
      }

      console.log(`\n📊 ES RESULTS: ${results.length} found, Quality: ${qualityAssessment.quality}`);
      if (suggestionUsed) {
        console.log(`   🔤 Correction: "${suggestionUsed.original}" → "${suggestionUsed.corrected}"`);
      }
      console.log(`🎯 GOOGLE TRIGGER: ${triggerDecision.shouldTrigger ? '✅ YES' : '❌ NO'}`);

      // ✅ STEP 5: Google API fallback
      let googleResults = null;
      let finalResults = results;
      let totalResponseTime = esResponseTime;

      if (triggerDecision.shouldTrigger && googleService.isEnabled()) {
        let queryForGoogle = correctedQuery;
        
        if (language !== 'en' && translationService.isEnabled()) {
          queryForGoogle = await translationService.translateQuery(correctedQuery, language);
        }

        console.log(`\n🌐 Calling Google API with: "${queryForGoogle}"`);
        googleResults = await googleService.searchPlaces(queryForGoogle, language);
        totalResponseTime += googleResults.responseTime || 0;

        if (googleResults.success && googleResults.results.length > 0) {
          console.log(`\n🌍 Translating ${googleResults.results.length} results (parallel)...`);
          
          const tranStart = Date.now();
          const englishNames = googleResults.results.map(r => r.names.en);
          
          const [arabicNames, spanishNames] = await Promise.all([
            translationService.translateBatch(englishNames, 'en', 'ar'),
            translationService.translateBatch(englishNames, 'en', 'es')
          ]);
          
          for (let i = 0; i < googleResults.results.length; i++) {
            googleResults.results[i].names.ar = arabicNames[i];
            googleResults.results[i].names.es = spanishNames[i];
          }
          
          console.log(`   ✅ Translations done in ${Date.now() - tranStart}ms\n`);

          finalResults = [
            ...googleResults.results,
            ...results.slice(0, Math.max(0, size - googleResults.results.length))
          ];
          
          console.log(`📊 MERGED: ${googleResults.results.length} Google + ${results.length} ES`);
        }
      }

      console.log(`⏱️  Total: ${totalResponseTime}ms\n`);

      return {
        success: true,
        query: correctedQuery,
        originalQuery: query !== correctedQuery ? query : undefined,
        language,
        results: finalResults,
        total: finalResults.length,
        quality: qualityAssessment.quality,
        
        suggestion: suggestionUsed ? {
          original: suggestionUsed.original,
          corrected: suggestionUsed.corrected,
          confidence: suggestionUsed.confidence,
          type: suggestionUsed.type
        } : null,
        
        googleTrigger: {
          ...triggerDecision,
          triggered: googleResults !== null
        },
        responseTime: totalResponseTime,
        sources: {
          elasticsearch: { count: results.length, responseTime: esResponseTime },
          google: googleResults ? {
            count: googleResults.results.length,
            responseTime: googleResults.responseTime,
            status: googleResults.googleStatus
          } : null
        },
        analysis: {
          isIATA: searchAnalysis.isIATA,
          iataTokens: searchAnalysis.iataTokens,
          validIATATokens: validIATATokens,
          typeKeyword: searchAnalysis.typeKeyword,
          wordCount: searchAnalysis.words.length,
          words: searchAnalysis.words
        }
      };

    } catch (error) {
      console.error('❌ Search error:', error.message);
      console.error(error.stack);  // ✅ Added for debugging
      return {
        success: false,
        query,
        error: error.message,
        results: [],
        responseTime: Date.now() - startTime
      };
    }
  }

  shouldTriggerGoogle(qualityAssessment, analysis, results) {
    const triggers = config.SEARCH.googleTrigger;
    
    if (!triggers.enabled) {
      return {
        shouldTrigger: false,
        reasons: ['GOOGLE_TRIGGER_DISABLED'],
        confidence: 0,
        decision: 'Google trigger is disabled in config'
      };
    }

    const reasons = [];
    let shouldTrigger = false;

    if (triggers.onZeroResults && results.length === 0) {
      reasons.push('NO_RESULTS');
      shouldTrigger = true;
    }

    if (triggers.onPoorQuality && results.length > 0) {
      const topScore = results[0].score;
      let threshold = triggers.minScoreThreshold;
      
      if (analysis.wordCount >= 3) {
        threshold = 20000;
      } else if (analysis.wordCount === 2) {
        threshold = 15000;
      }
      
      if (topScore < threshold) {
        reasons.push(`LOW_SCORE (${Math.round(topScore)} < ${threshold})`);
        shouldTrigger = true;
      }
    }

    if (triggers.onTypeMismatch && analysis.typeKeyword && results.length > 0) {
      const topResult = results[0];
      if (topResult.type !== analysis.typeKeyword) {
        reasons.push(`TYPE_MISMATCH (wanted: ${analysis.typeKeyword}, got: ${topResult.type})`);
        shouldTrigger = true;
      }
    }

    let decision;
    let confidence = 0;

    if (shouldTrigger) {
      decision = `Google API will be called. Reasons: ${reasons.join(', ')}`;
      confidence = 0.1;
    } else {
      decision = 'Elasticsearch results are sufficient. Google API not needed.';
      if (results.length > 0) {
        const topScore = results[0].score;
        confidence = Math.min(1.0, topScore / 50000);
      }
    }

    return {
      shouldTrigger,
      reasons,
      confidence: Math.round(confidence * 100) / 100,
      decision
    };
  }

  async getHealth() {
    try {
      return await this.client.cluster.health();
    } catch (error) {
      throw error;
    }
  }

  async getStats() {
    try {
      const health = await this.getHealth();
      const indexStats = await this.client.indices.stats({
        index: 'places'
      });

      const count = await this.client.count({
        index: 'places'
      });

      return {
        health: health.status,
        nodes: health.number_of_nodes,
        activeShards: health.active_shards,
        documentCount: count.count,
        indexSize: indexStats.indices.places.primaries.store.size_in_bytes
      };
    } catch (error) {
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.connected = false;
      console.log('✓ Elasticsearch disconnected');
    }
  }
}

module.exports = new ElasticsearchService();