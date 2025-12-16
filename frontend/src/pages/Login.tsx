import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';

interface LoginProps {
  setIsAuthenticated: (value: boolean) => void;
}

export default function Login({ setIsAuthenticated }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiService.login({ username, password });
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setIsAuthenticated(true);
      navigate('/');
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center', color: '#333' }}>
          Login to Admin Portal
        </h2>
        {error && (
          <div style={{
            padding: '10px',
            background: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter username"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p style={{ marginTop: '20px', textAlign: 'center' }}>
          Don't have an account? <Link to="/register" style={{ color: '#007bff' }}>Register</Link>
        </p>
        <div style={{ marginTop: '20px', padding: '10px', background: '#f8f9fa', borderRadius: '4px', fontSize: '12px' }}>
          <strong>Demo Credentials:</strong><br />
          Username: Umakani<br />
          Password: test
        </div>
      </div>
    </div>
  );
}

