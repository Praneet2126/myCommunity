/**
 * Content Moderation Module - Main Orchestrator
 * Combines rule-based checks with AI-based toxicity detection
 * 
 * Decision Flow:
 * 1. Rule-based checks (fast, deterministic)
 * 2. If inconclusive, call AI model
 * 3. Combine results and return final decision
 */

const linkAnalyzer = require('./rules/linkAnalyzer');
const spamDetector = require('./rules/spamDetector');
const promotionDetector = require('./rules/promotionDetector');
const repetitionDetector = require('./rules/repetitionDetector');
const toxicBertClient = require('./ai/toxicBertClient');

class ContentModerator {
  constructor() {
    this.requireAIForBlock = false; // Set to true if you want AI confirmation for blocks
  }

  /**
   * Run all rule-based checks
   */
  async runRuleBasedChecks(text, userId, chatType = 'city') {
    const results = {
      linkAnalysis: null,
      spamCheck: null,
      promotionCheck: null,
      repetitionCheck: null,
      overallDecision: 'ALLOW',
      flags: []
    };

    // 1. Link Analysis
    results.linkAnalysis = linkAnalyzer.analyze(text);
    results.flags.push(...results.linkAnalysis.flags);

    // 2. Spam Detection
    results.spamCheck = spamDetector.analyze(text);
    results.flags.push(...results.spamCheck.flags);

    // 3. Promotion Detection
    results.promotionCheck = promotionDetector.analyze(text);
    results.flags.push(...results.promotionCheck.flags);

    // 4. Repetition Detection (requires userId)
    if (userId) {
      const links = results.linkAnalysis.urls || [];
      results.repetitionCheck = repetitionDetector.analyze(userId, text, links);
      results.flags.push(...results.repetitionCheck.flags);
    }

    // Determine overall decision from rules
    const decisions = [
      results.linkAnalysis.decision,
      results.spamCheck.decision,
      results.promotionCheck.decision,
      results.repetitionCheck?.decision || 'ALLOW'
    ];

    // If any rule says BLOCK, overall is BLOCK
    if (decisions.includes('BLOCK')) {
      results.overallDecision = 'BLOCK';
    } else if (decisions.includes('FLAG')) {
      results.overallDecision = 'FLAG';
    } else {
      results.overallDecision = 'ALLOW';
    }

    // Remove duplicate flags
    results.flags = [...new Set(results.flags)];

    return results;
  }

  /**
   * Determine if AI analysis is needed
   */
  shouldCallAI(ruleResults, text) {
    // Don't call AI if rules already determined clear BLOCK
    if (ruleResults.overallDecision === 'BLOCK' && !this.requireAIForBlock) {
      return false;
    }

    // Call AI if:
    // 1. Rules are inconclusive (FLAG status) - need AI to determine severity
    // 2. Suspicious patterns detected that need context understanding
    // 3. Potential abuse indicators that rules can't fully assess
    // 4. Short messages that passed rules (likely simple toxic content that rules miss)
    
    // Performance optimization: Only call AI when there's a reason to suspect toxicity
    // This avoids calling AI for every single message while still catching toxic content

    const hasSuspiciousFlags = ruleResults.flags.some(flag => 
      flag.includes('url_shortener') || 
      flag.includes('suspicious') ||
      flag.includes('promotional') ||
      flag.includes('potential_abuse') ||
      flag.includes('repetition') // Repeated messages might be spam/abuse
    );

    // For ALLOW messages: only call AI if short (likely simple toxic messages) or has suspicious flags
    // Short messages are more likely to be simple insults that rules miss
    const isShortMessage = text && text.length < 100 && text.trim().length > 0;

    const shouldCall = 
      ruleResults.overallDecision === 'FLAG' || // Inconclusive - need AI assessment
      hasSuspiciousFlags ||
      (ruleResults.overallDecision === 'ALLOW' && isShortMessage); // Short messages that passed rules

    return shouldCall;
  }

