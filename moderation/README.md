# Content Moderation Module

A hybrid content moderation system combining rule-based checks with AI-based toxicity detection using Hugging Face's `unitary/toxic-bert` model.

## Features

- **Rule-Based Detection**: Fast, deterministic checks for spam, promotions, suspicious links, and message repetition
- **AI-Based Toxicity Detection**: Context-aware analysis using Hugging Face Inference API
- **Hybrid Approach**: AI is only called when rule-based checks are inconclusive
- **Conservative Thresholds**: Designed to minimize false positives

## Architecture

```
moderation/
├── rules/
│   ├── linkAnalyzer.js      # Suspicious link detection
│   ├── spamDetector.js       # Spam pattern detection
│   ├── promotionDetector.js  # Promotional content detection
│   └── repetitionDetector.js # Duplicate message detection
├── ai/
│   └── toxicBertClient.js   # Hugging Face API integration
└── index.js                  # Main orchestrator
```

## Setup

### Environment Variables

Add the following to your `.env` file:

```env
HUGGING_FACE_API_KEY=your_api_key_here
```

To get a Hugging Face API key:
1. Sign up at https://huggingface.co
2. Go to Settings → Access Tokens
3. Create a new token with "Read" permissions
4. Add it to your `.env` file

**Note**: The module will work without the API key, but AI-based toxicity detection will be disabled. Rule-based checks will still function.

## Usage

### Basic Usage

```javascript
const contentModerator = require('./moderation');

// Moderate a message
const result = await contentModerator.moderate(
  messageContent,
  userId,        // Optional, for repetition detection
  'city'         // Optional, 'city' or 'private'
);

if (!result.allowed) {
  // Message was blocked
  console.log('Blocked:', result.reason);
  console.log('Flags:', result.flags);
} else {
  // Message is allowed
  // May still have flags for review
}
```

### Result Structure

```javascript
{
  allowed: boolean,        // true if message can be posted
  decision: string,        // 'ALLOW', 'FLAG', or 'BLOCK'
  flags: string[],         // Array of violation flags
  confidence: number,      // AI confidence score (0-1)
  reason: string,          // Human-readable reason
  sources: {
    ruleBased: boolean,    // Whether rule-based checks ran
    ai: boolean            // Whether AI analysis ran
  }
}
```

### Quick Check (Rule-Based Only)

For high-volume scenarios where you want fast rule-based checks only:

```javascript
const result = await contentModerator.quickCheck(
  messageContent,
  userId
);
```

## Integration

The moderation module is already integrated into:
- WebSocket handlers (`socket/handlers/cityChat.js`, `socket/handlers/privateChat.js`)
- REST API routes (`routes/cities.js`, `routes/chats.js`)

Messages are automatically moderated before being saved to the database.

## Rule-Based Checks

### Link Analysis
- URL shortener detection
- Suspicious TLD detection
- IP address URLs
- Affiliate link patterns
- Insecure HTTP links
- Suspicious domain patterns

### Spam Detection
- Character repetition
- Excessive capitalization
- Excessive punctuation
- Whitespace flooding
- Non-alphanumeric character ratio
- Message length extremes

### Promotion Detection
- Promotional keywords
- Urgency language
- Contact solicitation
- Social media promotion
- Price emphasis patterns
- Contact information

### Repetition Detection
- Exact duplicate messages
- Near-duplicate messages (90% similarity)
- Rapid-fire messaging
- Repeated links
- Template patterns

## AI-Based Detection

The AI model (`unitary/toxic-bert`) detects:
- **Toxic**: General toxic language
- **Severe Toxic**: Highly toxic content
- **Obscene**: Obscene language
- **Threat**: Threatening language
- **Insult**: Insulting language
- **Identity Hate**: Hate speech targeting identity

### Thresholds

Conservative thresholds are used to minimize false positives:
- `identity_hate` / `threat`: 0.70
- `severe_toxic`: 0.75
- `obscene`: 0.80
- `toxic`: 0.85
- `insult`: 0.75

## Decision Flow

1. **Rule-Based Checks**: Run all rule-based detectors
2. **Clear Block**: If rules determine BLOCK → Block immediately
3. **AI Analysis**: If rules are inconclusive (FLAG) → Call AI model
4. **Combine Results**: Merge rule-based and AI results
5. **Final Decision**: Return allow/block with flags

## Error Handling

- If AI API is unavailable → Falls back to rule-based decision
- If AI times out → Allows message with warning flag
- If AI returns invalid response → Allows message with error flag
- All errors are logged for monitoring

## Performance

- **Rule-Based**: <10ms per message
- **AI Analysis**: <500ms per message (with 2s timeout)
- **Caching**: AI results are cached for 5 minutes (in-memory)

## Monitoring

The module logs:
- Blocked messages with reasons
- AI API errors and timeouts
- Cache hits/misses

Check server logs for moderation activity.

## Customization

### Adjusting Thresholds

Edit `moderation/ai/toxicBertClient.js` to adjust AI thresholds:

```javascript
const thresholds = {
  identity_hate: 0.70,  // Adjust as needed
  threat: 0.70,
  // ...
};
```

### Requiring AI Confirmation

In `moderation/index.js`, set:

```javascript
this.requireAIForBlock = true; // Require AI confirmation for blocks
```

### Adding Custom Rules

Create new rule files in `moderation/rules/` and integrate them in `moderation/index.js`.

## Testing

Test the moderation module:

```javascript
const contentModerator = require('./moderation');

// Test spam detection
const spamResult = await contentModerator.moderate('BUY NOW!!! CLICK HERE!!!', 'user123');
console.log(spamResult); // Should block

// Test AI toxicity
const toxicResult = await contentModerator.moderate('You are an idiot', 'user123');
console.log(toxicResult); // May flag or block depending on confidence

// Test normal message
const normalResult = await contentModerator.moderate('Hello, how are you?', 'user123');
console.log(normalResult); // Should allow
```

## Notes

- The module is designed to be conservative and avoid false positives
- Messages are only blocked when there's high confidence
- Flagged messages are allowed but may be reviewed later
- Repetition detection uses in-memory cache (consider Redis for production)
