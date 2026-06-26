import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Car, CheckCircle, Wrench, BarChart2, Search, 
  TrendingUp, RefreshCw, Eye, Calendar, DollarSign
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${API_URL}/${cleanPath}`;
};

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div 
    className="card" 
    style={{
      display: 'flex', 
      flexDirection: 'column', 
      gap: '12px',
      borderLeft: `4px solid ${color || 'var(--text-color)'}`,
      background: 'var(--glass-bg)',
      transition: 'all 0.3s ease',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
      <Icon size={14} color={color} />
      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</span>
    </div>
    <div style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{value}</div>
  </div>
);

const VehicleList = () => {
  const { addToast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, bRes] = await Promise.all([
        axios.get(`${API_URL}/api/vehicles`),
        axios.get(`${API_URL}/api/bookings`, { headers: authHeaders() }),
      ]);
      if (vRes.data.success) setVehicles(vRes.data.data);
      if (bRes.data.success) setBookings(bRes.data.data);
    } catch {
      addToast('Failed to fetch fleet diagnostics', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build per-vehicle stats from bookings
  const vehicleStats = vehicles.map(v => {
    const vBookings = bookings.filter(b => b.vehicle?._id === v._id || b.vehicle === v._id);
    const rented    = vBookings.filter(b => ['Confirmed', 'Completed'].includes(b.bookingStatus));
    const revenue   = rented.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    return { ...v, rentCount: rented.length, revenue, totalBookings: vBookings.length };
  });

  const totalVehicles   = vehicles.length;
  const available       = vehicles.filter(v => v.status === 'available').length;
  const rented          = vehicles.filter(v => v.status === 'rented').length;
  const maintenance     = vehicles.filter(v => v.status === 'maintenance').length;
  const totalRentals    = bookings.filter(b => ['Confirmed', 'Completed'].includes(b.bookingStatus)).length;

  const statusColors = {
    available:   '#10b981',
    rented:      '#3b82f6',
    maintenance: '#f59e0b',
  };

  const statusBgs = {
    available:   'rgba(16, 185, 129, 0.12)',
    rented:      'rgba(59, 130, 246, 0.12)',
    maintenance: 'rgba(245, 158, 11, 0.12)',
  };

  // Searching & filtering
  const filteredVehicles = vehicleStats.filter(v => {
    const matchesSearch = 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'All' || v.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Sort by rent count descending by default
  const sortedVehicles = [...filteredVehicles].sort((a, b) => b.rentCount - a.rentCount);

  return (
    <div className="container" style={{ marginTop: '40px', paddingBottom: '80px', animation: 'fadeIn 0.35s ease' }}>
      
      {/* Header Banner */}
      <div className="card" style={{ 
        position: 'relative', 
        overflow: 'hidden', 
        marginBottom: '36px', 
        borderLeft: '4px solid var(--accent-primary)',
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
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
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
              <Car size={20} color="var(--accent-primary)" />
            </div>
            <div>
              <h1 className="page-title" style={{ fontSize: '1.8rem', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                Fleet <span className="text-gradient">Rental Statistics</span>
              </h1>
              <p style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '2px' }}>
                Complete fleet tracking metrics — rental frequencies, utilization coefficients, and accrued earnings per asset.
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
            <span>Refresh Stats</span>
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
          <div className="pulse" style={{ height: '350px', background: 'var(--surface-1)', borderRadius: 'var(--radius-lg)' }} />
        </div>
      ) : (
        <>
          {/* Summary Cards Row 1 */}
          <div className="grid-cols-3" style={{ marginBottom: '24px' }}>
            <StatCard icon={Car}         label="Fleet Size"          value={totalVehicles}  color="var(--accent-primary)" />
            <StatCard icon={CheckCircle} label="Active Available"    value={available}      color="#10b981" />
            <StatCard icon={BarChart2}   label="Total Confirmed Rentals" value={totalRentals}   color="var(--accent-cyan)" />
          </div>

          {/* Summary Cards Row 2 */}
          <div className="grid-cols-3" style={{ marginBottom: '36px' }}>
            <StatCard icon={Car}         label="Currently Rented"    value={rented}         color="#3b82f6" />
            <StatCard icon={Wrench}      label="Under Maintenance"  value={maintenance}    color="#f59e0b" />
            <StatCard icon={DollarSign}  label="Aggregated Fleet Revenue"
              value={`NRS ${bookings.filter(b=>['Confirmed','Completed'].includes(b.bookingStatus)).reduce((s,b)=>s+(b.totalPrice||0),0).toLocaleString()}`}
              color="#10b981"
            />
          </div>

          {/* Filter Toolbar Card */}
          <div className="card" style={{ padding: '20px 24px', marginBottom: '24px', background: 'var(--surface-1)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-heading)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color="var(--accent-cyan)" />
                  <span>Asset Performance Breakdown ({sortedVehicles.length} / {vehicles.length})</span>
                </h2>
                <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '2px' }}>Vehicles are sorted automatically by total times rented.</p>
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                <input 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search fleet by brand, model, type, or name..." 
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
                  {['available', 'rented', 'maintenance'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {sortedVehicles.length === 0 ? (
            <div className="card" style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.6 }}>
              <Search size={36} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
              <p style={{ fontWeight: 600 }}>No vehicles found matching filters.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)' }}>
              <table style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
                <thead>
                  <tr>
                    <th style={{ background: 'transparent' }}>Image</th>
                    <th style={{ background: 'transparent' }}>Vehicle Profile</th>
                    <th style={{ background: 'transparent' }}>Class</th>
                    <th style={{ background: 'transparent' }}>Fuel System</th>
                    <th style={{ background: 'transparent' }}>Rent Rate / Day</th>
                    <th style={{ background: 'transparent' }}>Frequency Rented</th>
                    <th style={{ background: 'transparent' }}>Gross Earnings</th>
                    <th style={{ background: 'transparent' }}>Current Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedVehicles.map(v => {
                    const c = statusColors[v.status] || 'var(--text-color)';
                    const bg = statusBgs[v.status] || 'var(--surface-1)';
                    return (
                      <tr key={v._id}>
                        <td>
                          <div style={{
                            width: '72px', height: '48px',
                            backgroundColor: 'var(--surface-2)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {v.image ? (
                              <img
                                src={getImageUrl(v.image)}
                                alt={`${v.brand} ${v.name}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <Car size={20} style={{ opacity: 0.3 }} />
                            )}
                          </div>
                        </td>
                        <td>
                          <strong style={{ fontSize: '0.92rem' }}>{v.brand} {v.name}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'monospace' }}>{v.model}</div>
                        </td>
                        <td>
                          <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
                            {v.type}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.88rem' }}>{v.fuelType}</td>
                        <td>
                          <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-heading)' }}>
                            NRS {v.rentPerDay?.toLocaleString()}
                          </strong>
                        </td>
                        <td>
                          <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{v.rentCount}</span>
                          <span style={{ opacity: 0.5, fontSize: '0.75rem', marginLeft: '6px' }}>
                            ({v.totalBookings} times total)
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-heading)' }}>
                            NRS {v.revenue?.toLocaleString()}
                          </strong>
                        </td>
                        <td>
                          <span className="badge" style={{ borderColor: c, color: c, background: bg, fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
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

export default VehicleList;
