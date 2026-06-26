import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PasswordInput from '../components/PasswordInput';
import { LogIn, Mail, Car } from 'lucide-react';

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login }    = useAuth();
  const { addToast } = useToast();
  const navigate     = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please fill in all fields', 'error');
      return;
    }
    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);
    if (result.success) {
      addToast('Welcome back!', 'success');
      navigate('/');
    } else {
      addToast(result.message, 'error');
    }
  };

  return (
    <div style={{
      minHeight: '90vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'absolute', top: '-120px', right: '-80px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', left: '-60px',
        width: '350px', height: '350px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'var(--gradient-brand)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          }}>
            <Car size={26} color="#fff" strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '6px' }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Sign in to your account to continue
          </p>
        </div>

        {/* Card */}
        <div className="auth-card">
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={11} /> Email Address
              </label>
              <input
                type="email"
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              enforceMinLength={false}
              hint={null}
            />

            <button
              type="submit"
              className="btn"
              style={{ width: '100%', marginTop: '8px', padding: '14px' }}
              disabled={submitting}
            >
              {submitting
                ? <><span className="spin-icon" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Authenticating...</>
                : <><LogIn size={16} /> Sign In</>
              }
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.88rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Don't have an account? </span>
            <Link
              to="/register"
              style={{
                fontWeight: 700, color: 'var(--text-accent)',
                borderBottom: '1px solid rgba(99,102,241,0.4)',
              }}
            >
              Create one
            </Link>
          </div>


        </div>
      </div>
    </div>
  );
};

export default Login;
