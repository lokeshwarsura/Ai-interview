from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import InterviewSession
from backend.app.schemas import DashboardStatsResponse
from typing import List, Dict

router = APIRouter(prefix="/dashboard", tags=["Dashboard Intelligence"])

@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    # 1. Fetch all completed sessions
    sessions = db.query(InterviewSession).order_by(InterviewSession.created_at.desc()).all()
    
    total = len(sessions)
    if total == 0:
        return DashboardStatsResponse(
            total_interviews=0,
            average_overall_score=0.0,
            average_confidence=0.0,
            average_communication=0.0,
            average_technical=0.0,
            recent_interviews=[]
        )
        
    avg_overall = sum(s.overall_score for s in sessions) / total
    avg_conf = sum(s.confidence_score for s in sessions) / total
    avg_comm = sum(s.communication_score for s in sessions) / total
    avg_tech = sum(s.technical_score for s in sessions) / total
    
    recent = []
    for s in sessions[:8]:  # Top 8 recent
        recent.append({
            "id": s.id,
            "candidate_name": s.candidate_name,
            "job_role": s.job_role,
            "overall_score": float(round(s.overall_score, 1)),
            "confidence_score": float(round(s.confidence_score, 1)),
            "created_at": s.created_at.strftime("%Y-%m-%d %H:%M")
        })
        
    return DashboardStatsResponse(
        total_interviews=total,
        average_overall_score=float(round(avg_overall, 1)),
        average_confidence=float(round(avg_conf, 1)),
        average_communication=float(round(avg_comm, 1)),
        average_technical=float(round(avg_tech, 1)),
        recent_interviews=recent
    )
