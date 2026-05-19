from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Resume Schemas
class ResumeUploadResponse(BaseModel):
    id: int
    filename: str
    parsed_skills: List[str]
    matched_job_title: str
    job_match_score: float
    custom_questions: List[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True

# Interview Schemas
class InterviewStartRequest(BaseModel):
    candidate_name: str
    job_role: str
    experience_level: str = "fresher"

class QuestionDetail(BaseModel):
    id: int
    question: str
    category: str
    difficulty: str
    ideal_answer: str

class InterviewStartResponse(BaseModel):
    session_id: int
    candidate_name: str
    job_role: str
    questions: List[QuestionDetail]

# Answer Submission Schemas
class AudioMetricsInput(BaseModel):
    zcr: Optional[float] = 0.0
    energy: Optional[float] = 0.0
    spectral_bands: Optional[List[float]] = []

class VideoMetricsInput(BaseModel):
    eye_contact_ratio: Optional[float] = 0.0
    smile_rate: Optional[float] = 0.0
    dominant_emotion: Optional[str] = "neutral"

class AnswerSubmitRequest(BaseModel):
    session_id: int
    question_text: str
    category: str
    ideal_answer: str
    candidate_transcript: str
    video_frame: Optional[str] = None
    # Real-time media inputs (can be sent if captured on client)
    audio_metrics: Optional[AudioMetricsInput] = None
    video_metrics: Optional[VideoMetricsInput] = None

class AnswerSubmitResponse(BaseModel):
    success: bool
    relevance_score: float
    grammar_score: float
    filler_count: int
    confidence_score: float
    dominant_emotion: str

# Feedback Report Schemas
class QuestionResponseDetail(BaseModel):
    id: int
    question_text: str
    category: str
    ideal_answer: str
    candidate_transcript: str
    relevance_score: float
    grammar_score: float
    filler_count: int
    confidence_score: float
    dominant_emotion: str
    eye_contact_ratio: float

class FeedbackReportResponse(BaseModel):
    id: int
    candidate_name: str
    job_role: str
    experience_level: str
    overall_score: float
    confidence_score: float
    communication_score: float
    technical_score: float
    
    # Audiovisual metrics
    eye_contact_ratio: float
    smile_rate: float
    vocal_confidence: float
    fluency: float
    filler_word_count: int
    grammar_score: float
    speaking_pace: float
    
    # Big Five Personality Traits
    extraversion: float
    neuroticism: float
    agreeableness: float
    conscientiousness: float
    openness: float
    
    # Emotion Breakdown
    happy_ratio: float
    sad_ratio: float
    neutral_ratio: float
    angry_ratio: float
    fear_ratio: float
    surprise_ratio: float
    
    # Text Feedbacks
    strengths: List[str]
    weaknesses: List[str]
    improvement_tips: List[str]
    
    responses: List[QuestionResponseDetail]
    created_at: datetime

    class Config:
        from_attributes = True

# Dashboard Stats Schemas
class DashboardStatsResponse(BaseModel):
    total_interviews: int
    average_overall_score: float
    average_confidence: float
    average_communication: float
    average_technical: float
    recent_interviews: List[Dict]
