from sqlalchemy.orm import Session
from . import models, schemas, auth

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_report(db: Session, user_id: int, filename: str, file_path: str, summary: str):
    db_report = models.Report(
        user_id=user_id,
        filename=filename,
        file_path=file_path,
        summary=summary
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

def get_reports_by_user(db: Session, user_id: int):
    return db.query(models.Report).filter(models.Report.user_id == user_id).order_by(models.Report.uploaded_at.desc()).all()

def get_report_by_id(db: Session, report_id: int, user_id: int):
    return db.query(models.Report).filter(models.Report.id == report_id, models.Report.user_id == user_id).first()

def delete_report(db: Session, report_id: int, user_id: int):
    db_report = get_report_by_id(db, report_id, user_id)
    if db_report:
        db.delete(db_report)
        db.commit()
        return True
    return False

def create_chat_message(db: Session, user_id: int, report_id: int, sender: str, message: str):
    db_msg = models.ChatMessage(
        user_id=user_id,
        report_id=report_id,
        sender=sender,
        message=message
    )
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return db_msg

def get_chat_messages(db: Session, report_id: int, user_id: int):
    return db.query(models.ChatMessage).filter(
        models.ChatMessage.report_id == report_id,
        models.ChatMessage.user_id == user_id
    ).order_by(models.ChatMessage.timestamp.asc()).all()

def delete_chat_messages(db: Session, report_id: int, user_id: int):
    db.query(models.ChatMessage).filter(
        models.ChatMessage.report_id == report_id,
        models.ChatMessage.user_id == user_id
    ).delete()
    db.commit()
    return True
