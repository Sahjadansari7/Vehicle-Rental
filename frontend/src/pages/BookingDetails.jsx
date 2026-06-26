import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Calendar, MapPin, Car, CreditCard, ShieldAlert,
  Award, Calculator, CheckCircle2, ArrowRight, Fuel, Gauge, Tag
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${API_URL}/${cleanPath}`;
};

const InfoCard = ({ icon: Icon, title, children }) => (
  <div style={{
    background: 'var(--glass-bg)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '22px',
    position: 'relative', overflow: 'hidden',
  }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--gradient-brand)' }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '8px',
        background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={14} style={{ color: 'var(--text-accent)' }} />
      </div>
      <p style={{
        fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.78rem',
        textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)',
      }}>
        {title}
      </p>
    </div>
    {children}
  </div>
);

const BookingDetails = () => {
  const { user }     = useAuth();
  const { addToast } = useToast();
  const navigate     = useNavigate();
  const [searchParams] = useSearchParams();

  const vehicleId        = searchParams.get('vehicleId');
  const pickupLocationId = searchParams.get('pickupLocationId');
  const pickupDateStr    = searchParams.get('pickupDate');
  const returnDateStr    = searchParams.get('returnDate');

  const [vehicle, setVehicle]     = useState(null);
  const [location, setLocation]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchCheckoutDetails = useCallback(async () => {
    if (!vehicleId || !pickupLocationId || !pickupDateStr || !returnDateStr) {
      addToast('Missing booking checkout details', 'error');
      navigate('/');
      return;
    }
    setLoading(true);
    try {
      const [vehicleRes, locationRes] = await Promise.all([
        axios.get(`${API_URL}/api/vehicles/${vehicleId}?pickupDate=${pickupDateStr}&returnDate=${returnDateStr}`),
        axios.get(`${API_URL}/api/locations/${pickupLocationId}`),
      ]);
      if (vehicleRes.data.success && locationRes.data.success) {
        setVehicle(vehicleRes.data.data);
        setLocation(locationRes.data.data);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load checkout details', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [vehicleId, pickupLocationId, pickupDateStr, returnDateStr, addToast, navigate]);

  useEffect(() => { fetchCheckoutDetails(); }, [fetchCheckoutDetails]);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  const handleCheckout = async () => {
    if (!user) { addToast('Authentication required', 'error'); navigate('/login'); return; }
    setProcessing(true);
    try {
      const bookingRes = await axios.post(`${API_URL}/api/bookings`, {
        vehicleId, pickupLocationId,
        pickupDate: pickupDateStr, returnDate: returnDateStr,
      });
      if (!bookingRes.data.success) {
        addToast(bookingRes.data.message || 'Failed to create booking draft', 'error');
        setProcessing(false);
        return;
      }
      const bookingData = bookingRes.data.data.booking;
      addToast('Booking reserved. Initiating payment...', 'success');

      const paymentRes = await axios.post(`${API_URL}/api/payments/initiate`, { bookingId: bookingData._id });
      if (paymentRes.data.success && paymentRes.data.data.payment_url) {
        if (paymentRes.data.data.isSimulated) {
          addToast('Simulation mode — redirecting to mock payment...', 'success');
        } else {
          addToast('Redirecting to Khalti checkout...', 'success');
        }
        window.location.href = paymentRes.data.data.payment_url;
      } else {
        addToast('Failed to initiate payment gateway', 'error');
        setProcessing(false);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Checkout error occurred', 'error');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spin-icon" style={{
            width: '40px', height: '40px', margin: '0 auto 16px',
            border: '3px solid var(--border-default)',
            borderTopColor: 'var(--accent-primary)',
            borderRadius: '50%',
          }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading checkout details...</p>
        </div>
      </div>
    );
  }

  const daysCount = vehicle?.pricing?.days || 1;

  return (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{
        padding: '56px 0 40px',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-60px', right: '-40px',
          width: '280px', height: '280px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          filter: 'blur(50px)', pointerEvents: 'none',
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <span className="section-label" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px',
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: '999px', marginBottom: '12px',
          }}>
            <CreditCard size={11} /> Checkout
          </span>
          <h1 className="page-title" style={{ marginBottom: '8px' }}>Reservation Checkout</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Review your booking details and confirm payment.
          </p>
        </div>
      </div>

      <div className="container" style={{ marginTop: '40px', marginBottom: '80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '28px', alignItems: 'start' }}>

          {/* Left — Summary cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Vehicle card */}
            <InfoCard icon={Car} title="Selected Vehicle">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <span className="badge">{vehicle?.type}</span>
                    <span className="badge badge-success">{vehicle?.status}</span>
                  </div>
                  <h3 style={{ fontSize: '1.3rem', letterSpacing: '-0.03em', marginBottom: '6px' }}>
                    {vehicle?.brand} {vehicle?.name}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Model: {vehicle?.model}
                  </p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <Fuel size={12} /> {vehicle?.fuelType}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <Tag size={12} /> NRS {vehicle?.rentPerDay}/day
                    </span>
                  </div>
                </div>
                {vehicle?.image && (
                  <div style={{
                    width: '150px', height: '95px', flexShrink: 0,
                    borderRadius: 'var(--radius-md)', overflow: 'hidden',
                    background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <img
                      src={getImageUrl(vehicle.image)}
                      alt={`${vehicle.brand} ${vehicle.name}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }}
                    />
                  </div>
                )}
              </div>
            </InfoCard>

            {/* Pickup station */}
            <InfoCard icon={MapPin} title="Pickup Station">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{location?.name}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {location?.latitude}, {location?.longitude}
              </p>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontSize: '0.72rem', color: 'var(--text-accent)',
                padding: '4px 10px', borderRadius: '999px',
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
              }}>
                <Award size={11} /> Nearest branch selected
              </span>
            </InfoCard>

            {/* Rental timeline */}
            <InfoCard icon={Calendar} title="Rental Timeline">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  padding: '14px 16px',
                  background: 'var(--surface-1)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                    Pickup
                  </p>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{formatDate(pickupDateStr)}</p>
                </div>
                <div style={{
                  padding: '14px 16px',
                  background: 'var(--surface-1)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                    Return
                  </p>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{formatDate(returnDateStr)}</p>
                </div>
              </div>
              <div style={{
                textAlign: 'center', padding: '10px',
                background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(99,102,241,0.15)',
              }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-accent)' }}>
                  Duration: {daysCount} rental day{daysCount !== 1 ? 's' : ''}
                </span>
              </div>
            </InfoCard>
          </div>

          {/* Right — Pricing + pay */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.06) 100%)',
            border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px',
            position: 'sticky', top: '90px',
            overflow: 'hidden',
          }}>
            {/* Top accent */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
              background: 'var(--gradient-brand)',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px',
                background: 'var(--gradient-brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Calculator size={16} color="#fff" />
              </div>
              <h3 style={{ fontSize: '1rem', letterSpacing: '-0.01em' }}>Fare Breakdown</h3>
            </div>

            {vehicle?.pricing && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0', marginBottom: '20px' }}>
                {[
                  { label: `Base fee (${daysCount} days × NRS ${vehicle.rentPerDay})`, value: `NRS ${vehicle.pricing.basePrice}`, accent: false },
                  { label: `${vehicle.type} class multiplier`, value: `×${vehicle.pricing.vehicleTypeMultiplier}`, accent: false },
                  ...(vehicle.pricing.breakdown?.spansWeekend ? [{ label: 'Weekend markup (+20%)', value: '×1.2', accent: true, color: '#fbbf24' }] : []),
                  ...(vehicle.pricing.breakdown?.spansPeak ? [{ label: 'Peak season (+10%)', value: '×1.1', accent: true, color: '#fbbf24' }] : []),
                  ...(vehicle.pricing.breakdown?.isLongTerm ? [{ label: 'Long-term discount (−15%)', value: `−NRS ${vehicle.pricing.longTermDiscount}`, accent: true, color: '#34d399' }] : []),
                ].map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid var(--border-subtle)',
                    fontSize: '0.84rem',
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                    <span style={{ fontWeight: 600, color: row.color || 'var(--text-primary)' }}>{row.value}</span>
                  </div>
                ))}

                {/* Total */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginTop: '16px', padding: '16px',
                  background: 'rgba(99,102,241,0.1)', borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(99,102,241,0.2)',
                }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Total Price</span>
                  <span style={{
                    fontSize: '1.7rem', fontWeight: 800, letterSpacing: '-0.04em',
                    fontFamily: 'var(--font-heading)',
                    background: 'var(--gradient-brand)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
                    NRS {vehicle.pricing.finalPrice}
                  </span>
                </div>
              </div>
            )}

            {/* Security notice */}
            <div style={{
              display: 'flex', gap: '12px',
              padding: '14px',
              background: 'rgba(244,63,94,0.06)',
              border: '1px solid rgba(244,63,94,0.15)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
            }}>
              <ShieldAlert size={18} style={{ color: '#fb7185', flexShrink: 0, marginTop: '1px' }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#fb7185', marginBottom: '4px' }}>
                  Double Booking Protection
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Proceeding creates a booking draft that locks your vehicle. Unpaid drafts expire automatically.
                </p>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="btn"
              style={{ width: '100%', padding: '15px', fontSize: '0.9rem' }}
              disabled={processing}
            >
              {processing ? (
                <>
                  <span className="spin-icon" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard size={17} />
                  Pay with Khalti
                </>
              )}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '12px' }}>
              Secure payment powered by Khalti
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
