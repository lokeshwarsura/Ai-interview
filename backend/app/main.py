from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database import engine, Base
from backend.app.api import interviews, resume, dashboard

# Create all database tables on start
Base.metadata.create_all(bind=engine)
print("FastAPI: Database tables checked/created.")

app = FastAPI(
    title="AI-Powered Smart Interview Analyzer API",
    description="Multimodal Interview Evaluation using Computer Vision, NLP, Speech, and Decision ML Models",
    version="1.0.0"
)

# Enable CORS for React.js client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins in local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(interviews.router, prefix="/api")
app.include_router(resume.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "AI-Powered Smart Interview Analyzer Backend API is running."
    }
