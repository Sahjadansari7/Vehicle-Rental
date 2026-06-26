import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Search, Flame, Zap, HelpCircle, ArrowRight,
  Compass, Calendar, X, ChevronDown, Star, Fuel,
  Gauge, Tag, Loader2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${API_URL}/${cleanPath}`;
};

const typeColors = {
  Bike: { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.3)' },
  Car:  { bg: 'rgba(99,102,241,0.12)', text: '#a5b4fc', border: 'rgba(99,102,241,0.3)' },
  EV:   { bg: 'rgba(6,182,212,0.12)',  text: '#22d3ee', border: 'rgba(6,182,212,0.3)' },
  SUV:  { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
};

const TypeBadge = ({ type }) => {
  const colors = typeColors[type] || typeColors.Car;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px', borderRadius: '999px', fontSize: '0.7rem',
      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
      background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
    }}>
      {type}
    </span>
  );
};

const Home = () => {
  const [vehicles, setVehicles]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [pickupDate, setPickupDate]     = useState('');
  const [returnDate, setReturnDate]     = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [recLoading, setRecLoading]     = useState(false);

  const { user }     = useAuth();
  const { addToast } = useToast();
  const navigate     = useNavigate();

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/vehicles?`;
      if (searchTerm)               url += `search=${searchTerm}&`;
      if (selectedType)             url += `type=${selectedType}&`;
      if (pickupDate && returnDate) url += `pickupDate=${pickupDate}&returnDate=${returnDate}&`;
      const res = await axios.get(url);
      if (res.data.success) setVehicles(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to retrieve vehicles', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedType, pickupDate, returnDate, addToast]);

  const fetchRecommendation = useCallback(async () => {
    setRecLoading(true);
    try {
      let url = `${API_URL}/api/vehicles/recommend/optimal?`;
      if (selectedType)             url += `type=${selectedType}&`;
      if (pickupDate && returnDate) url += `pickupDate=${pickupDate}&returnDate=${returnDate}&`;
      const res = await axios.get(url);
      if (res.data.success && res.data.data) {
        setRecommendation(res.data.data.recommendation);
        setAlternatives(res.data.data.alternatives || []);
      } else {
        setRecommendation(null); setAlternatives([]);
      }
    } catch {
      setRecommendation(null); setAlternatives([]);
    } finally {
      setRecLoading(false);
    }
  }, [selectedType, pickupDate, returnDate]);

  useEffect(() => {
    fetchVehicles();
    fetchRecommendation();
  }, [fetchVehicles, fetchRecommendation]);

  const handleRentClick = (vehicleId) => {
    if (!user) {
      addToast('Please login to place a booking', 'error');
      navigate('/login');
      return;
    }
    if (!pickupDate || !returnDate) {
      addToast('Please select pickup and return dates first', 'error');
      window.scrollTo({ top: 200, behavior: 'smooth' });
      return;
    }
    navigate(`/locations?rentVehicleId=${vehicleId}&pickupDate=${pickupDate}&returnDate=${returnDate}`);
  };

  const handleClearDates = () => {
    setPickupDate(''); setReturnDate('');
    addToast('Date selection cleared', 'success');
  };

  const daysCount = (pickupDate && returnDate)
    ? Math.max(1, Math.ceil(Math.abs(new Date(returnDate) - new Date(pickupDate)) / 86400000))
    : 0;

  const vehicleTypes = [
    { value: '', label: 'All Vehicles', icon: '🚗' },
    { value: 'Bike', label: 'Bikes', icon: '🏍️' },
    { value: 'Car', label: 'Cars', icon: '🚘' },
    { value: 'EV', label: 'Electric', icon: '⚡' },
    { value: 'SUV', label: 'SUVs', icon: '🚙' },
  ];

  return (
    <div style={{ position: 'relative' }}>
      {/* ── HERO SECTION ─────────────────────────────── */}
      <div style={{
        position: 'relative',
        padding: '72px 0 56px',
        overflow: 'hidden',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {/* Background orbs */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '680px' }}>
            <div className="animate-fade-in-up" style={{ marginBottom: '16px' }}>
              <span className="section-label" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '5px 14px',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: '999px',
              }}>
                <Zap size={11} fill="currentColor" />
                Premium Vehicle Rental Platform
              </span>
            </div>

            <h1
              className="hero-title animate-fade-in-up delay-1"
              style={{ marginBottom: '20px' }}
            >
              Drive Your
              <br />
              <span className="text-gradient">Next Adventure.</span>
            </h1>

            <p
              className="animate-fade-in-up delay-2"
              style={{
                fontSize: '1.1rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                maxWidth: '520px',
                marginBottom: '36px',
              }}
            >
              Rent bikes, cars, EVs, and SUVs from nearby outlets. Get dynamic pricing, real-time availability, and smart recommendations.
            </p>

            {/* Quick stats */}
            <div className="animate-fade-in-up delay-3" style={{
              display: 'flex', gap: '28px', flexWrap: 'wrap',
            }}>
              {[
                { value: vehicles.length || '—', label: 'Vehicles Available' },
                { value: '4', label: 'Vehicle Classes' },
                { value: '24/7', label: 'Support' },
              ].map((s) => (
                <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{
                    fontFamily: 'var(--font-heading)', fontWeight: 800,
                    fontSize: '1.6rem', letterSpacing: '-0.04em',
                    background: 'var(--gradient-brand)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
                    {s.value}
                  </span>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '48px' }}>

        {/* ── FILTER PANEL ─────────────────────────────── */}
        <div className="filter-panel animate-fade-in-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
            <div style={{
              width: '32px', height: '32px',
              background: 'var(--gradient-brand)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Compass size={16} color="#fff" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem' }}>
                Search & Filter
              </p>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Set dates to unlock dynamic pricing
              </p>
            </div>
          </div>

          {/* Type selector pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {vehicleTypes.map((t) => (
              <button
                key={t.value}
                onClick={() => setSelectedType(t.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: `1px solid ${selectedType === t.value ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                  background: selectedType === t.value
                    ? 'rgba(99,102,241,0.15)'
                    : 'var(--surface-1)',
                  color: selectedType === t.value ? 'var(--text-accent)' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Date + Search row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={12} /> Pickup Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={12} /> Return Date
              </label>
              <input
                type="date"
                min={pickupDate || new Date().toISOString().split('T')[0]}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Search size={12} /> Search Vehicles
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Brand or model name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '40px', paddingRight: searchTerm ? '36px' : '16px', marginBottom: 0 }}
                />
                <Search size={15} style={{
                  position: 'absolute', left: '13px', top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }} />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    style={{
                      position: 'absolute', right: '12px', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', display: 'flex',
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Date actions */}
          {(pickupDate || returnDate) && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: '16px', paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
            }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                {pickupDate && returnDate
                  ? `📅 ${daysCount} day${daysCount !== 1 ? 's' : ''} selected — dynamic pricing active`
                  : '📅 Select both dates to see pricing'}
              </span>
              <button onClick={handleClearDates} className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: '0.76rem' }}>
                <X size={13} /> Clear Dates
              </button>
            </div>
          )}
        </div>

        {/* ── RECOMMENDATION PANEL ─────────────────────── */}
        {recommendation && !recLoading && (
          <div className="rec-panel animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 12px', borderRadius: '999px', fontSize: '0.7rem',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: 'rgba(245,158,11,0.15)', color: '#fbbf24',
                  border: '1px solid rgba(245,158,11,0.35)',
                  marginBottom: '10px',
                }}>
                  <Flame size={11} fill="#fbbf24" color="#fbbf24" />
                  AI Recommended
                </span>
                <h2 style={{ fontSize: '1.6rem', letterSpacing: '-0.03em' }}>
                  Best Value Right Now
                </h2>
              </div>

              {pickupDate && returnDate && (
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                    {daysCount}-Day Estimate
                  </p>
                  <p style={{
                    fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em',
                    fontFamily: 'var(--font-heading)',
                    background: 'var(--gradient-brand)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
                    NRS {recommendation.rentPerDay * daysCount}
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: '4px' }}>
                  {recommendation.brand} {recommendation.name}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  {recommendation.type} · {recommendation.fuelType}
                </p>

                {recommendation.image && (
                  <div style={{
                    width: '100%', height: '160px', overflow: 'hidden',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(99,102,241,0.06)',
                    border: '1px solid var(--border-default)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '16px',
                  }}>
                    <img
                      src={getImageUrl(recommendation.image)}
                      alt={`${recommendation.brand} ${recommendation.name}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                  <span className="badge"><Tag size={10} /> NRS {recommendation.rentPerDay}/day</span>
                  <span className="badge"><Zap size={10} /> {recommendation.fuelEfficiency} KM/L</span>
                  <span className={`badge ${recommendation.status === 'available' ? 'badge-success' : 'badge-danger'}`}>
                    {recommendation.status}
                  </span>
                </div>

                <button
                  onClick={() => handleRentClick(recommendation._id)}
                  className="btn"
                  style={{ width: '100%' }}
                >
                  Reserve This Vehicle
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="responsive-left-border">
                <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Why Recommended?
                </p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '0', listStyle: 'none' }}>
                  {[
                    `Lowest daily rate in its class: NRS ${recommendation.rentPerDay}/day`,
                    `Fuel efficiency: ${recommendation.fuelEfficiency} KM/L`,
                    'Verified availability for your dates',
                  ].map((item, i) => (
                    <li key={i} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      fontSize: '0.85rem', color: 'var(--text-secondary)',
                    }}>
                      <span style={{
                        width: '18px', height: '18px', flexShrink: 0,
                        background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-primary)',
                        marginTop: '1px',
                      }}>
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                {alternatives.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      Alternatives
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {alternatives.map((alt) => (
                        <button
                          key={alt._id}
                          onClick={() => setSearchTerm(alt.name)}
                          style={{
                            flex: 1, minWidth: '110px',
                            border: '1px solid var(--border-default)',
                            background: 'var(--surface-1)',
                            padding: '10px', cursor: 'pointer',
                            textAlign: 'center',
                            borderRadius: 'var(--radius-sm)',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'var(--accent-primary)';
                            e.currentTarget.style.background = 'var(--surface-2)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'var(--border-default)';
                            e.currentTarget.style.background = 'var(--surface-1)';
                          }}
                        >
                          <p style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                            {alt.brand} {alt.name}
                          </p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            NRS {alt.rentPerDay}/day
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── FLEET SECTION ────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', letterSpacing: '-0.03em' }}>
              Fleet Availability
              <span style={{
                marginLeft: '10px',
                display: 'inline-flex', alignItems: 'center',
                padding: '2px 10px', borderRadius: '999px', fontSize: '0.75rem',
                fontWeight: 700, verticalAlign: 'middle',
                background: 'rgba(99,102,241,0.12)',
                color: 'var(--text-accent)',
                border: '1px solid rgba(99,102,241,0.25)',
              }}>
                {loading ? '...' : vehicles.length}
              </span>
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {daysCount ? `Showing prices for ${daysCount} day${daysCount !== 1 ? 's' : ''}` : 'Select dates to see total pricing'}
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <div className="skeleton" style={{ height: '190px' }} />
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="skeleton" style={{ height: '14px', width: '40%' }} />
                  <div className="skeleton" style={{ height: '20px', width: '70%' }} />
                  <div className="skeleton" style={{ height: '12px', width: '55%' }} />
                  <div className="skeleton" style={{ height: '80px' }} />
                  <div className="skeleton" style={{ height: '40px', marginTop: '8px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '72px 40px',
            background: 'var(--surface-1)',
            border: '1px dashed var(--border-default)',
            borderRadius: 'var(--radius-xl)',
          }}>
            <HelpCircle size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)', opacity: 0.5 }} />
            <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>No vehicles found</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid-cols-3" style={{ marginBottom: '60px' }}>
            {vehicles.map((vehicle, idx) => {
              const finalPrice = vehicle.pricing?.finalPrice || (vehicle.rentPerDay * (daysCount || 1));
              const available = vehicle.status === 'available';

              return (
                <div
                  key={vehicle._id}
                  className="vehicle-card animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {/* Image */}
                  <div className="vehicle-card-image" style={{ position: 'relative' }}>
                    {vehicle.image
                      ? <img src={getImageUrl(vehicle.image)} alt={`${vehicle.brand} ${vehicle.name}`} />
                      : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                          <span style={{ fontSize: '2.5rem' }}>🚗</span>
                          <span style={{ fontSize: '0.75rem' }}>No image</span>
                        </div>
                      )
                    }
                    {/* Availability overlay dot */}
                    <span style={{
                      position: 'absolute', top: '12px', right: '12px',
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: available ? '#34d399' : '#f43f5e',
                      boxShadow: `0 0 0 3px ${available ? 'rgba(52,211,153,0.25)' : 'rgba(244,63,94,0.25)'}`,
                    }} />
                  </div>

                  <div className="vehicle-card-body">
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <TypeBadge type={vehicle.type} />
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: available ? '#34d399' : '#94a3b8',
                      }}>
                        {vehicle.status}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                      {vehicle.brand} {vehicle.name}
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                      {vehicle.model}
                    </p>

                    {/* Quick specs */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        <Fuel size={12} /> {vehicle.fuelType}
                      </span>
                      {vehicle.fuelEfficiency && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          <Gauge size={12} /> {vehicle.fuelEfficiency} KM/L
                        </span>
                      )}
                    </div>

                    {/* Pricing breakdown */}
                    {vehicle.pricing ? (
                      <div className="pricing-breakdown">
                        <p style={{ fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                          Pricing Breakdown
                        </p>
                        <div className="pricing-row">
                          <span>Base ({daysCount}d × NRS {vehicle.rentPerDay})</span>
                          <span>NRS {vehicle.pricing.basePrice}</span>
                        </div>
                        <div className="pricing-row">
                          <span>{vehicle.type} multiplier</span>
                          <span>×{vehicle.pricing.vehicleTypeMultiplier}</span>
                        </div>
                        {vehicle.pricing.breakdown?.spansWeekend && (
                          <div className="pricing-row">
                            <span>Weekend (+20%)</span>
                            <span style={{ color: '#fbbf24' }}>×1.2</span>
                          </div>
                        )}
                        {vehicle.pricing.breakdown?.spansPeak && (
                          <div className="pricing-row">
                            <span>Peak season (+10%)</span>
                            <span style={{ color: '#fbbf24' }}>×1.1</span>
                          </div>
                        )}
                        {vehicle.pricing.breakdown?.isLongTerm && (
                          <div className="pricing-row">
                            <span>Long-term (-15%)</span>
                            <span style={{ color: '#34d399' }}>−NRS {vehicle.pricing.longTermDiscount}</span>
                          </div>
                        )}
                        <div className="pricing-row total">
                          <span>Total</span>
                          <span>NRS {finalPrice}</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px',
                        background: 'var(--surface-1)', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        marginBottom: '14px', fontSize: '0.84rem',
                      }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Daily Rate</span>
                        <strong>NRS {vehicle.rentPerDay}</strong>
                      </div>
                    )}

                    {/* Rent button */}
                    <div style={{ marginTop: 'auto' }}>
                      <button
                        onClick={() => handleRentClick(vehicle._id)}
                        className="btn"
                        style={{ width: '100%', fontSize: '0.82rem', padding: '12px' }}
                        disabled={!available}
                      >
                        {available ? (
                          <>Rent Vehicle <ArrowRight size={15} /></>
                        ) : (
                          'Unavailable'
                        )}
                      </button>
                    </div>
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

export default Home;
