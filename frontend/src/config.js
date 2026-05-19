const savedUrl = localStorage.getItem('VITE_API_URL');
export const API_BASE_URL = savedUrl || import.meta.env.VITE_API_URL || 'http://localhost:8000';
