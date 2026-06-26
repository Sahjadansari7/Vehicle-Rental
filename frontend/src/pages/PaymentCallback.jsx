import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, XCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const pidx = searchParams.get('pidx');
  const transactionId = searchParams.get('transaction_id');
  const purchaseOrderId = searchParams.get('purchase_order_id');

  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [bookingDetails, setBookingDetails] = useState(null);

  // Prevent duplicate verification calls in React StrictMode
  const verifiedRef = useRef(false);

  useEffect(() => {
    const verifyPaymentTransaction = async () => {
      if (verifiedRef.current) return;
      verifiedRef.current = true;

      if (!pidx) {
        setStatus('error');
        setErrorMsg('Invalid callback parameters. No transaction index (pidx) detected.');
        addToast('Invalid payment callback', 'error');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const res = await axios.post(
          `${API_URL}/api/payments/verify`,
          { pidx, transactionId },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (res.data.success) {
          setStatus('success');
          setBookingDetails(res.data.data.booking);
          addToast('Payment verified successfully!', 'success');
        } else {
          setStatus('error');
          setErrorMsg(res.data.message || 'Payment transaction verification failed.');
          addToast('Payment failed', 'error');
        }
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setErrorMsg(err.response?.data?.message || 'Failed to complete transaction verification.');
        addToast('Verification failed', 'error');
      }
    };

    verifyPaymentTransaction();
  }, [pidx, transactionId, addToast]);

  return (
    <div className="container" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.35s ease' }}>
      <div className="card" style={{ width: '100%', maxWidth: '540px', padding: '48px 40px', background: 'var(--glass-bg)', position: 'relative', overflow: 'hidden' }}>
        
        {/* Glow Effects */}
        {status === 'success' && (
          <div style={{
            position: 'absolute',
            top: '-10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
        )}
        {status === 'error' && (
          <div style={{
            position: 'absolute',
            top: '-10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
        )}

        {status === 'verifying' && (
          <div>
            <Loader2 size={52} className="spin-icon" style={{ margin: '0 auto 24px auto', strokeWidth: 1.5, color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.6rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', fontWeight: 800, letterSpacing: '-0.01em', marginBottom: '12px' }}>
              VERIFYING TRANSACTION
            </h2>
            <p style={{ opacity: 0.65, fontSize: '0.92rem', lineHeight: '1.6' }}>
              Confirming transaction status with the payment gateway router. Please do not close or reload this browser tab.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', 
              background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
            }}>
              <CheckCircle2 size={44} style={{ color: 'var(--accent-emerald)', strokeWidth: 1.5 }} />
            </div>
            
            <h2 style={{ fontSize: '1.6rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', fontWeight: 800, letterSpacing: '-0.01em', marginBottom: '12px' }}>
              RESERVATION SECURED
            </h2>
            <p style={{ opacity: 0.65, fontSize: '0.92rem', marginBottom: '28px', lineHeight: '1.6' }}>
              Your payment has been successfully verified, booking is confirmed, and your allocated vehicle is registered.
            </p>

            <div className="card" style={{ textAlign: 'left', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', marginBottom: '32px', fontSize: '0.88rem', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ opacity: 0.65 }}>Booking Reference ID:</span>
                <strong style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>{bookingDetails?.bookingId || 'VR-XXXXXX'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ opacity: 0.65 }}>Transaction Reference:</span>
                <span style={{ fontFamily: 'monospace', opacity: 0.8 }}>{transactionId || 'MOCK_TX_ID'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ opacity: 0.65 }}>Pricing Settled:</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>NRS {bookingDetails?.totalPrice?.toLocaleString() || '0.00'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', marginTop: '16px', paddingTop: '16px' }}>
                <span style={{ opacity: 0.65 }}>Receipt Status:</span>
                <span className="badge" style={{ borderColor: 'var(--accent-emerald)', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.68rem', fontWeight: 800 }}>
                  PAID CONFIRMED
                </span>
              </div>
            </div>

            <div className="grid-cols-2">
              <Link to="/history" className="btn" style={{ width: '100%', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                <span>Trip History</span>
                <ArrowRight size={14} />
              </Link>
              <Link to="/" className="btn btn-secondary" style={{ width: '100%', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                Browse Fleet
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', 
              background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
            }}>
              <XCircle size={44} style={{ color: 'var(--accent-rose)', strokeWidth: 1.5 }} />
            </div>
            
            <h2 style={{ fontSize: '1.6rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', fontWeight: 800, letterSpacing: '-0.01em', marginBottom: '12px' }}>
              TRANSACTION FAILED
            </h2>
            <p style={{ opacity: 0.65, fontSize: '0.92rem', marginBottom: '28px', lineHeight: '1.6', color: '#fca5a5' }}>
              {errorMsg}
            </p>

            <div className="grid-cols-2">
              <Link to="/" className="btn" style={{ width: '100%', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                Return to Fleet
              </Link>
              <Link to="/history" className="btn btn-secondary" style={{ width: '100%', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                My Bookings
              </Link>
            </div>
          </div>
        )}

      </div>
      
      {/* Animation Injector */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default PaymentCallback;
