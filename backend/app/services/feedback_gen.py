class FeedbackGenerator:
    @staticmethod
    def generate_feedback_report(confidence_score: float, 
                                 communication_score: float, 
                                 technical_score: float,
                                 eye_contact: float, 
                                 fluency: float, 
                                 grammar: float, 
                                 speaking_pace: float, 
                                 fillers_count: int,
                                 extraversion: float, 
                                 neuroticism: float) -> dict:
        """
        Synthesizes numerical metrics and generates list of strengths,
        weaknesses, and suggestions for improvement.
        """
        strengths = []
        weaknesses = []
        tips = []

        # 1. Strengths
        if technical_score >= 75:
            strengths.append("Excellent technical depth and conceptual understanding. Answers demonstrated strong specialized keyword vocabulary.")
        elif technical_score >= 60:
            strengths.append("Solid core technical capabilities, addressing most key engineering requirements.")
            
        if eye_contact >= 0.85:
            strengths.append("Outstanding eye contact. Maintains highly stable gaze looking directly at the webcam, projecting trust and engagement.")
        elif eye_contact >= 0.75:
            strengths.append("Steady gaze and focus. Projected confidence through consistent head-cam posture.")
            
        if fluency >= 0.85 and fillers_count < 4:
            strengths.append("Highly fluent and articulate speaker. Expresses complex designs clearly with minimal filler word reliance.")
        elif communication_score >= 75:
            strengths.append("Strong communication clarity. Structured answers logically and paced sentences well.")

        if extraversion >= 70:
            strengths.append("High enthusiasm and warm expressiveness. Smile rates indicate strong collaborative potential.")

        # Default if list is short
        if len(strengths) < 2:
            strengths.append("Shows polite listening and structured logical sequencing of candidate answers.")
            strengths.append("Maintains positive facial expressions (e.g. neutral, happy) throughout the mock session.")

        # 2. Weaknesses
        if technical_score < 65:
            weaknesses.append("Answers could benefit from greater technical depth and reference to standard library or structural details.")
            
        if eye_contact < 0.75:
            weaknesses.append("Frequent gaze shifts or looking away from the camera, which can be interpreted as nervousness or distraction.")
            
        if fillers_count > 6 or fluency < 0.75:
            weaknesses.append(f"Excessive use of filler words (e.g., 'like', 'um', 'uh', 'you know') disrupting overall speaking flow.")
            
        if speaking_pace > 150:
            weaknesses.append("Extremely fast speech delivery, which may make it difficult for interviewers to follow core arguments.")
        elif speaking_pace < 110:
            weaknesses.append("Slow pace and long pauses, which can cause answers to lose structural coherence.")

        if neuroticism >= 65:
            weaknesses.append("High vocal and visual signs of stress. Speech signals reflect nervous pacing under pressure.")

        # Default
        if len(weaknesses) == 0:
            weaknesses.append("Minor pacing shifts between technical segments, though overall delivery is stable.")
            weaknesses.append("A few specialized technical definitions could be explained with clearer real-world analogies.")

        # 3. Actionable Tips
        if eye_contact < 0.85:
            tips.append("Try sticking a small sticky note right next to your webcam lens. Looking at the note helps you maintain natural, steady eye contact.")
            
        if fillers_count > 4:
            tips.append("Practice the 'Pause-and-Breathe' method. When you need a moment to collect your thoughts, pause silently instead of saying 'um' or 'like'.")
            
        if technical_score < 75:
            tips.append("Before answering, structure your response using the STAR method (Situation, Task, Action, Result) to maximize depth and impact.")

        if speaking_pace > 145:
            tips.append("Focus on conscious articulation. Try taking short regular breaths between sentences to naturally slow down your delivery to around 130 words per minute.")
        elif speaking_pace < 115:
            tips.append("Increase your speaking energy. Practice speed-reading articles aloud for 5 minutes daily to improve raw word articulation speed.")

        if len(tips) < 3:
            tips.append("Review typical questions and write down key concepts in bullet points. Avoid reading scripts; focus on dynamic key-term delivery.")
            tips.append("Do a mock run looking at a mirror or recording yourself to build vocal confidence.")

        return {
            "strengths": strengths[:3],
            "weaknesses": weaknesses[:3],
            "improvement_tips": tips[:3]
        }

feedback_generator = FeedbackGenerator()
