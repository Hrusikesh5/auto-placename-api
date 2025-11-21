


// const config = require('../config');

// class ElasticsearchQueryBuilderV5 {
//   /**
//    * MAIN ENTRY POINT
//    */
//   buildQuery(query, language = 'en', size = 10) {
//     const analysis = this.analyzeQuery(query, language);
    
//     console.log(`\n📊 QUERY ANALYSIS:`);
//     console.log(`   Query: "${query}"`);
//     console.log(`   Language: ${language}`);
//     console.log(`   Words: [${analysis.words.join(', ')}]`);
//     console.log(`   Cleaned: "${analysis.cleanedQuery}"`);
//     if (analysis.typeKeyword) {
//       console.log(`   Type Keyword Found: ${analysis.typeKeyword}`);
//     }
//     if (analysis.isIATA) {
//       console.log(`   Format: IATA Code`);
//     }
//     console.log('');

//     // IATA Query (3 chars = airport code)
//     if (analysis.isIATA) {
//       return this.buildIATAQuery(analysis, language, size);
//     }

//     // Standard Query with Type Awareness
//     return this.buildStandardQuery(analysis, language, size);
//   }

//   /**
//    * ANALYZE QUERY
//    * Extract: words, type keywords, format, language
//    */
//   analyzeQuery(query, language) {
//     const trimmed = query.trim();
//     const cleanedInput = this.cleanInput(trimmed);
//     const isIATA = this.detectIATA(cleanedInput);
//     const typeKeyword = this.detectTypeKeyword(cleanedInput, language);
//     const words = this.tokenizeQuery(cleanedInput, language);

//     return {
//       original: query,
//       trimmed: trimmed,
//       cleaned: cleanedInput,
//       words: words,
//       wordCount: words.length,
//       isIATA: isIATA,
//       typeKeyword: typeKeyword,
//       language: language,
//       cleanedQuery: words.join(' ')
//     };
//   }

//   /**
//    * CLEAN INPUT
//    * Remove special characters, normalize spaces
//    */
//   cleanInput(query) {
//     return query
//       .replace(/[*\[\](){}]/g, '') // Remove special chars: * [ ] ( ) { }
//       .replace(/[^\w\s\u0600-\u06FF\u00C0-\u017F]/g, ' ') // Keep: letters, Arabic, Spanish accents
//       .replace(/\s+/g, ' ') // Normalize spaces
//       .trim();
//   }

//   /**
//    * DETECT IATA CODE
//    * Returns true if query is exactly 3 letters
//    */
//   detectIATA(query) {
//     const trimmed = query.toUpperCase().trim();
//     return /^[A-Z]{3}$/.test(trimmed);
//   }

//   /**
//    * DETECT COMMON TYPOS FOR TYPE KEYWORDS
//    * Maps common misspellings to correct types
//    */
//   detectTypoKeyword(query) {
//     const lowered = query.toLowerCase();
    
//     // Airport typos (aipot, airpot, etc.)
//     const airportTypos = [
//       'aipot', 'airpot', 'airpor', 'arport', 'aiport', 
//       'airpotr', 'airprt', 'aeorport', 'aerport',
//       'aitport', 'airpott', 'airoport', 'airportt',
//       'yaarpot', 'eirport', 'airpoet', 'airpoty'
//     ];
    
//     // Hotel typos
//     const hotelTypos = [
//       'hotl', 'hotle', 'hotal', 'hotell', 'htoel', 'hottel',
//       'hoteal', 'hotle', 'hoteel'
//     ];
    
//     for (const typo of airportTypos) {
//       if (lowered.includes(typo)) {
//         return 'airport';
//       }
//     }
    
//     for (const typo of hotelTypos) {
//       if (lowered.includes(typo)) {
//         return 'hotel';
//       }
//     }
    
//     return null;
//   }

//   /**
//    * DETECT TYPE KEYWORD - MULTILINGUAL
//    * Supports: English, Arabic, Spanish
//    */
//   detectTypeKeyword(query, language) {
//     const lowered = query.toLowerCase();

//     // ===== CHECK FOR TYPOS FIRST =====
//     const typoType = this.detectTypoKeyword(query);
//     if (typoType) {
//       console.log(`   ⚠️  Detected typo for type: ${typoType}`);
//       return typoType;
//     }

//     // ===== ENGLISH TYPE KEYWORDS =====
//     if (lowered.includes('airport') || lowered.includes('aeroport')) {
//       return 'airport';
//     }
//     if (lowered.includes('hotel') || lowered.includes('inn') || 
//         lowered.includes('resort') || lowered.includes('hostel') ||
//         lowered.includes('motel')) {
//       return 'hotel';
//     }

//     // ===== ARABIC TYPE KEYWORDS =====
//     // مطار (mataar) = airport
//     if (query.includes('مطار')) {
//       return 'airport';
//     }
//     // فندق (funduq) = hotel
//     if (query.includes('فندق')) {
//       return 'hotel';
//     }

//     // ===== SPANISH TYPE KEYWORDS =====
//     // aeropuerto = airport
//     if (lowered.includes('aeropuerto')) {
//       return 'airport';
//     }
//     // hotel = hotel (same as English)
//     if (lowered.includes('hotel')) {
//       return 'hotel';
//     }

//     return null;
//   }

//   /**
//    * PHONETIC MATCHING
//    * Generate phonetic variations for better typo tolerance
//    */
//   generatePhoneticVariations(word) {
//     // Common phonetic substitutions
//     const phoneticRules = [
//       // Vowel confusion
//       { pattern: /a/g, replace: '[aei]' },
//       { pattern: /e/g, replace: '[aei]' },
//       { pattern: /i/g, replace: '[aei]' },
//       { pattern: /o/g, replace: '[ou]' },
//       { pattern: /u/g, replace: '[ou]' },
      
//       // Consonant confusion
//       { pattern: /ph/g, replace: 'f' },
//       { pattern: /k/g, replace: '[ck]' },
//       { pattern: /c/g, replace: '[ck]' },
//     ];

//     return word; // For now, we'll use fuzzy matching instead
//   }

//   /**
//    * TOKENIZE QUERY
//    * Remove stop words, clean punctuation
//    */
//   tokenizeQuery(query, language) {
//     // Stop words by language
//     const stopWords = {
//       en: new Set(['the', 'a', 'an', 'of', 'at', 'in', 'on', 'to', 'for', 'by', 'and', 'or']),
//       ar: new Set(['ال', 'في', 'على', 'من', 'إلى', 'و', 'أو']),
//       es: new Set(['el', 'la', 'de', 'en', 'a', 'y', 'o', 'por'])
//     };

