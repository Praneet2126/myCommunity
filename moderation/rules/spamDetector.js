/**
 * Spam Detector - Detects spam patterns in messages
 * Checks for character repetition, excessive formatting, and spam patterns
 */

class SpamDetector {
  constructor() {
    // Common spam patterns
    this.spamPatterns = [
      /(.)\1{5,}/g, // 6+ consecutive identical characters (increased from 5+ to allow typos)
      /[!]{4,}/g,   // 4+ consecutive exclamation marks
      /[?]{4,}/g,   // 4+ consecutive question marks
      /[.]{4,}/g    // 4+ consecutive periods
    ];
  }

  /**
   * Check for character repetition
   * Increased threshold to 6+ consecutive characters to allow common typos
   * (e.g., "goood", "beacch") while still catching obvious spam (e.g., "aaaaaaa")
   */
  hasExcessiveRepetition(text) {
    // Check for 6+ consecutive identical characters (increased from 4+)
    return /(.)\1{5,}/.test(text);
  }

  /**
   * Check for repeated words (e.g., "spam spam spam")
   */
  hasRepeatedWords(text) {
    const words = text.trim().toLowerCase().split(/\s+/);
    if (words.length < 3) return false;
    
    // Count occurrences of each word
    const wordCounts = new Map();
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
    
    // Check if any word appears 3+ times
    for (const [word, count] of wordCounts.entries()) {
      if (count >= 3 && word.length > 2) { // Ignore very short words
        return true;
      }
    }
    
    // Check for consecutive repeated words (e.g., "spam spam spam")
    for (let i = 0; i < words.length - 2; i++) {
      if (words[i] === words[i + 1] && words[i] === words[i + 2] && words[i].length > 2) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check for excessive capitalization
   */
  hasExcessiveCaps(text) {
    const letters = text.replace(/[^a-zA-Z]/g, '');
    if (letters.length === 0) return false;
    
    const upperCount = (letters.match(/[A-Z]/g) || []).length;
    const capsRatio = upperCount / letters.length;
    
    // More than 50% uppercase (excluding single-word emphasis)
    return capsRatio > 0.5 && letters.length > 10;
  }

  /**
   * Check for excessive punctuation
   */
  hasExcessivePunctuation(text) {
    // More than 3 consecutive identical punctuation marks
    if (/[!?.]{4,}/.test(text)) return true;
    
    // More than 5 total punctuation marks in short message
    if (text.length < 100) {
      const punctCount = (text.match(/[!?.]/g) || []).length;
      return punctCount > 5;
    }
    
    return false;
  }

  /**
   * Check for whitespace flooding
   */
  hasWhitespaceFlooding(text) {
    const whitespaceRatio = (text.match(/\s/g) || []).length / text.length;
    
    // More than 20% whitespace
    if (whitespaceRatio > 0.2) return true;
    
    // More than 5 consecutive line breaks
    if (/\n{6,}/.test(text)) return true;
    
    return false;
  }

  /**
   * Check for non-alphanumeric character ratio
   */
  hasExcessiveSymbols(text) {
    const alphanumeric = text.replace(/[^a-zA-Z0-9\s]/g, '').length;
    const total = text.length;
    
    if (total === 0) return false;
    
    const symbolRatio = 1 - (alphanumeric / total);
    return symbolRatio > 0.4; // More than 40% symbols
  }

  /**
   * Check message length extremes
   */
  hasExtremeLength(text) {
    const trimmed = text.trim();
    
    // Too short (likely spam fragment)
    if (trimmed.length < 5 && trimmed.length > 0) return true;
    
    // Too long (likely copy-paste spam)
    if (trimmed.length > 2000) return true;
    
    return false;
  }

  /**
   * Check for spam patterns
   */
  matchesSpamPatterns(text) {
    for (const pattern of this.spamPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Analyze message for spam
   * Returns: { decision: 'BLOCK' | 'FLAG' | 'ALLOW', flags: string[] }
   */
  analyze(text) {
    const flags = [];
    let decision = 'ALLOW';

    if (!text || typeof text !== 'string') {
      return { decision: 'BLOCK', flags: ['invalid_content'] };
    }

    const trimmed = text.trim();
    
    // Empty or whitespace-only
    if (trimmed.length === 0) {
      return { decision: 'BLOCK', flags: ['empty_message'] };
    }

    // Extreme length
    if (this.hasExtremeLength(trimmed)) {
      flags.push('extreme_length');
      if (trimmed.length < 5) {
        decision = 'BLOCK';
      } else {
        decision = 'FLAG';
      }
    }

    // Character repetition
    if (this.hasExcessiveRepetition(trimmed)) {
      flags.push('character_repetition');
      decision = 'BLOCK';
    }

    // Word repetition (e.g., "spam spam spam")
    if (this.hasRepeatedWords(trimmed)) {
      flags.push('word_repetition');
      decision = 'BLOCK';
    }

    // Excessive capitalization
    if (this.hasExcessiveCaps(trimmed)) {
      flags.push('excessive_caps');
      if (decision !== 'BLOCK') {
        decision = 'FLAG';
      }
    }

    // Excessive punctuation
    if (this.hasExcessivePunctuation(trimmed)) {
      flags.push('excessive_punctuation');
      if (decision !== 'BLOCK') {
        decision = 'FLAG';
      }
    }

    // Whitespace flooding
    if (this.hasWhitespaceFlooding(trimmed)) {
      flags.push('whitespace_flooding');
      if (decision !== 'BLOCK') {
        decision = 'FLAG';
      }
    }

    // Excessive symbols
    if (this.hasExcessiveSymbols(trimmed)) {
      flags.push('excessive_symbols');
      if (decision !== 'BLOCK') {
        decision = 'FLAG';
      }
    }

    // Spam patterns
    if (this.matchesSpamPatterns(trimmed)) {
      flags.push('spam_pattern');
      decision = 'BLOCK';
    }

    return {
      decision,
      flags: [...new Set(flags)]
    };
  }
}

module.exports = new SpamDetector();
