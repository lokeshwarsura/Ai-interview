import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Award, Users, Mic, Video, Eye, Sparkles } from 'lucide-react';

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
    fetch('http://localhost:8000/api/dashboard/stats')
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
    </div>
  );
}
