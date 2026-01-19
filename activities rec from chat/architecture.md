# Project Architecture: Goa Activity Recommender

## Overview
This project provides a local-first, AI-powered search and recommendation engine for activities and places in Goa. It uses Semantic Search (RAG-lite), Cross-Encoding for re-ranking, and a Local LLM for query expansion and chat analysis.

## Core Logic & Flow
1. **Query Processing**: The user provides a search query or a chat transcript.
2. **Local LLM Analysis**: 
   - For search: Expands the query with synonyms and related locations using `Qwen2.5-0.5B-Instruct`.
   - For chat: Extracts specific interests, locations, and constraints from the group conversation.
3. **Retrieval**: Performs a semantic search against a pre-encoded corpus of Goa places using `SentenceTransformer` (`all-MiniLM-L6-v2`).
4. **Re-ranking**: Refines the top candidates using a Cross-Encoder (`ms-marco-MiniLM-L-6-v2`) to ensure high relevance.
5. **Presentation**: Displays results with match scores, duration, and descriptions.

---

## Backend (FastAPI)
The backend provides a scalable API interface for the search engine.

### Endpoints
#### `GET /search`
- **Purpose**: Retrieve relevant places based on a semantic query.
- **Input**: `query` (string)
- **Output Format**:
```json
[
  {
    "name": "Fort Aguada",
    "duration": "1-2 hours",
    "score": 0.85
  }
]
```

### Components
- **SearchEngine**: Singleton class managing model loading and vector operations.
- **Models**: `all-MiniLM-L6-v2` (Retriever).

---

## Frontend (Streamlit)
A rich UI for interacting with the recommender system.

### Features
1. **Direct Search**: Includes AI query expansion for better coverage.
2. **Group Chat Analyzer**: Uploads/loads chat history (JSON) to generate group-specific recommendations.
3. **Local LLM Integration**: Uses Hugging Face `pipeline` for text generation and keyword extraction.

---

## Data Structures

### Places Data (`goa_activities.json` / `cleaned_goa_places.json`)
```json
{
  "places": [
    {
      "name": "Full Place Name",
      "description": "Brief description",
      "full_text": "Extensive details about the location",
      "suggested_hours": "Duration string"
    }
  ]
]
```

### Chat Data (`test_chat.json`)
```json
[
  {
    "user": "Username",
    "message": "User message content"
  }
]
```

---

## Integration for Fullstack
To integrate this into a production-grade fullstack project:
1. **Move Heavy Logic to Backend**: Migrate the Cross-Encoder and Local LLM (Qwen) logic from the Streamlit frontend to the FastAPI backend.
2. **RESTful API**: Define more endpoints (e.g., `/analyze-chat`) in FastAPI.
3. **Frontend Separation**: Use a modern framework (React/Next.js) for the UI, calling the FastAPI backend.
4. **Environment Management**: Use Docker for consistent deployment of Python environments and model weights.
