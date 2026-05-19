from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
import os
import re
import pandas as pd
import numpy as np
from typing import List
from backend.app.database import get_db
from backend.app.models import InterviewSession, QuestionResponse
from backend.app.schemas import (
    InterviewStartRequest, InterviewStartResponse, QuestionDetail,
    AnswerSubmitRequest, AnswerSubmitResponse, FeedbackReportResponse,
    QuestionResponseDetail
)
from backend.app.services.nlp_service import nlp_service
from backend.app.services.face_service import face_service
from backend.app.services.speech_service import speech_service
from backend.app.services.confidence_service import confidence_service
from backend.app.services.feedback_gen import feedback_generator

router = APIRouter(prefix="/interviews", tags=["Mock Interview Core"])

def get_questions_from_datasets(job_role: str, experience_level: str) -> List[dict]:
    """
    Retrieves 5 custom questions: 2 from HR questions, 3 from Technical software questions.
    Uses memory-efficient parsing for large datasets.
    """
    questions = []
    
    # 1. Fetch 2 HR questions from 'hr interview/hr_interview_questions_dataset.json'
    hr_path = "hr interview/hr_interview_questions_dataset.json"
    hr_count = 0
    if os.path.exists(hr_path):
        try:
            # Since the file is 2.5M records, we stream it or read first 1000 lines
            # let's open and read a small chunk to parse a subset of questions safely
            with open(hr_path, "r", encoding="utf-8") as f:
                # read first 500000 characters and parse what we can
                chunk = f.read(2000000)
                # Ensure chunk ends with a closing bracket
                end_pos = chunk.rfind("}")
                if end_pos != -1:
                    chunk = chunk[:end_pos+1]
                    if not chunk.endswith("]"):
                        chunk = chunk + "]"
                    if not chunk.startswith("["):
                        chunk = "[" + chunk
                    hr_list = json.loads(chunk)
                    
                    # Filter questions based on experience or role
                    for item in hr_list:
                        role_match = job_role.lower() in str(item.get("role", "")).lower()
                        exp_match = experience_level.lower() == str(item.get("experience", "")).lower()
                        
                        if role_match or exp_match or hr_count < 2:
                            questions.append({
                                "question": item.get("question"),
                                "category": item.get("category", "Behavioral"),
                                "difficulty": item.get("difficulty", "Medium"),
                                "ideal_answer": item.get("ideal_answer", "Give a structured behavioral response.")
                            })
                            hr_count += 1
                            if hr_count >= 2:
                                break
        except Exception as e:
            print(f"Error loading HR questions: {e}")
            
    # Fallbacks for HR if none loaded
    if hr_count < 2:
        questions.append({
            "question": "Tell me about a time you had to learn something completely new quickly.",
            "category": "Adaptability",
            "difficulty": "Easy",
            "ideal_answer": "I'm always eager to learn and embrace change as a way to improve. For example, I once had to switch to a new tech stack and picked it up quickly."
        })
        questions.append({
            "question": "Describe a scenario where you had a disagreement with a team member. How did you resolve it?",
            "category": "Conflict Resolution",
            "difficulty": "Medium",
            "ideal_answer": "I believe in respectful communication, active listening, and finding objective technical common grounds. I try to understand the other developer's perspective first."
        })

    # 2. Fetch 3 Technical questions from 'cse dataset questions/Software Questions.csv'
    tech_path = "cse dataset questions/Software Questions.csv"
    tech_count = 0
    if os.path.exists(tech_path):
        try:
            df = pd.read_csv(tech_path, encoding='latin-1')
            # Look for matches in Category or shuffle
            df_shuffled = df.sample(frac=1.0, random_state=42)
            for _, row in df_shuffled.iterrows():
                questions.append({
                    "question": str(row.get("Question")),
                    "category": str(row.get("Category", "Technical")),
                    "difficulty": str(row.get("Difficulty", "Medium")),
                    "ideal_answer": str(row.get("Answer"))
                })
                tech_count += 1
                if tech_count >= 3:
                    break
        except Exception as e:
            print(f"Error loading tech questions: {e}")

    # Fallbacks for Tech if none loaded
    if tech_count < 3:
        questions.extend([
            {
                "question": "What is the difference between compilation and interpretation?",
                "category": "General Programming",
                "difficulty": "Medium",
                "ideal_answer": "Compilation translates source code into machine code creating an executable file. Interpretation translates and executes code line by line without creating an executable."
            },
            {
                "question": "Explain the concept of OOP (Object-Oriented Programming) and its core pillars.",
                "category": "OOP Concepts",
                "difficulty": "Medium",
                "ideal_answer": "Object-Oriented Programming organizes software design around data (objects) rather than logic. The four core pillars are Encapsulation, Abstraction, Inheritance, and Polymorphism."
            },
            {
                "question": "What is the purpose of database indexes and how do they work?",
                "category": "Databases",
                "difficulty": "Hard",
                "ideal_answer": "An index is a data structure (e.g. B-Tree) that improves the speed of data retrieval operations on a database table. It acts like an index of a book, pointing to data locations without searching every row."
            }
        ])
        
    # Standardize IDs
    final_questions = []
    for i, q in enumerate(questions[:5]):
        final_questions.append({
            "id": i + 1,
            **q
        })
    return final_questions

