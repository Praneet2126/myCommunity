/**
 * Promotion Detector - Detects promotional and marketing content
 * Identifies sales pitches, affiliate content, and promotional language
 */

class PromotionDetector {
  constructor() {
    // Promotional keywords
    this.promotionalKeywords = new Set([
      'discount', 'deal', 'offer', 'limited time', 'act now', 'click here',
      'buy now', 'special price', 'cheapest', 'guaranteed', 'best price',
      'exclusive', 'sale', 'promo', 'coupon', 'voucher', 'free shipping',
      'hurry', 'limited offer', 'don\'t miss', 'order now', 'shop now',
      'check out', 'visit us', 'call now', 'book now', 'reserve now'
    ]);

    // Urgency words
    this.urgencyWords = new Set([
      'urgent', 'hurry', 'limited', 'expires', 'ending soon', 'last chance',
      'today only', 'now only', 'while supplies last', 'act fast'
    ]);

    // Contact solicitation patterns
    this.contactPatterns = [
      /dm\s+me/gi,
      /contact\s+me/gi,
      /message\s+me/gi,
      /reach\s+out/gi,
      /get\s+in\s+touch/gi,
      /call\s+me/gi,
      /text\s+me/gi
    ];

    // Social media patterns
    this.socialMediaPatterns = [
      /@\w+/g, // Instagram/Twitter handles
      /follow\s+(us|me)/gi,
      /instagram/i,
      /facebook/i,
      /twitter/i,
      /tiktok/i,
      /youtube/i,
      /subscribe/gi
    ];

    // Price emphasis patterns
    this.pricePatterns = [
      /\$\d+[\s]*only/gi,
      /\d+%[\s]*off/gi,
      /only\s+\$\d+/gi,
      /save\s+\$\d+/gi,
      /save\s+\d+%/gi
    ];

    // Booking platform mentions (excessive)
    this.bookingPlatforms = new Set([
      'booking.com', 'expedia', 'agoda', 'hotels.com', 'priceline',
      'kayak', 'trivago', 'orbitz', 'travelocity'
    ]);
  }

  /**
   * Count promotional keywords in text
   */
  countPromotionalKeywords(text) {
    const lowerText = text.toLowerCase();
    let count = 0;
    
    for (const keyword of this.promotionalKeywords) {
      if (lowerText.includes(keyword)) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * Check for urgency language
   */
  hasUrgencyLanguage(text) {
    const lowerText = text.toLowerCase();
    
    for (const word of this.urgencyWords) {
      if (lowerText.includes(word)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check for contact solicitation
   */
  hasContactSolicitation(text) {
    for (const pattern of this.contactPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check for social media promotion
   */
  hasSocialMediaPromotion(text) {
    for (const pattern of this.socialMediaPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check for price emphasis
   */
  hasPriceEmphasis(text) {
    for (const pattern of this.pricePatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check for excessive booking platform mentions
   */
  hasExcessiveBookingMentions(text) {
    const lowerText = text.toLowerCase();
    let mentionCount = 0;
    
    for (const platform of this.bookingPlatforms) {
      if (lowerText.includes(platform)) {
        mentionCount++;
      }
    }
    
    // More than 2 mentions is excessive
    return mentionCount > 2;
  }

  /**
   * Check for phone number or email
   */
  hasContactInfo(text) {
    // Phone number pattern
    const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    
    // Email pattern
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    
    return phonePattern.test(text) || emailPattern.test(text);
  }

  /**
   * Analyze message for promotional content
   * Returns: { decision: 'BLOCK' | 'FLAG' | 'ALLOW', flags: string[] }
   */
  analyze(text) {
    const flags = [];
    let decision = 'ALLOW';
    let promotionalScore = 0;

    if (!text || typeof text !== 'string') {
      return { decision: 'ALLOW', flags: [] };
    }

    const lowerText = text.toLowerCase();

    // Count promotional keywords
    const keywordCount = this.countPromotionalKeywords(lowerText);
    if (keywordCount >= 3) {
      flags.push('promotional_keywords');
      promotionalScore += 2;
    } else if (keywordCount >= 2) {
      flags.push('promotional_keywords');
      promotionalScore += 1;
    }

    // Urgency language
    if (this.hasUrgencyLanguage(lowerText)) {
      flags.push('urgency_language');
      promotionalScore += 1;
    }

    // Contact solicitation
    if (this.hasContactSolicitation(text)) {
      flags.push('contact_solicitation');
      promotionalScore += 2;
    }

    // Social media promotion
    if (this.hasSocialMediaPromotion(text)) {
      flags.push('social_media_promotion');
      promotionalScore += 2;
    }

    // Price emphasis
    if (this.hasPriceEmphasis(text)) {
      flags.push('price_emphasis');
      promotionalScore += 1;
    }

    // Contact info
    if (this.hasContactInfo(text)) {
      flags.push('contact_info');
      promotionalScore += 2;
    }

    // Excessive booking platform mentions
    if (this.hasExcessiveBookingMentions(lowerText)) {
      flags.push('excessive_platform_mentions');
      promotionalScore += 1;
    }

    // Decision based on promotional score
    if (promotionalScore >= 4) {
      decision = 'BLOCK';
    } else if (promotionalScore >= 2) {
      decision = 'FLAG';
    }

    return {
      decision,
      flags: [...new Set(flags)],
      promotionalScore
    };
  }
}

module.exports = new PromotionDetector();
