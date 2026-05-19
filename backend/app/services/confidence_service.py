import os
import joblib
import numpy as np

class ConfidenceService:
    def __init__(self):
        self.model_path = "backend/models/confidence_model.joblib"
        self.model = None
        if os.path.exists(self.model_path):
            try:
                self.model = joblib.load(self.model_path)
                print("ConfidenceService: Personality & Confidence model loaded successfully.")
            except Exception as e:
                print(f"ConfidenceService: Error loading model: {e}")
        else:
            print("ConfidenceService: Model not found. Using fallbacks.")

    def predict_traits_and_confidence(self, 
                                      word_count: int, 
                                      filler_count: int, 
                                      unique_words: int, 
                                      eye_contact_ratio: float, 
                                      smile_rate: float, 
                                      vocal_confidence: float, 
                                      fluency: float) -> dict:
        """
        Combines verbal and non-verbal cues to predict personality traits (Big Five)
        and final job suitability/confidence scores.
        """
        # Calculate features matching train_models.py
        log_words = np.log1p(word_count)
        filler_freq = filler_count / word_count if word_count > 0 else 0
        vocab_div = unique_words / word_count if word_count > 0 else 0
        
        features = [log_words, filler_freq, vocab_div, eye_contact_ratio, smile_rate, vocal_confidence, fluency]
        
        if self.model:
            try:
                arr = np.array(features).reshape(1, -1)
                pred = self.model.predict(arr)[0]
                
                # Targets are: [extraversion, neuroticism, agreeableness, conscientiousness, openness, interview]
                # All scaled in [0, 1] originally
                return {
                    "extraversion": float(np.clip(pred[0] * 100.0, 10.0, 99.0)),
                    "neuroticism": float(np.clip(pred[1] * 100.0, 10.0, 99.0)),
                    "agreeableness": float(np.clip(pred[2] * 100.0, 10.0, 99.0)),
                    "conscientiousness": float(np.clip(pred[3] * 100.0, 10.0, 99.0)),
                    "openness": float(np.clip(pred[4] * 100.0, 10.0, 99.0)),
                    "confidence_score": float(np.clip(pred[5] * 100.0, 10.0, 99.0))
                }
            except Exception as e:
                print(f"ConfidenceService prediction error: {e}")
                
        # High quality fallback rules in case of missing model
        # Base scores upon physical indicators
        base_confidence = 0.3 * eye_contact_ratio + 0.3 * vocal_confidence + 0.4 * fluency
        
        extra = 0.5 * smile_rate + 0.5 * vocal_confidence
        neuro = 0.8 * (1.0 - fluency) + 0.2 * (1.0 - eye_contact_ratio)
        agree = 0.6 * smile_rate + 0.4 * eye_contact_ratio
        consc = 0.7 * fluency + 0.3 * (1.0 - filler_freq)
        openn = 0.5 * (unique_words / 50 if unique_words < 50 else 1.0) + 0.5 * eye_contact_ratio
        
        # Scale to percentage 0-100
        return {
            "extraversion": float(np.clip(extra * 100.0, 20.0, 98.0)),
            "neuroticism": float(np.clip(neuro * 100.0, 15.0, 90.0)),
            "agreeableness": float(np.clip(agree * 100.0, 30.0, 98.0)),
            "conscientiousness": float(np.clip(consc * 100.0, 35.0, 98.0)),
            "openness": float(np.clip(openn * 100.0, 30.0, 98.0)),
            "confidence_score": float(np.clip(base_confidence * 100.0, 25.0, 98.0))
        }

confidence_service = ConfidenceService()
