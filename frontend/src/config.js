const savedUrl = localStorage.getItem('VITE_API_URL');
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
export const API_BASE_URL = savedUrl || import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:8000' : 'https://ai-interview-ldm8.onrender.com');
