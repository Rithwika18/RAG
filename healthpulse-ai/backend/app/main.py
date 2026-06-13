from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from .database import engine, Base, get_db
from .config import settings
from . import models, schemas, crud, auth, rag
from .routes import auth as auth_router, reports as reports_router, settings as settings_router

# Create DB Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Medical Report Analyzer API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production-ready dynamic origins, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount modular routes
app.include_router(auth_router.router, prefix="/api")
app.include_router(reports_router.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")

# ROOT ENDPOINTS (To match User Specification)
@app.post("/register", response_model=schemas.UserResponse)
def root_register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return auth_router.register(user, db)

@app.post("/login", response_model=schemas.Token)
def root_login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    return auth_router.login(user_credentials, db)

@app.post("/upload")
async def root_upload(
    file: UploadFile = File(...),
    provider: str = Form("ollama"),
    model: str = Form("llama3"),
    api_key: Optional[str] = Form(None),
    language: Optional[str] = Form("English"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return await reports_router.upload_report(
        file=file, provider=provider, model=model, api_key=api_key, language=language, db=db, current_user=current_user
    )

@app.get("/reports", response_model=List[schemas.ReportResponse])
def root_get_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return reports_router.get_reports(db, current_user)

@app.get("/summary")
def root_get_summary(
    report_id: Optional[int] = None,
    language: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if report_id is not None:
        report = crud.get_report_by_id(db, report_id, current_user.id)
    else:
        # Grab the latest uploaded report if no ID was provided
        reports = crud.get_reports_by_user(db, current_user.id)
        report = reports[0] if reports else None
        
    if not report:
        raise HTTPException(status_code=404, detail="No medical reports found.")
        
    analysis = {}
    if report.summary:
        try:
            analysis = json.loads(report.summary)
        except Exception:
            analysis = {"summary": report.summary}
            
    if language and language.lower() != "english":
        try:
            analysis = reports_router.translate_analysis_dict(analysis, language)
        except Exception as e:
            print(f"Error during on-the-fly summary translation: {e}")

    return {
        "id": report.id,
        "filename": report.filename,
        "uploaded_at": report.uploaded_at,
        "analysis": analysis
    }

class RootChatRequest(schemas.ChatQueryRequest):
    report_id: int

@app.post("/chat")
def root_chat(
    req: RootChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return reports_router.chat_on_report(
        report_id=req.report_id,
        req=schemas.ChatQueryRequest(
            message=req.message,
            provider=req.provider,
            model=req.model,
            api_key=req.api_key,
            language=req.language
        ),
        db=db,
        current_user=current_user
    )

@app.post("/compare")
def root_compare(
    req: schemas.ReportCompareRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return reports_router.compare_reports(req, db, current_user)

@app.post("/settings", response_model=schemas.SettingsResponse)
def root_settings(req: schemas.SettingsRequest):
    return settings_router.test_settings(req)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Medical Report Analyzer API is running."}
