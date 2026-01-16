/**
 * Repetition Detector - Detects repeated messages and patterns
 * Checks for duplicate messages, rapid-fire messaging, and template patterns
 */

class RepetitionDetector {
  constructor() {
    // In-memory cache for recent messages (in production, use Redis or similar)
    this.recentMessages = new Map(); // userId -> array of recent messages
    this.messageCache = new Map(); // messageHash -> count
    this.maxCacheSize = 1000;
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
  }

  /**
   * Normalize message for comparison
   */
  normalizeMessage(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s]/g, ''); // Remove punctuation for comparison
  }

  /**
   * Calculate similarity between two messages (simple word overlap)
   */
  calculateSimilarity(text1, text2) {
    const words1 = new Set(this.normalizeMessage(text1).split(/\s+/));
    const words2 = new Set(this.normalizeMessage(text2).split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    if (union.size === 0) return 0;
    
    return intersection.size / union.size;
  }

  /**
   * Create hash for message
   */
  hashMessage(text) {
    return this.normalizeMessage(text);
  }

  /**
   * Check for exact duplicate
   */
  isExactDuplicate(userId, text, timestamp) {
    const normalized = this.hashMessage(text);
    const userMessages = this.recentMessages.get(userId) || [];
    
    // Check if same message was sent recently (within 5 minutes)
    for (const msg of userMessages) {
      if (msg.normalized === normalized) {
        const timeDiff = timestamp - msg.timestamp;
        if (timeDiff < 5 * 60 * 1000) { // 5 minutes
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check for near-duplicate (high similarity)
   */
  isNearDuplicate(userId, text, timestamp) {
    const userMessages = this.recentMessages.get(userId) || [];
    
    for (const msg of userMessages) {
      const similarity = this.calculateSimilarity(text, msg.original);
      if (similarity > 0.9) { // 90% similarity
        const timeDiff = timestamp - msg.timestamp;
        if (timeDiff < 10 * 60 * 1000) { // 10 minutes
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check for rapid-fire messaging
   */
  isRapidFire(userId, timestamp) {
    const userMessages = this.recentMessages.get(userId) || [];
    
    if (userMessages.length < 5) return false;
    
    // Check last 5 messages
    const recentMessages = userMessages.slice(-5);
    const timeSpan = timestamp - recentMessages[0].timestamp;
    
    // More than 5 messages in 60 seconds
    return timeSpan < 60 * 1000;
  }

  /**
   * Check if same link is repeated
   */
  hasRepeatedLink(userId, links, timestamp) {
    if (!links || links.length === 0) return false;
    
    const userMessages = this.recentMessages.get(userId) || [];
    
    for (const link of links) {
      let linkCount = 0;
      
      for (const msg of userMessages) {
        if (msg.links && msg.links.includes(link)) {
          linkCount++;
        }
      }
      
      // Same link in 2+ messages within 10 minutes
      if (linkCount >= 2) {
        const recentWithLink = userMessages.filter(msg => 
          msg.links && msg.links.includes(link) && 
          (timestamp - msg.timestamp) < 10 * 60 * 1000
        );
        
        if (recentWithLink.length >= 2) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check for template pattern (same structure, different keywords)
   */
  hasTemplatePattern(userId, text) {
    const userMessages = this.recentMessages.get(userId) || [];
    
    if (userMessages.length < 3) return false;
    
    // Check last 3 messages for similar structure
    const recent = userMessages.slice(-3).map(msg => msg.original);
    recent.push(text);
    
    // Check if messages have similar word count and structure
    const wordCounts = recent.map(msg => msg.split(/\s+/).length);
    const avgWordCount = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
    
    // If all messages have similar length (within 20% variance)
    const variance = wordCounts.every(count => 
      Math.abs(count - avgWordCount) / avgWordCount < 0.2
    );
    
    if (variance && recent.length >= 3) {
      // Check if they share similar structure
      const similarities = [];
      for (let i = 0; i < recent.length - 1; i++) {
        for (let j = i + 1; j < recent.length; j++) {
          similarities.push(this.calculateSimilarity(recent[i], recent[j]));
        }
      }
      
      const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
      return avgSimilarity > 0.6; // 60% average similarity
    }
    
    return false;
  }

  /**
   * Store message in cache
   */
  storeMessage(userId, text, links, timestamp) {
    // Clean old messages
    this.cleanOldMessages(userId, timestamp);
    
    const normalized = this.hashMessage(text);
    const userMessages = this.recentMessages.get(userId) || [];
    
    userMessages.push({
      original: text,
      normalized,
      links: links || [],
      timestamp
    });
    
    // Keep only last 20 messages per user
    if (userMessages.length > 20) {
      userMessages.shift();
    }
    
    this.recentMessages.set(userId, userMessages);
    
    // Clean cache if too large
    if (this.recentMessages.size > this.maxCacheSize) {
      this.cleanOldCache(timestamp);
    }
  }

  /**
   * Clean old messages for a user
   */
  cleanOldMessages(userId, currentTime) {
    const userMessages = this.recentMessages.get(userId) || [];
    const filtered = userMessages.filter(msg => 
      currentTime - msg.timestamp < this.cacheTimeout
    );
    
    if (filtered.length === 0) {
      this.recentMessages.delete(userId);
    } else {
      this.recentMessages.set(userId, filtered);
    }
  }

  /**
   * Clean old cache entries
   */
  cleanOldCache(currentTime) {
    const usersToDelete = [];
    
    for (const [userId, messages] of this.recentMessages.entries()) {
      const filtered = messages.filter(msg => 
        currentTime - msg.timestamp < this.cacheTimeout
      );
      
      if (filtered.length === 0) {
        usersToDelete.push(userId);
      } else {
        this.recentMessages.set(userId, filtered);
      }
    }
    
    usersToDelete.forEach(userId => this.recentMessages.delete(userId));
  }

  /**
   * Analyze message for repetition
   * Returns: { decision: 'BLOCK' | 'FLAG' | 'ALLOW', flags: string[] }
   */
  analyze(userId, text, links, timestamp = Date.now()) {
    const flags = [];
    let decision = 'ALLOW';

    if (!text || typeof text !== 'string') {
      return { decision: 'ALLOW', flags: [] };
    }

    // Exact duplicate
    if (this.isExactDuplicate(userId, text, timestamp)) {
      flags.push('exact_duplicate');
      decision = 'BLOCK';
    }

    // Near-duplicate
    if (decision === 'ALLOW' && this.isNearDuplicate(userId, text, timestamp)) {
      flags.push('near_duplicate');
      decision = 'FLAG';
    }

    // Rapid-fire messaging
    if (this.isRapidFire(userId, timestamp)) {
      flags.push('rapid_fire');
      if (decision !== 'BLOCK') {
        decision = 'FLAG';
      }
    }

    // Repeated links
    if (links && links.length > 0 && this.hasRepeatedLink(userId, links, timestamp)) {
      flags.push('repeated_link');
      if (decision !== 'BLOCK') {
        decision = 'FLAG';
      }
    }

    // Template pattern
    if (this.hasTemplatePattern(userId, text)) {
      flags.push('template_pattern');
      if (decision !== 'BLOCK') {
        decision = 'FLAG';
      }
    }

    // Store message for future checks
    this.storeMessage(userId, text, links, timestamp);

    return {
      decision,
      flags: [...new Set(flags)]
    };
  }
}

module.exports = new RepetitionDetector();
