
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import chromadb
from chromadb.utils import embedding_functions
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="PharmaGPT & Symptom Matcher")

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
CHROMA_PATH = 'd:/python/RAG/chroma_db'
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL_NAME = os.getenv("NVIDIA_MODEL_NAME", "nvidia/nemotron-3-nano-30b-a3b:free")

# Initialize ChromaDB
client = chromadb.PersistentClient(path=CHROMA_PATH)
emb_func = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
collection = client.get_or_create_collection(name="medicines", embedding_function=emb_func)

# Initialize OpenAI SDK for OpenRouter
ai_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []

@app.get("/")
async def root():
    return {"message": "Welcome to PharmaGPT API"}

@app.post("/chat")
async def chat_rag(request: ChatRequest):
    """Conversational RAG for specific medicine queries."""
    try:
        # 1. Retrieve context
        search_results = collection.query(
            query_texts=[request.message],
            n_results=2
        )
        
        context = "\n---\n".join(search_results['documents'][0])
        
        # 2. Build Prompt
        system_prompt = (
            "You are PharmaGPT, a professional medical assistant. Use the following context to answer the user's question. "
            "If the information is not in the context, say you don't know based on the current database. "
            "ALWAYS include safety warnings if applicable. "
            "Format your response in composed Markdown, using tables, bullet points, and bold text where appropriate. "
            "DISCLAIMER: State that this is not medical advice.\n\n"
            f"Context:\n{context}"
        )
        
        messages = [{"role": "system", "content": system_prompt}]
        if request.history:
            messages.extend(request.history)
        messages.append({"role": "user", "content": request.message})
        
        # 3. Call NVIDIA Nemotron via OpenRouter
        response = ai_client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            temperature=0.1,
            max_tokens=1024
        )
        
        return {
            "answer": response.choices[0].message.content,
            "sources": search_results['metadatas'][0]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
