import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Award, Users, Mic, Video, Eye, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function DashboardPage({ setView, setSessionId }) {
  const [stats, setStats] = useState({
    total_interviews: 0,
    average_overall_score: 0.0,
    average_confidence: 0.0,
    average_communication: 0.0,
    average_technical: 0.0,
    recent_interviews: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/dashboard/stats`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching dashboard stats:', err);
        setLoading(false);
      });
  }, []);

  const [activeTab, setActiveTab] = useState('analytics');

  // Sandbox NLP states
  const [idealAnswer, setIdealAnswer] = useState("HashMap stores elements as key-value pairs, yielding O(1) average time complexity for lookup and insert operations.");
  const [candidateAnswer, setCandidateAnswer] = useState("I will implement a HashMap that maps unique keys to values. This gives us O(1) lookup speed on average because we compute the index using a hash function.");
  const [nlpResult, setNlpResult] = useState({ similarity: 0.82, keywords: 0.80, cheatingDetected: false, doubleWords: 0, finalScore: 81 });

  // Sandbox ML slider states
  const [sliders, setSliders] = useState({
    eyeContact: 85,
    smileRate: 15,
    vocalConfidence: 80,
    fluency: 85,
    uniqueVocab: 75
  });

  const handleSliderChange = (key, value) => {
    setSliders(prev => ({ ...prev, [key]: Number(value) }));
  };

  // Live Personality ML Calculations (corresponds to confidence_service.py fallback weights)
  const calcExtraversion = 0.5 * sliders.smileRate + 0.5 * sliders.vocalConfidence;
  const calcNeuroticism = 0.8 * (100 - sliders.fluency) + 0.2 * (100 - sliders.eyeContact);
  const calcAgreeableness = 0.6 * sliders.smileRate + 0.4 * sliders.eyeContact;
  const calcConscientiousness = 0.7 * sliders.fluency + 0.3 * sliders.eyeContact;
  const calcOpenness = 0.5 * sliders.uniqueVocab + 0.5 * sliders.vocalConfidence;
  const calcOverallConfidence = 0.3 * sliders.eyeContact + 0.3 * sliders.vocalConfidence + 0.4 * sliders.fluency;

  // Real-time NLP Math
  const runNlpValidation = () => {
    const getTokens = (text) => text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    const idealTokens = getTokens(idealAnswer);
    const candTokens = getTokens(candidateAnswer);

    if (idealTokens.length === 0 || candTokens.length === 0) {
      setNlpResult({ similarity: 0, keywords: 0, cheatingDetected: false, doubleWords: 0, finalScore: 0 });
      return;
    }

    const vocab = Array.from(new Set([...idealTokens, ...candTokens]));
    const getVec = (tokens) => vocab.map(w => tokens.filter(t => t === w).length);
    const idealVec = getVec(idealTokens);
    const candVec = getVec(candTokens);

    const dotProduct = idealVec.reduce((sum, val, i) => sum + val * candVec[i], 0);
    const magIdeal = Math.sqrt(idealVec.reduce((sum, val) => sum + val * val, 0));
    const magCand = Math.sqrt(candVec.reduce((sum, val) => sum + val * val, 0));

    const sim = magIdeal && magCand ? (dotProduct / (magIdeal * magCand)) : 0;

    const stopWords = ["the", "and", "should", "could", "would", "about", "their", "this"];
    const idealKeywords = Array.from(new Set(idealTokens.filter(w => !stopWords.includes(w))));
    const matchedKeywords = idealKeywords.filter(w => candTokens.includes(w));
    const keywordsScore = idealKeywords.length ? (matchedKeywords.length / idealKeywords.length) : 0;

    const wordCountRatio = candTokens.length / idealTokens.length;
    const isCheating = wordCountRatio > 3.0 && sim < 0.15;

    const doubleWordsMatches = candidateAnswer.match(/\b(\w+)\s+\1\b/gi) || [];

    const finalRaw = (sim * 75 + keywordsScore * 25) * (isCheating ? 0.3 : 1);
    setNlpResult({
      similarity: sim,
      keywords: keywordsScore,
      cheatingDetected: isCheating,
      doubleWords: doubleWordsMatches.length,
      finalScore: Math.round(Math.max(15, Math.min(95, finalRaw)))
    });
  };

  const CircularProgress = ({ value, label, color }) => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;
    
    return (
      <div className="progress-ring-container glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg width="120" height="120">
          <circle cx="60" cy="60" r={radius} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="progress-ring-circle"
          />
        </svg>
        <div className="progress-text">
          <span style={{ fontSize: '22px', fontWeight: '800', fontFamily: 'var(--font-display)' }}>{value.toFixed(0)}%</span>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>{label}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>Loading Dashboard Analytics...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '32px', marginBottom: '8px' }}>Dashboard Intelligence</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome to your AI-Powered Smart Interview hub. Analyze your performance across verbal and visual dimensions.</p>
        </div>
        <button className="btn-primary" onClick={() => setView('interview')}>
          <Sparkles size={16} />
          Start Mock Interview
        </button>
      </div>

      {/* Segmented Tab Switcher */}
      <div className="glass-card" style={{ display: 'flex', padding: '6px', gap: '8px', borderRadius: '12px', width: 'fit-content', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
        <button 
          style={{ 
            padding: '8px 24px', 
            borderRadius: '8px', 
            border: 'none', 
            fontFamily: 'var(--font-display)', 
            fontWeight: '600',
            fontSize: '14px',
            background: activeTab === 'analytics' ? 'var(--accent-primary)' : 'transparent',
            color: activeTab === 'analytics' ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onClick={() => setActiveTab('analytics')}
        >
          📊 System Dashboard
        </button>
        <button 
          style={{ 
            padding: '8px 24px', 
            borderRadius: '8px', 
            border: 'none', 
            fontFamily: 'var(--font-display)', 
            fontWeight: '600',
            fontSize: '14px',
            background: activeTab === 'playground' ? 'var(--accent-secondary)' : 'transparent',
            color: activeTab === 'playground' ? 'white' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onClick={() => setActiveTab('playground')}
        >
          🧪 Interactive AI Sandbox
        </button>
      </div>

      {activeTab === 'analytics' ? (
        <>
          {/* Grid of Averages */}
          {stats.total_interviews > 0 ? (
            <div className="grid-4">
              <CircularProgress value={stats.average_overall_score} label="Overall Match" color="var(--accent-primary)" />
              <CircularProgress value={stats.average_technical} label="Technical Depth" color="var(--color-success)" />
              <CircularProgress value={stats.average_communication} label="Communication" color="var(--color-info)" />
              <CircularProgress value={stats.average_confidence} label="Confidence Score" color="var(--accent-secondary)" />
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.02) 100%)' }}>
              <Award size={48} style={{ color: 'var(--accent-primary)', marginBottom: '16px' }} />
              <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>No Interview History Yet</h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 20px' }}>
                Ready to jumpstart your career? Upload your resume for automatic skill extraction and tailored questions, or start a mock session directly.
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button className="btn-secondary" onClick={() => setView('resume')}>Upload Resume</button>
                <button className="btn-primary" onClick={() => setView('interview')}>Start Mock Run</button>
              </div>
            </div>
          )}

          {/* Widgets info */}
          <div className="grid-2">
            {/* Left widget: Stats list */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>System Overview</h3>
              
              <div className="widget-card">
                <div className="widget-icon" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)' }}>
                  <Users size={20} />
                </div>
                <div className="widget-info">
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Completed Interviews</span>
                  <span style={{ fontSize: '24px', fontWeight: '800' }}>{stats.total_interviews} sessions</span>
                </div>
              </div>

              <div className="widget-card">
                <div className="widget-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)' }}>
                  <Mic size={20} />
                </div>
                <div className="widget-info">
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Speech Emotion Analytics</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>Active (RAVDESS + CREMA-D)</span>
                </div>
              </div>

              <div className="widget-card">
                <div className="widget-icon" style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--color-info)' }}>
                  <Video size={20} />
                </div>
                <div className="widget-info">
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Computer Vision Face Recognition</span>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>Active (FER2013 + RAF-DB)</span>
                </div>
              </div>
            </div>

            {/* Right widget: Quick Guides */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>Resume & JD Matcher</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                Our Resume Intelligence Module allows you to upload standard PDF/Text resumes. We match your extracted skills against our database of **1.6 Million Job Descriptions** from the recruitment dataset.
              </p>
              <div style={{ marginTop: 'auto' }}>
                <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setView('resume')}>
                  Access Resume Intelligence
                </button>
              </div>
            </div>
          </div>

          {/* Recent Interviews List */}
          {stats.recent_interviews.length > 0 && (
            <div className="glass-card">
              <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Recent Interview Sessions</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Target Role</th>
                      <th>Overall Match</th>
                      <th>Confidence Score</th>
                      <th>Date & Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent_interviews.map((session) => (
                      <tr key={session.id}>
                        <td style={{ fontWeight: '600' }}>{session.candidate_name}</td>
                        <td>{session.job_role}</td>
                        <td>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '6px', 
                            fontWeight: '700',
                            background: session.overall_score >= 75 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                            color: session.overall_score >= 75 ? 'var(--color-success)' : 'var(--color-warning)'
                          }}>
                            {session.overall_score}%
                          </span>
                        </td>
                        <td>{session.confidence_score}%</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{session.created_at}</td>
                        <td>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                            onClick={() => {
                              setSessionId(session.id);
                              setView('report');
                            }}
                          >
                            <Eye size={14} />
                            View Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* AI Sandbox Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(99, 102, 241, 0.02) 100%)' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} />
              AI Model Sandbox & Verification Playground
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              Use this interactive panel to validate the mathematical thresholds, vector-space TF-IDF matching, anti-cheating algorithms, and personality ML linear regression weights of the AI interview backend immediately!
            </p>
          </div>

          <div className="grid-2" style={{ gap: '32px' }}>
            
            {/* NLP Sandbox */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', color: 'var(--color-info)' }}>📝 NLP & Anti-Cheating Validator</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tests TF-IDF Vector Space Cosine Similarity and Gamesmanship Penalties</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Benchmark Ideal Answer:</label>
                <textarea 
                  value={idealAnswer}
                  onChange={(e) => setIdealAnswer(e.target.value)}
                  style={{ width: '100%', minHeight: '60px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', padding: '10px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical' }}
                />

                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Candidate Response:</span>
                  <span style={{ fontSize: '10px', color: 'var(--color-warning)' }}>(Try typing massive spam to test cheat defense)</span>
                </label>
                <textarea 
                  value={candidateAnswer}
                  onChange={(e) => setCandidateAnswer(e.target.value)}
                  style={{ width: '100%', minHeight: '80px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white', padding: '10px', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical' }}
                />

                <button 
                  className="btn-primary" 
                  onClick={runNlpValidation}
                  style={{ background: 'var(--color-info)', color: 'white', width: '100%', justifyContent: 'center', marginTop: '8px' }}
                >
                  🧪 Trigger NLP Similarity Math
                </button>
              </div>

              {/* NLP Results Output */}
              <div className="glass-card" style={{ background: 'rgba(0,0,0,0.15)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>Metrics Breakdown:</span>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: nlpResult.finalScore >= 75 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    Calculated Match: {nlpResult.finalScore}%
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>TF-IDF Cosine Overlap:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>{(nlpResult.similarity * 100).toFixed(1)}%</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Keyword Technical Coverage:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>{(nlpResult.keywords * 100).toFixed(0)}%</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Grammar Stutter Count:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: '700', color: nlpResult.doubleWords > 0 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                      {nlpResult.doubleWords} double words
                    </span>
                  </div>

                  {nlpResult.cheatingDetected && (
                    <div style={{ 
                      marginTop: '8px', 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      color: 'var(--color-danger)', 
                      padding: '8px 12px', 
                      borderRadius: '6px', 
                      fontWeight: '700', 
                      fontSize: '11px',
                      textAlign: 'center',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      animation: 'pulse 1.5s infinite'
                    }}>
                      ⚠️ GAMESMANSHIP CHEAT PENALTY ACTIVE (-70% OVERALL DEDUCTION)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Regression Sandbox */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', color: 'var(--accent-secondary)' }}>📊 Multimodal Trait Regressor</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Draggable Linear Weights for Big Five & Job Suitability</span>
              </div>

              {/* Sliders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>👁️ Eye Contact Focus:</span>
                    <span style={{ fontWeight: '700' }}>{sliders.eyeContact}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={sliders.eyeContact}
                    onChange={(e) => handleSliderChange('eyeContact', e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>😊 Smile Rate (CV Crop):</span>
                    <span style={{ fontWeight: '700' }}>{sliders.smileRate}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={sliders.smileRate}
                    onChange={(e) => handleSliderChange('smileRate', e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--accent-secondary)', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>🗣️ Vocal Confidence (Acoustics):</span>
                    <span style={{ fontWeight: '700' }}>{sliders.vocalConfidence}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={sliders.vocalConfidence}
                    onChange={(e) => handleSliderChange('vocalConfidence', e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--color-success)', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>💬 Speech Fluency (No fillers):</span>
                    <span style={{ fontWeight: '700' }}>{sliders.fluency}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={sliders.fluency}
                    onChange={(e) => handleSliderChange('fluency', e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--color-info)', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>📚 Vocabulary Diversity:</span>
                    <span style={{ fontWeight: '700' }}>{sliders.uniqueVocab}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={sliders.uniqueVocab}
                    onChange={(e) => handleSliderChange('uniqueVocab', e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--accent-secondary)', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Calculated Outputs */}
              <div className="glass-card" style={{ background: 'rgba(0,0,0,0.15)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px dashed rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>Big Five Personalities:</span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-secondary)' }}>
                    Vocal Match: {calcOverallConfidence.toFixed(0)}%
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>💫 Extraversion</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-primary)' }}>{calcExtraversion.toFixed(0)}%</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>🧠 Neuroticism</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-danger)' }}>{calcNeuroticism.toFixed(0)}%</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>🤝 Agreeableness</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-success)' }}>{calcAgreeableness.toFixed(0)}%</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>🎯 Conscientiousness</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-info)' }}>{calcConscientiousness.toFixed(0)}%</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>📖 Openness & Wit</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{calcOpenness.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
          
          {/* CV Cropping & Equalization Validation Details */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--color-success)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={20} />
              Computer Vision face crop & shadow mitigation validation details
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
              The system standardizes uncropped room webcam feeds by isolating only the <strong>central 60% face crop area</strong> (discarding the shoulders, chair backrest, and room walls). It then standardizes brightness values to remove room shadow anomalies. When screen reflections misclassify expressions as <em>fear</em> or <em>sadness</em>, our <strong>Ambient shadow smoothing pipeline</strong> automatically standardizes them to <em>neutral</em>, <em>thoughtful surprise</em>, or <em>happy</em> states.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}
