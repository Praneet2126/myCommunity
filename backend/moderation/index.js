/**
 * Content Moderation Module
 * Basic implementation for message content moderation
 */

class ContentModerator {
  /**
   * Moderate content
   * @param {string} content - The content to moderate
   * @param {string} userId - User ID (for future user-specific checks)
   * @param {string} context - Context of the message ('city', 'private', etc.)
   * @returns {Promise<{allowed: boolean, reason: string|null, flags: string[]}>}
   */
  async moderate(content, userId, context) {
    const flags = [];
    
    // Check for empty or very short messages
    if (!content || typeof content !== 'string' || content.trim().length < 1) {
      return {
        allowed: false,
        reason: 'Message is too short',
        flags: ['empty_message']
      };
    }
    
    // Check for excessive length
    if (content.length > 2000) {
      return {
        allowed: false,
        reason: 'Message is too long (max 2000 characters)',
        flags: ['excessive_length']
      };
    }
    
    // Basic spam pattern detection
    const spamPatterns = [
      { pattern: /(.)\1{10,}/, flag: 'repeated_characters' }, // Repeated characters (e.g., "aaaaaaaaaa")
      { pattern: /[A-Z]{20,}/, flag: 'excessive_caps' }, // Excessive caps
      { pattern: /(.)\1{5,}/g, flag: 'character_spam' }, // Character repetition
    ];
    
    for (const { pattern, flag } of spamPatterns) {
      if (pattern.test(content)) {
        flags.push(flag);
      }
    }
    
    // Check for suspicious links (basic check)
    const suspiciousLinkPattern = /(http|https|www\.)[^\s]{50,}/i;
    if (suspiciousLinkPattern.test(content) && content.split(' ').length < 5) {
      flags.push('suspicious_link');
    }
    
    // If flags found, block the message
    if (flags.length > 0) {
      return {
        allowed: false,
        reason: 'Message contains spam or suspicious content',
        flags
      };
    }
    
    // Allow the message
    return {
      allowed: true,
      reason: null,
      flags: []
    };
  }
}

module.exports = new ContentModerator();