//     const stops = stopWords[language] || stopWords.en;

//     const words = query
//       .trim()
//       .toLowerCase()
//       .replace(/[^\w\s\u0600-\u06FF\u00C0-\u017F]/g, ' ') // Keep Arabic, Spanish
//       .split(/\s+/)
//       .filter(word => word.length > 1 && !stops.has(word));

//     return [...new Set(words)]; // Remove duplicates
//   }

//   /**
//    * BUILD IATA QUERY
//    * For 3-character airport codes
//    */
//   buildIATAQuery(analysis, language, size) {
//     const languageField = config.LANGUAGES.FIELDS[language];
//     const englishField = config.LANGUAGES.FIELDS['en'];

//     return {
//       size: size,
//       query: {
//         bool: {
//           should: [
//             // PRIORITY 1: Exact IATA match (10000x boost)
//             {
//               term: {
//                 iata: {
//                   value: analysis.cleaned.toUpperCase(),
//                   boost: 10000
//                 }
//               }
//             },

//             // PRIORITY 2: Force type=airport for IATA
//             {
//               term: {
//                 type: {
//                   value: 'airport',
//                   boost: 5000
//                 }
//               }
//             },

//             // PRIORITY 3: Text match on names
//             {
//               multi_match: {
//                 query: analysis.cleaned,
//                 fields: [englishField, languageField],
//                 type: 'phrase_prefix',
//                 boost: 100
//               }
//             }
//           ]
//         }
//       },
//       sort: [{ _score: { order: 'desc' } }]
//     };
//   }

//   /**
//    * BUILD STANDARD QUERY
//    * Main search with context awareness
//    */
//   buildStandardQuery(analysis, language, size) {
//     const languageField = config.LANGUAGES.FIELDS[language];
//     const englishField = config.LANGUAGES.FIELDS['en'];
//     const { words, cleanedQuery, typeKeyword } = analysis;

//     const shouldClauses = [];

//     // ================================================
//     // 🔥 PRIORITY 0: EXPLICIT TYPE PRIORITY
//     // When type keyword detected, actual airports/hotels 
//     // should rank above hotels/places with that word in name
//     // ================================================
//     if (typeKeyword) {
//       // Find location words (exclude type keyword)
//       const locationWords = words.filter(word => {
//         const lower = word.toLowerCase();
//         return !lower.includes('airport') && 
//                !lower.includes('hotel') &&
//                !lower.includes('aipot') &&
//                !lower.includes('airpot') &&
//                !lower.includes('hotl');
//       });

//       if (locationWords.length > 0) {
//         shouldClauses.push({
//           bool: {
//             must: [
//               // Location words must match
//               ...locationWords.map(word => ({
//                 match: {
//                   [englishField]: {
//                     query: word,
//                     fuzziness: this.calculateFuzziness(word, words.length),
//                     prefix_length: 1
//                   }
//                 }
//               })),
              
//               // Type MUST match (not just in name)
//               {
//                 term: {
//                   type: typeKeyword
//                 }
//               }
//             ],
//             // CRITICAL: This ensures actual airports/hotels rank higher
//             // than places with "airport" or "hotel" in their name
//             boost: 50000 // MASSIVE boost for actual type match
//           }
//         });

//         console.log(`   ✅ Type priority boost applied for: ${typeKeyword}`);
//         console.log(`   📍 Location words: [${locationWords.join(', ')}]`);
//       }
//     }

//     // ================================================
//     // PRIORITY 1: MULTI-WORD CONTEXT (all words match)
//     // ================================================
//     if (words.length >= 2 && typeKeyword) {
//       shouldClauses.push({
//         bool: {
//           must: words.map(word => ({
//             match: {
//               [englishField]: {
//                 query: word,
//                 fuzziness: this.calculateFuzziness(word, words.length),
//                 prefix_length: 1
//               }
//             }
//           })),
//           boost: 10000
//         }
//       });
//     }

//     // ================================================
//     // PRIORITY 2: EXACT PHRASE MATCH
//     // ================================================
//     shouldClauses.push({
//       multi_match: {
//         query: cleanedQuery,
//         fields: [
//           `${englishField}.keyword^20`,
//           `${englishField}^15`,
//           ...(language !== 'en' ? [`${languageField}^12`] : [])
//         ],
//         type: 'phrase',
//         boost: 5000
//       }
//     });

//     // ================================================
//     // PRIORITY 3: ALL WORDS MUST MATCH
//     // ================================================
//     shouldClauses.push({
//       bool: {
//         must: words.map(word => ({
//           match: {
//             [englishField]: {
//               query: word,
//               fuzziness: this.calculateFuzziness(word, words.length),
//               prefix_length: 1,
//               boost: 100
//             }
//           }
//         })),
//         boost: 3000
//       }
//     });

//     // ================================================
//     // PRIORITY 4: MOST WORDS MATCH (60% threshold)
//     // ================================================
//     shouldClauses.push({
//       bool: {
//         should: words.map(word => ({
//           match: {
//             [englishField]: {
//               query: word,
//               fuzziness: 'AUTO',
//               boost: 50
//             }
//           }
//         })),
//         minimum_should_match: Math.max(1, Math.ceil(words.length * 0.6)),
//         boost: 1500
//       }
//     });

//     // ================================================
//     // PRIORITY 5: PHRASE WITH SLOP
//     // ================================================
//     shouldClauses.push({
//       match_phrase: {
//         [englishField]: {
//           query: cleanedQuery,
//           slop: 5,
//           boost: 1200
//         }
//       }
//     });

//     // ================================================
//     // PRIORITY 6: PREFIX MATCHING (single word)
//     // ================================================
//     if (words.length === 1) {
//       shouldClauses.push({
//         match_phrase_prefix: {
//           [englishField]: {
//             query: words[0],
//             boost: 800
//           }
//         }
//       });
//     }

//     // ================================================
//     // PRIORITY 7: CROSS FIELDS
//     // ================================================
//     shouldClauses.push({
//       multi_match: {
//         query: cleanedQuery,
//         fields: language === 'en' 
//           ? [englishField] 
//           : [languageField, englishField],
//         type: 'cross_fields',
//         operator: 'or',
//         boost: 600
//       }
//     });

//     // ================================================
//     // PRIORITY 8: TYPE BOOST (secondary)
//     // This is less important than Priority 0
//     // ================================================
//     if (typeKeyword) {
//       shouldClauses.push({
//         term: {
//           type: {
//             value: typeKeyword,
//             boost: 2000
//           }
//         }
//       });
//     }

//     const baseQuery = {
//       size: size,
//       query: {
//         bool: {
//           should: shouldClauses,
//           minimum_should_match: 1
//         }
//       },
//       sort: [{ _score: { order: 'desc' } }]
//     };

