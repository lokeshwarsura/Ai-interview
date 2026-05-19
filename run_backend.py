import uvicorn

if __name__ == "__main__":
    print("Starting AI Interview Analyzer FastAPI server...")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
