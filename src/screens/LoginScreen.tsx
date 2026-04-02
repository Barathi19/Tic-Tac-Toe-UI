import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { nakamaClient, nakamaState, Session } from '../nakama';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Auto login if already valid
    const restoreSession = async () => {
      const stored = localStorage.getItem('nakama_auth_token');
      const refresh = localStorage.getItem('nakama_refresh_token') || "";
      if (stored) {
        try {
          const session = Session.restore(stored, refresh);
          const currentTime = Math.floor(new Date().getTime() / 1000);
          if (!session.isexpired(currentTime)) {
              nakamaState.session = session;
              navigate('/', { replace: true });
          }
        } catch (e) {
            console.error("Failed to restore session", e);
        }
      }
    };
    restoreSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please choose a username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use a persistent random device ID from localStorage to ensure uniqueness
      // even if two players choose the same username.
      let deviceId = localStorage.getItem('nakama_device_id');
      if (!deviceId) {
          deviceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          localStorage.setItem('nakama_device_id', deviceId);
      }
      
      // Authenticate with unique Device ID ONLY to avoid username uniqueness conflicts.
      // We set the chosen name as a 'Display Name' which Nakama allows to be non-unique.
      const session = await nakamaClient.authenticateDevice(deviceId, true);
      await nakamaClient.updateAccount(session, { display_name: username });
      localStorage.setItem('nakama_auth_token', session.token);
      localStorage.setItem('nakama_refresh_token', session.refresh_token);
      nakamaState.session = session;
      navigate('/');
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ background: "radial-gradient(circle at top right, rgba(59,130,246,0.1), transparent 400px), radial-gradient(circle at bottom left, rgba(236,72,153,0.1), transparent 400px)" }}>
      <h1 className="title">Tic-Tac-Toe</h1>
      <div className="card" style={{ animation: "fadeUp 0.5s ease-out" }}>
        <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Join the Battle</h2>
        
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter a username..." 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              maxLength={20}
            />
          </div>
          
          {error && <div style={{ color: "var(--accent-color)", fontSize: "0.875rem", textAlign: "center" }}>{error}</div>}
          
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <div className="loader" /> : <><LogIn size={20} /> Play Now</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