//     return baseQuery;
//   }

//   /**
//    * CALCULATE FUZZINESS
//    * Context-aware fuzzy distance
//    */
//   calculateFuzziness(word, totalWords) {
//     // Brand names (all caps): no fuzziness
//     if (word === word.toUpperCase() && word.length > 2) {
//       return 0;
//     }

//     // Short words: no fuzziness
//     if (word.length <= 3) {
//       return 0;
//     }

//     // Medium words: allow 1 typo
//     if (word.length <= 6) {
//       return 1;
//     }

//     // Long words: allow 2 typos
//     if (word.length <= 10) {
//       return 2;
//     }

//     // Very long words: AUTO
//     return 'AUTO';
//   }

//   /**
//    * FORMAT RESULTS
//    * Transform Elasticsearch response to user-friendly format
//    */
//   formatResults(esResponse, language, query) {
//     if (!esResponse.hits || !esResponse.hits.hits) {
//       return [];
//     }

//     const languageField = config.LANGUAGES.FIELDS[language];
//     const englishField = config.LANGUAGES.FIELDS['en'];
//     const topScore = esResponse.hits.hits[0]?._score || 1;

//     return esResponse.hits.hits.map((hit, index) => ({
//       rank: index + 1,
//       score: Math.round(hit._score * 100) / 100,
//       scorePercentage: Math.round((hit._score / topScore) * 100),
      
//       // Names in all 3 languages
//       names: {
//         [language]: hit._source[languageField] || hit._source[englishField],
//         en: hit._source[englishField],
//         ar: hit._source.placenameAR,
//         es: hit._source.placenameES
//       },

//       // Location coordinates
//       location: {
//         lat: hit._source.lat,
//         lng: hit._source.lng
//       },

//       // Metadata
//       type: hit._source.type,
//       iata: hit._source.iata || null,
//       postcode: hit._source.postcode || null,

//       // Quality assessment
//       quality: this.assessQuality(hit._score / topScore),
//       matched: hit._source[languageField] ? 'native' : 'english_fallback'
//     }));
//   }

//   /**
//    * ASSESS QUALITY
//    * Rate result quality as EXCELLENT/GOOD/FAIR/POOR
//    */
//   assessQuality(scorePercentage) {
//     if (scorePercentage >= 0.95) return 'EXCELLENT';
//     if (scorePercentage >= 0.80) return 'GOOD';
//     if (scorePercentage >= 0.50) return 'FAIR';
//     return 'POOR';
//   }

//   /**
//    * ASSESS OVERALL RESULT QUALITY
//    * Determine if results are good or need Google fallback
//    */
//   assessResultQuality(results, analysis) {
//     if (results.length === 0) {
//       return 'POOR';
//     }

//     const topResult = results[0];
//     const topQuality = topResult.quality;

//     // If type keyword specified and top result matches type: check quality
//     if (analysis.typeKeyword && topResult.type === analysis.typeKeyword) {
//       if (topQuality === 'EXCELLENT') {
//         return 'EXCELLENT';
//       }
//       return 'GOOD';
//     }

//     // If no location found (scores very low), mark as POOR
//     if (topResult.score < 1000) {
//       return 'POOR';
//     }

//     // If top result is EXCELLENT: GOOD overall
//     if (topQuality === 'EXCELLENT') {
//       return 'GOOD';
//     }

//     // If top result is GOOD: FAIR overall
//     if (topQuality === 'GOOD') {
//       return 'FAIR';
//     }

//     return 'POOR';
//   }
// }

// module.exports = new ElasticsearchQueryBuilderV5();













// const config = require('../config');

// class ElasticsearchQueryBuilderV5 {
//   /**
//    * MAIN ENTRY POINT
//    */
//   buildQuery(query, language = 'en', size = 10) {
//     const analysis = this.analyzeQuery(query, language);
    
//     console.log(`\n📊 QUERY ANALYSIS:`);
//     console.log(`   Query: "${query}"`);
//     console.log(`   Language: ${language}`);
//     console.log(`   Words: [${analysis.words.join(', ')}]`);
//     console.log(`   Cleaned: "${analysis.cleanedQuery}"`);
//     if (analysis.typeKeyword) {
//       console.log(`   Type Keyword Found: ${analysis.typeKeyword}`);
//     }
//     if (analysis.isIATA) {
//       console.log(`   Format: IATA Code`);
//     }
//     console.log('');

//     // IATA Query (3 chars = airport code)
//     if (analysis.isIATA) {
//       return this.buildIATAQuery(analysis, language, size);
//     }

//     // Standard Query with Type Awareness
//     return this.buildStandardQuery(analysis, language, size);
//   }

//   /**
//    * ANALYZE QUERY
//    */
//   analyzeQuery(query, language) {
//     const trimmed = query.trim();
//     const cleanedInput = this.cleanInput(trimmed);
//     const isIATA = this.detectIATA(cleanedInput);
//     const typeKeyword = this.detectTypeKeyword(cleanedInput, language);
//     const words = this.tokenizeQuery(cleanedInput, language);

//     return {
//       original: query,
//       trimmed: trimmed,
//       cleaned: cleanedInput,
//       words: words,
//       wordCount: words.length,
//       isIATA: isIATA,
//       typeKeyword: typeKeyword,
//       language: language,
//       cleanedQuery: words.join(' ')
//     };
//   }

//   cleanInput(query) {
//     return query
//       .replace(/[*\[\](){}]/g, '')
//       .replace(/[^\w\s\u0600-\u06FF\u00C0-\u017F]/g, ' ')
//       .replace(/\s+/g, ' ')
//       .trim();
//   }

//   detectIATA(query) {
//     const trimmed = query.toUpperCase().trim();
//     return /^[A-Z]{3}$/.test(trimmed);
//   }

//   levenshteinDistance(str1, str2) {
//     const matrix = [];
//     for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
//     for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
    
//     for (let i = 1; i <= str2.length; i++) {
//       for (let j = 1; j <= str1.length; j++) {
//         if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
//           matrix[i][j] = matrix[i - 1][j - 1];
//         } else {
//           matrix[i][j] = Math.min(
//             matrix[i - 1][j - 1] + 1,
//             matrix[i][j - 1] + 1,
//             matrix[i - 1][j] + 1
//           );
//         }
//       }
//     }
//     return matrix[str2.length][str1.length];
//   }

//   detectTypoKeyword(query) {
//     const lowered = query.toLowerCase();
    
