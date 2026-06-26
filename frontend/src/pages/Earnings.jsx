import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  TrendingUp, DollarSign, CheckCircle2, XCircle, Clock, 
  CreditCard, Search, ArrowUpRight, ArrowDownRight, RefreshCw,
  Percent, Award, Calendar, Layers, ShieldCheck
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

const StatCard = ({ icon: Icon, label, value, sub, color, borderGlow }) => (
  <div 
    className="card" 
    style={{
      display: 'flex', 
      flexDirection: 'column', 
      gap: '12px',
      borderLeft: `4px solid ${color || 'var(--text-color)'}`,
      background: 'var(--glass-bg)',
      transition: 'all 0.3s ease',
      boxShadow: borderGlow ? `0 0 20px rgba(${borderGlow}, 0.15), var(--shadow-sm)` : 'var(--shadow-sm)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
        <Icon size={14} color={color} />
        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      {borderGlow && (
        <span style={{ 
          fontSize: '0.65rem', 
          padding: '2px 8px', 
          borderRadius: 'var(--radius-full)', 
          background: `rgba(${borderGlow}, 0.1)`, 
          color: color,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          Primary
        </span>
      )}
    </div>
    <div style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{value}</div>
    {sub && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>{sub}</div>}
  </div>
);

const Earnings = () => {
  const { addToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, pRes] = await Promise.all([
        axios.get(`${API_URL}/api/bookings`, { headers: authHeaders() }),
        axios.get(`${API_URL}/api/payments`, { headers: authHeaders() }),
      ]);
      if (bRes.data.success) setBookings(bRes.data.data);
      if (pRes.data.success) setPayments(pRes.data.data);
    } catch {
      // fallback: only bookings
      try {
        const bRes = await axios.get(`${API_URL}/api/bookings`, { headers: authHeaders() });
        if (bRes.data.success) setBookings(bRes.data.data);
      } catch {
        addToast('Failed to retrieve financial metrics', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived stats from bookings
  const confirmed = bookings.filter(b => b.bookingStatus === 'Confirmed');
  const completed = bookings.filter(b => b.bookingStatus === 'Completed');
  const cancelled = bookings.filter(b => b.bookingStatus === 'Cancelled');
  const pending   = bookings.filter(b => b.bookingStatus === 'Pending');

  const totalRevenue = [...confirmed, ...completed].reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const completedRevenue = completed.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const confirmedRevenue = confirmed.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  // Payment stats
  const paidPayments = payments.filter(p => p.status === 'Completed');
  const totalPaid = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const formatNRS = (n) => `NRS ${(n || 0).toLocaleString()}`;
  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // Filtering list
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.bookingId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vehicle?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vehicle?.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || b.bookingStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    Confirmed: '#10b981',
    Completed: '#3b82f6',
    Cancelled: '#ef4444',
    Pending: '#f59e0b'
  };

  const statusBgs = {
    Confirmed: 'rgba(16, 185, 129, 0.12)',
    Completed: 'rgba(59, 130, 246, 0.12)',
    Cancelled: 'rgba(239, 68, 68, 0.12)',
    Pending: 'rgba(245, 158, 11, 0.12)'
  };

  // Calculate percentage ratios
  const totalCompletedConfirmed = completed.length + confirmed.length || 1;
  const completedPct = Math.round((completed.length / totalCompletedConfirmed) * 100) || 0;
  const confirmedPct = Math.round((confirmed.length / totalCompletedConfirmed) * 100) || 0;

  return (
    <div className="container" style={{ marginTop: '40px', paddingBottom: '80px', animation: 'fadeIn 0.35s ease' }}>
      
      {/* Header Banner */}
      <div className="card" style={{ 
        position: 'relative', 
        overflow: 'hidden', 
        marginBottom: '36px', 
        borderLeft: '4px solid var(--accent-emerald)',
        background: 'var(--gradient-card)'
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-5%',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: 'var(--surface-2)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border-default)',
            }}>
              <TrendingUp size={20} color="var(--accent-emerald)" />
            </div>
            <div>
              <h1 className="page-title" style={{ fontSize: '1.8rem', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                Earnings <span style={{ color: 'var(--accent-emerald)' }}>& Profit Metrics</span>
              </h1>
              <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '2px' }}>
                Real-time financial audits, booking revenue statements, and ledger statistics.
              </p>
            </div>
          </div>

          <button 
            onClick={fetchData} 
            className="btn btn-secondary" 
            style={{ 
              padding: '10px 18px', 
              fontSize: '0.8rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              borderRadius: 'var(--radius-sm)' 
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            <span>Reload Ledger</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="pulse" style={{ height: '120px', background: 'var(--surface-1)', borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
          <div className="pulse" style={{ height: '400px', background: 'var(--surface-1)', borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : (
        <>
          {/* Stat Cards - Row 1 */}
          <div className="grid-cols-3" style={{ marginBottom: '24px' }}>
            <StatCard
              icon={DollarSign}
              label="Accrued Revenue"
              value={formatNRS(totalRevenue)}
              sub={<><ArrowUpRight size={14} color="#34d399" /> <span>Confirmed & Completed bookings</span></>}
              color="#10b981"
              borderGlow="16, 185, 127"
            />
            <StatCard
              icon={CreditCard}
              label="Payments Liquidated"
              value={formatNRS(totalPaid || totalRevenue)}
              sub={<><ShieldCheck size={14} color="#60a5fa" /> <span>{paidPayments.length || confirmed.length + completed.length} verified checkout receipts</span></>}
              color="#3b82f6"
            />
            <StatCard
              icon={Percent}
              label="Revenue in Pipeline"
              value={formatNRS(confirmedRevenue)}
              sub={<><Clock size={14} color="#a78bfa" /> <span>Currently reserved, outstanding payout</span></>}
              color="#8b5cf6"
            />
          </div>

          {/* Stat Cards - Row 2 */}
          <div className="grid-cols-3" style={{ marginBottom: '36px' }}>
            <StatCard
              icon={CheckCircle2}
              label="Completed Trips"
              value={completed.length}
              sub={<span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{formatNRS(completedRevenue)} paidout</span>}
              color="#10b981"
            />
            <StatCard
              icon={Clock}
              label="Pending Confirmation"
              value={pending.length}
              sub="Awaiting admin approval"
              color="#f59e0b"
            />
            <StatCard
              icon={XCircle}
              label="Cancelled Payout"
              value={cancelled.length}
              sub={<span style={{ color: '#fb7185' }}>Revenue lost & cancelled</span>}
              color="#ef4444"
            />
          </div>

          {/* Visual Breakdown Progress Ring & Analytics bar */}
          <div className="card" style={{ marginBottom: '40px', padding: '24px', background: 'var(--glass-bg)' }}>
            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>
              REVENUE RATIO DISTRIBUTION
            </h3>
            <div style={{ display: 'flex', height: '14px', borderRadius: 'var(--radius-full)', overflow: 'hidden', background: 'var(--surface-1)', marginBottom: '20px' }}>
              <div style={{ width: `${completedPct}%`, background: 'var(--accent-emerald)', transition: 'width 0.5s ease' }} title={`Completed: ${completedPct}%`} />
              <div style={{ width: `${confirmedPct}%`, background: 'var(--accent-primary)', transition: 'width 0.5s ease' }} title={`Confirmed: ${confirmedPct}%`} />
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-emerald)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>Completed Trips ({completedPct}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>Active Confirmed ({confirmedPct}%)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                <Award size={14} color="var(--accent-cyan)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fulfillment Rate: <strong style={{ color: 'var(--text-primary)' }}>{completedPct}%</strong></span>
              </div>
            </div>
          </div>

          {/* Search Table Toolbar */}
          <div className="card" style={{ padding: '20px 24px', marginBottom: '24px', background: 'var(--surface-1)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-heading)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="var(--accent-cyan)" />
                  <span>Ledger Transactions ({filteredBookings.length} / {bookings.length})</span>
                </h2>
                <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '2px' }}>Audit all individual reservations and their total payments.</p>
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                <input 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search ledger by Booking ID, customer email, vehicle..." 
                  style={{ paddingLeft: '38px', marginBottom: 0, fontSize: '0.85rem', height: '42px' }}
                />
              </div>

              <div style={{ width: '160px' }}>
                <select 
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value)}
                  style={{ marginBottom: 0, fontSize: '0.85rem', height: '42px', padding: '10px 14px' }}
                >
                  <option value="All">All Statuses</option>
                  {['Pending', 'Confirmed', 'Completed', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="card" style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.6 }}>
              <Search size={36} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
              <p style={{ fontWeight: 600 }}>No statements found matching your active ledger filters.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)' }}>
              <table style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
                <thead>
                  <tr>
                    <th style={{ background: 'transparent' }}>Booking ID</th>
                    <th style={{ background: 'transparent' }}>Customer</th>
                    <th style={{ background: 'transparent' }}>Vehicle</th>
                    <th style={{ background: 'transparent' }}>Pickup Date</th>
                    <th style={{ background: 'transparent' }}>Return Date</th>
                    <th style={{ background: 'transparent' }}>Settled Amount</th>
                    <th style={{ background: 'transparent' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map(b => {
                    const c = statusColors[b.bookingStatus] || 'var(--text-color)';
                    const bg = statusBgs[b.bookingStatus] || 'var(--surface-1)';
                    return (
                      <tr key={b._id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{b.bookingId || '—'}</td>
                        <td>
                          <strong style={{ fontSize: '0.9rem' }}>{b.user?.name || 'Guest User'}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{b.user?.email || '—'}</div>
                        </td>
                        <td>
                          <strong style={{ fontSize: '0.88rem' }}>{b.vehicle?.brand} {b.vehicle?.name}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{b.vehicle?.type}</div>
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>{formatDate(b.pickupDate)}</td>
                        <td style={{ fontSize: '0.82rem' }}>{formatDate(b.returnDate)}</td>
                        <td>
                          <strong style={{ color: b.bookingStatus === 'Cancelled' ? 'var(--text-muted)' : 'var(--accent-emerald)', fontFamily: 'var(--font-heading)' }}>
                            NRS {b.totalPrice?.toLocaleString()}
                          </strong>
                        </td>
                        <td>
                          <span className="badge" style={{ borderColor: c, color: c, background: bg, fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                            {b.bookingStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'rgba(255,255,255,0.015)' }}>
                    <td colSpan={5} style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', opacity: 0.7, padding: '20px' }}>
                      Aggregated Revenue Statement (Confirmed + Completed)
                    </td>
                    <td colSpan={2} style={{ padding: '20px' }}>
                      <strong style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--accent-emerald)', fontFamily: 'var(--font-heading)' }}>
                        {formatNRS(totalRevenue)}
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}

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

export default Earnings;
