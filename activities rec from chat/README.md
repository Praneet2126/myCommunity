# Goa Activity Recommender (Local AI)

An AI-powered recommendation system for discovering activities in Goa. It features semantic search, re-ranking, and group chat analysis using local LLMs.

## Features
- **Semantic Search**: Understands intent beyond keywords.
- **AI Query Expansion**: Uses Qwen 2.5 (0.5B) to broaden search context.
- **Group Chat Analysis**: Analyzes conversations to find spots that fit everyone's interests.
- **100% Local**: No data leaves your machine; uses local Transformers and LLMs.

## Project Structure
- `main.py`: FastAPI backend for semantic search.
- `streamlit_app.py`: Streamlit frontend with advanced AI features.
- `architecture.md`: Detailed system design and data flow.
- `data/`: JSON files containing place data and sample chats.

## Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Backend (FastAPI)
```bash
python main.py
```
The API will be available at `http://localhost:8000`.

### 3. Run Frontend (Streamlit)
```bash
streamlit run streamlit_app.py
```

## Data
- `goa_activities.json`: Primary data source for activities.
- `cleaned_goa_places.json`: Supplemental data source.
- `test_chat.json`: Sample chat transcript for testing the analyzer.

## Architecture
For detailed information on the system design, please refer to [architecture.md](architecture.md).
