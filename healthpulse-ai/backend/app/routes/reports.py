from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
import os
import uuid
import json
from typing import List, Optional
from ..database import get_db
from ..auth import get_current_user
from .. import models, schemas, crud, rag

router = APIRouter(prefix="/reports", tags=["reports"])

@router.post("/upload")
async def upload_report(
    file: UploadFile = File(...),
    provider: str = Form("ollama"),
    model: str = Form("qwen2.5:0.5b"),
    api_key: Optional[str] = Form(None),
    language: Optional[str] = Form("English"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Validate file format
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF reports are supported.")
        
    # Save file to upload directory
    file_id = str(uuid.uuid4())
    filename = f"{file_id}_{file.filename}"
    file_path = os.path.join("data", "uploads", filename)
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
        
    try:
        # 1. Extract text from PDF
        text = rag.extract_text_from_pdf(file_path)
        if not text.strip():
            raise HTTPException(status_code=400, detail="The PDF contains no readable text.")
            
        # 2. Chunk text and save to ChromaDB
        chunks = rag.chunk_text(text)
        
        # Save placeholder record to get ID
        report_record = crud.create_report(
            db=db,
            user_id=current_user.id,
            filename=file.filename,
            file_path=file_path,
            summary=None
        )
        
        # Store in ChromaDB using collection name keyed to report_record.id
        rag.store_chunks_in_chroma(report_record.id, chunks)
        
        # 3. Generate summary report using LLM
        prompt = f"""Analyze this medical report text. Return your response in the requested JSON format.
Language preference for all output text fields: {language}.
If the text is not a medical report, return a summary saying so.

Medical Report Text:
{text[:6000]}
"""
        summary_response = rag.generate_llm_response(
            provider=provider,
            model=model,
            api_key=api_key,
            prompt=prompt,
            system_prompt=rag.SYSTEM_ANALYZER_PROMPT,
            response_format_json=True
        )
        
        # 4. Parse JSON
        parsed_summary = rag.parse_llm_json(summary_response)
        
        # Translate to regional language if not English
        if language and language.lower() != "english":
            parsed_summary = rag.translate_data(parsed_summary, language)
        
        # Save stringified summary response to SQL Database
        report_record.summary = json.dumps(parsed_summary)
        db.commit()
        db.refresh(report_record)
        
        return {
            "id": report_record.id,
            "filename": report_record.filename,
            "uploaded_at": report_record.uploaded_at,
            "analysis": parsed_summary
        }
    except Exception as e:
        # Cleanup file if processing failed
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"Failed to process medical report: {str(e)}")

@router.get("", response_model=List[schemas.ReportResponse])
def get_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_reports_by_user(db, current_user.id)

def translate_analysis_dict(analysis: dict, target_lang: str) -> dict:
    lang_map = {
        "hindi": "hi",
        "telugu": "te"
    }
    lang_code = lang_map.get(target_lang.lower())
    if not lang_code:
        return analysis

    # Copy analysis to avoid mutating database state or causing issues
    translated = json.loads(json.dumps(analysis))

    # Translate summary
    if "summary" in translated and translated["summary"]:
        translated["summary"] = rag.translate_text(translated["summary"], lang_code)

    # Translate key findings
    if "key_findings" in translated and isinstance(translated["key_findings"], list):
        translated["key_findings"] = [
            (rag.translate_text(item, lang_code) if isinstance(item, str) else item)
            for item in translated["key_findings"]
        ]

    # Translate recommendations
    if "recommendations" in translated and isinstance(translated["recommendations"], list):
        translated["recommendations"] = [
            (rag.translate_text(item, lang_code) if isinstance(item, str) else item)
            for item in translated["recommendations"]
        ]

    # Translate abnormal values
    if "abnormal_values" in translated and isinstance(translated["abnormal_values"], list):
        for item in translated["abnormal_values"]:
            if isinstance(item, dict):
                if "parameter" in item and item["parameter"]:
                    item["parameter"] = rag.translate_text(item["parameter"], lang_code)
                if "interpretation" in item and item["interpretation"]:
                    item["interpretation"] = rag.translate_text(item["interpretation"], lang_code)

    # Translate doctor notes
    if "doctor_notes" in translated and isinstance(translated["doctor_notes"], dict):
        dn = translated["doctor_notes"]
        for key in ["observations", "questions_to_ask", "suggested_tests"]:
            if key in dn and isinstance(dn[key], list):
                dn[key] = [
                    (rag.translate_text(item, lang_code) if isinstance(item, str) else item)
                    for item in dn[key]
                ]

    return translated

@router.get("/{report_id}")
def get_report(
    report_id: int,
    language: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    report = crud.get_report_by_id(db, report_id, current_user.id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    analysis = {}
    if report.summary:
        try:
            analysis = json.loads(report.summary)
        except Exception:
            analysis = {"summary": report.summary}
            
    if language and language.lower() != "english":
        try:
            analysis = translate_analysis_dict(analysis, language)
        except Exception as e:
            print(f"Error during on-the-fly report translation: {e}")

    return {
        "id": report.id,
        "filename": report.filename,
        "uploaded_at": report.uploaded_at,
        "analysis": analysis
    }

@router.delete("/{report_id}")
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    report = crud.get_report_by_id(db, report_id, current_user.id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # Delete file from local uploads
    if os.path.exists(report.file_path):
        try:
            os.remove(report.file_path)
        except Exception:
            pass
            
    # Delete Chroma collection
    try:
        client = rag.get_chroma_client()
        client.delete_collection(name=f"report_col_{report_id}")
    except Exception:
        pass
        
    crud.delete_report(db, report_id, current_user.id)
    return {"status": "success", "message": "Report deleted successfully"}

@router.get("/{report_id}/chat", response_model=List[schemas.ChatMessageResponse])
def get_chat_history(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_chat_messages(db, report_id, current_user.id)

@router.delete("/{report_id}/chat")
def clear_chat_history(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    crud.delete_chat_messages(db, report_id, current_user.id)
    return {"status": "success", "message": "Chat history cleared successfully"}

@router.post("/{report_id}/chat")
def chat_on_report(
    report_id: int,
    req: schemas.ChatQueryRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    report = crud.get_report_by_id(db, report_id, current_user.id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # 1. Record original user message in DB
    crud.create_chat_message(db, current_user.id, report_id, "user", req.message)
    
    # 2. Determine target language code
    lang_code = None
    if req.language and req.language.lower() != "english":
        lang_map = {
            "hindi": "hi",
            "telugu": "te"
        }
        lang_code = lang_map.get(req.language.lower())
        
    # 3. Translate question to English for high-precision Chroma query and reasoning
    english_query = req.message
    if lang_code:
        english_query = rag.translate_text(req.message, "en")
        
    # 4. Query vector store for related context in English
    context_chunks = rag.query_chroma(report_id, english_query, n_results=4)
    context_text = "\n\n".join(context_chunks)
    
    # 4b. Extract the full report text to ensure absolute precision (e.g., distinguishing RBC/WBC)
    try:
        full_report_text = rag.extract_text_from_pdf(report.file_path)
        # Cap full text to 8000 characters to keep it well within context limits
        full_report_text = full_report_text[:8000]
    except Exception as e:
        print(f"Error extracting full report text in chat: {e}")
        full_report_text = ""
    
    # 5. Formulate context prompt in English
    system_prompt = """You are a professional medical assistant AI.
You must base your answer strictly on the provided medical report details.
Be extremely precise about specific medical metrics (e.g., distinguishing RBC from WBC, Glucose levels, etc.). Do not confuse similar-sounding or related parameters.
Answer the user's question clearly, precisely, and extremely concisely (1-2 sentences maximum). If the details do not contain the answer, say "Not mentioned in report."
"""
    prompt = f"""Use the following medical report details to answer the user's question.

Full Medical Report Text:
--------------------
{full_report_text}
--------------------

Relevant Excerpts:
--------------------
{context_text}
--------------------

Question: {english_query}
Answer:"""
    
    # 6. Generate reply from LLM in English
    ai_response = rag.generate_llm_response(
        provider=req.provider,
        model=req.model,
        api_key=req.api_key,
        prompt=prompt,
        system_prompt=system_prompt
    )
    
    # 7. Translate English response to regional language if requested
    if lang_code:
        ai_response = rag.translate_text(ai_response, lang_code)
        
    # 8. Record AI response in DB
    crud.create_chat_message(db, current_user.id, report_id, "ai", ai_response)
    
    return {"response": ai_response}

@router.post("/compare")
def compare_reports(
    req: schemas.ReportCompareRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if len(req.report_ids) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 reports to compare.")
        
    reports = []
    for r_id in req.report_ids:
        report = crud.get_report_by_id(db, r_id, current_user.id)
        if not report:
            raise HTTPException(status_code=404, detail=f"Report ID {r_id} not found or unauthorized")
        reports.append(report)
        
    # Compile text and parsed summaries for LLM comparison
    summaries_text = ""
    for idx, report in enumerate(reports):
        analysis = json.loads(report.summary) if report.summary else {}
        summaries_text += f"\nReport #{idx+1} (Filename: {report.filename}, Date: {report.uploaded_at.strftime('%Y-%m-%d')}):\n"
        summaries_text += f"Key Findings: {json.dumps(analysis.get('key_findings', []))}\n"
        summaries_text += f"Abnormal Values: {json.dumps(analysis.get('abnormal_values', []))}\n"
        summaries_text += f"Charts Data: {json.dumps(analysis.get('charts_data', []))}\n"
        
    prompt = f"""You are an expert medical analyzer. Compare the following medical reports for the same patient over time.
Identify trends, changes, improvements, or worsening parameters.
Focus specifically on parameters like Cholesterol, Glucose, Hemoglobin, and other key values.
Provide your output as a clean JSON response with the following format:
{{
  "comparison_summary": "Overall trend summary comparing the reports...",
  "trends": [
    {{
      "parameter": "Parameter name (e.g. Glucose)",
      "direction": "Improved" or "Worsened" or "Stable",
      "details": "Details about change, e.g. Glucose dropped from 110 mg/dL to 95 mg/dL."
    }}
  ],
  "recommendations": [
    "Suggested recommendation based on trend..."
  ],
  "chart_comparison": [
     {{
       "date": "Report Date (YYYY-MM-DD)",
       "parameter_values": {{
          "Glucose": 110,
          "Cholesterol": 240
       }}
     }}
  ]
}}
Do not include any conversational filler, markdown formatting (like ```json), or text outside the JSON block. Return ONLY the JSON object.
"""
    
    raw_response = rag.generate_llm_response(
        provider=req.provider,
        model=req.model,
        api_key=req.api_key,
        prompt=summaries_text + "\n\n" + prompt,
        system_prompt="You are a medical analyst comparing reports.",
        response_format_json=True
    )
    
    parsed_comparison = rag.parse_llm_json(raw_response)

    # Translate to regional language if requested
    lang_code = None
    if getattr(req, "language", None) and req.language.lower() != "english":
        lang_map = {
            "hindi": "hi",
            "telugu": "te"
        }
        lang_code = lang_map.get(req.language.lower())

    if lang_code and parsed_comparison:
        # Translate overall summary
        if "comparison_summary" in parsed_comparison and parsed_comparison["comparison_summary"]:
            parsed_comparison["comparison_summary"] = rag.translate_text(parsed_comparison["comparison_summary"], lang_code)
            
        # Translate trends details
        if "trends" in parsed_comparison and isinstance(parsed_comparison["trends"], list):
            for t in parsed_comparison["trends"]:
                if "details" in t and t["details"]:
                    t["details"] = rag.translate_text(t["details"], lang_code)
                    
        # Translate recommendations
        if "recommendations" in parsed_comparison and isinstance(parsed_comparison["recommendations"], list):
            translated_recs = []
            for rec in parsed_comparison["recommendations"]:
                if rec:
                    translated_recs.append(rag.translate_text(rec, lang_code))
            parsed_comparison["recommendations"] = translated_recs

    return parsed_comparison
