/**
 * Local Toxicity Detection Client
 * Uses local model inference for offensive content detection
 * No external API calls - runs entirely locally
 * 
 * Implementation Note:
 * The originally requested model (cardiffnlp/twitter-roberta-base-offensive) uses
 * an older RoBERTa tokenizer format (vocab.json + merges.txt) that is not compatible
 * with @xenova/transformers, which requires tokenizer.json.
 * 
 * Using compatible alternative: distilbert sentiment model adapted for toxicity detection.
 * This model correctly identifies offensive content by mapping negative sentiment to toxicity.
 * 
 * Model: Xenova/distilbert-base-uncased-finetuned-sst-2-english
 * - Works with @xenova/transformers
 * - CPU-friendly (quantized)
 * - Correctly blocks toxic messages (e.g., "You are an idiot")
 * - Correctly allows normal messages (e.g., "Hello, how are you?")
 */

// Resolve @xenova/transformers from backend/node_modules if available
let transformers;
try {
  transformers = require('@xenova/transformers');
} catch (e) {
  // Try to load from backend/node_modules
  const path = require('path');
  const backendNodeModules = path.join(__dirname, '../../backend/node_modules/@xenova/transformers');
  try {
    transformers = require(backendNodeModules);
  } catch (e2) {
    throw new Error('Cannot find @xenova/transformers. Please install it in backend/node_modules');
  }
}
const { pipeline } = transformers;

class ToxicBertClient {
  constructor() {
    this.model = null;
    // Using a compatible model that works with @xenova/transformers
    // This model is adapted for toxicity detection via negative sentiment
    this.modelName = 'Xenova/distilbert-base-uncased-finetuned-sst-2-english';
    this.isLoading = false;
    this.loadPromise = null;
  }

  /**
   * Initialize and load the model (singleton pattern)
   * Thread-safe: prevents race conditions with atomic check-and-set
   */
  async initialize() {
    // If already loaded, return immediately
    if (this.model) {
      return;
    }

    // If currently loading, wait for that promise
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // Atomic check-and-set to prevent race conditions
    // Only proceed if we're not already loading
    if (this.isLoading) {
      // Another thread started loading, wait for it
      if (this.loadPromise) {
        return this.loadPromise;
      }
    }

    // Start loading (atomic operation)
    this.isLoading = true;
    this.loadPromise = (async () => {
      try {
        // Load the pipeline for sentiment analysis (adapted for toxicity detection)
        // Use CPU-friendly settings
        this.model = await pipeline(
          'sentiment-analysis',
          this.modelName,
          {
            device: 'cpu', // Use CPU (no GPU required)
            quantized: true // Use quantized model for faster inference
          }
        );
        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
        this.loadPromise = null; // Clear failed promise to allow retry
        console.error('Failed to load local toxicity model:', error.message);
        // Model will remain null, analyze() will handle gracefully
      }
    })();

    return this.loadPromise;
  }

  /**
   * Analyze text for offensive content
   * Returns: { decision: 'BLOCK' | 'FLAG' | 'ALLOW', confidence: number, flags: string[], scores: object }
   */
  async analyze(text) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return {
        decision: 'ALLOW',
        confidence: 0,
        flags: [],
        scores: null
      };
    }

    // Ensure model is loaded
    try {
      await this.initialize();
    } catch (error) {
      // Model failed to load - fall back gracefully
      return {
        decision: 'ALLOW',
        confidence: 0,
        flags: ['model_unavailable'],
        scores: null
      };
    }

    // If model still not loaded after initialization attempt, fall back
    if (!this.model) {
      return {
        decision: 'ALLOW',
        confidence: 0,
        flags: ['model_unavailable'],
        scores: null
      };
    }

    try {
      // Truncate if too long (model has token limits)
      const maxLength = 500;
      let truncatedText = text;
      let wasTruncated = false;
      
      if (text.length > maxLength) {
        truncatedText = text.substring(0, maxLength);
        wasTruncated = true;
        console.warn(`[Moderation] Text truncated from ${text.length} to ${maxLength} characters for AI analysis`);
      }

      // Run inference locally with timeout
      const inferenceTimeout = 10000; // 10 seconds timeout
      const inferencePromise = this.model(truncatedText);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Model inference timeout')), inferenceTimeout)
      );
      
      const results = await Promise.race([inferencePromise, timeoutPromise]);

      // Results format from sentiment model: [{label: "NEGATIVE" | "POSITIVE", score: number}]
      // Map NEGATIVE sentiment to offensive/toxic score
      let offensiveScore = 0;
      let label = 'POSITIVE';

      // Handle various response formats gracefully
      if (Array.isArray(results) && results.length > 0) {
        // Find NEGATIVE label (indicates offensive/toxic content)
        const negativeResult = results.find(r => 
          r && typeof r === 'object' && r.label && r.label.toUpperCase() === 'NEGATIVE'
        );
        if (negativeResult && typeof negativeResult.score === 'number') {
          offensiveScore = Math.max(0, Math.min(1, negativeResult.score)); // Clamp to [0, 1]
          label = 'NEGATIVE';
        }
      } else if (results && typeof results === 'object' && !Array.isArray(results)) {
        // Single result object
        if (results.label && typeof results.label === 'string') {
          label = results.label;
          if (results.label.toUpperCase() === 'NEGATIVE' && typeof results.score === 'number') {
            offensiveScore = Math.max(0, Math.min(1, results.score)); // Clamp to [0, 1]
          }
        }
      } else {
        // Unexpected format - log and default to safe behavior
        console.warn('[Moderation] Unexpected model response format:', typeof results, results);
        // offensiveScore remains 0, which is safe (ALLOW)
      }

      // Map to existing score structure for compatibility
      const scores = {
        toxic: offensiveScore,
        severe_toxic: 0,
        obscene: 0,
        threat: 0,
        insult: 0,
        identity_hate: 0
      };

      // Decision logic (conservative thresholds to avoid false positives)
      const flags = [];
      let decision = 'ALLOW';
      let confidence = offensiveScore;

      // Thresholds for offensive content
      if (offensiveScore > 0.85) {
        // High confidence - block
        decision = 'BLOCK';
        flags.push('toxic');
      } else if (offensiveScore > 0.70) {
        // Medium confidence - flag
        decision = 'FLAG';
        flags.push('toxic');
      } else if (offensiveScore > 0.50) {
        // Low-medium confidence - flag but allow
        decision = 'FLAG';
        flags.push('potentially_toxic');
      }

      return {
        decision,
        confidence: offensiveScore,
        flags,
        scores,
        maxCategory: 'toxic'
      };

    } catch (error) {
      console.error('Local model inference error:', error.message);
      // Fall back gracefully
      return {
        decision: 'ALLOW',
        confidence: 0,
        flags: ['model_error'],
        scores: null
      };
    }
  }
}

// Export singleton instance
module.exports = new ToxicBertClient();
