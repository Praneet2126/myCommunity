# AI Microservice

FastAPI-based microservice for AI-powered features including similar hotels search, chat summarization, and content moderation.

## Features

1. **AI-based Similar Hotels Search**: Find similar hotels based on image input
2. **Chat Summarization**: Summarize chat conversations
3. **Content Moderation**: Detect spam and abusive language in chat messages

## Setup

### Option 1: Using Setup Script (Recommended)

```bash
cd ai-service
./setup.sh
source venv/bin/activate
python main.py
```

### Option 2: Manual Setup

1. **Create and activate virtual environment**

```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate  # On Windows
```

2. **Install dependencies**

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

3. **Configure environment variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Run the server**

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

The API will be available at `http://localhost:8001`

## API Documentation

Once the server is running, you can access:
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

## API Endpoints

### Health Check
- `GET /` - Service info
- `GET /health` - Health check

### Similar Hotels Search
- `POST /api/v1/hotels/similar` - Find similar hotels from image

### Chat Summarization
- `POST /api/v1/chat/summarize` - Summarize chat messages

### Content Moderation
- `POST /api/v1/moderation/check` - Check single message
- `POST /api/v1/moderation/batch` - Check multiple messages

## Project Structure

```
ai-service/
├── main.py              # FastAPI application
├── config.py            # Configuration settings
├── requirements.txt     # Python dependencies
├── setup.sh             # Setup script
├── test_endpoints.py    # Test script for endpoints
├── .env.example         # Environment variables template
├── .gitignore          # Git ignore file
├── README.md           # This file
├── services/           # Service modules
│   ├── __init__.py
│   └── ai_service.py   # AI service integration
├── utils/              # Utility functions
│   ├── __init__.py
│   └── helpers.py      # Helper functions
└── venv/               # Virtual environment (not in git)
```

## Testing

After starting the server, you can test the endpoints:

```bash
python test_endpoints.py
```

Or use the interactive API documentation at http://localhost:8001/docs

## Next Steps

1. Integrate with your AI service endpoints
2. Connect to backend database if needed
3. Add authentication/authorization
4. Implement error handling and logging
5. Add unit tests
6. Configure CORS with specific frontend URL

## Development

The server runs in development mode with auto-reload enabled. For production, use a proper ASGI server like Gunicorn with Uvicorn workers.
