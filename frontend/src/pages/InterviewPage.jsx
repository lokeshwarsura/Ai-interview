import React, { useState, useEffect, useRef } from 'react';
import { Video, Mic, ArrowRight, Play, Sparkles, User, Briefcase, Clock, FileText } from 'lucide-react';

export default function InterviewPage({ setView, setSessionId, customQuestionsPool, setCustomQuestionsPool }) {
  const [setup, setSetup] = useState(true);
  const [candidateName, setCandidateName] = useState('');
  const [jobRole, setJobRole] = useState('Software Engineer');
  const [experience, setExperience] = useState('fresher');

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [timer, setTimer] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const [audioLevel, setAudioLevel] = useState(5);
  const audioIntervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize Web Speech API for real Speech-to-Text
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript((prev) => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Webcam activation hook
  useEffect(() => {
    if (!setup && session) {
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          streamRef.current = stream;
        })
        .catch((err) => {
          console.warn("Camera access denied or unavailable:", err);
        });
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [setup, session]);

  // Timer countdown
  useEffect(() => {
    if (setup || !session) return;
    if (timer === 0) {
      handleNextQuestion();
      return;
    }
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, setup, session]);

  // Audio level animation
  const startAudioMeter = () => {
    audioIntervalRef.current = setInterval(() => {
      setAudioLevel(Math.random() * 80 + 10);
    }, 120);
  };

  const stopAudioMeter = () => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
    }
    setAudioLevel(5);
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopAudioMeter();
      setIsRecording(false);
    } else {
      setTranscript('');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Speech recognition start issue:', e);
        }
      }
      startAudioMeter();
      setIsRecording(true);
    }
  };

  const handleStartSetup = async (e) => {
    e.preventDefault();
    if (!candidateName) return;

    setSubmitting(true);
    try {
      // If we have custom questions from resume, bypass dataset fetching
      if (customQuestionsPool && customQuestionsPool.length > 0) {
        // Start interview session on server
        const sRes = await fetch('http://localhost:8000/api/interviews/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidate_name: candidateName, job_role: jobRole, experience_level: experience })
        });
        const sData = await sRes.json();
        
        setSession(sData);
        setQuestions(customQuestionsPool);
        setSetup(false);
        setTimer(60);
      } else {
        // Fetch from datasets
        const sRes = await fetch('http://localhost:8000/api/interviews/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidate_name: candidateName, job_role: jobRole, experience_level: experience })
        });
        const sData = await sRes.json();
        
        setSession(sData);
        setQuestions(sData.questions);
        setSetup(false);
        setTimer(60);
      }
      setSubmitting(false);
    } catch (err) {
      console.error('Error starting interview:', err);
      setSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    if (submitting) return;
    setSubmitting(true);

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      stopAudioMeter();
      setIsRecording(false);
    }

    const currentQ = questions[currentIdx];
    const finalTranscriptText = transcript.trim();

    if (!finalTranscriptText) {
      const confirmSkip = window.confirm("Your answer is empty. Are you sure you want to submit and move to the next question? (This will result in a lower technical score for this question)");
      if (!confirmSkip) {
        setSubmitting(false);
        return;
      }
    }

    // Capture a real physical webcam frame for visual analytics (FER & Eye Gaze)
    let base64Frame = null;
    if (videoRef.current && streamRef.current) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        base64Frame = canvas.toDataURL('image/jpeg', 0.6); // compress to highly lightweight 60% quality JPEG
      } catch (err) {
        console.warn("Could not capture real camera frame:", err);
      }
    }

    // Submit answer to backend API
    try {
      await fetch('http://localhost:8000/api/interviews/submit_answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.session_id,
          question_text: currentQ.question,
          category: currentQ.category,
          ideal_answer: currentQ.ideal_answer,
          candidate_transcript: finalTranscriptText,
          video_frame: base64Frame
        })
      });

      // Move forward
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1);
        setTranscript('');
        setTimer(60);
        setSubmitting(false);
      } else {
        // Last question answered! Finalize session and predict confidence!
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        const finRes = await fetch(`http://localhost:8000/api/interviews/finalize/${session.session_id}`, {
          method: 'POST'
        });
        const finData = await finRes.json();
        
        // Reset pool
        setCustomQuestionsPool([]);
        setSessionId(session.session_id);
        setView('report');
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setSubmitting(false);
    }
  };

  const handleAutofillIdeal = () => {
    // Fills transcript with ideal answer for quick testing
    const currentQ = questions[currentIdx];
    setTranscript(currentQ.ideal_answer);
  };

  if (setup) {
    return (
      <div className="modal-overlay">
        <div className="glass-card modal-content" style={{ animation: 'pulse 2s infinite alternate' }}>
          <h2 className="text-gradient" style={{ fontSize: '24px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} />
            Mock Interview Setup
          </h2>
          
          <form onSubmit={handleStartSetup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Candidate Name</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ width: '100%', paddingLeft: '40px' }} 
                  placeholder="Enter your full name" 
                  value={candidateName} 
                  required
                  onChange={(e) => setCandidateName(e.target.value)}
                />
                <User size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Role Category</label>
              <div style={{ position: 'relative' }}>
                <select 
                  className="form-input" 
                  style={{ width: '100%', paddingLeft: '40px', appearance: 'none' }}
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                >
                  <option value="Software Engineer">Software Engineer (General)</option>
                  <option value="DevOps Engineer">DevOps Engineer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Data Scientist">Data Scientist & AI Specialist</option>
                </select>
                <Briefcase size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Experience Level</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['fresher', 'mid', 'senior'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 'var(--border-radius-md)',
                      border: '1px solid',
                      borderColor: experience === level ? 'var(--accent-primary)' : 'var(--glass-border)',
                      background: experience === level ? 'rgba(99,102,241,0.1)' : 'rgba(0,0,0,0.2)',
                      color: experience === level ? 'var(--text-primary)' : 'var(--text-secondary)',
                      textTransform: 'capitalize',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'var(--transition-smooth)'
                    }}
                    onClick={() => setExperience(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {customQuestionsPool && customQuestionsPool.length > 0 && (
              <div style={{ 
                background: 'rgba(16,185,129,0.06)', 
                border: '1px solid rgba(16,185,129,0.2)', 
                padding: '10px 14px', 
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--color-success)',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FileText size={14} /> Resume Skills integrated! Loaded tailored mock questions.
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
              disabled={submitting}
            >
              <Play size={16} fill="#fff" />
              {submitting ? 'Preparing Mock...' : 'Initialize Interview Session'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px' }}>
            Interviewing: <span style={{ color: 'var(--accent-primary)' }}>{session?.candidate_name}</span>
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Target Role: {session?.job_role} | Mode: {experience.toUpperCase()}</span>
        </div>
        <div className="glass-card" style={{ padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} style={{ color: timer < 15 ? 'var(--color-danger)' : 'var(--color-success)' }} />
          <span style={{ 
            fontSize: '15px', 
            fontWeight: '800', 
            fontFamily: 'var(--font-display)',
            color: timer < 15 ? 'var(--color-danger)' : 'var(--text-primary)'
          }}>
            {timer}s remaining
          </span>
        </div>
      </div>

      <div className="grid-2">
        {/* Left: Webcam and Audio monitors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Webcam Simulator Box */}
          <div className="glass-card" style={{ 
            height: '300px', 
            position: 'relative', 
            overflow: 'hidden', 
            background: '#040509',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--border-radius-lg)',
            border: '2px solid var(--glass-border)'
          }}>
            {/* Real Webcam Stream Render */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ 
                position: 'absolute', 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                opacity: 0.7,
                zIndex: 0
              }} 
            />

            {/* active scanner visual */}
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              height: '2px', 
              background: 'linear-gradient(90deg, transparent, var(--accent-primary), transparent)',
              animation: 'scan 4s infinite linear',
              zIndex: 2
            }}></div>
            
            {/* Landmark Mock overlays */}
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '2px dashed rgba(99,102,241,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'spin 20s infinite linear',
              zIndex: 2,
              pointerEvents: 'none'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                border: '1px solid rgba(168,85,247,0.3)',
              }}></div>
            </div>

            {/* Corner camera tags */}
            <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--glass-border)', zIndex: 3 }}>
              <span className="live-indicator"></span>
              <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em' }}>WEBCAM STREAM</span>
            </div>
            
            <div style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '10px', fontSize: '11px', color: 'var(--text-secondary)', zIndex: 3 }}>
              FaceMesh: ACTIVE | Gaze: CALIBRATED
            </div>
            
            <Video size={32} style={{ position: 'absolute', opacity: 0.1, zIndex: 1 }} />
            
            <style>{`
              @keyframes scan {
                0% { top: 0%; }
                50% { top: 100%; }
                100% { top: 0%; }
              }
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>

          {/* Audio volume bars */}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px' }}>
            <Mic size={20} style={{ color: isRecording ? 'var(--color-danger)' : 'var(--text-secondary)' }} />
            <div style={{ flex: 1, height: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '7px', overflow: 'hidden', display: 'flex', alignItems: 'center', padding: '0 4px' }}>
              <div style={{ 
                height: '6px', 
                borderRadius: '3px',
                width: `${audioLevel}%`, 
                background: isRecording ? 'linear-gradient(90deg, var(--color-success), var(--color-warning))' : 'var(--text-muted)',
                transition: 'width 0.1s ease' 
              }}></div>
            </div>
            <button 
              style={{
                background: isRecording ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)',
                border: '1px solid',
                borderColor: isRecording ? 'rgba(239,68,68,0.3)' : 'var(--glass-border)',
                color: isRecording ? 'var(--color-danger)' : 'var(--text-primary)',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              onClick={toggleRecording}
            >
              {isRecording ? 'Mute' : 'Speak'}
            </button>
          </div>
        </div>

        {/* Right: Question and transcript input */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '380px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Question {currentIdx + 1} of {questions.length} ({currentQ?.category})
            </span>
            <h3 style={{ fontSize: '18px', marginTop: '6px', lineHeight: '1.5' }}>{currentQ?.question}</h3>
          </div>
          
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Your Spoken Answer Transcript</span>
              <button 
                type="button" 
                style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
                onClick={handleAutofillIdeal}
              >
                Autofill Ideal Answer (Testing)
              </button>
            </label>
            <textarea 
              className="form-input" 
              style={{ width: '100%', flex: 1, resize: 'none', fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: '1.6', background: 'rgba(0,0,0,0.25)' }}
              placeholder={isRecording ? "Listening through your microphone... start speaking your answer." : "Click 'Speak' to transcribe voice in real-time, or type/autofill your response."}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />
          </div>

          <button 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center' }} 
            disabled={submitting}
            onClick={handleNextQuestion}
          >
            {submitting ? 'Saving Metrics...' : currentIdx < questions.length - 1 ? 'Save & Next Question' : 'Save & Finalize Interview'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
