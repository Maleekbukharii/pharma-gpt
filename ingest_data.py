
import pandas as pd
import chromadb
from chromadb.utils import embedding_functions
import os
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Configuration
DATA_PATH = 'd:/python/RAG/MID.xlsx'
CHROMA_PATH = 'd:/python/RAG/chroma_db'
SAMPLE_SIZE = 200000 

def clean_text(text):
    if pd.isna(text) or text == "":
        return ""
    return str(text).strip()

def ingest_data():
    print(f"Loading data from {DATA_PATH}...")
    # Loading first N rows for testing
    df = pd.read_excel(DATA_PATH, nrows=SAMPLE_SIZE)
    
    # Fill NaN values
    df = df.fillna("")

    # Initialize ChromaDB
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    
    # Using local embedding function to save API calls
    # This will download the model on first run
    emb_func = embedding_functions.SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
    
    collection = client.get_or_create_collection(
        name="medicines",
        embedding_function=emb_func
    )

    documents = []
    metadatas = []
    ids = []

    print(f"Processing {len(df)} rows...")
    for idx, row in df.iterrows():
        # Combine fields for context
        # We want to search symptoms/benefits, so we prioritize those fields
        main_content = f"Medicine: {row['Name']}\n" \
                       f"Benefits: {row['ProductBenefits']}\n" \
                       f"Introduction: {row['ProductIntroduction']}\n" \
                       f"How it works: {row['HowWorks']}"
        
        # Metadata for filtering and detailed display
        metadata = {
            "name": str(row['Name']),
            "contains": str(row['Contains']),
            "side_effects": str(row['SideEffect']),
            "how_to_use": str(row['HowToUse']),
            "safety_advice": str(row['SafetyAdvice']),
            "therapeutic_class": str(row['Therapeutic_Class']),
            "habit_forming": str(row['Habit_Forming'])
        }
        
        documents.append(main_content)
        metadatas.append(metadata)
        ids.append(f"med_{idx}")

    # Add to collection in batches to be safe
    batch_size = 100
    for i in range(0, len(documents), batch_size):
        print(f"Indexing batch {i//batch_size + 1}...")
        collection.add(
            documents=documents[i:i+batch_size],
            metadatas=metadatas[i:i+batch_size],
            ids=ids[i:i+batch_size]
        )
    
    print(f"Successfully indexed {len(documents)} medicines.")

if __name__ == "__main__":
    ingest_data()