@router.post("/start", response_model=InterviewStartResponse)
async def start_interview(request: InterviewStartRequest, db: Session = Depends(get_db)):
    # 1. Create a session in DB
    session = InterviewSession(
        candidate_name=request.candidate_name,
        job_role=request.job_role,
        experience_level=request.experience_level
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # 2. Get questions
    questions = get_questions_from_datasets(request.job_role, request.experience_level)
    
    # Return starting config
    return InterviewStartResponse(
        session_id=session.id,
        candidate_name=session.candidate_name,
        job_role=session.job_role,
        questions=[QuestionDetail(**q) for q in questions]
    )

@router.post("/submit_answer", response_model=AnswerSubmitResponse)
async def submit_answer(request: AnswerSubmitRequest, db: Session = Depends(get_db)):
    # Ensure session exists
    session = db.query(InterviewSession).filter(InterviewSession.id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # 1. Analyze verbal quality (NLP)
    fillers_analysis = nlp_service.count_filler_words(request.candidate_transcript)
    grammar_analysis = nlp_service.check_grammar(request.candidate_transcript)
    relevance_analysis = nlp_service.analyze_answer_relevance(
        request.candidate_transcript, 
        request.ideal_answer,
        [request.category]
    )
    
    # 2. Process physical audio features (SER)
    speech_metrics = speech_service.get_simulated_metrics()
    if request.audio_metrics and request.audio_metrics.energy:
        # If frontend sent live audio parameters
        pass
        
    # 3. Process physical video features (FER)
    # Run the actual deep learning Random Forest facial model if a webcam base64 frame is provided!
    if request.video_frame:
        video_metrics = face_service.analyze_frame_base64(request.video_frame)
    else:
        video_metrics = face_service.get_simulated_metrics()
        if request.video_metrics and request.video_metrics.eye_contact_ratio:
            video_metrics["eye_contact_ratio"] = request.video_metrics.eye_contact_ratio
            video_metrics["dominant_emotion"] = request.video_metrics.dominant_emotion
            if request.video_metrics.smile_rate > 0.0:
                video_metrics["smile_rate"] = request.video_metrics.smile_rate
            
    # Combine scores to calculate answer confidence
    # Fluency is higher when fillers are low
    fluency_score = float(np.clip(1.0 - fillers_analysis["frequency"], 0.2, 1.0))
    answer_confidence = float(np.clip(
        0.3 * video_metrics["eye_contact_ratio"] + 
        0.3 * speech_metrics["vocal_confidence"] + 
        0.4 * fluency_score, 0.1, 0.98
    ))
    
    # Save Response
    response = QuestionResponse(
        session_id=request.session_id,
        question_text=request.question_text,
        category=request.category,
        ideal_answer=request.ideal_answer,
        candidate_transcript=request.candidate_transcript,
        relevance_score=relevance_analysis["relevance_score"] * 100.0,
        grammar_score=grammar_analysis["grammar_score"] * 100.0,
        filler_count=fillers_analysis["total_fillers"],
        confidence_score=answer_confidence * 100.0,
        dominant_emotion=video_metrics["dominant_emotion"],
        eye_contact_ratio=video_metrics["eye_contact_ratio"] * 100.0,
        speech_fluency=fluency_score * 100.0
    )
    db.add(response)
    db.commit()
    db.refresh(response)
    
    return AnswerSubmitResponse(
        success=True,
        relevance_score=response.relevance_score,
        grammar_score=response.grammar_score,
        filler_count=response.filler_count,
        confidence_score=response.confidence_score,
        dominant_emotion=response.dominant_emotion
    )

@router.post("/finalize/{session_id}", response_model=FeedbackReportResponse)
async def finalize_interview(session_id: int, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    responses = db.query(QuestionResponse).filter(QuestionResponse.session_id == session_id).all()
    if not responses:
        raise HTTPException(status_code=400, detail="No answers submitted in this session.")
        
    # Aggregate values from individual responses
    total_answers = len(responses)
    avg_relevance = float(np.mean([r.relevance_score for r in responses]))
    avg_grammar = float(np.mean([r.grammar_score for r in responses]))
    total_fillers = sum(r.filler_count for r in responses)
    avg_eye_contact = float(np.mean([r.eye_contact_ratio for r in responses])) / 100.0
    avg_fluency = float(np.mean([r.speech_fluency for r in responses])) / 100.0
    
    # Calculate word count metric
    total_words = 0
    unique_words_set = set()
    for r in responses:
        words = str(r.candidate_transcript).lower().split()
        total_words += len(words)
        unique_words_set.update(words)
        
    avg_words_per_answer = total_words / total_answers
    
    # Simple simulated pace (WPM)
    speaking_pace = float(np.random.uniform(120, 140))
    
    # Visual emotions breakdown ratios
    emotions = [r.dominant_emotion for r in responses]
    happy_ratio = emotions.count("happy") / total_answers
    sad_ratio = emotions.count("sad") / total_answers
    neutral_ratio = emotions.count("neutral") / total_answers
    angry_ratio = emotions.count("angry") / total_answers
    fear_ratio = emotions.count("fear") / total_answers
    surprise_ratio = emotions.count("surprise") / total_answers
    
    # Average physical cues
    vocal_confidence = float(np.random.uniform(0.75, 0.92))
    smile_rate = float(happy_ratio * 0.8 + 0.1)
    
    # Compute multi-modal personality & confidence using the trained regressor!
    traits = confidence_service.predict_traits_and_confidence(
        word_count=total_words,
        filler_count=total_fillers,
        unique_words=len(unique_words_set),
        eye_contact_ratio=avg_eye_contact,
        smile_rate=smile_rate,
        vocal_confidence=vocal_confidence,
        fluency=avg_fluency
    )
    
    # Compute Core Performance Dimensions (0-100)
    session.confidence_score = traits["confidence_score"]
    session.communication_score = float(np.clip(
        0.4 * (avg_fluency * 100.0) + 
        0.4 * avg_grammar + 
        0.2 * (100.0 - min(total_fillers * 10.0, 80.0)), 20.0, 98.0
    ))
    # Technical score based on TF-IDF relevance and keyword matches
    session.technical_score = avg_relevance
    session.overall_score = float(np.clip(
        0.4 * session.technical_score + 
        0.3 * session.confidence_score + 
        0.3 * session.communication_score, 20.0, 98.0
    ))
    
    # Set variables
    session.eye_contact_ratio = avg_eye_contact * 100.0
    session.smile_rate = smile_rate * 100.0
    session.vocal_confidence = vocal_confidence * 100.0
    session.fluency = avg_fluency * 100.0
    session.filler_word_count = total_fillers
    session.grammar_score = avg_grammar
    session.speaking_pace = speaking_pace
    
    # Set personality traits
    session.extraversion = traits["extraversion"]
    session.neuroticism = traits["neuroticism"]
    session.agreeableness = traits["agreeableness"]
    session.conscientiousness = traits["conscientiousness"]
    session.openness = traits["openness"]
    
    # Set emotions
    session.happy_ratio = happy_ratio
    session.sad_ratio = sad_ratio
    session.neutral_ratio = neutral_ratio
    session.angry_ratio = angry_ratio
    session.fear_ratio = fear_ratio
    session.surprise_ratio = surprise_ratio
    
    # 4. Generate written feedbacks
    feedback_report = feedback_generator.generate_feedback_report(
        confidence_score=session.confidence_score,
        communication_score=session.communication_score,
        technical_score=session.technical_score,
        eye_contact=avg_eye_contact,
        fluency=avg_fluency,
        grammar=avg_grammar / 100.0,
        speaking_pace=speaking_pace,
        fillers_count=total_fillers,
        extraversion=session.extraversion,
        neuroticism=session.neuroticism
    )
    
    session.strengths = json.dumps(feedback_report["strengths"])
    session.weaknesses = json.dumps(feedback_report["weaknesses"])
    session.improvement_tips = json.dumps(feedback_report["improvement_tips"])
    
    db.commit()
    db.refresh(session)
    
    # Format and return report
    return FeedbackReportResponse(
        id=session.id,
        candidate_name=session.candidate_name,
        job_role=session.job_role,
        experience_level=session.experience_level,
        overall_score=session.overall_score,
        confidence_score=session.confidence_score,
        communication_score=session.communication_score,
        technical_score=session.technical_score,
        eye_contact_ratio=session.eye_contact_ratio,
        smile_rate=session.smile_rate,
        vocal_confidence=session.vocal_confidence,
        fluency=session.fluency,
        filler_word_count=session.filler_word_count,
        grammar_score=session.grammar_score,
        speaking_pace=session.speaking_pace,
        extraversion=session.extraversion,
        neuroticism=session.neuroticism,
        agreeableness=session.agreeableness,
        conscientiousness=session.conscientiousness,
        openness=session.openness,
        happy_ratio=session.happy_ratio,
        sad_ratio=session.sad_ratio,
        neutral_ratio=session.neutral_ratio,
        angry_ratio=session.angry_ratio,
        fear_ratio=session.fear_ratio,
        surprise_ratio=session.surprise_ratio,
        strengths=feedback_report["strengths"],
        weaknesses=feedback_report["weaknesses"],
        improvement_tips=feedback_report["improvement_tips"],
        responses=[
            QuestionResponseDetail(
                id=r.id,
                question_text=r.question_text,
                category=r.category,
                ideal_answer=r.ideal_answer,
                candidate_transcript=r.candidate_transcript,
                relevance_score=r.relevance_score,
                grammar_score=r.grammar_score,
                filler_count=r.filler_count,
                confidence_score=r.confidence_score,
                dominant_emotion=r.dominant_emotion,
                eye_contact_ratio=r.eye_contact_ratio
            ) for r in responses
        ],
        created_at=session.created_at
    )

@router.get("/report/{session_id}", response_model=FeedbackReportResponse)
async def get_feedback_report(session_id: int, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    responses = db.query(QuestionResponse).filter(QuestionResponse.session_id == session_id).all()
    
    return FeedbackReportResponse(
        id=session.id,
        candidate_name=session.candidate_name,
        job_role=session.job_role,
        experience_level=session.experience_level,
        overall_score=session.overall_score,
        confidence_score=session.confidence_score,
        communication_score=session.communication_score,
        technical_score=session.technical_score,
        eye_contact_ratio=session.eye_contact_ratio,
        smile_rate=session.smile_rate,
        vocal_confidence=session.vocal_confidence,
        fluency=session.fluency,
        filler_word_count=session.filler_word_count,
        grammar_score=session.grammar_score,
        speaking_pace=session.speaking_pace,
        extraversion=session.extraversion,
        neuroticism=session.neuroticism,
        agreeableness=session.agreeableness,
        conscientiousness=session.conscientiousness,
        openness=session.openness,
        happy_ratio=session.happy_ratio,
        sad_ratio=session.sad_ratio,
        neutral_ratio=session.neutral_ratio,
        angry_ratio=session.angry_ratio,
        fear_ratio=session.fear_ratio,
        surprise_ratio=session.surprise_ratio,
        strengths=json.loads(session.strengths) if session.strengths else [],
        weaknesses=json.loads(session.weaknesses) if session.weaknesses else [],
        improvement_tips=json.loads(session.improvement_tips) if session.improvement_tips else [],
        responses=[
            QuestionResponseDetail(
                id=r.id,
                question_text=r.question_text,
                category=r.category,
                ideal_answer=r.ideal_answer,
                candidate_transcript=r.candidate_transcript,
                relevance_score=r.relevance_score,
                grammar_score=r.grammar_score,
                filler_count=r.filler_count,
                confidence_score=r.confidence_score,
                dominant_emotion=r.dominant_emotion,
                eye_contact_ratio=r.eye_contact_ratio
            ) for r in responses
        ],
        created_at=session.created_at
    )
