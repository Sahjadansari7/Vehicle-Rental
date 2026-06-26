import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Calendar, ShieldCheck, MapPin, Tag,
  Clock, Package, ArrowRight, Loader2,
  XCircle, RotateCcw, AlertTriangle, X, CreditCard,
  CheckCircle2, Banknote
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${API_URL}/${cleanPath}`;
};

const statusConfig = {
  Confirmed: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)', label: 'Confirmed' },
  Pending:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', label: 'Pending' },
  Cancelled: { color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.2)', label: 'Cancelled' },
  Completed: { color: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.25)', label: 'Completed' },
};

// ─── Cancel Confirmation Modal ────────────────────────────────────────────────
const CancelModal = ({ booking, onConfirm, onClose, cancelling }) => {
  const hasPaid = booking?.payment?.status === 'Completed';
  const refundAmount = booking?.payment?.amount || booking?.totalPrice || 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          animation: 'fadeInBackdrop 0.2s ease',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1001,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        animation: 'slideUpModal 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <div style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          borderRadius: '20px',
          padding: '0',
          maxWidth: '460px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        }}>
          {/* Modal header */}
          <div style={{
            padding: '24px 28px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(0,0,0,0) 60%)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <XCircle size={20} style={{ color: '#f87171' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '2px' }}>
                  Cancel Booking
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  #{booking?.bookingId}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={cancelling}
              style={{
                background: 'var(--surface-2)', border: '1px solid var(--border-subtle)',
                borderRadius: '8px', width: '32px', height: '32px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Modal body */}
          <div style={{ padding: '24px 28px' }}>
            {/* Vehicle info summary */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 16px',
              background: 'var(--surface-2)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              marginBottom: '20px',
            }}>
              {booking?.vehicle?.image && (
                <div style={{
                  width: '60px', height: '38px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0,
                  background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <img
                    src={getImageUrl(booking.vehicle.image)}
                    alt={`${booking.vehicle.brand} ${booking.vehicle.name}`}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                  />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px' }}>
                  {booking?.vehicle?.brand} {booking?.vehicle?.name}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(booking?.pickupDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' → '}
                  {new Date(booking?.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '1px' }}>Total</p>
                <p style={{ fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                  NRS {booking?.totalPrice?.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Refund notice */}
            {hasPaid ? (
              <div style={{
                display: 'flex', gap: '12px', alignItems: 'flex-start',
                padding: '16px',
                background: 'rgba(52,211,153,0.07)',
                border: '1px solid rgba(52,211,153,0.2)',
                borderRadius: '12px',
                marginBottom: '20px',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Banknote size={17} style={{ color: '#34d399' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#34d399', marginBottom: '4px' }}>
                    Full Refund Will Be Processed
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    Your payment of <strong style={{ color: 'var(--text-primary)' }}>NRS {refundAmount.toLocaleString()}</strong> will be
                    refunded to your original payment method. Refunds typically reflect within 3–5 business days.
                  </p>
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex', gap: '12px', alignItems: 'flex-start',
                padding: '14px',
                background: 'rgba(251,191,36,0.06)',
                border: '1px solid rgba(251,191,36,0.2)',
                borderRadius: '12px',
                marginBottom: '20px',
              }}>
                <AlertTriangle size={16} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  No payment was made for this booking. Cancelling will simply release the vehicle reservation.
                </p>
              </div>
            )}

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.6 }}>
              This action <strong style={{ color: 'var(--text-primary)' }}>cannot be undone</strong>. The vehicle will be
              immediately released and made available for other customers.
            </p>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={onClose}
                disabled={cancelling}
                style={{
                  flex: 1, padding: '12px 16px',
                  background: 'var(--surface-2)', border: '1px solid var(--border-default)',
                  borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                  color: 'var(--text-primary)', transition: 'all 0.15s ease',
                  fontFamily: 'var(--font-heading)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
              >
                Keep Booking
              </button>
              <button
                onClick={onConfirm}
                disabled={cancelling}
                style={{
                  flex: 1.2, padding: '12px 16px',
                  background: cancelling ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.85)',
                  border: '1px solid rgba(239,68,68,0.5)',
                  borderRadius: '10px', cursor: cancelling ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: '0.85rem', color: '#fff',
                  transition: 'all 0.15s ease', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '7px', fontFamily: 'var(--font-heading)',
                }}
                onMouseEnter={e => !cancelling && (e.currentTarget.style.background = 'rgba(239,68,68,1)')}
                onMouseLeave={e => !cancelling && (e.currentTarget.style.background = 'rgba(239,68,68,0.85)')}
              >
                {cancelling ? (
                  <>
                    <Loader2 size={14} className="spin-icon" />
                    Processing...
                  </>
                ) : (
                  <>
                    <XCircle size={14} />
                    {hasPaid ? 'Cancel & Refund' : 'Cancel Booking'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUpModal {
          from { opacity: 0; transform: translateY(30px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};

// ─── Main History Component ───────────────────────────────────────────────────
const History = () => {
  const { user }     = useAuth();
  const { addToast } = useToast();
  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [modalBooking, setModalBooking] = useState(null); // booking object for the modal

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setBookings(res.data.data);
    } catch (err) {
      console.error(err);
      addToast('Failed to retrieve booking history', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancelConfirm = async () => {
    if (!modalBooking) return;
    setCancellingId(modalBooking._id);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${API_URL}/api/bookings/${modalBooking._id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const refund = res.data.data?.refund;
        if (refund?.processed) {
          addToast(`Booking cancelled! Refund of NRS ${refund.amount.toLocaleString()} is being processed.`, 'success');
        } else {
          addToast('Booking cancelled and vehicle released!', 'success');
        }
        setModalBooking(null);
        fetchBookings();
      } else {
        addToast(res.data.message || 'Failed to cancel.', 'error');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Error during cancellation.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const isCancellationAllowed = (pickupDateStr) => {
    const today  = new Date(); today.setHours(0,0,0,0);
    const pickup = new Date(pickupDateStr); pickup.setHours(0,0,0,0);
    return today < pickup;
  };

  const calcDays = (pickup, ret) =>
    Math.max(1, Math.ceil(Math.abs(new Date(ret) - new Date(pickup)) / 86400000));

  return (
    <div style={{ position: 'relative' }}>
      {/* Cancel Modal */}
      {modalBooking && (
        <CancelModal
          booking={modalBooking}
          onClose={() => !cancellingId && setModalBooking(null)}
          onConfirm={handleCancelConfirm}
          cancelling={!!cancellingId}
        />
      )}

      {/* Page header */}
      <div style={{
        padding: '56px 0 40px',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-80px', right: '-40px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          filter: 'blur(50px)', pointerEvents: 'none',
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <span className="section-label" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px',
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: '999px', marginBottom: '12px',
          }}>
            <Package size={11} fill="currentColor" /> My Bookings
          </span>
          <h1 className="page-title" style={{ marginBottom: '8px' }}>Booking History</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Track your active reservations, payments and cancellations.
          </p>
        </div>
      </div>

      <div className="container" style={{ marginTop: '40px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{
                borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                border: '1px solid var(--border-subtle)',
                padding: '24px', display: 'flex', gap: '20px', alignItems: 'center',
              }}>
                <div className="skeleton" style={{ width: '120px', height: '75px', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="skeleton" style={{ height: '12px', width: '20%' }} />
                  <div className="skeleton" style={{ height: '20px', width: '40%' }} />
                  <div className="skeleton" style={{ height: '12px', width: '60%' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                  <div className="skeleton" style={{ height: '28px', width: '100px' }} />
                  <div className="skeleton" style={{ height: '36px', width: '130px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 40px',
            background: 'var(--surface-1)',
            border: '1px dashed var(--border-default)',
            borderRadius: 'var(--radius-xl)',
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '20px',
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Package size={28} style={{ color: 'var(--text-accent)' }} />
            </div>
            <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>No bookings yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '300px', margin: '0 auto' }}>
              Your rental history will appear here once you make a booking.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '60px' }}>
            {bookings.map((booking, idx) => {
              const isPaid       = booking.bookingStatus === 'Confirmed';
              const isCancelled  = booking.bookingStatus === 'Cancelled';
              const isCompleted  = booking.bookingStatus === 'Completed';
              const isRefunded   = isCancelled && booking.payment?.status === 'Refunded';
              const cancellable  = isCancellationAllowed(booking.pickupDate) && !isCancelled && !isCompleted;
              const status       = statusConfig[booking.bookingStatus] || statusConfig.Pending;
              const days         = calcDays(booking.pickupDate, booking.returnDate);

              return (
                <div
                  key={booking._id}
                  className="animate-fade-in-up"
                  style={{
                    animationDelay: `${idx * 0.06}s`,
                    background: isCancelled ? 'rgba(148,163,184,0.04)' : 'var(--glass-bg)',
                    backdropFilter: 'var(--glass-blur)',
                    WebkitBackdropFilter: 'var(--glass-blur)',
                    border: `1px solid ${isCancelled ? 'rgba(148,163,184,0.15)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '20px',
                    transition: 'box-shadow 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: isCancelled ? 0.8 : 1,
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = isCancelled ? 'none' : 'var(--shadow-md)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  {/* Left accent line */}
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: '3px', background: status.color,
                    borderRadius: '3px 0 0 3px',
                  }} />

                  {/* Vehicle image + info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
                    {booking.vehicle?.image && (
                      <div style={{
                        width: '130px', height: '80px', flexShrink: 0,
                        borderRadius: 'var(--radius-md)', overflow: 'hidden',
                        background: 'rgba(99,102,241,0.06)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        filter: isCancelled ? 'grayscale(0.6)' : 'none',
                      }}>
                        <img
                          src={getImageUrl(booking.vehicle.image)}
                          alt={`${booking.vehicle.brand} ${booking.vehicle.name}`}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }}
                        />
                      </div>
                    )}

                    <div style={{ flex: 1 }}>
                      {/* Booking ID + status + refund badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{
                          display: 'inline-flex', padding: '3px 10px',
                          borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700,
                          background: 'var(--surface-2)', border: '1px solid var(--border-default)',
                          color: 'var(--text-secondary)', letterSpacing: '0.06em',
                          fontFamily: 'var(--font-heading)',
                        }}>
                          #{booking.bookingId}
                        </span>
                        <span style={{
                          display: 'inline-flex', padding: '3px 10px',
                          borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700,
                          background: status.bg, border: `1px solid ${status.border}`,
                          color: status.color, letterSpacing: '0.06em',
                        }}>
                          {booking.bookingStatus}
                        </span>
                        {/* Refund badge */}
                        {isRefunded && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '3px 10px', borderRadius: '999px',
                            fontSize: '0.68rem', fontWeight: 700,
                            background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)',
                            color: '#34d399', letterSpacing: '0.06em',
                          }}>
                            <RotateCcw size={9} />
                            Refunded
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.1rem', letterSpacing: '-0.02em', marginBottom: '10px' }}>
                        {booking.vehicle?.brand} {booking.vehicle?.name}
                      </h3>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          <Calendar size={13} style={{ color: 'var(--text-accent)', flexShrink: 0 }} />
                          {formatDate(booking.pickupDate)} → {formatDate(booking.returnDate)}
                          <span style={{
                            padding: '1px 8px', borderRadius: '99px', fontSize: '0.68rem',
                            background: 'var(--surface-2)', color: 'var(--text-muted)',
                          }}>
                            {days}d
                          </span>
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          <MapPin size={13} style={{ color: 'var(--text-accent)', flexShrink: 0 }} />
                          {booking.pickupLocation?.name || 'Main Branch'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          <Tag size={13} style={{ color: 'var(--text-accent)', flexShrink: 0 }} />
                          {booking.vehicle?.type} · {booking.vehicle?.fuelType}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side — price + action */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end', minWidth: '180px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '2px' }}>
                        {isRefunded ? 'Refunded' : 'Total'}
                      </p>
                      <p style={{
                        fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.04em',
                        fontFamily: 'var(--font-heading)',
                        background: isRefunded
                          ? 'linear-gradient(135deg, #34d399, #10b981)'
                          : 'var(--gradient-brand)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        textDecoration: isRefunded ? 'none' : 'none',
                      }}>
                        NRS {booking.totalPrice}
                      </p>
                    </div>

                    {/* Status indicators */}
                    {isPaid && !isCancelled && (
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        fontSize: '0.76rem', color: '#34d399', fontWeight: 600,
                      }}>
                        <ShieldCheck size={14} /> Payment Confirmed
                      </span>
                    )}

                    {isRefunded && (
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 12px', borderRadius: '8px',
                        fontSize: '0.75rem', fontWeight: 600,
                        background: 'rgba(52,211,153,0.08)',
                        border: '1px solid rgba(52,211,153,0.2)',
                        color: '#34d399',
                      }}>
                        <CheckCircle2 size={13} /> Refund Processed
                      </span>
                    )}

                    {isCancelled && !isRefunded && (
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Cancelled
                      </span>
                    )}

                    {!isCancelled && !isCompleted && booking.bookingStatus === 'Pending' && (
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        fontSize: '0.76rem', color: 'var(--text-muted)',
                      }}>
                        <Clock size={12} /> {booking.bookingStatus}
                      </span>
                    )}

                    {/* Cancel button */}
                    {cancellable && (
                      <button
                        id={`cancel-btn-${booking._id}`}
                        onClick={() => setModalBooking(booking)}
                        disabled={cancellingId === booking._id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '8px 16px',
                          background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.25)',
                          borderRadius: '9px',
                          cursor: 'pointer',
                          fontSize: '0.8rem', fontWeight: 600,
                          color: '#f87171',
                          fontFamily: 'var(--font-heading)',
                          transition: 'all 0.15s ease',
                          letterSpacing: '0.02em',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(239,68,68,0.14)';
                          e.currentTarget.style.borderColor = 'rgba(239,68,68,0.45)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                          e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)';
                        }}
                      >
                        {cancellingId === booking._id ? (
                          <Loader2 size={12} className="spin-icon" />
                        ) : (
                          <XCircle size={13} />
                        )}
                        {booking.payment?.status === 'Completed' ? 'Cancel & Refund' : 'Cancel Booking'}
                      </button>
                    )}
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

export default History;
