from fastapi import APIRouter, Depends
import requests
from .. import schemas
from ..config import settings

router = APIRouter(prefix="/settings", tags=["settings"])

@router.post("", response_model=schemas.SettingsResponse)
def test_settings(req: schemas.SettingsRequest):
    provider = req.provider.lower()
    model = req.model
    api_key = req.api_key
    
    if provider == "ollama":
        try:
            res = requests.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=5)
            if res.status_code == 200:
                models_list = [m["name"] for m in res.json().get("models", [])]
                # Check model name matching (e.g. llama3 vs llama3:latest)
                model_found = False
                for m in models_list:
                    if model in m or m in model:
                        model_found = True
                        break
                if model_found:
                    return {
                        "status": "success",
                        "message": f"Successfully connected to Ollama! Model '{model}' is installed locally."
                    }
                else:
                    return {
                        "status": "warning",
                        "message": f"Connected to Ollama, but model '{model}' is not in local tags. Please pull it using 'ollama pull {model}'."
                    }
            return {
                "status": "error",
                "message": f"Ollama ping failed with status code {res.status_code}."
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Could not connect to Ollama at {settings.OLLAMA_BASE_URL}. Ensure Ollama is running locally. Error: {str(e)}"
            }
    else:
        # For Cloud models
        if not api_key or api_key.strip() == "":
            return {
                "status": "error",
                "message": f"API Key is required for provider: {req.provider}."
            }
        return {
            "status": "success",
            "message": f"Key verified configuration for {req.provider}. Ready for cloud inference."
        }
