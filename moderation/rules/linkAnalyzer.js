/**
 * Link Analyzer - Detects suspicious links and URLs
 * Analyzes URLs for malicious patterns, suspicious TLDs, and URL shorteners
 */

class LinkAnalyzer {
  constructor() {
    // URL shortener domains
    this.urlShorteners = new Set([
      'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd',
      'buff.ly', 'short.link', 'tiny.cc', 'rebrand.ly', 'cutt.ly',
      'shorturl.at', 'v.gd', 'shorte.st', 'adf.ly', 'bc.vc'
    ]);

    // Suspicious TLDs commonly used for malicious sites
    this.suspiciousTLDs = new Set([
      '.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.click',
      '.download', '.stream', '.online', '.site', '.website', '.space'
    ]);

    // Common affiliate link parameters
    this.affiliateParams = new Set([
      'ref=', 'affiliate=', 'partner=', 'utm_source=', 'utm_medium=',
      'aff=', 'ref_id=', 'referrer=', 'source=', 'campaign='
    ]);
  }

  /**
   * Extract all URLs from text
   */
  extractUrls(text) {
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi;
    const matches = text.match(urlRegex) || [];
    return matches.map(url => {
      // Normalize URLs
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      return url;
    });
  }

  /**
   * Check if URL is a shortener
   */
  isUrlShortener(url) {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      return this.urlShorteners.has(domain) || 
             domain.includes('short') || 
             domain.includes('tiny');
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if URL has suspicious TLD
   */
  hasSuspiciousTLD(url) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      for (const tld of this.suspiciousTLDs) {
        if (hostname.endsWith(tld)) {
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if URL contains IP address
   */
  isIpAddress(url) {
    const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;
    return ipRegex.test(url);
  }

  /**
   * Check if URL has affiliate parameters
   */
  hasAffiliateParams(url) {
    try {
      const urlObj = new URL(url);
      const searchParams = urlObj.search;
      
      for (const param of this.affiliateParams) {
        if (searchParams.toLowerCase().includes(param)) {
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if URL uses HTTP instead of HTTPS
   */
  isInsecure(url) {
    return url.startsWith('http://') && !url.startsWith('https://');
  }

  /**
   * Check if domain looks suspicious (excessive numbers, hyphens, mixed scripts)
   */
  hasSuspiciousDomain(url) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      
      // Too many numbers
      const numberCount = (hostname.match(/\d/g) || []).length;
      if (numberCount > 3) return true;
      
      // Too many hyphens
      const hyphenCount = (hostname.match(/-/g) || []).length;
      if (hyphenCount > 3) return true;
      
      // Mixed scripts (basic check)
      const hasLatin = /[a-z]/.test(hostname);
      const hasCyrillic = /[а-яё]/i.test(hostname);
      if (hasLatin && hasCyrillic) return true;
      
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Analyze links in message
   * Returns: { decision: 'BLOCK' | 'FLAG' | 'ALLOW', flags: string[], urls: array }
   */
  analyze(text) {
    const urls = this.extractUrls(text);
    const flags = [];
    let decision = 'ALLOW';

    if (urls.length === 0) {
      return { decision: 'ALLOW', flags: [], urls: [] };
    }

    // Check each URL
    for (const url of urls) {
      // IP address URLs are always suspicious
      if (this.isIpAddress(url)) {
        flags.push('suspicious_link');
        decision = 'BLOCK';
        continue;
      }

      // URL shorteners
      if (this.isUrlShortener(url)) {
        flags.push('url_shortener');
        if (decision !== 'BLOCK') {
          decision = 'FLAG'; // Flag for AI review
        }
      }

      // Suspicious TLDs
      if (this.hasSuspiciousTLD(url)) {
        flags.push('suspicious_tld');
        decision = 'BLOCK';
      }

      // Affiliate links
      if (this.hasAffiliateParams(url)) {
        flags.push('affiliate_link');
        if (decision !== 'BLOCK') {
          decision = 'FLAG';
        }
      }

      // Insecure HTTP
      if (this.isInsecure(url)) {
        flags.push('insecure_link');
        if (decision !== 'BLOCK') {
          decision = 'FLAG';
        }
      }

      // Suspicious domain patterns
      if (this.hasSuspiciousDomain(url)) {
        flags.push('suspicious_domain');
        if (decision !== 'BLOCK') {
          decision = 'FLAG';
        }
      }
    }

    // Multiple links increase suspicion
    if (urls.length > 2) {
      flags.push('multiple_links');
      if (decision === 'ALLOW') {
        decision = 'FLAG';
      }
    }

    // High link density
    const linkDensity = urls.join('').length / text.length;
    if (linkDensity > 0.3) {
      flags.push('high_link_density');
      if (decision === 'ALLOW') {
        decision = 'FLAG';
      }
    }

    return {
      decision,
      flags: [...new Set(flags)], // Remove duplicates
      urls
    };
  }
}

module.exports = new LinkAnalyzer();