//     const airportTypos = [
//       'aipot', 'airpot', 'airpor', 'arport', 'aiport',
//       'airpotr', 'airprt', 'aeorport', 'aerport',
//       'aitport', 'airpott', 'airoport', 'airportt',
//       'yaarpot', 'eirport', 'airpoet', 'airpoty',
//       'aerpot', 'airprot', 'ariport', 'airporrt',
//       'airpourt', 'erpot', 'aerpourt', 'aeropot',
//       'airpoot', 'aairport', 'airpoort', 'aorport',
//       'aurport', 'aitpot', 'airpprt', 'qirport',
//       'sirport', 'wairport', 'aieport', 'airort',
//       'irport', 'airpport', 'airrport', 'oirport',
//       'uirport', 'airpart', 'airpurt'
//     ];
    
//     const hotelTypos = [
//       'hotl', 'hotle', 'hotal', 'hotell', 'htoel',
//       'hottel', 'hoteal', 'hoteel', 'hoetl', 'hottl',
//       'htel', 'hotale', 'hotwl', 'hotrl', 'hotep',
//       'hoel', 'hhotel', 'hottell'
//     ];
    
//     for (const typo of airportTypos) {
//       if (lowered.includes(typo)) {
//         console.log(`   🔍 Dictionary match: "${typo}" → airport`);
//         return 'airport';
//       }
//     }
    
//     for (const typo of hotelTypos) {
//       if (lowered.includes(typo)) {
//         console.log(`   🔍 Dictionary match: "${typo}" → hotel`);
//         return 'hotel';
//       }
//     }
    
//     const words = lowered.split(/\s+/);
//     const airportKeywords = ['airport', 'aeroport', 'aeropuerto'];
//     const hotelKeywords = ['hotel', 'inn', 'resort'];
    
//     for (const word of words) {
//       if (word.length < 4) continue;
      
//       for (const keyword of airportKeywords) {
//         const distance = this.levenshteinDistance(word, keyword);
//         const maxDistance = Math.ceil(keyword.length * 0.35);
//         if (distance <= maxDistance) {
//           console.log(`   🔤 Phonetic match: "${word}" → "airport" (distance: ${distance}/${maxDistance})`);
//           return 'airport';
//         }
//       }
      
//       for (const keyword of hotelKeywords) {
//         const distance = this.levenshteinDistance(word, keyword);
//         const maxDistance = Math.ceil(keyword.length * 0.35);
//         if (distance <= maxDistance) {
//           console.log(`   🔤 Phonetic match: "${word}" → "hotel" (distance: ${distance}/${maxDistance})`);
//           return 'hotel';
//         }
//       }
//     }
    
//     return null;
//   }

//   detectTypeKeyword(query, language) {
//     const lowered = query.toLowerCase();
//     const typoType = this.detectTypoKeyword(query);
//     if (typoType) {
//       console.log(`   ⚠️  Detected typo for type: ${typoType}`);
//       return typoType;
//     }

//     if (lowered.includes('airport') || lowered.includes('aeroport')) return 'airport';
//     if (lowered.includes('hotel') || lowered.includes('inn') || 
//         lowered.includes('resort') || lowered.includes('hostel') ||
//         lowered.includes('motel')) return 'hotel';
//     if (query.includes('مطار')) return 'airport';
//     if (query.includes('فندق')) return 'hotel';
//     if (lowered.includes('aeropuerto')) return 'airport';

//     return null;
//   }

//   tokenizeQuery(query, language) {
//     const stopWords = {
//       en: new Set(['the', 'a', 'an', 'of', 'at', 'in', 'on', 'to', 'for', 'by', 'and', 'or']),
//       ar: new Set(['ال', 'في', 'على', 'من', 'إلى', 'و', 'أو']),
//       es: new Set(['el', 'la', 'de', 'en', 'a', 'y', 'o', 'por'])
//     };

//     const stops = stopWords[language] || stopWords.en;

//     const words = query
//       .trim()
//       .toLowerCase()
//       .replace(/[^\w\s\u0600-\u06FF\u00C0-\u017F]/g, ' ')
//       .split(/\s+/)
//       .filter(word => word.length > 1 && !stops.has(word));

//     return [...new Set(words)];
//   }

//   buildIATAQuery(analysis, language, size) {
//     const languageField = config.LANGUAGES.FIELDS[language];
//     const englishField = config.LANGUAGES.FIELDS['en'];

//     return {
//       size: size,
//       query: {
//         bool: {
//           should: [
//             {
//               term: {
//                 iata: {
//                   value: analysis.cleaned.toUpperCase(),
//                   boost: 10000
//                 }
//               }
//             },
//             {
//               term: {
//                 type: {
//                   value: 'airport',
//                   boost: 5000
//                 }
//               }
//             },
//             {
//               multi_match: {
//                 query: analysis.cleaned,
//                 fields: [englishField, languageField],
//                 type: 'phrase_prefix',
//                 boost: 100
//               }
//             }
//           ]
//         }
//       },
//       sort: [{ _score: { order: 'desc' } }]
//     };
//   }

//   /**
//    * ✅ COMPLETELY REFACTORED STANDARD QUERY
//    * Uses confidence-based tiered scoring to prevent false positives
//    */
//   buildStandardQuery(analysis, language, size) {
//     const languageField = config.LANGUAGES.FIELDS[language];
//     const englishField = config.LANGUAGES.FIELDS['en'];
//     const { words, cleanedQuery, typeKeyword } = analysis;

//     const shouldClauses = [];

//     // Get location words (exclude type keywords)
//     const locationWords = words.filter(word => {
//       if (this.detectTypoKeyword(word)) return false;
//       const lower = word.toLowerCase();
//       return !lower.includes('airport') && 
//              !lower.includes('hotel') &&
//              !lower.includes('aeroport') &&
//              !lower.includes('aeropuerto') &&
//              !lower.includes('inn') &&
//              !lower.includes('resort') &&
//              !lower.includes('hostel') &&
//              !lower.includes('motel') &&
//              !lower.includes('مطار') &&
//              !lower.includes('فندق');
//     });

//     // ================================================
//     // 🥇 TIER 1: EXACT MATCHES (100K+ scores)
//     // ================================================
    
//     // 1A. Exact phrase match with type
//     if (typeKeyword && locationWords.length > 0) {
//       const locationPhrase = locationWords.join(' ');
//       shouldClauses.push({
//         bool: {
//           must: [
//             {
//               match_phrase: {
//                 [englishField]: {
//                   query: locationPhrase,
//                   boost: 1000
//                 }
//               }
//             },
//             {
//               term: {
//                 type: typeKeyword
//               }
//             }
//           ],
//           boost: 100 // Total: 100,000
//         }
//       });
//     }

