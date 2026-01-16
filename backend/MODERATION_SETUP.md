# Content Moderation Setup Guide

## Quick Start

The content moderation module has been successfully integrated into your chat system. Follow these steps to complete the setup:

### 1. Environment Variable

Add your Hugging Face API key to your `.env` file:

```env
HUGGING_FACE_API_KEY=your_api_key_here
```

**Getting an API Key:**
1. Sign up at https://huggingface.co
2. Go to Settings → Access Tokens
3. Create a new token with "Read" permissions
4. Copy the token and add it to your `.env` file

**Note:** The system will work without the API key, but AI-based toxicity detection will be disabled. Rule-based checks will still function.

### 2. Node.js Version

Ensure you're using Node.js 18+ (required for native `fetch` support). Check your version:

```bash
node --version
```

If you're using an older version, upgrade Node.js or the system will fall back to rule-based checks only.

### 3. Test the Integration

Start your server:

```bash
npm run dev
```

The moderation system is now active and will automatically check all messages before they're saved.

## What's Been Integrated

✅ **Rule-Based Moderation**
- Spam detection
- Promotion detection
- Suspicious link detection
- Message repetition detection

✅ **AI-Based Toxicity Detection**
- Uses Hugging Face `unitary/toxic-bert` model
- Detects toxic, severe toxic, obscene, threat, insult, and identity hate content
- Only called when rule-based checks are inconclusive

✅ **Integration Points**
- WebSocket handlers (city chat, private chat)
- REST API routes (city messages, private messages)
- Message editing functionality

## How It Works

1. **User sends a message** → Content moderation runs automatically
2. **Rule-based checks** → Fast, deterministic checks for spam, links, promotions, repetition
3. **If inconclusive** → AI model analyzes for toxicity
4. **Decision made** → Message is allowed or blocked with explanation

## User Experience

When a message is blocked, users receive an error message:

```json
{
  "message": "Message blocked by content moderation",
  "reason": "Blocked by rule-based checks (spam/promotion)",
  "flags": ["spam_pattern", "promotional_keywords"]
}
```

## Monitoring

Check your server logs for moderation activity:
- Blocked messages with reasons
- AI API calls and responses
- Cache hits/misses
- Error handling

## Configuration

See `moderation/README.md` for detailed configuration options, including:
- Adjusting AI thresholds
- Customizing rule sensitivity
- Adding custom rules

## Support

If you encounter issues:
1. Check that `HUGGING_FACE_API_KEY` is set in `.env`
2. Verify Node.js version is 18+
3. Check server logs for error messages
4. Review `moderation/README.md` for detailed documentation
