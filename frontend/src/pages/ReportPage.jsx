import React, { useState, useEffect } from 'react';
import { Award, CheckCircle, AlertTriangle, Lightbulb, RefreshCw, BarChart2, MessageSquare, Video, Mic, ArrowLeft } from 'lucide-react';

export default function ReportPage({ sessionId, setView }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    
    fetch(`http://localhost:8000/api/interviews/report/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching report:', err);
        setLoading(false);
      });
  }, [sessionId]);

  const highlightFillers = (text) => {
    if (!text) return '';
    const fillers = ["like", "um", "uh", "you know", "so", "actually", "basically", "literally"];
    let words = text.split(/\s+/);
    return words.map((w, idx) => {
      // Remove punctuation for comparison
      const cleanW = w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
      if (fillers.includes(cleanW)) {
        return (
          <span 
            key={idx} 
            style={{ 
              background: 'rgba(239,68,68,0.15)', 
              color: 'var(--color-danger)', 
              padding: '2px 6px', 
              borderRadius: '4px',
              fontWeight: '700',
              border: '1px solid rgba(239,68,68,0.3)',
              margin: '0 2px',
              display: 'inline-block'
            }}
          >
            {w}
          </span>
        );
      }
      return w + ' ';
    });
  };

  const ScoreCircle = ({ value, label, size = 100, color = 'var(--accent-primary)' }) => {
    const radius = size * 0.38;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size}>
            <circle cx={size/2} cy={size/2} r={radius} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
            <circle
              cx={size/2}
              cy={size/2}
              r={radius}
              fill="transparent"
              stroke={color}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: `${size * 0.18}px`, fontWeight: '800', fontFamily: 'var(--font-display)' }}>
            {value.toFixed(0)}%
          </div>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}>Running Multimodal Evaluation...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Report Not Found</h2>
        <button className="btn-primary" onClick={() => setView('dashboard')}>Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button 
            className="btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '13px', marginBottom: '16px' }}
            onClick={() => setView('dashboard')}
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>
          <h1 className="text-gradient" style={{ fontSize: '32px', marginBottom: '4px' }}>Interview Feedback Report</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Candidate: <strong style={{ color: '#fff' }}>{report.candidate_name}</strong> | Role: {report.job_role}</p>
        </div>
        <button className="btn-primary" onClick={() => setView('interview')}>
          <RefreshCw size={14} />
          Retake Interview
        </button>
      </div>

      {/* Main performance grids */}
      <div className="grid-4 glass-card" style={{ padding: '30px 20px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(0, 0, 0, 0) 100%)' }}>
        <ScoreCircle value={report.overall_score} label="Overall Match" size={130} color="var(--accent-primary)" />
        <ScoreCircle value={report.technical_score} label="Technical Depth" size={130} color="var(--color-success)" />
        <ScoreCircle value={report.communication_score} label="Communication" size={130} color="var(--color-info)" />
        <ScoreCircle value={report.confidence_score} label="Confidence Level" size={130} color="var(--accent-secondary)" />
      </div>

      {/* Grid: Personality & Physical parameters */}
      <div className="grid-2">
        {/* Left: Big Five */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} style={{ color: 'var(--accent-primary)' }} />
            Big Five Personality Traits (ML Annotations Correlation)
          </h3>
          
          <div className="trait-bar-container">
            {[
              { name: 'Extraversion', value: report.extraversion, desc: 'Expressiveness & enthusiasm' },
              { name: 'Openness', value: report.openness, desc: 'Intellectual depth & vocabulary' },
              { name: 'Conscientiousness', value: report.conscientiousness, desc: 'Fluency & structured reasoning' },
              { name: 'Agreeableness', value: report.agreeableness, desc: 'Warmth & camera smiles' },
              { name: 'Neuroticism', value: report.neuroticism, desc: 'Speech stress indicators' },
            ].map((t, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="trait-bar-row">
                  <span className="trait-name" style={{ fontWeight: '600' }}>{t.name}</span>
                  <div className="trait-bar-outer">
                    <div className="trait-bar-inner" style={{ width: `${t.value}%` }}></div>
                  </div>
                  <span className="trait-value">{t.value.toFixed(0)}%</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '156px' }}>{t.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Audio-video physical parameter breakdowns */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={18} style={{ color: 'var(--color-info)' }} />
            Audiovisual Physical Parameters
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', height: '100%' }}>
            
            <div className="glass-card" style={{ padding: '16px', background: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Eye Contact Rate</span>
              <span style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0', color: 'var(--color-success)' }}>{report.eye_contact_ratio.toFixed(0)}%</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Steady focus on webcam lens</span>
            </div>

            <div className="glass-card" style={{ padding: '16px', background: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Smile & Friendliness</span>
              <span style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0', color: 'var(--accent-secondary)' }}>{report.smile_rate.toFixed(0)}%</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Facial openness & energy</span>
            </div>

            <div className="glass-card" style={{ padding: '16px', background: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Vocal Volume confidence</span>
              <span style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0', color: 'var(--accent-primary)' }}>{report.vocal_confidence.toFixed(0)}%</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Audio signal energy level</span>
            </div>

            <div className="glass-card" style={{ padding: '16px', background: 'rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Filler Frequency</span>
              <span style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0', color: report.filler_word_count > 4 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                {report.filler_word_count} words
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Uh/Um/Like counts in answers</span>
            </div>

          </div>
        </div>
      </div>

      {/* Grid: Strengths, Weaknesses, and Improvement Tips */}
      <div className="grid-3">
        {/* Strengths */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--color-success)', background: 'linear-gradient(90deg, rgba(16,185,129,0.03) 0%, transparent 100%)' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--color-success)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} />
            Candidate Strengths
          </h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {report.strengths.map((str, idx) => (
              <li key={idx} style={{ listStyleType: 'disc' }}>{str}</li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--color-danger)', background: 'linear-gradient(90deg, rgba(239,68,68,0.03) 0%, transparent 100%)' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--color-danger)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            Identified Weaknesses
          </h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {report.weaknesses.map((weak, idx) => (
              <li key={idx} style={{ listStyleType: 'disc' }}>{weak}</li>
            ))}
          </ul>
        </div>

        {/* Actionable Suggestions */}
        <div className="glass-card" style={{ borderLeft: '4px solid var(--color-info)', background: 'linear-gradient(90deg, rgba(14,165,233,0.03) 0%, transparent 100%)' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--color-info)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lightbulb size={18} />
            AI Actionable Suggestions
          </h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {report.improvement_tips.map((tip, idx) => (
              <li key={idx} style={{ listStyleType: 'disc' }}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Answer-by-Answer Detailed Verbatim highlight breakdown */}
      <div className="glass-card">
        <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={18} style={{ color: 'var(--accent-primary)' }} />
          Verbal Evaluation & Filler Word Highlighting
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {report.responses.map((resp, index) => (
            <div key={index} style={{ borderBottom: index < report.responses.length - 1 ? '1px solid var(--glass-border)' : 'none', paddingBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-secondary)' }}>Q{index+1}. {resp.category} Question</span>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', fontWeight: '600' }}>
                  <span style={{ color: 'var(--color-success)' }}>Relevance: {resp.relevance_score.toFixed(0)}%</span>
                  <span style={{ color: 'var(--color-info)' }}>Fluency: {resp.confidence_score.toFixed(0)}%</span>
                  <span style={{ color: 'var(--color-warning)' }}>Fillers: {resp.filler_count}</span>
                  <span style={{ color: '#fff', textTransform: 'capitalize' }}>Emotion: {resp.dominant_emotion}</span>
                </div>
              </div>
              
              <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '6px', borderLeft: '2px solid var(--accent-primary)' }}>
                {resp.question_text}
              </p>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Ideal Technical Answer Benchmark:</span>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'rgba(16,185,129,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.1)', lineHeight: '1.6' }}>
                  {resp.ideal_answer}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Your Spoken Answer Transcript (fillers colored in red):</span>
                <div style={{ fontSize: '13px', color: '#fff', background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '8px', border: '1px solid var(--glass-border)', lineHeight: '1.7' }}>
                  {highlightFillers(resp.candidate_transcript)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