//     // 1B. Exact keyword match
//     shouldClauses.push({
//       match: {
//         [`${englishField}.keyword`]: {
//           query: cleanedQuery,
//           boost: 80000
//         }
//       }
//     });

//     // ================================================
//     // 🥈 TIER 2: STRONG MATCHES (50K-100K scores)
//     // ================================================
    
//     // 2A. All words match exactly (no fuzz) with type
//     if (typeKeyword && locationWords.length > 0) {
//       shouldClauses.push({
//         bool: {
//           must: [
//             ...locationWords.map(word => ({
//               match: {
//                 [englishField]: {
//                   query: word,
//                   fuzziness: 0, // ✅ NO FUZZINESS for strong matches
//                   boost: 500
//                 }
//               }
//             })),
//             {
//               term: {
//                 type: typeKeyword
//               }
//             }
//           ],
//           boost: 100 // Total: 50,000+
//         }
//       });
//     }

//     // 2B. Exact phrase match (no type requirement)
//     shouldClauses.push({
//       match_phrase: {
//         [englishField]: {
//           query: cleanedQuery,
//           boost: 50000
//         }
//       }
//     });

//     // ================================================
//     // 🥉 TIER 3: MODERATE MATCHES (20K-50K scores)
//     // ================================================
    
//     // 3A. All words match with minimal fuzziness (1 typo) + type
//     if (typeKeyword && locationWords.length > 0) {
//       shouldClauses.push({
//         bool: {
//           must: [
//             ...locationWords.map(word => ({
//               match: {
//                 [englishField]: {
//                   query: word,
//                   fuzziness: word.length > 5 ? 1 : 0, // ✅ Only 1 typo for long words
//                   prefix_length: 2, // ✅ Require 2-char prefix match
//                   boost: 200
//                 }
//               }
//             })),
//             {
//               term: {
//                 type: typeKeyword
//               }
//             }
//           ],
//           boost: 100 // Total: 20,000+
//         }
//       });
//     }

//     // 3B. Phrase match with small slop
//     shouldClauses.push({
//         match_phrase: {
//         [englishField]: {
//           query: cleanedQuery,
//           slop: 2, // ✅ Only 2 words can be inserted
//           boost: 30000
//         }
//       }
//     });

//     // 3C. Type match boost (only if type specified)
//     if (typeKeyword) {
//       shouldClauses.push({
//         term: {
//           type: {
//             value: typeKeyword,
//             boost: 25000
//           }
//         }
//       });
//     }

//     // ================================================
//     // 🏅 TIER 4: WEAK MATCHES (5K-20K scores)
//     // ================================================
    
//     // 4A. Most words match (70% threshold) with controlled fuzziness
//     if (words.length >= 2) {
//       shouldClauses.push({
//         bool: {
//           should: words.map(word => ({
//             match: {
//               [englishField]: {
//                 query: word,
//                 fuzziness: word.length > 6 ? 1 : 0, // ✅ Conservative fuzziness
//                 boost: 100
//               }
//             }
//           })),
//           minimum_should_match: Math.ceil(words.length * 0.7), // ✅ 70% must match
//           boost: 100 // Total: 10,000-20,000
//         }
//       });
//     }

//     // 4B. Prefix matching for single word queries
//     if (words.length === 1) {
//       shouldClauses.push({
//         match_phrase_prefix: {
//           [englishField]: {
//             query: words[0],
//             boost: 15000
//           }
//         }
//       });
//     }

//     // ================================================
//     // 🎯 TIER 5: FALLBACK MATCHES (< 5K scores)
//     // These will trigger Google fallback
//     // ================================================
    
//     // 5A. Cross-field fuzzy search (last resort)
//     shouldClauses.push({
//       multi_match: {
//         query: cleanedQuery,
//         fields: language === 'en' 
//           ? [englishField] 
//           : [languageField, englishField],
//         type: 'cross_fields',
//         operator: 'or',
//         fuzziness: 'AUTO',
//         boost: 100 // Total: < 5,000
//       }
//     });

//     return {
//       size: size,
//       query: {
//         bool: {
//           should: shouldClauses,
//           minimum_should_match: 1
//         }
//       },
//       sort: [{ _score: { order: 'desc' } }]
//     };
//   }

//   formatResults(esResponse, language, query, analysis) {
//     if (!esResponse.hits || !esResponse.hits.hits) {
//       return [];
//     }

//     const languageField = config.LANGUAGES.FIELDS[language];
//     const englishField = config.LANGUAGES.FIELDS['en'];
//     const topScore = esResponse.hits.hits[0]?._score || 1;

//     return esResponse.hits.hits.map((hit, index) => {
//       const absoluteScore = hit._score;
//       const scorePercentage = absoluteScore / topScore;
      
//       return {
//         rank: index + 1,
//         score: Math.round(absoluteScore * 100) / 100,
//         scorePercentage: Math.round(scorePercentage * 100),
        
//         names: {
//           [language]: hit._source[languageField] || hit._source[englishField],
//           en: hit._source[englishField],
//           ar: hit._source.placenameAR,
//           es: hit._source.placenameES
//         },

//         location: {
//           lat: hit._source.lat,
//           lng: hit._source.lng
//         },

//         type: hit._source.type,
//         iata: hit._source.iata || null,
//         postcode: hit._source.postcode || null,

//         quality: this.assessQuality(absoluteScore, scorePercentage, analysis?.isIATA || false),
//         matched: hit._source[languageField] ? 'native' : 'english_fallback',
//         typeMatch: analysis ? (analysis.typeKeyword ? hit._source.type === analysis.typeKeyword : null) : null
//       };
//     });
//   }

//   /**
//    * ✅ UPDATED: Tier-based quality assessment
//    */
//   assessQuality(absoluteScore, scorePercentage, isIATA = false) {
//     if (isIATA) {
//       if (absoluteScore >= 50000 && scorePercentage >= 0.95) return 'EXCELLENT';
//       if (absoluteScore >= 30000 || scorePercentage >= 0.90) return 'GOOD';
//       if (absoluteScore >= 20000) return 'FAIR';
//       return 'POOR';
//     }
    
//     // ✅ NEW: Tier-based thresholds
//     if (absoluteScore >= 50000 && scorePercentage >= 0.90) return 'EXCELLENT'; // Tier 1-2
//     if (absoluteScore >= 20000 && scorePercentage >= 0.70) return 'GOOD';      // Tier 3
//     if (absoluteScore >= 10000 && scorePercentage >= 0.50) return 'FAIR';      // Tier 4
//     return 'POOR'; // Tier 5 or below
//   }

