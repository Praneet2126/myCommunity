import json
import numpy as np
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI()

class Place(BaseModel):
    name: str
    duration: str
    score: float

class SearchEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SearchEngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.places_data = []
        self.embeddings = None
        self._load_data()
        self._initialized = True

    def _extract_name(self, full_name: str) -> str:
        words = full_name.split()
        return " ".join(words[:4])

    def _load_data(self):
        try:
            with open('cleaned_goa_places.json', 'r') as f:
                data = json.load(f)
                raw_places = data.get('places', [])
                
                corpus = []
                for p in raw_places:
                    clean_name = self._extract_name(p.get('name', ''))
                    description = p.get('description', '')
                    full_text = p.get('full_text', '')
                    suggested_hours = p.get('suggested_hours', 'Not specified')
                    
                    combined_text = f"{p.get('name', '')} {description} {full_text}"
                    
                    self.places_data.append({
                        "name": clean_name,
                        "duration": suggested_hours
                    })
                    corpus.append(combined_text)
                
                if corpus:
                    self.embeddings = self.model.encode(corpus, convert_to_tensor=False)
                    self.embeddings = self.embeddings / np.linalg.norm(self.embeddings, axis=1, keepdims=True)
        except Exception as e:
            print(f"Error loading data: {e}")

    def search(self, query: str, top_k: int = 1) -> List[Place]:
        if self.embeddings is None or not self.places_data:
            return []
        
        query_embedding = self.model.encode([query], convert_to_tensor=False)
        query_embedding = query_embedding / np.linalg.norm(query_embedding, axis=1, keepdims=True)
        
        similarities = np.dot(self.embeddings, query_embedding.T).flatten()
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        
        results = []
        for idx in top_indices:
            place = self.places_data[idx]
            results.append(Place(
                name=place['name'],
                duration=place['duration'],
                score=float(similarities[idx])
            ))
        return results

@app.on_event("startup")
def startup_event():
    SearchEngine()

@app.get("/search", response_model=List[Place])
async def search_places(query: str):
    if not query:
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    engine = SearchEngine()
    results = engine.search(query)
    
    if not results:
        raise HTTPException(status_code=404, detail="No matches found")
    
    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
