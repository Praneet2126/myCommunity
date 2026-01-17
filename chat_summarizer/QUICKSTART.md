# Quick Start Guide - Chat Summarizer

## Prerequisites

- Python 3.8 or higher
- Hugging Face API key (get one at https://huggingface.co/settings/tokens)

## Setup Steps

### 1. Install Dependencies

```bash
cd chat_summarizer
pip install -r requirements.txt
```

### 2. Set Up API Key

You have two options:

**Option A: Environment Variable (Recommended)**
```bash
export HF_API_KEY="your_huggingface_api_key_here"
```

**Option B: .env File**
Create a `.env` file in the `backend/` directory (parent folder):
```bash
# From chat_summarizer directory
echo "HF_API_KEY=your_huggingface_api_key_here" > ../backend/.env
```

Or create it in the `chat_summarizer/` directory:
```bash
echo "HF_API_KEY=your_huggingface_api_key_here" > .env
```

## Running the Chat Summarizer

### Method 1: Command Line Interface (CLI)

The CLI provides an easy way to test the summarizer:

**Interactive Mode** (enter messages manually):
```bash
python3 cli.py
```

**From a Text File** (one message per line):
```bash
python3 cli.py example_messages.txt
```

**From a JSON File**:
```bash
python3 cli.py messages.json
# or explicitly:
python3 cli.py --json messages.json
```

**Example with the included example file:**
```bash
python3 cli.py example_messages.txt
```

### Method 2: As a Python Module

```python
from chat_summarizer import summarize_unread_messages

messages = [
    "Message 1 text here...",
    "Message 2 text here...",
    # ... more messages
]

result = summarize_unread_messages(messages)

if result['summarized']:
    print("Summary:")
    for bullet in result['summary']:
        print(f"  • {bullet}")
else:
    print(f"Not summarized: {result['reason']}")
    print(f"Stats: {result['stats']}")
```

## Thresholds

Summarization only occurs when **both** conditions are met:
- **Message count**: ≥ 15 messages
- **Word count**: ≥ 200 words

If either threshold is not met, the function returns `summarized=False` with a reason.

## Troubleshooting

**Error: "Hugging Face API key not found"**
- Make sure you've set the `HF_API_KEY` environment variable or created a `.env` file
- Check that the `.env` file is in the correct location (backend/ or chat_summarizer/)

**Error: "Module not found"**
- Make sure you're in the correct directory or have installed the module
- Try: `pip install -e .` from the chat_summarizer directory (if setup.py exists)

**API Errors**
- Verify your Hugging Face API key is valid
- Check your internet connection
- The API may be rate-limited if you make too many requests
