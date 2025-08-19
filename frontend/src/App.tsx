import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import ChatApp from './components/ChatApp';
import './App.css';

interface User {
  username: string;
  token: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('auth_token');
    const username = localStorage.getItem('auth_username');

    if (token && username) {
      // Validate token
      validateToken(token, username);
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async (token: string, username: string) => {
    try {
      const response = await fetch('/otp_demo.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'validate_token',
          token: token
        })
      });

      const data = await response.json();

      if (data.valid) {
        setUser({ username, token });
        // If already logged in, redirect to chat
        window.location.href = 'http://localhost:8080';
      } else {
        // Clear invalid session
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_username');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_username');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (token: string, username: string) => {
    // Save session
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_username', username);
    setUser({ username, token });

    // Redirect to existing chat application on port 8080
    window.location.href = 'http://localhost:8080';
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_username');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {user ? (
        <ChatApp user={user} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default App;
