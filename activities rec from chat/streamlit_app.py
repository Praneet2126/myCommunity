import streamlit as st
import json
import numpy as np
import torch
from sentence_transformers import SentenceTransformer, CrossEncoder
from sklearn.feature_extraction.text import CountVectorizer
from transformers import pipeline

class AdvancedSearchEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AdvancedSearchEngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized: return
        
        # 1. Retrieval & Ranking Models
        self.retriever = SentenceTransformer('all-MiniLM-L6-v2')
        self.reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
        
        # 2. Local LLM (Qwen2.5-0.5B-Instruct)
        device = "mps" if torch.backends.mps.is_available() else "cpu"
        
        try:
            self.local_llm = pipeline(
                "text-generation",
                model="Qwen/Qwen2.5-0.5B-Instruct",
                device=device
            )
        except Exception as e:
            self.local_llm = pipeline(
                "text-generation",
                model="Qwen/Qwen2.5-0.5B-Instruct",
                device="cpu"
            )
        
        self.places_data = []
        self.embeddings = None
        self._load_data()
        self._initialized = True

    def _extract_keywords(self, text: str, top_n: int = 5) -> list:
        try:
            count = CountVectorizer(ngram_range=(1, 2), stop_words='english').fit([text])
            candidates = count.get_feature_names_out()
            doc_emb = self.retriever.encode([text])
            cand_emb = self.retriever.encode(candidates)
            dist = np.dot(cand_emb, doc_emb.T).flatten()
            return [candidates[i] for i in np.argsort(dist)[-top_n:]]
        except: return []

    def _load_data(self):
        try:
            with open('goa_activities.json', 'r') as f:
                raw_places = json.load(f).get('places', [])
                corpus = []
                for p in raw_places:
                    name, desc = p.get('name', ''), p.get('description', '')
                    keywords = self._extract_keywords(f"{name} {desc}")
                    self.places_data.append({
                        "name": " ".join(name.split()[:4]),
                        "duration": p.get('suggested_hours', 'Not specified'),
                        "description": desc,
                        "keywords": keywords,
                        "full_content": f"{name} {desc} {p.get('full_text', '')} {', '.join(keywords)}"
                    })
                    corpus.append(f"{name} {desc} {', '.join(keywords)}")
                self.embeddings = self.retriever.encode(corpus, convert_to_tensor=False)
                self.embeddings /= np.linalg.norm(self.embeddings, axis=1, keepdims=True)
        except Exception as e:
            st.error(f"Error loading data: {e}")

    def search(self, query: str, top_k: int = 15):
        q_emb = self.retriever.encode([query])
        q_emb /= np.linalg.norm(q_emb, axis=1, keepdims=True)
        sims = np.dot(self.embeddings, q_emb.T).flatten()
        idx_pool = np.argsort(sims)[-top_k:]
        pairs = [[query, self.places_data[i]['full_content']] for i in idx_pool]
        scores = self.reranker.predict(pairs)
        results = [{**self.places_data[idx_pool[i]], "score": float(scores[i])} for i in range(len(idx_pool))]
        return sorted(results, key=lambda x: x['score'], reverse=True)

    def expand_query_local(self, query: str):
        # Strict Few-Shot Prompting
        messages = [
            {"role": "system", "content": "You are a keyword extractor. Given a query, output 10 specific synonyms and related locations. Output ONLY a comma-separated list. No numbers. No sentences."},
            {"role": "user", "content": "historical monument"},
            {"role": "assistant", "content": "fort, heritage site, UNESCO, Aguada, Chapora, ruins, museum, citadel, ancient architecture, castle"},
            {"role": "user", "content": query}
        ]
        prompt = self.local_llm.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        output = self.local_llm(prompt, max_new_tokens=50, do_sample=False)
        generated = output[0]['generated_text']
        expanded = generated.split("assistant\n")[-1].strip() if "assistant\n" in generated else generated.split("<|im_start|>assistant")[-1].strip()
        return f"{query}, {expanded}"

    def analyze_chat_local(self, chat_data: list):
        # Focus on the most recent 50 messages
        chat_str = "\n".join([f"{m['user']}: {m['message']}" for m in chat_data[-50:]])
        
        # Aggressive Few-Shot for Specificity
        messages = [
            {"role": "system", "content": "Extract specific locations, activities, and constraints from the chat. Avoid generic terms like 'beaches' or 'temples'. No numbers. Output ONLY a comma-separated list of specific names and phrases."},
            {"role": "user", "content": "Rohan: Let's go to South Goa. Neha: I want to see Cabo de Rama. Priya: No long walks please."},
            {"role": "assistant", "content": "South Goa, Cabo de Rama, minimal walking, quiet spots, scenic views"},
            {"role": "user", "content": f"Chat Transcript:\n{chat_str}"}
        ]
        
        prompt = self.local_llm.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        output = self.local_llm(prompt, max_new_tokens=150, do_sample=False)
        
        generated = output[0]['generated_text']
        if "assistant\n" in generated:
            result = generated.split("assistant\n")[-1].strip()
        else:
            result = generated.split("<|im_start|>assistant")[-1].strip()
        
        # Clean up any potential leftover numbers if the model still hallucinates them
        import re
        result = re.sub(r'\d+\.\s*', '', result)
        return result

@st.cache_resource
def get_engine():
    return AdvancedSearchEngine()

st.set_page_config(page_title="Goa Local Search (Qwen)", layout="wide", page_icon="🏖️")
st.title("🏖️ Goa Explorer - Powered by Qwen (Local AI)")
st.markdown("""
- **100% Private**: Runs entirely on your local machine.
- **Strict Specificity**: Captures specific spots (like South Goa) and constraints (like minimal walking).
""")

engine = get_engine()

tab1, tab2 = st.tabs(["Direct Search", "Group Chat Analyzer"])

with tab1:
    query = st.text_input("Find a place in Goa:", placeholder="e.g., historical monument, quiet beach")
    if query:
        with st.spinner("Local AI expanding your query..."):
            expanded_q = engine.expand_query_local(query)
            st.caption(f"**Search Context:** {expanded_q}")
        
        results = engine.search(expanded_q)[:5]
        for res in results:
            with st.expander(f"📍 {res['name']} (Match: {res['score']:.2f})"):
                st.write(f"**Duration:** {res['duration']}\n\n**Description:** {res['description']}")

with tab2:
    st.header("Analyze Group Chat")
    if st.button("Load Sample Group Chat"):
        with open('test_chat.json', 'r') as f:
            st.session_state['chat_data'] = json.load(f)
            st.success("Test chat loaded!")

    if 'chat_data' in st.session_state:
        with st.expander("Show Chat History"):
            for m in st.session_state['chat_data']:
                st.write(f"**{m['user']}**: {m['message']}")
        
        if st.button("Identify Places for Group"):
            with st.spinner("Analyzing group dynamics..."):
                profile = engine.analyze_chat_local(st.session_state['chat_data'])
                # Cleaning the UI display
                st.info(f"**Group Interests Identified:** {profile}")
                results = engine.search(profile)[:5]
                for res in results:
                    with st.expander(f"📍 {res['name']}"):
                        st.write(f"**Why it fits:** Match {res['score']:.2f}")
                        st.write(f"**Suggested Hours:** {res['duration']}")
                        st.write(f"**Info:** {res['description']}")
