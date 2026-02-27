import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * LoginForm
 * Handles both login and registration in one component.
 * Uses AuthContext which calls the real Spring Boot backend.
 */
function LoginForm({ onLoginSuccess }) {
  const { login, register } = useAuth();

  // Form fields
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [role, setRole] = useState('CUSTOMER');

  // UI state
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetMessages = () => {
    setMessage('');
    setIsError(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await login(email, password);

        if (result.success) {
          setMessage(`Welcome back, ${result.user.name}! (${result.user.role})`);
          setIsError(false);
          if (onLoginSuccess) {
            onLoginSuccess(result.user);
          }
        } else {
          setIsError(true);
          setMessage(result.message || 'Login failed. Please check your credentials.');
        }
      } else {
        // Register mode
        if (!name.trim()) {
          setIsError(true);
          setMessage('Full name is required.');
          setLoading(false);
          return;
        }
        if (phoneNumber.length !== 10 && phoneNumber.length > 0) {
          setIsError(true);
          setMessage('Phone number must be 10 digits.');
          setLoading(false);
          return;
        }

        const result = await register(name, email, password, role, phoneNumber, aadharNumber);

        if (result.success) {
          setIsError(false);
          setMessage('Registered successfully! Please log in with your new credentials.');
          setMode('login');
          setPassword('');
        } else {
          setIsError(true);
          setMessage(result.message || 'Registration failed.');
        }
      }
    } catch (err) {
      console.error(err);
      setIsError(true);
      setMessage('Server error. Make sure the backend is running on port 8081.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetMessages();
    setEmail('');
    setPassword('');
    setName('');
    setPhoneNumber('');
    setAadharNumber('');
  };

  return (
    <div
      style={{
        border: '1px solid #333',
        padding: '28px 24px',
        width: '340px',
        margin: '40px auto',
        backgroundColor: '#111',
        color: '#fff',
        borderRadius: '10px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
        fontFamily: 'Inter, Segoe UI, sans-serif',
      }}
    >
      <h2 style={{ marginBottom: '18px', fontSize: '1.4rem', fontWeight: 700, color: '#eee' }}>
        {mode === 'login' ? 'Sign In' : 'Create Account'}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Name — only on register */}
        {mode === 'register' && (
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              value={name}
              style={inputStyle}
              placeholder="e.g. John Doe"
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            style={inputStyle}
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={password}
            style={inputStyle}
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Extra fields only on register */}
        {mode === 'register' && (
          <>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Phone Number (10 digits)</label>
              <input
                type="tel"
                value={phoneNumber}
                style={inputStyle}
                placeholder="9876543210"
                maxLength={10}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={labelStyle}>Aadhar Number (12 digits)</label>
              <input
                type="text"
                value={aadharNumber}
                style={inputStyle}
                placeholder="123456789012"
                maxLength={12}
                onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Account Type</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="CUSTOMER">Customer</option>
                <option value="AGENT">Agent</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </>
        )}

        {/* Status message */}
        {message && (
          <p style={{ color: isError ? '#ff5555' : '#55ff88', marginBottom: '12px', fontSize: '0.88rem', whiteSpace: 'pre-wrap' }}>
            {message}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={buttonStyle}
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Register'}
        </button>
      </form>

      {/* Mode toggle */}
      <div style={{ marginTop: '16px', fontSize: '0.88rem', color: '#aaa' }}>
        {mode === 'login' ? (
          <span>
            Don&apos;t have an account?{' '}
            <button type="button" onClick={() => switchMode('register')} style={linkBtnStyle}>
              Register here
            </button>
          </span>
        ) : (
          <span>
            Already have an account?{' '}
            <button type="button" onClick={() => switchMode('login')} style={linkBtnStyle}>
              Sign in
            </button>
          </span>
        )}
      </div>

      {/* Demo credentials hint */}
      {mode === 'login' && (
        <div style={{ marginTop: '16px', fontSize: '0.78rem', color: '#666', borderTop: '1px solid #222', paddingTop: '12px' }}>
          <strong style={{ color: '#555' }}>Demo credentials:</strong>
          <br />Admin: admin@example.com / admin123
          <br />Agent: agent@example.com / agent123
          <br />Customer: john@example.com / customer123
        </div>
      )}
    </div>
  );
}

/* ---------- Shared styles ---------- */
const labelStyle = {
  display: 'block',
  marginBottom: '4px',
  fontSize: '0.85rem',
  color: '#bbb',
};

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  backgroundColor: '#1e1e1e',
  color: '#eee',
  border: '1px solid #333',
  borderRadius: '6px',
  fontSize: '0.95rem',
  boxSizing: 'border-box',
  outline: 'none',
};

const buttonStyle = {
  width: '100%',
  padding: '10px',
  backgroundColor: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.2s',
};

const linkBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#60a5fa',
  cursor: 'pointer',
  fontSize: '0.88rem',
  padding: 0,
  textDecoration: 'underline',
};

export default LoginForm;
