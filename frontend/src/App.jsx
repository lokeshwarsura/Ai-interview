import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Sparkles, Brain, Award } from 'lucide-react';
import DashboardPage from './pages/DashboardPage';
import ResumePage from './pages/ResumePage';
import InterviewPage from './pages/InterviewPage';
import ReportPage from './pages/ReportPage';
import { API_BASE_URL } from './config';

export default function App() {
  const [view, setView] = useState('dashboard');
  const [sessionId, setSessionId] = useState(null);
  const [customQuestionsPool, setCustomQuestionsPool] = useState([]);
  const [apiConnected, setApiConnected] = useState(false);

  useEffect(() => {
    // Quick ping to check API connection
    fetch(`${API_BASE_URL}/api/dashboard/stats`)
      .then((res) => {
        if (res.ok) setApiConnected(true);
      })
      .catch(() => setApiConnected(false));
  }, []);

  return (
    <div className="app-container">
      
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 0 15px rgba(99,102,241,0.4)' }}>
            <Brain size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', lineHeight: '1.1' }}>Smart Interview</h2>
            <span style={{ fontSize: '10px', color: 'var(--accent-secondary)', fontWeight: '700', letterSpacing: '0.05em' }}>MULTIMODAL AI v1.0</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--border-radius-md)',
              border: 'none',
              background: view === 'dashboard' ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: view === 'dashboard' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'var(--transition-smooth)'
            }}
            onClick={() => setView('dashboard')}
          >
            <LayoutDashboard size={18} style={{ color: view === 'dashboard' ? 'var(--accent-primary)' : 'inherit' }} />
            Dashboard
          </button>

          <button 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--border-radius-md)',
              border: 'none',
              background: view === 'resume' ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: view === 'resume' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'var(--transition-smooth)'
            }}
            onClick={() => setView('resume')}
          >
            <FileText size={18} style={{ color: view === 'resume' ? 'var(--accent-primary)' : 'inherit' }} />
            Resume Intelligence
          </button>

          <button 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--border-radius-md)',
              border: 'none',
              background: view === 'interview' ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: view === 'interview' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'var(--transition-smooth)'
            }}
            onClick={() => setView('interview')}
          >
            <Sparkles size={18} style={{ color: view === 'interview' ? 'var(--accent-primary)' : 'inherit' }} />
            Mock Interview
          </button>
        </nav>

        {/* Cloud API Connection & Override widget */}
        <div style={{ 
          marginTop: 'auto', 
          marginBottom: '15px', 
          padding: '12px', 
          borderRadius: '8px', 
          background: 'rgba(255,255,255,0.02)', 
          border: '1px solid var(--glass-border)', 
          fontSize: '11px',
          fontFamily: 'var(--font-display)' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>🔌 Cloud API status</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: apiConnected ? 'var(--color-success)' : 'var(--color-warning)', display: 'inline-block' }}></span>
              <span style={{ fontSize: '9px', fontWeight: '700', color: apiConnected ? 'var(--color-success)' : 'var(--color-warning)' }}>
                {apiConnected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>
          <div style={{ wordBreak: 'break-all', fontSize: '9px', color: 'var(--text-muted)', marginBottom: '8px', fontFamily: 'monospace' }}>
            {API_BASE_URL}
          </div>
          <button 
            style={{ 
              width: '100%', 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid var(--glass-border)', 
              borderRadius: '6px', 
              color: 'white', 
              padding: '6px', 
              fontSize: '10px', 
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onClick={() => {
              const newUrl = prompt("Enter your live Render backend API URL (or leave blank and press OK to reset to default):", API_BASE_URL);
              if (newUrl !== null) {
                if (newUrl.trim() === '') {
                  localStorage.removeItem('VITE_API_URL');
                } else {
                  localStorage.setItem('VITE_API_URL', newUrl.trim().replace(/\/$/, ''));
                }
                window.location.reload();
              }
            }}
          >
            Configure Live URL
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={16} style={{ color: 'var(--accent-secondary)' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '600' }}>Active Node Session</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>localhost:3000</div>
          </div>
        </div>
      </aside>

      {/* Main Panel View Area */}
      <main className="main-content">
        {view === 'dashboard' && (
          <DashboardPage setView={setView} setSessionId={setSessionId} />
        )}
        {view === 'resume' && (
          <ResumePage setView={setView} setCustomQuestionsPool={setCustomQuestionsPool} />
        )}
        {view === 'interview' && (
          <InterviewPage 
            setView={setView} 
            setSessionId={setSessionId} 
            customQuestionsPool={customQuestionsPool}
            setCustomQuestionsPool={setCustomQuestionsPool}
          />
        )}
        {view === 'report' && (
          <ReportPage sessionId={sessionId} setView={setView} />
        )}
      </main>
    </div>
  );
}
