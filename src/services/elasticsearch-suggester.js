const config = require('../config');

class ElasticsearchSuggester {
  constructor() {
    this.client = null;
    this.enabled = true;
  }

  setClient(client) {
    this.client = client;
    console.log('✓ Elasticsearch Suggester initialized');
  }

  /**
   * ✅ MAIN: GET SPELLING SUGGESTIONS
   */
  async getSuggestions(query, language = 'en') {
    if (!this.client || !this.enabled) {
      return {
        corrected: query,
        hasSuggestions: false,
        confidence: 0
      };
    }

    const startTime = Date.now();
    const languageField = this.getLanguageField(language);

    try {
      console.log(`\n🔍 SPELLING CHECK:`);
      console.log(`   Query: "${query}"`);

      const suggesterBody = this.buildSuggesterRequest(query, languageField);
      const response = await this.client.search({
        index: config.ELASTICSEARCH.index,
        body: suggesterBody
      });

      const responseTime = Date.now() - startTime;
      const result = this.parseSuggestions(response, query);
      
      if (result.hasSuggestions) {
        console.log(`   ✅ Suggestion: "${result.corrected}" (confidence: ${(result.confidence * 100).toFixed(0)}%)`);
      } else {
        console.log(`   ℹ️  No correction needed`);
      }
      console.log(`   Response time: ${responseTime}ms\n`);

      return { ...result, responseTime };

    } catch (error) {
      console.error(`   ❌ Suggester error: ${error.message}\n`);
      return {
        corrected: query,
        hasSuggestions: false,
        confidence: 0,
        error: error.message
      };
    }
  }

  buildSuggesterRequest(query, languageField) {
    return {
      size: 0,
      suggest: {
        phrase_suggestion: {
          text: query,
          phrase: {
            field: `${languageField}.raw`,
            size: 3,
            gram_size: 2,
            max_errors: 2,
            confidence: 0.4,
            real_word_error_likelihood: 0.9,
            direct_generator: [
              {
                field: `${languageField}.raw`,
                suggest_mode: 'always',
                min_word_length: 2,
                prefix_length: 0
              },
              {
                field: languageField,
                suggest_mode: 'popular',
                min_word_length: 3
              }
            ],
            collate: {
              query: {
                source: {
                  bool: {
                    must: [
                      {
                        match_phrase: {
                          [`${languageField}.raw`]: '{{suggestion}}'
                        }
                      }
                    ]
                  }
                }
              },
              prune: true
            },
            stupid_backoff: {
              discount: 0.4
            }
          }
        },
        term_suggestion: {
          text: query,
          term: {
            field: `${languageField}.raw`,
            suggest_mode: 'popular',
            min_word_length: 3,
            max_edits: 2,
            min_doc_freq: 1
          }
        }
      }
    };
  }

  parseSuggestions(response, originalQuery) {
    const phraseSuggestions = response.suggest?.phrase_suggestion?.[0]?.options || [];
    
    if (phraseSuggestions.length > 0) {
      const best = phraseSuggestions[0];
      
      if (best.text.toLowerCase() !== originalQuery.toLowerCase()) {
        return {
          corrected: best.text,
          hasSuggestions: true,
          confidence: best.score,
          original: originalQuery,
          type: 'phrase',
          collateMatch: best.collate_match || false
        };
      }
    }

    const termSuggestions = response.suggest?.term_suggestion || [];
    
    if (termSuggestions.length > 0) {
      const words = originalQuery.split(' ');
      let correctedWords = [...words];
      let hasChanges = false;
      let totalScore = 0;
      let changeCount = 0;

      for (let i = 0; i < termSuggestions.length; i++) {
        const termSuggest = termSuggestions[i];
        
        if (termSuggest.options && termSuggest.options.length > 0) {
          const bestOption = termSuggest.options[0];
          
          if (bestOption.score > 0.6) {
            correctedWords[i] = bestOption.text;
            hasChanges = true;
            totalScore += bestOption.score;
            changeCount++;
          }
        }
      }

      if (hasChanges) {
        const corrected = correctedWords.join(' ');
        const avgScore = changeCount > 0 ? totalScore / changeCount : 0;
        
        return {
          corrected,
          hasSuggestions: true,
          confidence: avgScore,
          original: originalQuery,
          type: 'term',
          changedWords: changeCount
        };
      }
    }

    return {
      corrected: originalQuery,
      hasSuggestions: false,
      confidence: 0,
      original: originalQuery
    };
  }

  getLanguageField(language) {
    const fields = {
      'en': 'placenameEN',
      'ar': 'placenameAR',
      'es': 'placenameES'
    };
    
    return fields[language] || 'placenameEN';
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  getStats() {
    return {
      enabled: this.enabled,
      connected: this.client !== null
    };
  }
}

module.exports = new ElasticsearchSuggester();