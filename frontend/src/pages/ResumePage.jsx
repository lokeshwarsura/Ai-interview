import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Briefcase, Play, HelpCircle } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function ResumePage({ setView, setCustomQuestionsPool }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [showRecs, setShowRecs] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/resume/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setResumeData(data);
      
      // Fetch recommendations
      const recsRes = await fetch(`${API_BASE_URL}/api/resume/recommendations/${data.id}`);
      const recsData = await recsRes.json();
      setRecommendations(recsData);
      
      setUploading(false);
      setShowRecs(true);
    } catch (err) {
      console.error('Error uploading resume:', err);
      setUploading(false);
    }
  };

  const handleAutofillSampleResume = async () => {
    setUploading(true);
    const mockContent = `John Doe\nSoftware Engineer\nSkills: Python, FastAPI, React, SQL, Git, Docker, Machine Learning.\nExperience:\n- Developed backend REST APIs using FastAPI and Python.\n- Designed dynamic frontend components with React.js.`;
    const mockFile = new File([mockContent], "sample_resume.txt", { type: "text/plain" });
    
    const formData = new FormData();
    formData.append('file', mockFile);

    try {
      const res = await fetch(`${API_BASE_URL}/api/resume/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setResumeData(data);
      
      // Fetch recommendations
      const recsRes = await fetch(`${API_BASE_URL}/api/resume/recommendations/${data.id}`);
      const recsData = await recsRes.json();
      setRecommendations(recsData);
      
      setUploading(false);
      setShowRecs(true);
    } catch (err) {
      console.error('Error autofilling resume:', err);
      setUploading(false);
    }
  };

  const handleStartInterviewWithCustom = () => {
    if (resumeData && resumeData.custom_questions) {
      setCustomQuestionsPool(resumeData.custom_questions);
      setView('interview');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div>
        <h1 className="text-gradient" style={{ fontSize: '32px', marginBottom: '8px' }}>Resume Intelligence</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Upload your resume to extract skills, match against our 1.6M Job Descriptions dataset, and get tailored questions.</p>
      </div>

      <div className="grid-2">
        {/* Left: Upload box */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '18px' }}>Upload Resume</h3>
          
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ 
              border: '2px dashed var(--glass-border)', 
              borderRadius: 'var(--border-radius-lg)', 
              padding: '40px 20px', 
              textAlign: 'center',
              background: 'rgba(0,0,0,0.2)',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
            onClick={() => document.getElementById('resume-file').click()}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
            >
              <input 
                type="file" 
                id="resume-file" 
                accept=".pdf,.txt" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
              <Upload size={36} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                {file ? file.name : 'Select PDF or Text Resume'}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Maximum size 10MB. Text format recommended.
              </p>
            </div>
            
            <button 
              type="button" 
              className="btn-secondary" 
              style={{ justifyContent: 'center', background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--glass-border)', padding: '12px' }}
              onClick={handleAutofillSampleResume}
              disabled={uploading}
            >
              Autofill Sample Resume (Testing)
            </button>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ justifyContent: 'center' }} 
              disabled={!file || uploading}
            >
              {uploading ? 'Processing & Matching...' : 'Upload & Analyze Resume'}
            </button>
          </form>

          {resumeData && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Extracted Skills ({resumeData.parsed_skills.length})</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {resumeData.parsed_skills.map((skill, index) => (
                    <span 
                      key={index} 
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.1) 100%)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        color: 'var(--text-primary)',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Job Recommendations & Actions */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '18px' }}>Interactive Mock Options</h3>
          
          {resumeData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
              <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(14,165,233,0.01) 100%)', borderColor: 'rgba(16,185,129,0.15)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />
                  <span style={{ fontWeight: '700', fontSize: '16px' }}>Resume Successfully Parsed</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
                  We matched you as a strong fit for **{resumeData.matched_job_title}** (Match Score: **{resumeData.job_match_score}%**). We've generated tailored technical questions focusing on your skills.
                </p>
              </div>

              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px' }} onClick={handleStartInterviewWithCustom}>
                <Play size={18} fill="#fff" />
                Start Tailored Interview
              </button>
              
              <div style={{ marginTop: 'auto' }}>
                <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HelpCircle size={14} /> Included Skill-Questions Preview:
                </h4>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {resumeData.custom_questions.slice(0, 3).map((q, idx) => (
                    <li key={idx} style={{ listStyleType: 'decimal' }}>{q.question}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-muted)', padding: '40px 0' }}>
              <FileText size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ fontSize: '14px' }}>Analyze your resume to reveal job matches and custom questions.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations Cards list */}
      {showRecs && recommendations.length > 0 && (
        <div className="glass-card">
          <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Briefcase size={20} style={{ color: 'var(--accent-primary)' }} />
            Recruitment Dataset Fit Recommendations (Top 3 Matches out of 1.6M Job Descriptions)
          </h3>
          
          <div className="grid-3">
            {recommendations.slice(0, 3).map((rec, idx) => (
              <div key={idx} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(255,255,255,0.015)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>{rec.title}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{rec.role}</span>
                  </div>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '6px', 
                    fontSize: '12px', 
                    fontWeight: '800',
                    background: 'rgba(99,102,241,0.1)',
                    color: 'var(--accent-primary)'
                  }}>
                    {rec.score}% Fit
                  </span>
                </div>
                
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', flex: 1 }}>
                  {rec.description.length > 180 ? rec.description.slice(0, 180) + '...' : rec.description}
                </p>
                
                {rec.matching_skills.length > 0 && (
                  <div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600', color: 'var(--color-success)', marginBottom: '6px' }}>
                      <CheckCircle size={12} /> Matching Skills:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {rec.matching_skills.slice(0, 4).map((s, i) => (
                        <span key={i} style={{ fontSize: '10px', background: 'rgba(16,185,129,0.05)', color: 'var(--color-success)', padding: '2px 6px', borderRadius: '4px' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {rec.missing_skills.length > 0 && (
                  <div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600', color: 'var(--color-warning)', marginBottom: '6px' }}>
                      <AlertTriangle size={12} /> Missing Skills:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {rec.missing_skills.slice(0, 4).map((s, i) => (
                        <span key={i} style={{ fontSize: '10px', background: 'rgba(245,158,11,0.05)', color: 'var(--color-warning)', padding: '2px 6px', borderRadius: '4px' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
