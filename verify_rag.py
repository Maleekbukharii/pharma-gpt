
import chromadb
from chromadb.utils import embedding_functions

# Configuration
CHROMA_PATH = 'd:/python/RAG/chroma_db'

def verify():
    print("Initializing ChromaDB Client...")
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    emb_func = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    collection = client.get_or_create_collection(name="medicines", embedding_function=emb_func)

    query = "I have a headache and fever"
    print(f"\nTesting search for: '{query}'")
    
    results = collection.query(
        query_texts=[query],
        n_results=3
    )

    print("\nResults:")
    for i in range(len(results['ids'][0])):
        name = results['metadatas'][0][i].get('name')
        score = results['distances'][0][i]
        print(f"{i+1}. {name} (Distance: {score:.4f})")
        print(f"   Excerpt: {results['documents'][0][i][:150]}...")

if __name__ == "__main__":
    verify()
