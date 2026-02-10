# PharmaGPT & Symptom Matcher

PharmaGPT is a professional medical assistant powered by RAG (Retrieval-Augmented Generation). It enables users to search for medicines based on symptoms or benefits and facilitates conversational queries with safety-first medical guidance.

## 🚀 Features

- **Symptom Matcher**: Search for medicines by describing symptoms or desired benefits.
- **Conversational RAG**: Ask specific follow-up questions about medicines using high-performance AI models.
- **Safety First**: Automatically provides safety warnings and disclaimers with responses.
- **Local Persistence**: Uses ChromaDB for fast, local vector storage and retrieval.

## 📊 Dataset Details

The system leverages a pharmaceutical dataset (`MID.xlsx`) containing comprehensive information for over 200,000+ entries (sampled during ingestion).

Key data fields include:
- **Medicine Name & Composition**
- **Product Benefits & Introduction**
- **How it Works & Usage Instructions**
- **Side Effects & Safety Advice**
- **Therapeutic Class & Habit-Forming Status**

## 🛠️ Tech Stack

- **Backend**: FastAPI, Uvicorn
- **Vector Database**: ChromaDB
- **Embeddings**: Sentence Transformers (`all-MiniLM-L6-v2`)
- **LLM Engine**: NVIDIA Nemotron (via OpenRouter)
- **Data Processing**: Pandas, OpenPyXL

## ⚙️ Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Maleekbukharii/pharma-gpt.git
cd pharma-gpt
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
NVIDIA_MODEL_NAME=nvidia/nemotron-3-nano-30b-a3b:free
```

### 4. Data Ingestion
Run the ingestion script to process the dataset and build the vector database:
```bash
python ingest_data.py
```
*Note: This script processes the `MID.xlsx` file and stores embeddings in the `chroma_db/` directory.*

## 🏃 Running the Application

### Start the API Server
```bash
python main.py
```
The server will start at `http://localhost:8000`.

### API Endpoints
- **GET `/`**: Welcome message.
- **POST `/search`**: Search medicines by symptoms.
  - Body: `{"text": "headache and fever", "top_k": 3}`
- **POST `/chat`**: Conversational AI for medicine queries.
  - Body: `{"message": "Can I take Paracetamol with food?", "history": []}`

## 🧪 Verification
You can verify the database state by running:
```bash
python verify_rag.py
```

## ⚖️ Disclaimer
This application is for educational and informational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
