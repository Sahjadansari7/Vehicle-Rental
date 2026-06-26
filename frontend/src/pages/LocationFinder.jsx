import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MapPin, Navigation, ArrowRight, Route, Search, Star, ChevronRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const LocationFinder = () => {
  const { user, updateUserLocation } = useAuth();
  const { addToast }  = useToast();
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();

  const rentVehicleId = searchParams.get('rentVehicleId');
  const pickupDate    = searchParams.get('pickupDate');
  const returnDate    = searchParams.get('returnDate');

  const [lat, setLat]           = useState(user?.latitude  || '27.6850');
  const [lng, setLng]           = useState(user?.longitude || '85.3200');
  const [branches, setBranches] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [calculating, setCalculating] = useState(false);

  const calculateNearestBranches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/locations?lat=${lat}&lng=${lng}`);
      if (res.data.success) setBranches(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to load branch locations', 'error');
    } finally {
      setLoading(false);
    }
  }, [lat, lng, addToast]);

  useEffect(() => { calculateNearestBranches(); }, [calculateNearestBranches]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      addToast('Geolocation not supported by this browser', 'error');
      return;
    }
    setCalculating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const browserLat = position.coords.latitude.toFixed(6);
        const browserLng = position.coords.longitude.toFixed(6);
        setLat(browserLat);
        setLng(browserLng);
        await updateUserLocation(browserLat, browserLng);
        addToast('GPS coordinates updated!', 'success');
        setCalculating(false);
      },
      () => {
        addToast('Could not fetch browser GPS location.', 'error');
        setCalculating(false);
      }
    );
  };

  const handleSelectBranch = (branchId) => {
    if (!rentVehicleId || !pickupDate || !returnDate) {
      addToast('Please go back and select a vehicle & dates first', 'error');
      navigate('/');
      return;
    }
    navigate(`/booking-checkout?vehicleId=${rentVehicleId}&pickupLocationId=${branchId}&pickupDate=${pickupDate}&returnDate=${returnDate}`);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Page header */}
      <div style={{
        padding: '56px 0 40px',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-80px', left: '-60px',
          width: '320px', height: '320px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <span className="section-label" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px',
            background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)',
            borderRadius: '999px', marginBottom: '12px', color: 'var(--accent-cyan)',
          }}>
            <MapPin size={11} /> Branch Locator
          </span>
          <h1 className="page-title" style={{ marginBottom: '8px' }}>Select Pickup Branch</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Enter your coordinates or use GPS to find the nearest branch.
          </p>
        </div>
      </div>

      <div className="container" style={{ marginTop: '40px' }}>

        {/* Coordinate input panel */}
        <div className="filter-panel" style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{
              width: '32px', height: '32px', background: 'var(--gradient-brand)',
              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Navigation size={16} color="#fff" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem' }}>Your Location</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Used to calculate distance to branches</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '16px', alignItems: 'end' }}>
            <div>
              <label>Latitude</label>
              <input
                type="number"
                step="0.000001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
            <div>
              <label>Longitude</label>
              <input
                type="number"
                step="0.000001"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>
            <button
              onClick={calculateNearestBranches}
              className="btn"
              style={{ whiteSpace: 'nowrap', padding: '13px 20px' }}
            >
              <Search size={14} /> Find Nearest
            </button>
            <button
              onClick={handleGetCurrentLocation}
              className="btn btn-secondary"
              style={{ whiteSpace: 'nowrap', padding: '13px 16px' }}
              disabled={calculating}
            >
              {calculating ? (
                <><span className="spin-icon" style={{ display: 'inline-block', width: '13px', height: '13px', border: '2px solid var(--border-strong)', borderTopColor: 'var(--text-primary)', borderRadius: '50%' }} /> Syncing...</>
              ) : (
                <><Navigation size={14} /> Use GPS</>
              )}
            </button>
          </div>
        </div>

        {/* Branch list */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{
            width: '32px', height: '32px', background: 'rgba(6,182,212,0.1)',
            border: '1px solid rgba(6,182,212,0.25)', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Route size={15} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <h2 style={{ fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
            Nearby Branches
            {!loading && (
              <span style={{
                marginLeft: '10px', display: 'inline-flex',
                padding: '2px 10px', borderRadius: '999px', fontSize: '0.72rem',
                fontWeight: 700, verticalAlign: 'middle',
                background: 'rgba(6,182,212,0.1)', color: 'var(--accent-cyan)',
                border: '1px solid rgba(6,182,212,0.25)',
              }}>
                {branches.length}
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
                padding: '24px', display: 'flex', gap: '20px', alignItems: 'center',
              }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="skeleton" style={{ height: '18px', width: '30%' }} />
                  <div className="skeleton" style={{ height: '14px', width: '55%' }} />
                  <div className="skeleton" style={{ height: '28px', width: '70%' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                  <div className="skeleton" style={{ height: '30px', width: '80px' }} />
                  <div className="skeleton" style={{ height: '40px', width: '130px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '72px 40px',
            background: 'var(--surface-1)', border: '1px dashed var(--border-default)',
            borderRadius: 'var(--radius-xl)',
          }}>
            <MapPin size={40} style={{ margin: '0 auto 16px', color: 'var(--text-muted)', opacity: 0.4 }} />
            <p style={{ fontWeight: 700, marginBottom: '8px' }}>No branches found</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No rental branches are configured in the system yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '60px' }}>
            {branches.map((branch, index) => {
              const isClosest = index === 0;
              return (
                <div
                  key={branch._id}
                  className="animate-fade-in-up"
                  style={{
                    animationDelay: `${index * 0.06}s`,
                    background: isClosest
                      ? 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(99,102,241,0.08) 100%)'
                      : 'var(--glass-bg)',
                    backdropFilter: 'var(--glass-blur)',
                    WebkitBackdropFilter: 'var(--glass-blur)',
                    border: `1px solid ${isClosest ? 'rgba(6,182,212,0.35)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '20px',
                    transition: 'box-shadow 0.2s ease',
                    position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  {isClosest && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                      background: 'linear-gradient(90deg, #22d3ee, #6366f1)',
                    }} />
                  )}

                  <div style={{ flex: 1, minWidth: '280px' }}>
                    {/* Name + badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '10px',
                        background: isClosest ? 'rgba(6,182,212,0.15)' : 'var(--surface-2)',
                        border: `1px solid ${isClosest ? 'rgba(6,182,212,0.3)' : 'var(--border-default)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <MapPin size={16} style={{ color: isClosest ? '#22d3ee' : 'var(--text-secondary)' }} />
                      </div>
                      <h3 style={{ fontSize: '1.1rem', letterSpacing: '-0.02em' }}>{branch.name}</h3>
                      {isClosest && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '3px 10px', borderRadius: '999px',
                          fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
                          background: 'rgba(6,182,212,0.12)', color: '#22d3ee',
                          border: '1px solid rgba(6,182,212,0.3)',
                        }}>
                          <Star size={10} fill="currentColor" /> Nearest
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                      {branch.latitude}, {branch.longitude}
                    </p>

                    {/* Routing path */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      {branch.routingPath.map((nodeName, idx) => (
                        <React.Fragment key={idx}>
                          {idx > 0 && (
                            <ChevronRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          )}
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '0.72rem', fontWeight: 600,
                            background: nodeName === branch.name ? 'rgba(99,102,241,0.15)' : 'var(--surface-1)',
                            border: `1px solid ${nodeName === branch.name ? 'rgba(99,102,241,0.3)' : 'var(--border-subtle)'}`,
                            color: nodeName === branch.name ? 'var(--text-accent)' : 'var(--text-secondary)',
                          }}>
                            {nodeName}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Distance + action */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>
                        Distance
                      </p>
                      <p style={{
                        fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.04em',
                        fontFamily: 'var(--font-heading)',
                        background: isClosest ? 'linear-gradient(to right, #22d3ee, #6366f1)' : 'var(--gradient-brand)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      }}>
                        {branch.distanceFromUser} km
                      </p>
                      <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        Direct: {branch.directDistance} km
                      </p>
                    </div>
                    <button
                      onClick={() => handleSelectBranch(branch._id)}
                      className="btn"
                      style={{ fontSize: '0.82rem', padding: '10px 18px' }}
                    >
                      {rentVehicleId ? 'Confirm Branch' : 'Select Branch'}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationFinder;
