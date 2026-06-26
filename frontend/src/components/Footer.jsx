import React from 'react';
import { Link } from 'react-router-dom';
import { Car, MapPin, Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr 1fr',
          gap: '40px',
          marginBottom: '40px',
        }}>
          {/* Brand column */}
          <div>
            <Link to="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              fontFamily: 'var(--font-heading)', fontWeight: 900,
              fontSize: '1.2rem', letterSpacing: '-0.04em',
              marginBottom: '12px',
            }}>
              <div style={{
                width: '32px', height: '32px',
                background: 'var(--gradient-brand)',
                borderRadius: '9px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Car size={16} color="#fff" strokeWidth={2.5} />
              </div>
              <span style={{
                background: 'var(--gradient-brand)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                VEHICLE.RENT
              </span>
            </Link>
            <p style={{
              fontSize: '0.84rem',
              color: 'var(--text-muted)',
              lineHeight: 1.7,
              maxWidth: '260px',
            }}>
              Premium vehicle rental with dynamic pricing, smart recommendations, and real-time availability.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p style={{
              fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '14px',
            }}>
              Navigation
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
              {[
                { to: '/', label: 'Browse Vehicles' },
                { to: '/locations', label: 'Find Branches' },
                { to: '/login', label: 'Sign In' },
                { to: '/register', label: 'Register' },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  style={{
                    fontSize: '0.84rem',
                    color: 'var(--text-muted)',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={e => e.target.style.color = 'var(--text-secondary)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <p style={{
              fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '14px',
            }}>
              Info
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} /> Kathmandu, Nepal
              </span>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Dynamic Pricing Engine
              </span>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                GPS Branch Locator
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} Vehicle.Rent — All rights reserved.
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Built with ♥ in Nepal
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
