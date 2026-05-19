from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database import Base

class ResumeInfo(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    parsed_skills = Column(Text)  # JSON list of skills
    matched_job_title = Column(String)
    job_match_score = Column(Float)
    custom_questions = Column(Text)  # JSON list of tailored questions
    created_at = Column(DateTime, default=datetime.utcnow)

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    candidate_name = Column(String, index=True)
    job_role = Column(String)
    experience_level = Column(String)  # 'fresher', 'mid', 'senior'
    
    # Core scores
    overall_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    communication_score = Column(Float, default=0.0)
    technical_score = Column(Float, default=0.0)
    
    # Multi-modal metrics
    eye_contact_ratio = Column(Float, default=0.0)
    smile_rate = Column(Float, default=0.0)
    vocal_confidence = Column(Float, default=0.0)
    fluency = Column(Float, default=0.0)
    filler_word_count = Column(Integer, default=0)
    grammar_score = Column(Float, default=0.0)
    speaking_pace = Column(Float, default=0.0)  # words per minute
    
    # Big Five personality scores
    extraversion = Column(Float, default=0.0)
    neuroticism = Column(Float, default=0.0)
    agreeableness = Column(Float, default=0.0)
    conscientiousness = Column(Float, default=0.0)
    openness = Column(Float, default=0.0)
    
    # Emotion ratios
    happy_ratio = Column(Float, default=0.0)
    sad_ratio = Column(Float, default=0.0)
    neutral_ratio = Column(Float, default=0.0)
    angry_ratio = Column(Float, default=0.0)
    fear_ratio = Column(Float, default=0.0)
    surprise_ratio = Column(Float, default=0.0)
    
    # Actionable AI Feedback
    strengths = Column(Text)  # JSON list
    weaknesses = Column(Text)  # JSON list
    improvement_tips = Column(Text)  # JSON list
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    responses = relationship("QuestionResponse", back_populates="session", cascade="all, delete-orphan")

class QuestionResponse(Base):
    __tablename__ = "question_responses"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"))
    
    question_text = Column(Text)
    category = Column(String)
    ideal_answer = Column(Text)
    candidate_transcript = Column(Text)
    
    # Response metrics
    relevance_score = Column(Float, default=0.0)
    grammar_score = Column(Float, default=0.0)
    filler_count = Column(Integer, default=0)
    confidence_score = Column(Float, default=0.0)
    
    # Video & Speech metrics for this answer
    dominant_emotion = Column(String)
    eye_contact_ratio = Column(Float, default=0.0)
    speech_fluency = Column(Float, default=0.0)
    
    session = relationship("InterviewSession", back_populates="responses")
