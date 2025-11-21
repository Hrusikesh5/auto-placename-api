const deepl = require('deepl-node');
const config = require('../config');

class TranslationService {
  constructor() {
    this.apiKey = config.DEEPL.apiKey;
    this.enabled = config.DEEPL.enabled;
    
    // Initialize DeepL client
    if (this.enabled && this.apiKey) {
      try {
        this.translator = new deepl.Translator(this.apiKey, {
          maxRetries: 3,
          minTimeout: 3000,
          serverUrl: this.apiKey.endsWith(':fx') 
            ? 'https://api-free.deepl.com' 
            : 'https://api.deepl.com'
        });
        console.log('✓ DeepL Translator initialized');
      } catch (error) {
        console.error('✗ DeepL initialization failed:', error.message);
        this.enabled = false;
      }
    }
    
    // In-memory cache for translations
    this.cache = new Map();
    this.cacheMaxSize = 1000;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  isEnabled() {
    if (!this.enabled || !this.apiKey || !this.translator) {
      return false;
    }
    return true;
  }

  /**
   * MAIN TRANSLATION METHOD
   */
  async translate(text, sourceLang, targetLang) {
    // No translation needed if same language
    if (sourceLang === targetLang) {
      return text;
    }

    // Check cache first
    const cacheKey = `${sourceLang}:${targetLang}:${text}`;
    if (this.cache.has(cacheKey)) {
      this.cacheHits++;
      console.log(`   📦 Cache hit: "${text.substring(0, 30)}..."`);
      return this.cache.get(cacheKey);
    }

    this.cacheMisses++;

    if (!this.isEnabled()) {
      console.log(`   ⚠️  DeepL disabled, returning original text`);
      return text;
    }

    try {
      const startTime = Date.now();
      
      console.log(`   🔄 Translating (${sourceLang} → ${targetLang}): "${text.substring(0, 50)}..."`);

      // Map language codes
      const sourceCode = this.mapLanguageCode(sourceLang);
      const targetCode = this.mapLanguageCode(targetLang);

      // ✅ CRITICAL: targetCode should never be null
      if (targetCode === null) {
        console.error(`   ❌ Invalid target language: ${targetLang}`);
        return text;
      }

      // ✅ Translate with proper parameters
      const result = await this.translator.translateText(
        text,
        sourceCode,  // Can be null for auto-detect
        targetCode,  // Should never be null
        {
          preserveFormatting: true,
          tagHandling: 'html'
        }
      );

      const translatedText = result.text;
      const responseTime = Date.now() - startTime;

      console.log(`   ✅ Translated in ${responseTime}ms: "${translatedText.substring(0, 50)}..."`);

      // Cache the result
      this.cacheTranslation(cacheKey, translatedText);

      return translatedText;

    } catch (error) {
      console.error(`   ❌ DeepL API Error: ${error.message}`);
      
      if (error.message.includes('401') || error.message.includes('403')) {
        console.error(`   ❌ Authentication failed - check your DEEPL_API_KEY`);
      }
      
      // Fallback: return original text
      return text;
    }
  }

  /**
   * BATCH TRANSLATION
   */
  async translateBatch(texts, sourceLang, targetLang) {
    if (sourceLang === targetLang) {
      return texts;
    }

    if (!this.isEnabled()) {
      return texts;
    }

    console.log(`\n🌐 BATCH TRANSLATION:`);
    console.log(`   ${sourceLang} → ${targetLang}`);
    console.log(`   Texts: ${texts.length} items`);

    const translations = [];
    const startTime = Date.now();

    // Check cache for all texts first
    const uncachedTexts = [];
    const uncachedIndices = [];

    for (let i = 0; i < texts.length; i++) {
      const cacheKey = `${sourceLang}:${targetLang}:${texts[i]}`;
      if (this.cache.has(cacheKey)) {
        translations[i] = this.cache.get(cacheKey);
        this.cacheHits++;
      } else {
        uncachedTexts.push(texts[i]);
        uncachedIndices.push(i);
        this.cacheMisses++;
      }
    }

    // Translate uncached texts
    if (uncachedTexts.length > 0) {
      try {
        const sourceCode = this.mapLanguageCode(sourceLang);
        const targetCode = this.mapLanguageCode(targetLang);

        if (targetCode === null) {
          throw new Error(`Invalid target language: ${targetLang}`);
        }

        const results = await this.translator.translateText(
          uncachedTexts,
          sourceCode,
          targetCode,
          {
            preserveFormatting: true,
            tagHandling: 'html'
          }
        );

        // Handle both single and array results
        const resultsArray = Array.isArray(results) ? results : [results];

        // Fill in translations
        for (let i = 0; i < resultsArray.length; i++) {
          const translatedText = resultsArray[i].text;
          const originalIndex = uncachedIndices[i];
          translations[originalIndex] = translatedText;

          // Cache it
          const cacheKey = `${sourceLang}:${targetLang}:${uncachedTexts[i]}`;
          this.cacheTranslation(cacheKey, translatedText);
        }

      } catch (error) {
        console.error(`   ❌ Batch translation error: ${error.message}`);
        // Fill in original texts as fallback
        for (let i = 0; i < uncachedIndices.length; i++) {
          translations[uncachedIndices[i]] = uncachedTexts[i];
        }
      }
    }

    const responseTime = Date.now() - startTime;
    console.log(`   ✅ Batch complete in ${responseTime}ms (${this.cacheHits} cached, ${uncachedTexts.length} translated)`);

    return translations;
  }

  /**
   * TRANSLATE PLACE NAME TO ALL LANGUAGES
   */
  async translatePlaceToAllLanguages(englishName) {
    console.log(`\n🌍 TRANSLATING TO ALL LANGUAGES:`);
    console.log(`   English: "${englishName}"`);

    const translations = {
      en: englishName,
      ar: englishName, // Fallback
      es: englishName  // Fallback
    };

    if (!this.isEnabled()) {
      console.log(`   ⚠️  DeepL disabled, only English available`);
      return translations;
    }

    try {
      const startTime = Date.now();

      // Translate to both Arabic and Spanish in parallel
      const [arResult, esResult] = await Promise.all([
        this.translate(englishName, 'en', 'ar'),
        this.translate(englishName, 'en', 'es')
      ]);

      translations.ar = arResult;
      translations.es = esResult;

      const responseTime = Date.now() - startTime;

      console.log(`   ✅ All translations complete in ${responseTime}ms:`);
      console.log(`      EN: ${translations.en}`);
      console.log(`      AR: ${translations.ar}`);
      console.log(`      ES: ${translations.es}\n`);

      return translations;

    } catch (error) {
      console.error(`   ❌ Error translating to all languages: ${error.message}`);
      return translations;
    }
  }

  /**
   * TRANSLATE SEARCH QUERY
   */
  async translateQuery(query, userLanguage) {
    console.log(`\n🔍 TRANSLATING SEARCH QUERY:`);
    console.log(`   Original (${userLanguage}): "${query}"`);

    // Already in English
    if (userLanguage === 'en') {
      console.log(`   No translation needed\n`);
      return query;
    }

    if (!this.isEnabled()) {
      console.log(`   ⚠️  DeepL disabled, using original query\n`);
      return query;
    }

    try {
      const translatedQuery = await this.translate(query, userLanguage, 'en');
      console.log(`   Translated to EN: "${translatedQuery}"\n`);
      return translatedQuery;

    } catch (error) {
      console.error(`   ❌ Query translation failed, using original\n`);
      return query;
    }
  }

  /**
   * MAP LANGUAGE CODES
   * ⚠️ CRITICAL: DeepL is picky about source language codes
   */
  mapLanguageCode(lang) {
    const mapping = {
      // Lowercase (our format)
      'en': null,      // ✅ Auto-detect for English
      'ar': 'ar',      // ✅ Arabic
      'es': 'es',      // ✅ Spanish
      
      // Uppercase
      'EN': null,
      'AR': 'ar',
      'ES': 'es'
    };

    return mapping[lang] !== undefined ? mapping[lang] : null;
  }

  mapTargetLanguageCode(lang) {
  const mapping = {
    'en': 'en-US',  
    'ar': 'ar',
    'es': 'es',
    'EN': 'en-US',
    'AR': 'ar',
    'ES': 'es'
  };

  return mapping[lang] || 'en-US';
}

  /**
   * CACHE TRANSLATION
   */
  cacheTranslation(key, value) {
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  /**
   * GET CACHE STATS
   */
  getCacheStats() {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 
      ? ((this.cacheHits / totalRequests) * 100).toFixed(1) 
      : 0;

    return {
      size: this.cache.size,
      maxSize: this.cacheMaxSize,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: `${hitRate}%`
    };
  }

  /**
   * CLEAR CACHE
   */
  clearCache() {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    console.log('✓ Translation cache cleared');
  }

  /**
   * TEST CONNECTION
   */
  async testConnection() {
    if (!this.isEnabled()) {
      return {
        success: false,
        error: 'DeepL not configured'
      };
    }

    try {
      const result = await this.translator.translateText('Hello', null, 'es');
      return {
        success: true,
        test: 'Hello → ' + result.text,
        message: 'DeepL API working correctly'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new TranslationService();