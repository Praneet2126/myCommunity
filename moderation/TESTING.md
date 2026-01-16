# Content Moderation Testing Guide

## Quick Start

Run the test suite:

```bash
npm run test:moderation
```

Or directly:

```bash
node moderation/test-moderation.js
```

## Test Results

The test suite will:
- ✅ Show which tests pass/fail
- 📊 Display a summary with success rate
- 🎨 Use colors for easy reading
- ⚠️ Warn if API key is missing

## Understanding Test Results

### Expected vs Actual

- **BLOCK** = Message is blocked and cannot be posted
- **FLAG** = Message is allowed but flagged for review
- **ALLOW** = Message passes all checks

### Why Some Tests May Fail

1. **Conservative Thresholds**: Our moderation is designed to minimize false positives. Some messages that might seem like they should be BLOCKED are FLAGGED instead.

2. **AI Unavailable**: Without `HUGGING_FACE_API_KEY`, AI-based toxicity detection is disabled. Tests that rely on AI will use rule-based checks only.

3. **Context Matters**: The moderation system considers context. A message that looks promotional in isolation might be legitimate in a travel discussion.

### Adjusting Test Expectations

If tests fail because the system is more conservative than expected, you can:

1. **Update examples.txt**: Change `BLOCK` to `FLAG` if the system flags instead of blocks
2. **Adjust thresholds**: Modify thresholds in the moderation modules (see README.md)
3. **Add context**: Some tests might need more context to work correctly

## Test File Format

The `examples.txt` file uses this format:

```
EXPECTED_RESULT|MESSAGE_TEXT
```

Examples:
```
BLOCK|spam spam spam
ALLOW|Hello, how are you?
FLAG|Check out this deal!
```

- Lines starting with `#` are comments
- Empty lines are ignored
- Use `|` to separate expected result from message

## Adding More Tests

Add test cases to `examples.txt`:

```txt
# Your test category
BLOCK|Your spam message here
ALLOW|Your legitimate message here
```

## Running Specific Tests

You can create custom test files:

```bash
node moderation/test-moderation.js my-custom-tests.txt
```

## CI/CD Integration

The test script exits with code 1 if any tests fail, making it suitable for CI/CD:

```bash
npm run test:moderation || exit 1
```

## Notes

- Tests run sequentially with a small delay to avoid rate limiting
- AI tests require `HUGGING_FACE_API_KEY` to be set
- Some tests may have different results depending on API availability
- The system is designed to be conservative (avoid false positives)
