import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class NLPService:
    def __init__(self):
        self.fillers = ["like", "um", "uh", "you know", "so", "actually", "basically", "literally", "i mean"]
        # Standard english grammatical pattern rules
        self.double_words_re = re.compile(r"\b(\w+)\s+\1\b", re.IGNORECASE)

    def count_filler_words(self, text: str) -> dict:
        """Counts occurrence of each filler word and returns total."""
        text_lower = text.lower()
        words = re.findall(r"\b\w+\b", text_lower)
        total_words = len(words)
        
        filler_counts = {}
        total_fillers = 0
        
        for filler in self.fillers:
            count = len(re.findall(r"\b" + re.escape(filler) + r"\b", text_lower))
            if count > 0:
                filler_counts[filler] = count
                total_fillers += count
                
        filler_frequency = total_fillers / total_words if total_words > 0 else 0
        
        return {
            "total_fillers": total_fillers,
            "counts": filler_counts,
            "frequency": filler_frequency
        }

    def check_grammar(self, text: str) -> dict:
        """
        Runs simple rules:
        - Detects duplicated consecutive words (e.g. 'the the').
        - Checks for lowercase letters starting sentences.
        - Checks for lack of ending punctuation.
        Returns a score from 0.0 to 1.0 and a list of feedback suggestions.
        """
        suggestions = []
        deductions = 0.0
        
        # 1. Double words
        double_matches = self.double_words_re.findall(text)
        if double_matches:
            for match in set(double_matches):
                suggestions.append(f"Repeated word found: '{match} {match}'")
                deductions += 0.15
        
        # 2. Sentences starting with lowercase
        sentences = re.split(r'(?<=[.!?])\s+', text)
        for s in sentences:
            if s and s[0].islower():
                suggestions.append(f"Sentence should start with capital letter: '{s[:20]}...'")
                deductions += 0.05
                break
                
        # 3. Missing final punctuation
        if text and text.strip()[-1] not in ['.', '!', '?']:
            suggestions.append("Transcript lacks ending punctuation (period, exclamation, or question mark).")
            deductions += 0.05
            
        grammar_score = max(0.4, 1.0 - deductions)
        
        return {
            "grammar_score": float(grammar_score),
            "suggestions": suggestions
        }

    def analyze_answer_relevance(self, candidate_transcript: str, ideal_answer: str, category_keywords: list = None) -> dict:
        """
        Compares candidate answer against ideal answer using TF-IDF Cosine Similarity.
        Also calculates key term coverage.
        """
        if not candidate_transcript or not ideal_answer:
            return {"relevance_score": 0.0, "technical_depth": 0.0, "feedback": "Answer was too brief or empty."}
            
        # Clean text
        cand_clean = candidate_transcript.lower().strip()
        ideal_clean = ideal_answer.lower().strip()
        
        # TF-IDF Cosine Similarity
        try:
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf = vectorizer.fit_transform([cand_clean, ideal_clean])
            sim = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
        except Exception:
            sim = 0.0
            
        # Extract keywords from ideal answer (simple word frequencies minus stop words)
        words_ideal = set(re.findall(r"\b[a-z]{4,}\b", ideal_clean))
        stop_words = {"about", "there", "their", "would", "could", "should", "these", "those", "which", "other", "where"}
        keywords_ideal = [w for w in words_ideal if w not in stop_words]
        
        if category_keywords:
            keywords_ideal.extend([k.lower() for k in category_keywords])
        keywords_ideal = list(set(keywords_ideal))
        
        # Count match rate in candidate transcript
        matched_keywords = []
        for kw in keywords_ideal:
            if re.search(r"\b" + re.escape(kw) + r"\b", cand_clean):
                matched_keywords.append(kw)
                
        keyword_match_rate = len(matched_keywords) / len(keywords_ideal) if len(keywords_ideal) > 0 else 0.5
        
        # Blend cosine similarity and keyword coverage (75% semantic vector similarity, 25% keyword match rate)
        relevance = 0.75 * sim + 0.25 * keyword_match_rate
        
        # Gamesmanship Defense: If candidate dumps a large paragraph (>3x ideal length) 
        # but the cosine similarity is low, penalize aggressively by 70%
        cand_words_len = len(cand_clean.split())
        ideal_words_len = len(ideal_clean.split())
        if cand_words_len > 3 * ideal_words_len and sim < 0.15:
            relevance *= 0.3
            
        # Clamp between 0.05 and 0.98
        relevance_score = np.clip(relevance, 0.05, 0.98)
        
        # Technical depth is based on matching longer specialized words
        specialized_keywords = [w for w in matched_keywords if len(w) > 6]
        depth_score = np.clip(0.1 + 0.9 * (len(specialized_keywords) / 6.0 if len(specialized_keywords) < 6 else 1.0), 0.05, 0.98)
        
        # Generate short verbal feedback
        if relevance_score > 0.8:
            feedback = "Highly relevant response with excellent technical terminology coverage."
        elif relevance_score > 0.5:
            feedback = "Relevant response, though some core technical concepts could be explained in greater depth."
        else:
            feedback = "Response has low relevance to the question. Focus on addressing the core concepts directly."
            
        return {
            "relevance_score": float(relevance_score),
            "technical_depth": float(depth_score),
            "matched_keywords": matched_keywords,
            "feedback": feedback
        }

nlp_service = NLPService()
