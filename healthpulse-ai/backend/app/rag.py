import os
import fitz
import json
import requests
import hashlib
import urllib.parse
from typing import List, Optional, Dict, Any
import chromadb
from chromadb.utils import embedding_functions
import openai
import google.generativeai as genai
import anthropic
from .config import settings

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extracts all text content from a PDF report."""
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
    return text

def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
    """Splits text into chunks of clean words with overlap."""
    words = text.split()
    chunks = []
    current_chunk = []
    current_length = 0
    for word in words:
        current_chunk.append(word)
        current_length += len(word) + 1
        if current_length >= chunk_size:
            chunks.append(" ".join(current_chunk))
            # Keep overlap words
            overlap_count = max(1, int(chunk_overlap / 12))
            current_chunk = current_chunk[-overlap_count:]
            current_length = sum(len(w) + 1 for w in current_chunk)
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    return chunks

def get_fallback_embedding_function():
    """Returns a simple, deterministic, mock embedding function to avoid PyTorch dependency crashes."""
    class MockEmbeddingFunction(chromadb.EmbeddingFunction):
        def __call__(self, input: chromadb.Documents) -> chromadb.Embeddings:
            embeddings = []
            for text in input:
                # Generate SHA-256 hash
                h = hashlib.sha256(text.encode('utf-8')).hexdigest()
                # Convert hex digits to normal floats
                floats = [float(int(h[i:i+2], 16)) / 255.0 for i in range(0, len(h), 2)]
                # Repeat to get a 384-dimension vector (32 floats * 12 = 384)
                floats = (floats * 12)[:384]
                embeddings.append(floats)
            return embeddings
    return MockEmbeddingFunction()

def get_embedding_function():
    """Returns ONNX miniLM embedding function with fallback support."""
    try:
        return embedding_functions.ONNXMiniLM_L6_V2EmbeddingFunction()
    except Exception as e:
        print(f"Error loading ONNX embedding function, using fallback hash embeddings: {e}")
        return get_fallback_embedding_function()

def get_chroma_client():
    return chromadb.PersistentClient(path=settings.CHROMA_DB_DIR)

def store_chunks_in_chroma(report_id: int, chunks: List[str]):
    """Stores text chunks in a Chroma collection specific to the report."""
    client = get_chroma_client()
    emb_fn = get_embedding_function()
    
    # Collection names must be 3-63 chars, start/end alphanumeric, no double dots
    collection_name = f"report_col_{report_id}"
    
    # Delete existing collection if exists to avoid duplication
    try:
        client.delete_collection(name=collection_name)
    except Exception:
        pass

    collection = client.create_collection(
        name=collection_name,
        embedding_function=emb_fn
    )
    
    documents = chunks
    metadatas = [{"report_id": report_id} for _ in chunks]
    ids = [f"chunk_{i}" for i in range(len(chunks))]
    
    collection.add(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )

def query_chroma(report_id: int, query: str, n_results: int = 4) -> List[str]:
    """Retrieves relevant text chunks from Chroma for a query."""
    client = get_chroma_client()
    emb_fn = get_embedding_function()
    collection_name = f"report_col_{report_id}"
    
    try:
        collection = client.get_collection(
            name=collection_name,
            embedding_function=emb_fn
        )
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        documents = results.get("documents", [[]])[0]
        return documents
    except Exception as e:
        print(f"Error querying Chroma collection: {e}")
        return []

# System analyzer instructions
SYSTEM_ANALYZER_PROMPT = """You are an advanced medical report analyzer AI. Your task is to analyze the extracted text from a medical report and structure your findings into a valid JSON response.
Do not include any conversational filler, markdown formatting (like ```json), or text outside the JSON block. Return ONLY the JSON object.

The JSON object must have this exact structure:
{
  "summary": "Overall summary of the medical report, explaining what it represents in plain language.",
  "key_findings": [
    "Key finding 1",
    "Key finding 2"
  ],
  "abnormal_values": [
    {
      "parameter": "Parameter name (e.g. Cholesterol, Hemoglobin, Glucose)",
      "value": "Observed value (e.g. 240 mg/dL)",
      "reference_range": "Normal reference range (e.g. < 200 mg/dL)",
      "status": "High" or "Low" or "Critical",
      "interpretation": "Short clinical interpretation of this abnormal value."
    }
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "doctor_notes": {
    "observations": [
      "Important observation 1",
      "Important observation 2"
    ],
    "questions_to_ask": [
      "Question 1",
      "Question 2"
    ],
    "suggested_tests": [
      "Suggested follow-up test 1"
    ]
  },
  "charts_data": [
    {
      "parameter": "Cholesterol",
      "value": 240,
      "unit": "mg/dL"
    },
    {
      "parameter": "Glucose",
      "value": 110,
      "unit": "mg/dL"
    },
    {
      "parameter": "Hemoglobin",
      "value": 11.2,
      "unit": "g/dL"
    }
  ]
}
Ensure all values extracted for charts are represented as numeric values where possible, and parameters are standardized (e.g., Cholesterol, Glucose, Hemoglobin, HDL, LDL, Triglycerides).
Translate any output summaries and text fields to the requested language if a language is specified (e.g. Hindi or Telugu).
Keep all text descriptions, summaries, interpretations, recommendations, and observations extremely concise and short (1-2 sentences maximum per field). This is critical for quick generation.
"""

def generate_llm_response(
    provider: str,
    model: str,
    api_key: Optional[str],
    prompt: str,
    system_prompt: str = "You are a professional medical report analyzer.",
    response_format_json: bool = False
) -> str:
    """Connects dynamically to selected AI provider using client-provided configurations."""
    
    # 1. Ollama (Local AI)
    if provider.lower() == "ollama":
        # Check available models to avoid 404/missing model error and fallback if necessary
        try:
            tags_res = requests.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=5)
            if tags_res.status_code == 200:
                available_models = [m["name"] for m in tags_res.json().get("models", [])]
                if available_models:
                    model_found = False
                    for m in available_models:
                        if model in m or m in model:
                            model = m
                            model_found = True
                            break
                    if not model_found:
                        model = available_models[0]
        except Exception as tags_err:
            print(f"Error checking available Ollama models: {tags_err}")

        url = f"{settings.OLLAMA_BASE_URL}/api/chat"
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "stream": False,
            "options": {
                "temperature": 0.1,
                "repeat_penalty": 1.2
            }
        }
        if response_format_json:
            payload["format"] = "json"
            
        try:
            response = requests.post(url, json=payload, timeout=300)
            response.raise_for_status()
            res_data = response.json()
            return res_data["message"]["content"]
        except Exception as e:
            return f"Ollama Connection Error: Could not connect to {settings.OLLAMA_BASE_URL}. Ensure Ollama is running and model '{model}' is pulled. Error details: {str(e)}"
            
    # 2. OpenAI
    elif provider.lower() == "openai":
        if not api_key or api_key.strip() == "":
            return "OpenAI Error: API key is missing. Please provide it in Settings."
        try:
            client = openai.OpenAI(api_key=api_key)
            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2
            )
            return completion.choices[0].message.content
        except Exception as e:
            return f"OpenAI Error: {str(e)}"
            
    # 3. Gemini
    elif provider.lower() == "gemini":
        if not api_key or api_key.strip() == "":
            return "Gemini Error: API key is missing. Please provide it in Settings."
        try:
            genai.configure(api_key=api_key)
            gemini_model = genai.GenerativeModel(
                model_name=model,
                system_instruction=system_prompt
            )
            response = gemini_model.generate_content(prompt)
            return response.text
        except Exception as e:
            # Fallback to direct requests if client SDK version fails
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                payload = {
                    "contents": [{
                        "parts": [{"text": f"System Instruction: {system_prompt}\n\nUser Question: {prompt}"}]
                    }],
                    "generationConfig": {
                        "temperature": 0.2
                    }
                }
                res = requests.post(url, json=payload, timeout=90)
                res.raise_for_status()
                return res.json()["candidates"][0]["content"]["parts"][0]["text"]
            except Exception as ex:
                return f"Gemini SDK Error: {str(e)}. Fallback API Error: {str(ex)}"
                
    # 4. Claude
    elif provider.lower() == "claude":
        if not api_key or api_key.strip() == "":
            return "Claude Error: API key is missing. Please provide it in Settings."
        try:
            client = anthropic.Anthropic(api_key=api_key)
            message = client.messages.create(
                model=model,
                max_tokens=4000,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2
            )
            return message.content[0].text
        except Exception as e:
            return f"Claude Error: {str(e)}"
            
    else:
        return f"Unsupported Provider: {provider}"

def parse_llm_json(response_text: str) -> Dict[str, Any]:
    """Safely extracts JSON from markdown-wrapped text or raw blocks."""
    cleaned = response_text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines[-1].startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    try:
        return json.loads(cleaned)
    except Exception as e:
        print(f"JSON Parsing failed: {e}. Raw response: {response_text}")
        return {
            "summary": "Medical Report Analysis extracted successfully. (Unable to structure into cards: " + str(e) + "). Full details:\n\n" + response_text,
            "key_findings": ["See details in summary above"],
            "abnormal_values": [],
            "recommendations": [],
            "doctor_notes": {
                "observations": ["Failed to structure notes"],
                "questions_to_ask": ["Please consult your practitioner with the summary above"],
                "suggested_tests": []
            },
            "charts_data": []
        }

def translate_text(text: str, target_lang: str) -> str:
    """Translates text to a target language (e.g. 'hi', 'te') using the free Google Translate API."""
    if not text or not text.strip():
        return text
    lang_map = {
        "hindi": "hi",
        "telugu": "te",
        "english": "en",
        "hi": "hi",
        "te": "te",
        "en": "en"
    }
    lang_code = lang_map.get(target_lang.lower(), target_lang)
    if lang_code == "en":
        # Only skip if the text contains no Indic characters (Hindi or Telugu)
        has_indic = any(0x0900 <= ord(c) <= 0x097F or 0x0C00 <= ord(c) <= 0x0C7F for c in text)
        if not has_indic:
            return text
        
    try:
        url = "https://translate.googleapis.com/translate_a/single"
        params = {
            "client": "gtx",
            "sl": "auto",
            "tl": lang_code,
            "dt": "t",
            "q": text
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        res = requests.get(url, params=params, headers=headers, timeout=10)
        res.raise_for_status()
        data = res.json()
        translated_chunks = [sentence[0] for sentence in data[0] if sentence and sentence[0]]
        return "".join(translated_chunks)
    except Exception as e:
        print(f"Translation error ({target_lang}): {e}")
        return text

def translate_data(data, target_lang: str):
    """Translates all string values in a nested data structure using a single HTTP request to avoid rate-limiting and delays."""
    # 1. Collect all strings recursively
    strings_to_translate = []
    
    def collect_strings(x):
        if isinstance(x, str):
            if x.strip():
                strings_to_translate.append(x)
        elif isinstance(x, list):
            for item in x:
                collect_strings(item)
        elif isinstance(x, dict):
            for val in x.values():
                collect_strings(val)
                
    collect_strings(data)
    
    if not strings_to_translate:
        return data
        
    # 2. Join strings with a unique separator that Google Translate preserves
    separator = " [|||] "
    combined_text = separator.join(strings_to_translate)
    
    # 3. Translate the combined text in a single call
    translated_combined = translate_text(combined_text, target_lang)
    
    # 4. Split the translated text back
    translated_strings = translated_combined.split(separator)
    
    # If the counts don't match (e.g. translation removed separators), fallback to individual translation
    if len(translated_strings) != len(strings_to_translate):
        print(f"Batch translation split mismatch: expected {len(strings_to_translate)}, got {len(translated_strings)}. Falling back to individual translation.")
        translated_map = {}
        for s in strings_to_translate:
            translated_map[s] = translate_text(s, target_lang)
    else:
        translated_map = dict(zip(strings_to_translate, translated_strings))
        
    # 5. Reconstruct the structure with translated values
    def reconstruct(x):
        if isinstance(x, str):
            if x.strip():
                return translated_map.get(x, x)
            return x
        elif isinstance(x, list):
            return [reconstruct(item) for item in x]
        elif isinstance(x, dict):
            return {key: reconstruct(val) for key, val in x.items()}
        return x
        
    return reconstruct(data)