//   /**
//    * ✅ UPDATED: More aggressive Google triggering
//    */
//   assessResultQuality(results, analysis) {
//     if (results.length === 0) {
//       console.log(`   ❌ No results - Google needed`);
//       return {
//         quality: 'POOR',
//         triggerGoogle: true,
//         reason: 'NO_RESULTS'
//       };
//     }

//     const topResult = results[0];
//     const absoluteScore = topResult.score;

//     // Type mismatch
//     if (analysis.typeKeyword && topResult.type !== analysis.typeKeyword) {
//       console.log(`   ❌ Type mismatch: expected ${analysis.typeKeyword}, got ${topResult.type}`);
//       return {
//         quality: 'POOR',
//         triggerGoogle: true,
//         reason: 'TYPE_MISMATCH'
//       };
//     }

//     // ✅ NEW: Aggressive threshold for non-IATA queries
//     const threshold = analysis.isIATA ? 20000 : 10000; // ✅ Lowered to 10K
      
//     if (absoluteScore < threshold) {
//       console.log(`   ❌ Low score: ${absoluteScore} < ${threshold}`);
//       return {
//         quality: 'POOR',
//         triggerGoogle: true,
//         reason: 'LOW_CONFIDENCE_MATCH'
//       };
//     }

//     // Assess quality based on tiers
//     let quality = 'FAIR';
//     if (analysis.isIATA) {
//       if (absoluteScore >= 50000) quality = 'EXCELLENT';
//       else if (absoluteScore >= 30000) quality = 'GOOD';
//     } else {
//       if (absoluteScore >= 50000) quality = 'EXCELLENT';
//       else if (absoluteScore >= 20000) quality = 'GOOD';
//     }

//     console.log(`   ✅ Quality: ${quality} (score: ${absoluteScore})`);
    
//     return {
//       quality: quality,
//       triggerGoogle: false,
//       reason: 'SUFFICIENT_RESULTS'
//     };
//   }
// }

// module.exports = new ElasticsearchQueryBuilderV5();





const config = require('../config');

class ElasticsearchQueryBuilderV5 {
  buildQuery(query, language = 'en', size = 10) {
    const analysis = this.analyzeQuery(query, language);
    
    if (analysis.typeKeyword) {
      console.log(`   Type Keyword Found: ${analysis.typeKeyword}`);
    }
    if (analysis.isIATA) {
      console.log(`   Format: IATA Code`);
    }
    console.log('');

    if (analysis.isIATA) {
      return this.buildIATAQuery(analysis, language, size);
    }

    return this.buildStandardQuery(analysis, language, size);
  }

  analyzeQuery(query, language) {
    const trimmed = query.trim();
    const cleanedInput = this.cleanInput(trimmed);
   
    const typeKeyword = this.detectTypeKeyword(cleanedInput, language);
    const words = this.tokenizeQuery(cleanedInput, language);


    let isIATA = this.detectIATA(cleanedInput);
    let iataCode = null;
    if (!isIATA && words.length > 1) {
      for (const word of words) {
        if (/^[A-Z]{3}$/i.test(word)) {
          isIATA = true;
          iataCode = word.toUpperCase();
          console.log(`   ⚠️  Detected IATA code within multi-word query: ${iataCode}`);
          break;
        }
      }
    }



    return {
      original: query,
      trimmed: trimmed,
      cleaned: cleanedInput,
      words: words,
      wordCount: words.length,
      isIATA: isIATA,
      iataCode: iataCode || (isIATA ? cleanedInput.toUpperCase() : null),
      typeKeyword: typeKeyword,
      language: language,
      cleanedQuery: words.join(' ')
    };
  }

