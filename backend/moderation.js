/**
 * Content Moderation Service
 * 
 * This module provides basic content moderation for messages.
 * Can be extended with AI-based moderation (OpenAI Moderation API, etc.)
 */

// Basic profanity/spam detection (can be expanded)
const bannedWords = [
  'spam', 'scam', 'hack', 'fraud',
  // Add more banned words as needed
];

// Rate limiting storage (in production, use Redis)
const userMessageCounts = new Map();

/**
 * Moderate content before allowing it to be posted
 * @param {string} content - The message content to moderate
 * @param {string} userId - The user ID sending the message
 * @param {string} chatType - Type of chat ('city' or 'private')
 * @returns {Object} - { allowed: boolean, reason?: string, flags?: array }
 */
const moderate = async (content, userId, chatType = 'city') => {
  try {
    // 1. Check for empty content
    if (!content || content.trim().length === 0) {
      return {
        allowed: false,
        reason: 'Message content cannot be empty',
        flags: ['empty_content']
      };
    }

    // 2. Check message length (max 5000 characters)
    if (content.length > 5000) {
      return {
        allowed: false,
        reason: 'Message is too long (max 5000 characters)',
        flags: ['excessive_length']
      };
    }

    // 3. Check for banned words
    const lowerContent = content.toLowerCase();
    const foundBannedWords = bannedWords.filter(word => 
      lowerContent.includes(word.toLowerCase())
    );

    if (foundBannedWords.length > 0) {
      return {
        allowed: false,
        reason: 'Message contains inappropriate content',
        flags: ['banned_words', ...foundBannedWords]
      };
    }

    // 4. Rate limiting (max 10 messages per minute per user)
    const now = Date.now();
    const userKey = `${userId}-${chatType}`;
    
    if (!userMessageCounts.has(userKey)) {
      userMessageCounts.set(userKey, []);
    }

    const userMessages = userMessageCounts.get(userKey);
    
    // Remove messages older than 1 minute
    const recentMessages = userMessages.filter(timestamp => now - timestamp < 60000);
    
    if (recentMessages.length >= 10) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded. Please slow down.',
        flags: ['rate_limit']
      };
    }

    // Add current message timestamp
    recentMessages.push(now);
    userMessageCounts.set(userKey, recentMessages);

    // 5. Check for spam patterns (excessive caps, repeated characters)
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (content.length > 10 && capsRatio > 0.7) {
      return {
        allowed: false,
        reason: 'Message contains excessive caps (spam)',
        flags: ['excessive_caps']
      };
    }

    // Check for repeated characters (e.g., "hellooooooo")
    const repeatedChars = /(.)\1{5,}/;
    if (repeatedChars.test(content)) {
      return {
        allowed: false,
        reason: 'Message contains excessive repeated characters',
        flags: ['repeated_characters']
      };
    }

    // 6. All checks passed - allow message
    return {
      allowed: true
    };

  } catch (error) {
    console.error('Moderation error:', error);
    
    // On error, allow message through (fail-open)
    // In production, you might want to fail-closed for security
    return {
      allowed: true,
      warning: 'Moderation check failed but message was allowed'
    };
  }
};

/**
 * Clear rate limiting data (call periodically)
 */
const clearOldRateLimits = () => {
  const now = Date.now();
  for (const [key, timestamps] of userMessageCounts.entries()) {
    const recent = timestamps.filter(t => now - t < 60000);
    if (recent.length === 0) {
      userMessageCounts.delete(key);
    } else {
      userMessageCounts.set(key, recent);
    }
  }
};

// Clear old rate limits every 5 minutes
setInterval(clearOldRateLimits, 5 * 60 * 1000);

module.exports = {
  moderate,
  clearOldRateLimits
};