  /**
   * Combine rule-based and AI results
   */
  combineResults(ruleResults, aiResults) {
    const finalResult = {
      allowed: true,
      decision: 'ALLOW',
      flags: [...ruleResults.flags],
      confidence: 0,
      reason: null,
      sources: {
        ruleBased: true,
        ai: false
      }
    };

    // Start with rule-based decision
    if (ruleResults.overallDecision === 'BLOCK') {
      finalResult.allowed = false;
      finalResult.decision = 'BLOCK';
      finalResult.reason = 'Blocked by rule-based checks';
    } else if (ruleResults.overallDecision === 'FLAG') {
      finalResult.decision = 'FLAG';
      finalResult.reason = 'Flagged by rule-based checks';
    }

    // Incorporate AI results if available
    if (aiResults && aiResults.scores) {
      finalResult.sources.ai = true;
      finalResult.confidence = aiResults.confidence;
      finalResult.flags.push(...aiResults.flags);

      // AI decision takes precedence for toxicity-related flags
      // Respect the AI's decision - if it says ALLOW (even for legitimate negative feedback), allow it
      if (aiResults.decision === 'BLOCK') {
        // Only block if AI confidence is high AND AI explicitly decided to block
        // The AI client already handles legitimate feedback with higher thresholds
        if (aiResults.confidence > 0.85) {
          finalResult.allowed = false;
          finalResult.decision = 'BLOCK';
          finalResult.reason = `Blocked by AI toxicity detection: ${aiResults.maxCategory} (confidence: ${(aiResults.confidence * 100).toFixed(1)}%)`;
        } else if (aiResults.confidence > 0.70) {
          // Medium confidence - flag but allow
          finalResult.decision = 'FLAG';
          finalResult.reason = `Flagged by AI: ${aiResults.maxCategory} (confidence: ${(aiResults.confidence * 100).toFixed(1)}%)`;
        }
      } else if (aiResults.decision === 'ALLOW') {
        // AI decided to allow (e.g., legitimate negative feedback) - respect that decision
        // Override any rule-based BLOCK if AI says it's safe (legitimate feedback)
        if (finalResult.decision === 'BLOCK' && 
            aiResults.flags.some(f => f.includes('potentially_toxic') || !f.includes('toxic'))) {
          // AI says it's legitimate feedback, allow it
          finalResult.allowed = true;
          finalResult.decision = 'ALLOW';
          finalResult.reason = 'Allowed - legitimate feedback';
        }
      } else if (aiResults.decision === 'FLAG' && finalResult.decision === 'ALLOW') {
        finalResult.decision = 'FLAG';
        finalResult.reason = `Flagged by AI: ${aiResults.maxCategory}`;
      }

      // If rules say BLOCK but AI says low toxicity, trust rules (rules caught spam/promotion)
      if (ruleResults.overallDecision === 'BLOCK' && 
          aiResults.confidence < 0.50 && 
          !aiResults.flags.some(f => f.includes('toxic') || f.includes('threat') || f.includes('hate'))) {
        // Rules caught non-toxicity issue (spam, promotion, etc.)
        finalResult.allowed = false;
        finalResult.decision = 'BLOCK';
        finalResult.reason = 'Blocked by rule-based checks (spam/promotion)';
      }
    } else if (aiResults && aiResults.flags.includes('ai_unavailable')) {
      // AI unavailable - trust rule-based decision
      finalResult.flags.push('ai_unavailable');
    }

    // Remove duplicate flags
    finalResult.flags = [...new Set(finalResult.flags)];

    // Final safety check: if multiple severe flags, block
    const severeFlags = finalResult.flags.filter(flag => 
      flag.includes('threat') || 
      flag.includes('identity_hate') || 
      flag.includes('severe_toxic') ||
      flag.includes('suspicious_link') ||
      flag.includes('ip_address')
    );

    if (severeFlags.length >= 2) {
      finalResult.allowed = false;
      finalResult.decision = 'BLOCK';
      finalResult.reason = 'Multiple severe violations detected';
    }

    return finalResult;
  }

  /**
   * Main moderation function
   * @param {string} text - Message content
   * @param {string} userId - User ID (optional, for repetition detection)
   * @param {string} chatType - 'city' or 'private' (optional)
   * @returns {Promise<Object>} Moderation result
   */
  async moderate(text, userId = null, chatType = 'city') {
    // Input validation
    if (!text || typeof text !== 'string') {
      return {
        allowed: false,
        decision: 'BLOCK',
        flags: ['invalid_content'],
        confidence: 1.0,
        reason: 'Invalid message content',
        sources: { ruleBased: true, ai: false }
      };
    }

    // Run rule-based checks
    const ruleResults = await this.runRuleBasedChecks(text, userId, chatType);

    // If rules already blocked, return immediately (unless requireAIForBlock is true)
    if (ruleResults.overallDecision === 'BLOCK' && !this.requireAIForBlock) {
      return {
        allowed: false,
        decision: 'BLOCK',
        flags: ruleResults.flags,
        confidence: 1.0,
        reason: 'Blocked by rule-based checks',
        sources: { ruleBased: true, ai: false }
      };
    }

    // Determine if AI analysis is needed
    const needsAI = this.shouldCallAI(ruleResults, text);

    let aiResults = null;
    if (needsAI) {
      try {
        // Add timeout for AI analysis to prevent hanging
        const aiTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AI analysis timeout')), 2500); // 2.5 second timeout
        });
        
        aiResults = await Promise.race([
          toxicBertClient.analyze(text),
          aiTimeout
        ]);
      } catch (error) {
        console.warn('AI analysis error or timeout:', error.message);
        // Continue with rule-based results only - fail open
        aiResults = null;
      }
    }

    // Combine results
    const finalResult = this.combineResults(ruleResults, aiResults);

    return finalResult;
  }

  /**
   * Quick check - rule-based only (for high-volume scenarios)
   */
  async quickCheck(text, userId = null) {
    const ruleResults = await this.runRuleBasedChecks(text, userId);
    
    return {
      allowed: ruleResults.overallDecision !== 'BLOCK',
      decision: ruleResults.overallDecision,
      flags: ruleResults.flags,
      confidence: ruleResults.overallDecision === 'BLOCK' ? 1.0 : 0.5,
      reason: ruleResults.overallDecision === 'BLOCK' ? 'Blocked by rule-based checks' : 'Passed rule-based checks',
      sources: { ruleBased: true, ai: false }
    };
  }
}

// Export singleton instance
module.exports = new ContentModerator();