  cleanInput(query) {
    return query
      .replace(/[*\[\](){}]/g, '')
      .replace(/[^\w\s\u0600-\u06FF\u00C0-\u017F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  detectIATA(query) {
    const trimmed = query.toUpperCase().trim();
    return /^[A-Z]{3}$/.test(trimmed);
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  detectTypoKeyword(query) {
    const lowered = query.toLowerCase();
    
    const airportTypos = [
      'aipot', 'airpot', 'airpor', 'arport', 'aiport',
      'airpotr', 'airprt', 'aeorport', 'aerport',
      'aitport', 'airpott', 'airoport', 'airportt',
      'yaarpot', 'eirport', 'airpoet', 'airpoty',
      'aerpot', 'airprot', 'ariport', 'airporrt',
      'airpourt', 'erpot', 'aerpourt', 'aeropot',
      'airpoot', 'aairport', 'airpoort', 'aorport',
      'aurport', 'aitpot', 'airpprt', 'qirport',
      'sirport', 'wairport', 'aieport', 'airort',
      'irport', 'airpport', 'airrport', 'oirport',
      'uirport', 'airpart', 'airpurt'
    ];
    
    const hotelTypos = [
      'hotl', 'hotle', 'hotal', 'hotell', 'htoel',
      'hottel', 'hoteal', 'hoteel', 'hoetl', 'hottl',
      'htel', 'hotale', 'hotwl', 'hotrl', 'hotep',
      'hoel', 'hhotel', 'hottell'
    ];
    
    for (const typo of airportTypos) {
      if (lowered.includes(typo)) {
        console.log(`   🔍 Dictionary match: "${typo}" → airport`);
        return 'airport';
      }
    }
    
    for (const typo of hotelTypos) {
      if (lowered.includes(typo)) {
        console.log(`   🔍 Dictionary match: "${typo}" → hotel`);
        return 'hotel';
      }
    }
    
    const words = lowered.split(/\s+/);
    const airportKeywords = ['airport', 'aeroport', 'aeropuerto'];
    const hotelKeywords = ['hotel', 'inn', 'resort'];
    
    for (const word of words) {
      if (word.length < 4) continue;
      
      for (const keyword of airportKeywords) {
        const distance = this.levenshteinDistance(word, keyword);
        const maxDistance = Math.ceil(keyword.length * 0.35);
        if (distance <= maxDistance) {
          console.log(`   🔤 Phonetic match: "${word}" → "airport" (distance: ${distance}/${maxDistance})`);
          return 'airport';
        }
      }
      
      for (const keyword of hotelKeywords) {
        const distance = this.levenshteinDistance(word, keyword);
        const maxDistance = Math.ceil(keyword.length * 0.35);
        if (distance <= maxDistance) {
          console.log(`   🔤 Phonetic match: "${word}" → "hotel" (distance: ${distance}/${maxDistance})`);
          return 'hotel';
        }
      }
    }
    
    return null;
  }

  // detectTypeKeyword(query, language) {
  //   const lowered = query.toLowerCase();
  //   const typoType = this.detectTypoKeyword(query);
  //   if (typoType) {
  //     console.log(`   ⚠️  Detected typo for type: ${typoType}`);
  //     return typoType;
  //   }

  //   if (lowered.includes('airport') || lowered.includes('aeroport')) return 'airport';
  //   if (lowered.includes('hotel') || lowered.includes('inn') || 
  //       lowered.includes('resort') || lowered.includes('hostel') ||
  //       lowered.includes('motel')) return 'hotel';
  //   if (query.includes('مطار')) return 'airport';
  //   if (query.includes('فندق')) return 'hotel';
  //   if (lowered.includes('aeropuerto')) return 'airport';

  //   return null;
  // }



  detectTypeKeyword(query, language) {
  const lowered = query.toLowerCase();
  const typoType = this.detectTypoKeyword(query);
  
  if (typoType) {
    console.log(`   ⚠️  Detected typo for type: ${typoType}`);
    return typoType;
  }

  // ✅ Check for all type keywords
  const hasAirport = lowered.includes('airport') || 
                     lowered.includes('aeroport') || 
                     lowered.includes('aeropuerto') ||
                     query.includes('مطار');
                     
  const hasHotel = lowered.includes('hotel') || 
                   lowered.includes('inn') || 
                   lowered.includes('resort') || 
                   lowered.includes('hostel') ||
                   lowered.includes('motel') ||
                   query.includes('فندق');

  // ✅ Priority: hotel > airport (more specific destination)
  if (hasHotel && hasAirport) {
    console.log(`   🔀 Mixed query: prioritizing HOTEL`);
    return 'hotel';
  }

  // ✅ Single type detection
  if (hasAirport) return 'airport';
  if (hasHotel) return 'hotel';

  return null;
}

  tokenizeQuery(query, language) {
    const stopWords = {
      en: new Set(['the', 'a', 'an', 'of', 'at', 'in', 'on', 'to', 'for', 'by', 'and', 'or']),
      ar: new Set(['ال', 'في', 'على', 'من', 'إلى', 'و', 'أو']),
      es: new Set(['el', 'la', 'de', 'en', 'a', 'y', 'o', 'por'])
    };

    const stops = stopWords[language] || stopWords.en;

    const words = query
      .trim()
      .toLowerCase()
      .replace(/[^\w\s\u0600-\u06FF\u00C0-\u017F]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1 && !stops.has(word));

    return [...new Set(words)];
  }

  // buildIATAQuery(analysis, language, size) {
  //   const languageField = config.LANGUAGES.FIELDS[language];
  //   const englishField = config.LANGUAGES.FIELDS['en'];
    

  //   return {
  //     size: size,
  //     query: {
  //       bool: {
  //         should: [
  //           {
  //             term: {
  //               iata: {
  //                 value: analysis.cleaned.toUpperCase(),
  //                 boost: 10000
  //               }
  //             }
  //           },
  //           {
  //             term: {
  //               type: {
  //                 value: 'airport',
  //                 boost: 5000
  //               }
  //             }
  //           },
  //           {
  //             multi_match: {
  //               query: analysis.cleaned,
  //               fields: [englishField, languageField],
  //               type: 'phrase_prefix',
  //               boost: 100
  //             }
  //           }
  //         ]
  //       }
  //     },
  //     sort: [{ _score: { order: 'desc' } }]
  //   };
  // }


  buildIATAQuery(analysis, language, size) {
  const languageField = config.LANGUAGES.FIELDS[language];
  const englishField = config.LANGUAGES.FIELDS['en'];
  
 
  const iataCode = analysis.iataCode || analysis.cleaned.toUpperCase();

  return {
    size: size,
    query: {
      bool: {
        should: [
          {
            term: {
              iata: {
                value: iataCode,
                boost: 100000  
              }
            }
          },
          {
            bool: {
              must: [
                {
                  term: {
                    iata: {
                      value: iataCode,
                      boost: 50000
                    }
                  }
                },
                {
                  term: {
                    type: {
                      value: 'airport',
                      boost: 1000
                    }
                  }
                }
              ]
            }
          },
          {
            multi_match: {
              query: analysis.cleaned,
              fields: [englishField, languageField],
              type: 'phrase_prefix',
              boost: 100
            }
          }
        ]
      }
    },
    sort: [{ _score: { order: 'desc' } }]
  };
}

  buildStandardQuery(analysis, language, size) {
    const languageField = config.LANGUAGES.FIELDS[language];
    const englishField = config.LANGUAGES.FIELDS['en'];
    const { words, cleanedQuery, typeKeyword } = analysis;

    const shouldClauses = [];

    const locationWords = words.filter(word => {
      if (this.detectTypoKeyword(word)) return false;
      const lower = word.toLowerCase();
      return !lower.includes('airport') && 
             !lower.includes('hotel') &&
             !lower.includes('aeroport') &&
             !lower.includes('aeropuerto') &&
             !lower.includes('inn') &&
             !lower.includes('resort') &&
             !lower.includes('hostel') &&
             !lower.includes('motel') &&
             !lower.includes('مطار') &&
             !lower.includes('فندق');
    });

  if (typeKeyword && locationWords.length === 0) {
    console.log(`   ⚠️  Type-only query: "${typeKeyword}"`);
    
    return {
      size: size,
      query: {
        term: {
          type: {
            value: typeKeyword
          }
        }
      },
      sort: [{ _score: { order: 'desc' } }]
    };
  }

  // ✅ NEW: Check if query contains potential IATA code
  let potentialIATA = null;
  for (const word of words) {
    if (/^[a-z]{3}$/i.test(word)) {
      potentialIATA = word.toUpperCase();
      console.log(`   ✈️  Potential IATA in query: ${potentialIATA}`);
      break;
    }
  }

  // ✅ NEW: If IATA found, add high-priority IATA match
  if (potentialIATA) {
    shouldClauses.push({
      term: {
        iata: {
          value: potentialIATA,
          boost: 500000  // ✅ Highest priority
        }
      }
    });
  }

    // ================================================
    // 🥇 TIER 1: EXACT MATCHES (100K+ scores)
    // ================================================
    
    if (typeKeyword && locationWords.length > 0) {
      const locationPhrase = locationWords.join(' ');
      shouldClauses.push({
        bool: {
          must: [
            {
              match_phrase: {
                [englishField]: {
                  query: locationPhrase,
                  boost: 1000
                }
              }
            },
            {
              term: {
                type: typeKeyword
              }
            }
          ],
          boost: 100
        }
      });
    }

    shouldClauses.push({
      match: {
        [`${englishField}.keyword`]: {
          query: cleanedQuery,
          boost: 80000
        }
      }
    });

    // ================================================
    // 🥈 TIER 2: STRONG MATCHES (50K-100K scores)
    // ================================================
    
    if (typeKeyword && locationWords.length > 0) {
      shouldClauses.push({
        bool: {
          must: [
            ...locationWords.map(word => ({
              match: {
                [englishField]: {
                  query: word,
                  fuzziness: 0,
                  boost: 500
                }
              }
            })),
            {
              term: {
                type: typeKeyword
              }
            }
          ],
          boost: 100
        }
      });
    }

    shouldClauses.push({
      match_phrase: {
        [englishField]: {
          query: cleanedQuery,
          boost: 50000
        }
      }
    });

    // ================================================
    // 🥉 TIER 3: MODERATE MATCHES (20K-50K scores)
    // ================================================
    
    if (typeKeyword && locationWords.length > 0) {
      shouldClauses.push({
        bool: {
          must: [
            ...locationWords.map(word => ({
              match: {
                [englishField]: {
                  query: word,
                  fuzziness: word.length > 5 ? 1 : 0,
                  prefix_length: 2,
                  boost: 200
                }
              }
            })),
            {
              term: {
                type: typeKeyword
              }
            }
          ],
          boost: 100
        }
      });
    }

    shouldClauses.push({
      match_phrase: {
        [englishField]: {
          query: cleanedQuery,
          slop: 2,
          boost: 30000
        }
      }
    });

    if (typeKeyword) {
      shouldClauses.push({
        term: {
          type: {
            value: typeKeyword,
            boost: 25000
          }
        }
      });
    }

    // ================================================
    // 🏅 TIER 4: WEAK MATCHES (5K-20K scores)
    // ✅ FIXED: ALL words must match (not just 60%)
    // ================================================
    
    if (words.length >= 2) {
      shouldClauses.push({
        bool: {
          must: words.map(word => ({  // ✅ Changed from "should" to "must"
            match: {
              [englishField]: {
                query: word,
                fuzziness: 'AUTO',
                prefix_length: 1,
                max_expansions: 50,
                boost: 100
              }
            }
          })),
          boost: 150
        }
      });
    }

    // ✅ REMOVED WILDCARD ENTIRELY
    // Wildcard was causing false matches like "kokata" → "Bengaluru"

    // Only for single word: prefix matching
    if (words.length === 1) {
      shouldClauses.push({
        match_phrase_prefix: {
          [englishField]: {
            query: words[0],
            max_expansions: 50,
            boost: 15000
          }
        }
      });
    }

    // ================================================
    // 🎯 TIER 5: FALLBACK MATCHES (< 5K scores)
    // ================================================
    
    shouldClauses.push({
      multi_match: {
        query: cleanedQuery,
        fields: language === 'en' 
          ? [englishField] 
          : [languageField, englishField],
        type: 'best_fields',
        operator: 'or',
        fuzziness: 'AUTO',
        boost: 100
      }
    });

    return {
      size: size,
      query: {
        bool: {
          should: shouldClauses,
          minimum_should_match: 1
        }
      },
      sort: [{ _score: { order: 'desc' } }]
    };
  }

  formatResults(esResponse, language, query, analysis) {
    if (!esResponse.hits || !esResponse.hits.hits) {
      return [];
    }

    const languageField = config.LANGUAGES.FIELDS[language];
    const englishField = config.LANGUAGES.FIELDS['en'];
    const topScore = esResponse.hits.hits[0]?._score || 1;

    return esResponse.hits.hits.map((hit, index) => {
      const absoluteScore = hit._score;
      const scorePercentage = absoluteScore / topScore;
      
      return {
        rank: index + 1,
        score: Math.round(absoluteScore * 100) / 100,
        scorePercentage: Math.round(scorePercentage * 100),
        
        names: {
          [language]: hit._source[languageField] || hit._source[englishField],
          en: hit._source[englishField],
          ar: hit._source.placenameAR,
          es: hit._source.placenameES
        },

        location: {
          lat: hit._source.lat,
          lng: hit._source.lng
        },

        type: hit._source.type,
        iata: hit._source.iata || null,
        postcode: hit._source.postcode || null,

        quality: this.assessQuality(absoluteScore, scorePercentage, analysis?.isIATA || false),
        matched: hit._source[languageField] ? 'native' : 'english_fallback',
        typeMatch: analysis ? (analysis.typeKeyword ? hit._source.type === analysis.typeKeyword : null) : null
      };
    });
  }

  assessQuality(absoluteScore, scorePercentage, isIATA = false) {
    if (isIATA) {
      if (absoluteScore >= 50000 && scorePercentage >= 0.95) return 'EXCELLENT';
      if (absoluteScore >= 30000 || scorePercentage >= 0.90) return 'GOOD';
      if (absoluteScore >= 20000) return 'FAIR';
      return 'POOR';
    }
    
    if (absoluteScore >= 50000 && scorePercentage >= 0.90) return 'EXCELLENT';
    if (absoluteScore >= 20000 && scorePercentage >= 0.70) return 'GOOD';
    if (absoluteScore >= 10000 && scorePercentage >= 0.50) return 'FAIR';
    return 'POOR';
  }

  assessResultQuality(results, analysis) {
    if (results.length === 0) {
      console.log(`   ❌ No results - Google needed`);
      return {
        quality: 'POOR',
        triggerGoogle: true,
        reason: 'NO_RESULTS'
      };
    }

    const topResult = results[0];
    const absoluteScore = topResult.score;

    if (analysis.typeKeyword && topResult.type !== analysis.typeKeyword) {
      console.log(`   ❌ Type mismatch: expected ${analysis.typeKeyword}, got ${topResult.type}`);
      return {
        quality: 'POOR',
        triggerGoogle: true,
        reason: 'TYPE_MISMATCH'
      };
    }

    const threshold = analysis.isIATA ? 20000 : 10000;
      
    if (absoluteScore < threshold) {
      console.log(`   ❌ Low score: ${absoluteScore} < ${threshold}`);
      return {
        quality: 'POOR',
        triggerGoogle: true,
        reason: 'LOW_CONFIDENCE_MATCH'
      };
    }

    let quality = 'FAIR';
    if (analysis.isIATA) {
      if (absoluteScore >= 50000) quality = 'EXCELLENT';
      else if (absoluteScore >= 30000) quality = 'GOOD';
    } else {
      if (absoluteScore >= 50000) quality = 'EXCELLENT';
      else if (absoluteScore >= 20000) quality = 'GOOD';
    }

    console.log(`   ✅ Quality: ${quality} (score: ${absoluteScore})`);
    
    return {
      quality: quality,
      triggerGoogle: false,
      reason: 'SUFFICIENT_RESULTS'
    };
  }
}

module.exports = new ElasticsearchQueryBuilderV5();