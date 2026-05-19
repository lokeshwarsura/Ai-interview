import os
import re
import json
import pandas as pd
import numpy as np

class ResumeService:
    def __init__(self):
        # Broad list of standard tech & CSE skills to detect in resume texts
        self.skill_vocabulary = [
            # Languages
            "python", "javascript", "typescript", "java", "c\\+\\+", "c#", "ruby", "php", "go", "rust", "scala", "kotlin", "sql", "html", "css",
            # Frameworks / Web
            "react", "angular", "vue", "node\\.js", "express", "django", "flask", "fastapi", "spring boot", "laravel", "jquery", "bootstrap",
            # Cloud / DevOps
            "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "terraform", "ansible", "git", "github", "gitlab", "cicd", "linux",
            # AI / ML / Data
            "machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy", "spark", "hadoop", "tableau", "power bi",
            # Databases
            "postgresql", "mysql", "mongodb", "redis", "sqlite", "oracle", "cassandra", "elasticsearch",
            # Soft Skills
            "communication", "leadership", "agile", "scrum", "problem solving", "teamwork", "adaptability", "project management"
        ]
        
        # Load and cache a fast index of job descriptions for matching
        self.job_data_path = "job/job_descriptions.csv"
        self.job_cache = []
        self._load_job_descriptions_cache()

    def _load_job_descriptions_cache(self):
        """Loads a subset of jobs from job_descriptions.csv to match against."""
        if os.path.exists(self.job_data_path):
            try:
                # Load first 2000 jobs to keep operations fast, filtering for unique titles
                df = pd.read_csv(self.job_data_path, nrows=15000, encoding='latin-1')
                # Filter for technical, analytical, or managerial jobs
                tech_titles = ["engineer", "developer", "scientist", "analyst", "manager", "architect", "administrator"]
                pattern = "|".join(tech_titles)
                df_filtered = df[df['Job Title'].str.contains(pattern, case=False, na=False)]
                
                # Keep unique job titles to provide rich variety
                df_unique = df_filtered.drop_duplicates(subset=['Job Title']).head(150)
                
                for _, row in df_unique.iterrows():
                    self.job_cache.append({
                        "job_id": int(row.get("Job Id", 0)),
                        "title": str(row.get("Job Title", "Software Developer")),
                        "role": str(row.get("Role", "Developer")),
                        "description": str(row.get("Job Description", "")),
                        "skills": [s.strip().lower() for s in str(row.get("skills", "")).split(",") if s.strip()],
                        "responsibilities": str(row.get("Responsibilities", ""))
                    })
                print(f"ResumeService: Loaded {len(self.job_cache)} unique jobs into memory cache.")
            except Exception as e:
                print(f"ResumeService: Error loading job descriptions: {e}")
                self._load_fallback_jobs()
        else:
            print("ResumeService: job_descriptions.csv not found. Loading fallbacks.")
            self._load_fallback_jobs()

    def _load_fallback_jobs(self):
        """Standard fallback tech jobs in case dataset isn't loaded."""
        self.job_cache = [
            {
                "job_id": 1001,
                "title": "Python Backend Engineer",
                "role": "Backend Developer",
                "description": "Develop high-performance REST APIs, manage PostgreSQL databases, and run background workers.",
                "skills": ["python", "django", "fastapi", "postgresql", "docker", "git"],
                "responsibilities": "Design backend architecture, write unit tests, and maintain CI/CD pipelines."
            },
            {
                "job_id": 1002,
                "title": "Frontend React Developer",
                "role": "Frontend Developer",
                "description": "Create highly responsive user interfaces using React.js and manage state with Redux.",
                "skills": ["javascript", "typescript", "react", "html", "css", "git"],
                "responsibilities": "Develop modular components, integrate rest APIs, and optimize frontend speed."
            },
            {
                "job_id": 1003,
                "title": "Data Scientist & AI Specialist",
                "role": "AI Engineer",
                "description": "Design deep learning architectures, perform NLP and computer vision tasks, and deploy models.",
                "skills": ["python", "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn", "pandas"],
                "responsibilities": "Build predictive models, clean data, and publish intelligence services."
            }
        ]

    def parse_skills_from_text(self, text: str) -> list:
        """Searches for skill keywords in a resume text string."""
        text_lower = text.lower()
        extracted = []
        for skill_pat in self.skill_vocabulary:
            match = re.search(r"\b" + skill_pat + r"\b", text_lower)
            if match:
                # clean up escaping in output string
                clean_skill = skill_pat.replace("\\+", "+").replace("\\.", ".")
                extracted.append(clean_skill.upper())
        return list(set(extracted))

    def match_resume_to_jobs(self, resume_skills: list) -> list:
        """
        Calculates skill overlap scores against job cache, returning
        top recommendations.
        """
        if not resume_skills:
            return [{"title": j["title"], "score": 10.0, "matching_skills": []} for j in self.job_cache[:3]]
            
        skills_set = set(s.lower() for s in resume_skills)
        recommendations = []
        
        for job in self.job_cache:
            job_skills_set = set(s.lower() for s in job["skills"])
            # Calculate overlapping skills
            overlap = skills_set.intersection(job_skills_set)
            
            # Simple TF-IDF like overlap ratio
            score = (2.0 * len(overlap)) / (len(skills_set) + len(job_skills_set)) if len(job_skills_set) > 0 else 0
            
            recommendations.append({
                "job_id": job["job_id"],
                "title": job["title"],
                "role": job["role"],
                "description": job["description"],
                "score": float(np.round(score * 100.0, 1)),
                "matching_skills": [s.upper() for s in overlap],
                "missing_skills": [s.upper() for s in job_skills_set.difference(skills_set)]
            })
            
        # Sort by score descending
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return recommendations[:5] # Top 5 recommendations

    def generate_questions_for_skills(self, skills: list) -> list:
        """
        Generates custom mock interview questions targeting candidate's skills.
        Pulls from 'cse dataset questions' or dynamically generates.
        """
        questions = []
        
        # Load cse dataset questions if available
        cse_path = "cse dataset questions/Software Questions.csv"
        df_questions = None
        if os.path.exists(cse_path):
            try:
                df_questions = pd.read_csv(cse_path, encoding='latin-1')
            except Exception:
                pass
                
        skills_lower = [s.lower() for s in skills]
        
        # 1. Look for matching category questions in the CSV
        if df_questions is not None:
            for _, row in df_questions.iterrows():
                cat = str(row.get("Category", "")).lower()
                # Check if skill name is in category
                matched = False
                for sk in skills_lower:
                    if sk in cat or cat in sk:
                        matched = True
                        break
                if matched:
                    questions.append({
                        "question": str(row.get("Question", "")),
                        "ideal_answer": str(row.get("Answer", "")),
                        "category": str(row.get("Category", "Technical")),
                        "difficulty": str(row.get("Difficulty", "Medium"))
                    })
                    if len(questions) >= 3:
                        break
                        
        # 2. Add high-quality dynamic questions if we need more or fallbacks
        fallbacks = {
            "python": {
                "question": "What is the difference between deep copy and shallow copy in Python?",
                "ideal_answer": "A shallow copy constructs a new compound object and inserts references to the original objects. A deep copy constructs a new compound object and recursively inserts copies of the original objects.",
                "category": "Python Development",
                "difficulty": "Medium"
            },
            "javascript": {
                "question": "What are Closures in JavaScript and how do they work?",
                "ideal_answer": "A closure is the combination of a function bundled together with references to its surrounding state (the lexical environment). Closures allow an inner function to access the scope of an outer function even after the outer function has returned.",
                "category": "JavaScript Programming",
                "difficulty": "Hard"
            },
            "react": {
                "question": "Explain the difference between functional components with Hooks and standard class components.",
                "ideal_answer": "Functional components are simpler JS functions that accept props and return JSX. Hooks like useState and useEffect allow them to manage local state and lifecycle methods which were previously only possible in stateful class components.",
                "category": "React Frontend",
                "difficulty": "Easy"
            },
            "machine learning": {
                "question": "Explain overfitting in machine learning and how you can prevent it.",
                "ideal_answer": "Overfitting occurs when a model learns the detail and noise in the training data to the extent that it negatively impacts the performance on new data. It can be prevented by cross-validation, regularization (L1/L2), pruning decision trees, or using dropout layers.",
                "category": "Machine Learning",
                "difficulty": "Hard"
            },
            "docker": {
                "question": "What is the difference between a Docker image and a Docker container?",
                "ideal_answer": "A Docker image is a read-only template that contains the source code, libraries, and dependencies needed to run an application. A Docker container is a running instance of a Docker image.",
                "category": "DevOps",
                "difficulty": "Easy"
            }
        }
        
        for sk in skills_lower:
            if sk in fallbacks and len(questions) < 5:
                questions.append(fallbacks[sk])
                
        # Fill to 5 questions using general HR/technical prompts
        general_prompts = [
            {
                "question": "Tell me about a time you had to learn something completely new quickly.",
                "ideal_answer": "I'm always eager to learn and embrace change as a way to improve. For example, I once had to switch to a new tech stack and picked it up quickly.",
                "category": "Adaptability",
                "difficulty": "Easy"
            },
            {
                "question": "How do you handle conflict or differences of opinion within a development team?",
                "ideal_answer": "I believe in respectful communication, active listening, and finding objective technical common grounds. I try to understand the other developer's perspective first.",
                "category": "Teamwork",
                "difficulty": "Medium"
            }
        ]
        
        for p in general_prompts:
            if len(questions) < 5:
                questions.append(p)
                
        # Assign numeric IDs
        for i, q in enumerate(questions):
            q["id"] = i + 1
            
        return questions

resume_service = ResumeService()
