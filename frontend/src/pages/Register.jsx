import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PasswordInput from '../components/PasswordInput';
import { UserPlus, Mail, User, MapPin, Navigation, Car } from 'lucide-react';

const Register = () => {
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [lat, setLat]       = useState('27.6850');
  const [lng, setLng]       = useState('85.3200');
  const [submitting, setSubmitting] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate     = useNavigate();

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      addToast('Geolocation not supported by this browser', 'error');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        addToast('GPS coordinates captured!', 'success');
        setGpsLoading(false);
      },
      () => {
        addToast('Could not retrieve location. Using defaults.', 'error');
        setGpsLoading(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      addToast('Please fill in all fields', 'error');
      return;
    }
    if (password.length < 8) {
      addToast('Password must be at least 8 characters', 'error');
      return;
    }
    setSubmitting(true);
    const result = await register(name, email, password, 'user', Number(lat), Number(lng));
    setSubmitting(false);
    if (result.success) {
      addToast('Account created successfully!', 'success');
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
      padding: '48px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'absolute', top: '-100px', left: '-80px',
        width: '420px', height: '420px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 70%)',
        filter: 'blur(70px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-80px', right: '-60px',
        width: '360px', height: '360px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '480px', position: 'relative', zIndex: 1 }}>
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
            Create Account
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Join to rent vehicles and find nearby branches
          </p>
        </div>

        {/* Card */}
        <div className="auth-card">
          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label htmlFor="name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={11} /> Full Name
              </label>
              <input
                type="text"
                id="name"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            {/* Email */}
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

            {/* Password */}
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="Minimum 8 characters"
            />

            {/* Location Box */}
            <div style={{
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.18)',
              borderRadius: 'var(--radius-md)',
              padding: '18px',
              marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <div style={{
                  width: '28px', height: '28px',
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  borderRadius: '7px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MapPin size={14} color="var(--text-accent)" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                    Location Coordinates
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Used to find your nearest rental branch
                  </p>
                </div>
              </div>

              <div className="grid-cols-2" style={{ gap: '12px' }}>
                <div>
                  <label htmlFor="lat">Latitude</label>
                  <input
                    type="number"
                    id="lat"
                    step="0.000001"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    style={{ marginBottom: 0 }}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lng">Longitude</label>
                  <input
                    type="number"
                    id="lng"
                    step="0.000001"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    style={{ marginBottom: 0 }}
                    required
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '12px', padding: '10px', gap: '7px', fontSize: '0.8rem' }}
                disabled={gpsLoading}
              >
                {gpsLoading
                  ? <><span className="spin-icon" style={{ display: 'inline-block', width: '13px', height: '13px', border: '2px solid var(--border-strong)', borderTopColor: 'var(--text-primary)', borderRadius: '50%' }} /> Fetching...</>
                  : <><Navigation size={14} /> Use My GPS Location</>
                }
              </button>
            </div>

            <button
              type="submit"
              className="btn"
              style={{ width: '100%', padding: '14px' }}
              disabled={submitting}
            >
              {submitting
                ? <><span className="spin-icon" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} /> Creating account...</>
                : <><UserPlus size={16} /> Create Account</>
              }
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.88rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
            <Link
              to="/login"
              style={{
                fontWeight: 700, color: 'var(--text-accent)',
                borderBottom: '1px solid rgba(99,102,241,0.4)',
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
