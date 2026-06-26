import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShieldAlert, Car, MapPin, Users, Package,
  Plus, Trash2, Edit2, X, Check, Upload,
  Search, ArrowRight, Eye, ShieldCheck, HelpCircle,
  Layers, Database, Calendar, Settings, ChevronRight
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ─────────── Helpers ─────────── */
const getToken = () => localStorage.getItem('token');
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${API_URL}/${cleanPath}`;
};

/* ─────────── Sub-panels ─────────── */

/** Vehicle Management Panel */
const VehiclePanel = ({ vehicles, loading, onRefresh }) => {
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [form, setForm] = useState({
    name: '', type: 'Car', brand: '', model: '',
    fuelType: 'Petrol', rentPerDay: '', fuelEfficiency: '15', status: 'available'
  });

  const [previewSrc, setPreviewSrc] = useState('');

  useEffect(() => {
    if (!imageFile) {
      setPreviewSrc('');
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewSrc(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const editingVehicle = vehicles.find(v => v._id === editingId);
  const currentImageUrl = previewSrc || (editingVehicle?.image ? getImageUrl(editingVehicle.image) : '');

  const resetForm = () => {
    setForm({ name: '', type: 'Car', brand: '', model: '', fuelType: 'Petrol', rentPerDay: '', fuelEfficiency: '15', status: 'available' });
    setImageFile(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (v) => {
    setForm({ name: v.name, type: v.type, brand: v.brand, model: v.model, fuelType: v.fuelType, rentPerDay: v.rentPerDay, fuelEfficiency: v.fuelEfficiency, status: v.status });
    setEditingId(v._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (imageFile) fd.append('image', imageFile);

    try {
      if (editingId) {
        await axios.put(`${API_URL}/api/vehicles/${editingId}`, fd, { headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' } });
        addToast('Vehicle updated successfully', 'success');
      } else {
        await axios.post(`${API_URL}/api/vehicles`, fd, { headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' } });
        addToast('Vehicle added successfully', 'success');
      }
      resetForm();
      onRefresh();
    } catch (err) {
      addToast(err.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this vehicle?')) return;
    try {
      await axios.delete(`${API_URL}/api/vehicles/${id}`, { headers: authHeaders() });
      addToast('Vehicle deleted', 'success');
      onRefresh();
    } catch (err) {
      addToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  // Search and filters logic
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || v.type === filterType;
    const matchesStatus = filterStatus === 'All' || v.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const statusColors = {
    available: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399' },
    rented: { border: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)', text: '#a5b4fc' },
    maintenance: { border: '#fbbf24', bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24' }
  };

  return (
    <div style={{ animation: 'fadeIn 0.35s ease' }}>
      {/* Title Bar & Search Control */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '24px', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--accent-primary)" />
              <span>Fleet Inventory ({filteredVehicles.length} / {vehicles.length})</span>
            </h2>
            <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '2px' }}>Create, update, or remove rental fleet vehicles.</p>
          </div>
          
          <button 
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }} 
            className="btn" 
            style={{ 
              padding: '10px 20px', 
              fontSize: '0.8rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            {showForm ? <><X size={14} /><span>Close Form</span></> : <><Plus size={14} /><span>Add Vehicle</span></>}
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, brand, model..." 
              style={{ paddingLeft: '38px', marginBottom: 0, fontSize: '0.85rem', height: '42px' }}
            />
          </div>
          
          <div style={{ width: '140px' }}>
            <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value)}
              style={{ marginBottom: 0, fontSize: '0.85rem', height: '42px', padding: '10px 14px' }}
            >
              <option value="All">All Classes</option>
              {['Bike', 'Car', 'SUV', 'EV'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ width: '150px' }}>
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              style={{ marginBottom: 0, fontSize: '0.85rem', height: '42px', padding: '10px 14px' }}
            >
              <option value="All">All Status</option>
              {['available', 'rented', 'maintenance'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '28px', borderLeft: '4px solid var(--accent-primary)', animation: 'slideDown 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }} />
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', fontWeight: 700, margin: 0 }}>
              {editingId ? 'Edit Vehicle Details' : 'Register New Fleet Vehicle'}
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start' }}>
            <form onSubmit={handleSubmit} style={{ flex: '1 1 500px', margin: 0 }}>
              <div className="grid-cols-3">
                <div>
                  <label>Vehicle Name</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Model Y" required />
                </div>
                <div>
                  <label>Brand</label>
                  <input value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} placeholder="e.g. Tesla" required />
                </div>
                <div>
                  <label>Model / Year</label>
                  <input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} placeholder="e.g. 2023 Long Range" required />
                </div>
              </div>
              
              <div className="grid-cols-3">
                <div>
                  <label>Class Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                    {['Bike', 'Car', 'SUV', 'EV'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label>Fuel Type</label>
                  <select value={form.fuelType} onChange={e => setForm(p => ({ ...p, fuelType: e.target.value }))}>
                    {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label>Availability Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    {['available', 'rented', 'maintenance'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid-cols-3">
                <div>
                  <label>Daily Rent (NRS)</label>
                  <input type="number" value={form.rentPerDay} onChange={e => setForm(p => ({ ...p, rentPerDay: e.target.value }))} placeholder="e.g. 2500" required />
                </div>
                <div>
                  <label>Fuel Efficiency (km/l)</label>
                  <input type="number" value={form.fuelEfficiency} onChange={e => setForm(p => ({ ...p, fuelEfficiency: e.target.value }))} placeholder="e.g. 18" />
                </div>
                <div>
                  <label>Vehicle Photo</label>
                  <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => setImageFile(e.target.files[0])} 
                      style={{ 
                        position: 'absolute', 
                        inset: 0, 
                        opacity: 0, 
                        cursor: 'pointer',
                        zIndex: 10,
                        marginBottom: 0
                      }} 
                    />
                    <div style={{
                      background: 'var(--surface-1)',
                      border: '1px dashed var(--border-strong)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '11px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '0.85rem',
                      color: imageFile ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      transition: 'all 0.2s'
                    }}>
                      <Upload size={14} />
                      <span>{imageFile ? imageFile.name : 'Choose File...'}</span>
                    </div>
                  </div>
                  <div style={{ height: '20px' }}></div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" className="btn" style={{ padding: '11px 24px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Check size={14} /><span>{editingId ? 'Update Vehicle' : 'Register Vehicle'}</span>
                </button>
                <button type="button" onClick={resetForm} className="btn btn-secondary" style={{ padding: '11px 20px', fontSize: '0.85rem' }}>Cancel</button>
              </div>
            </form>

            {/* Premium Live Vehicle Card Preview */}
            <div style={{
              flex: '0 0 320px',
              minWidth: '280px',
              background: 'var(--surface-2)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: 'var(--shadow-md)',
              alignSelf: 'stretch'
            }}>
              <h4 style={{ 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                color: 'var(--accent-primary)', 
                letterSpacing: '0.05em',
                margin: 0
              }}>
                Live Vehicle Card Preview
              </h4>
              
              <div style={{
                height: '180px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {currentImageUrl ? (
                  <img 
                    src={currentImageUrl} 
                    alt="Vehicle preview" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} 
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Car size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <p style={{ fontSize: '0.75rem' }}>No Photo Selected</p>
                  </div>
                )}
              </div>

              <div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <span className="badge" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{form.type}</span>
                  <span className="badge" style={{ 
                    fontSize: '0.68rem', 
                    padding: '2px 8px', 
                    textTransform: 'capitalize',
                    ...(form.status === 'available' ? { borderColor: '#10b981', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' } :
                       form.status === 'rented' ? { borderColor: '#6366f1', background: 'rgba(99, 102, 241, 0.12)', color: '#a5b4fc' } :
                       { borderColor: '#fbbf24', background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' })
                  }}>{form.status}</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', margin: '0 0 6px 0', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                  {form.brand || 'Brand'} {form.name || 'Vehicle Name'}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                  Model: {form.model || 'Model Details'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Daily Rent</span>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-heading)' }}>
                      NRS {form.rentPerDay ? Number(form.rentPerDay).toLocaleString() : '0'}
                    </strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Specs</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {form.fuelType} · {form.fuelEfficiency || '—'} km/l
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vehicles Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="pulse" style={{ height: '80px', background: 'var(--surface-1)', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.6 }}>
          <Car size={36} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
          <p style={{ fontWeight: 600 }}>No vehicles found matching the active filters.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)' }}>
          <table style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
            <thead>
              <tr>
                <th style={{ background: 'transparent' }}>Image</th>
                <th style={{ background: 'transparent' }}>Vehicle info</th>
                <th style={{ background: 'transparent' }}>Category</th>
                <th style={{ background: 'transparent' }}>Fuel Specs</th>
                <th style={{ background: 'transparent' }}>Rate/Day</th>
                <th style={{ background: 'transparent' }}>Status</th>
                <th style={{ background: 'transparent', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map(v => {
                const s = statusColors[v.status] || { border: 'var(--border-default)', bg: 'var(--surface-1)', text: 'var(--text-color)' };
                return (
                  <tr key={v._id}>
                    <td>
                      <div style={{
                        width: '120px', height: '75px',
                        backgroundColor: 'var(--surface-2)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        {v.image ? (
                          <img 
                            src={getImageUrl(v.image)} 
                            alt={v.name} 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'contain',
                              padding: '4px',
                              transition: 'transform 0.3s ease'
                            }} 
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <Car size={24} style={{ opacity: 0.2 }} />
                        )}
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{v.brand} {v.name}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'monospace' }}>{v.model}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
                        {v.type}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{v.fuelType}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{v.fuelEfficiency || '—'} km/l</div>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-heading)' }}>NRS {v.rentPerDay?.toLocaleString()}</strong>
                    </td>
                    <td>
                      <span className="badge" style={{ borderColor: s.border, background: s.bg, color: s.text, fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                        {v.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleEdit(v)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '4px' }}>
                          <Edit2 size={12} /><span>Edit</span>
                        </button>
                        <button onClick={() => handleDelete(v._id)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '4px', border: '1px solid rgba(244, 63, 94, 0.2)', color: '#fb7185' }}>
                          <Trash2 size={12} /><span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/** Location Branch Management Panel */
const LocationPanel = ({ locations, loading, onRefresh }) => {
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [form, setForm] = useState({ name: '', latitude: '', longitude: '' });

  const resetForm = () => {
    setForm({ name: '', latitude: '', longitude: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (loc) => {
    setForm({ name: loc.name, latitude: loc.latitude, longitude: loc.longitude });
    setEditingId(loc._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/api/locations/${editingId}`, form, { headers: authHeaders() });
        addToast('Branch updated successfully', 'success');
      } else {
        await axios.post(`${API_URL}/api/locations`, form, { headers: authHeaders() });
        addToast('Branch created successfully', 'success');
      }
      resetForm();
      onRefresh();
    } catch (err) {
      addToast(err.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this branch?')) return;
    try {
      await axios.delete(`${API_URL}/api/locations/${id}`, { headers: authHeaders() });
      addToast('Branch deleted', 'success');
      onRefresh();
    } catch (err) {
      addToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const filteredLocations = locations.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeIn 0.35s ease' }}>
      {/* Search Header */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '24px', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="var(--accent-cyan)" />
              <span>Rental Branches ({filteredLocations.length} / {locations.length})</span>
            </h2>
            <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '2px' }}>Manage branch locations and pickup coordinates.</p>
          </div>
          
          <button 
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }} 
            className="btn" 
            style={{ 
              padding: '10px 20px', 
              fontSize: '0.8rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            {showForm ? <><X size={14} /><span>Close Form</span></> : <><Plus size={14} /><span>Add Branch</span></>}
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search branch by name..." 
              style={{ paddingLeft: '38px', marginBottom: 0, fontSize: '0.85rem', height: '42px' }}
            />
          </div>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '28px', borderLeft: '4px solid var(--accent-cyan)', animation: 'slideDown 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)' }} />
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
              {editingId ? 'Edit Location Details' : 'Register New Rental Branch'}
            </h3>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid-cols-3">
              <div>
                <label>Branch Name</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Airport Terminal" required />
              </div>
              <div>
                <label>Latitude</label>
                <input type="number" step="0.000001" value={form.latitude} onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))} placeholder="27.698012" required />
              </div>
              <div>
                <label>Longitude</label>
                <input type="number" step="0.000001" value={form.longitude} onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))} placeholder="85.359045" required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button type="submit" className="btn" style={{ padding: '11px 24px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={14} /><span>{editingId ? 'Update Branch' : 'Register Branch'}</span>
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary" style={{ padding: '11px 20px', fontSize: '0.85rem' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2].map(i => (
            <div key={i} className="pulse" style={{ height: '70px', background: 'var(--surface-1)', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.6 }}>
          <MapPin size={36} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
          <p style={{ fontWeight: 600 }}>No branch locations found.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)' }}>
          <table style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
            <thead>
              <tr>
                <th style={{ background: 'transparent' }}>Branch Name</th>
                <th style={{ background: 'transparent' }}>Latitude</th>
                <th style={{ background: 'transparent' }}>Longitude</th>
                <th style={{ background: 'transparent' }}>Vehicles Linked</th>
                <th style={{ background: 'transparent', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.map(loc => (
                <tr key={loc._id}>
                  <td>
                    <strong style={{ fontSize: '0.95rem' }}>{loc.name}</strong>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{loc.latitude}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{loc.longitude}</td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(34, 211, 238, 0.08)', color: 'var(--accent-cyan)', borderColor: 'rgba(34, 211, 238, 0.25)' }}>
                      {loc.availableVehicles?.length || 0} Vehicles
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleEdit(loc)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '4px' }}>
                        <Edit2 size={12} /><span>Edit</span>
                      </button>
                      <button onClick={() => handleDelete(loc._id)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '4px', border: '1px solid rgba(244, 63, 94, 0.2)', color: '#fb7185' }}>
                        <Trash2 size={12} /><span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/** All Bookings Panel (admin-only) */
const BookingsPanel = ({ bookings, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const statusStyles = {
    Confirmed: { border: '#10b981', color: '#34d399', bg: 'rgba(16, 185, 129, 0.12)' },
    Completed: { border: '#3b82f6', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.12)' },
    Cancelled: { border: '#ef4444', color: '#f87171', bg: 'rgba(239, 68, 68, 0.12)' },
    Pending: { border: '#f59e0b', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.12)' }
  };

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

  return (
    <div style={{ animation: 'fadeIn 0.35s ease' }}>
      {/* Search Header */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: '24px', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={18} color="var(--accent-secondary)" />
              <span>All System Bookings ({filteredBookings.length} / {bookings.length})</span>
            </h2>
            <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '2px' }}>Review, track, and monitor reservation history across your rental company.</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by Booking ID, customer email, vehicle name..." 
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

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="pulse" style={{ height: '78px', background: 'var(--surface-1)', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.6 }}>
          <Package size={36} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
          <p style={{ fontWeight: 600 }}>No bookings found matching filters.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', background: 'var(--glass-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)' }}>
          <table style={{ margin: 0, border: 'none', boxShadow: 'none' }}>
            <thead>
              <tr>
                <th style={{ background: 'transparent' }}>Booking ID</th>
                <th style={{ background: 'transparent' }}>User Profile</th>
                <th style={{ background: 'transparent' }}>Vehicle booked</th>
                <th style={{ background: 'transparent' }}>Rent Period</th>
                <th style={{ background: 'transparent' }}>Total price</th>
                <th style={{ background: 'transparent' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(b => {
                const s = statusStyles[b.bookingStatus] || { border: 'var(--border-default)', color: 'var(--text-color)', bg: 'var(--surface-1)' };
                return (
                  <tr key={b._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{b.bookingId || '—'}</td>
                    <td>
                      <strong style={{ fontSize: '0.9rem' }}>{b.user?.name || 'Guest User'}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{b.user?.email || '—'}</div>
                    </td>
                    <td>
                      <strong>{b.vehicle?.brand} {b.vehicle?.name}</strong>
                      <div style={{ marginTop: '2px' }}>
                        <span className="badge" style={{ fontSize: '0.65rem', padding: '1px 6px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>{b.vehicle?.type}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      <strong>{formatDate(b.pickupDate)}</strong>
                      <div style={{ color: 'var(--text-muted)', marginTop: '1px' }}>to {formatDate(b.returnDate)}</div>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-heading)' }}>NRS {b.totalPrice?.toLocaleString()}</strong>
                    </td>
                    <td>
                      <span className="badge" style={{ borderColor: s.border, color: s.color, background: s.bg, fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                        {b.bookingStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ─────────── Main Admin Page ─────────── */
const TABS = [
  { key: 'vehicles', label: 'Fleet & Cars', icon: Car, color: 'var(--accent-primary)' },
  { key: 'locations', label: 'Branch network', icon: MapPin, color: 'var(--accent-cyan)' },
  { key: 'bookings', label: 'All Reservations', icon: Package, color: 'var(--accent-secondary)' },
];

const Admin = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('vehicles');
  
  // Dashboard overall counts
  const [vehicles, setVehicles] = useState([]);
  const [locations, setLocations] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);

  const fetchVehicles = useCallback(async () => {
    setLoadingVehicles(true);
    try {
      const res = await axios.get(`${API_URL}/api/vehicles`);
      if (res.data.success) setVehicles(res.data.data);
    } catch { 
      addToast('Failed to fetch vehicles', 'error'); 
    } finally { 
      setLoadingVehicles(false); 
    }
  }, [addToast]);

  const fetchLocations = useCallback(async () => {
    setLoadingLocations(true);
    try {
      const res = await axios.get(`${API_URL}/api/locations`);
      if (res.data.success) setLocations(res.data.data);
    } catch { 
      addToast('Failed to fetch locations', 'error'); 
    } finally { 
      setLoadingLocations(false); 
    }
  }, [addToast]);

  const fetchBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const res = await axios.get(`${API_URL}/api/bookings`, { headers: authHeaders() });
      if (res.data.success) setBookings(res.data.data);
    } catch { 
      addToast('Failed to fetch bookings', 'error'); 
    } finally { 
      setLoadingBookings(false); 
    }
  }, [addToast]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchVehicles();
      fetchLocations();
      fetchBookings();
    }
  }, [user, fetchVehicles, fetchLocations, fetchBookings]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="container" style={{ marginTop: '80px', textAlign: 'center', opacity: 0.6 }}>
        <ShieldAlert size={48} style={{ margin: '0 auto 16px auto', color: 'var(--accent-rose)' }} />
        <p style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', fontWeight: 600 }}>Access Denied. Admin Privileges Required.</p>
        <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '8px' }}>Please login with an administrator account to view this dashboard.</p>
      </div>
    );
  }

  // Quick stats calculations
  const availableCount = vehicles.filter(v => v.status === 'available').length;
  const maintenanceCount = vehicles.filter(v => v.status === 'maintenance').length;
  const pendingReservations = bookings.filter(b => b.bookingStatus === 'Pending').length;

  return (
    <div className="container" style={{ marginTop: '40px', paddingBottom: '80px' }}>
      
      {/* Dashboard Top Header Banner */}
      <div className="card" style={{ 
        position: 'relative', 
        overflow: 'hidden', 
        marginBottom: '36px', 
        borderLeft: '4px solid var(--accent-primary)',
        background: 'var(--gradient-card)'
      }}>
        {/* Glow orb */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-default)',
          }}>
            <ShieldAlert size={20} color="var(--accent-primary)" />
          </div>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.8rem', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              System <span className="text-gradient">Administration</span>
            </h1>
          </div>
        </div>
        <p style={{ opacity: 0.65, fontSize: '0.95rem', maxWidth: '720px', lineHeight: '1.5' }}>
          Control and monitor global rental operations. Oversee branch distribution, configure the fleet, and audit client bookings.
        </p>
      </div>

      {/* Modern Dashboard Stats Grid */}
      <div className="grid-cols-3" style={{ marginBottom: '32px' }}>
        
        {/* Stat Item 1 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '24px', background: 'var(--glass-bg)' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Car size={22} color="var(--accent-primary)" />
          </div>
          <div>
            <label style={{ margin: 0, fontSize: '0.7rem' }}>Total Active Fleet</label>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
              {loadingVehicles ? '...' : vehicles.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{availableCount} available</span> • {maintenanceCount} under repair
            </div>
          </div>
        </div>

        {/* Stat Item 2 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '24px', background: 'var(--glass-bg)' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(34, 211, 238, 0.1)', border: '1px solid rgba(34, 211, 238, 0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MapPin size={22} color="var(--accent-cyan)" />
          </div>
          <div>
            <label style={{ margin: 0, fontSize: '0.7rem' }}>Rental Branches</label>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
              {loadingLocations ? '...' : locations.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Distributed vehicle hub nodes
            </div>
          </div>
        </div>

        {/* Stat Item 3 */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '24px', background: 'var(--glass-bg)' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Package size={22} color="var(--accent-secondary)" />
          </div>
          <div>
            <label style={{ margin: 0, fontSize: '0.7rem' }}>Total System Bookings</label>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)', marginTop: '2px' }}>
              {loadingBookings ? '...' : bookings.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>{pendingReservations} pending approval</span>
            </div>
          </div>
        </div>

      </div>

      {/* Custom Sleek Admin Navigation Tabs */}
      <div className="card" style={{ padding: '6px', background: 'var(--surface-1)', marginBottom: '32px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: '1 1 120px',
                  background: isActive ? 'var(--surface-3)' : 'none',
                  border: 'none',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  opacity: isActive ? 1 : 0.65,
                  transition: 'all 0.2s ease',
                  borderBottom: isActive ? `2px solid ${tab.color}` : '2px solid transparent',
                  boxShadow: isActive ? 'inset 0 1px 0 0 rgba(255,255,255,0.05)' : 'none'
                }}
              >
                <Icon size={15} color={isActive ? tab.color : 'var(--text-secondary)'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Panel Render */}
      <div style={{ marginTop: '16px' }}>
        {activeTab === 'vehicles' && (
          <VehiclePanel 
            vehicles={vehicles} 
            loading={loadingVehicles} 
            onRefresh={fetchVehicles} 
          />
        )}
        {activeTab === 'locations' && (
          <LocationPanel 
            locations={locations} 
            loading={loadingLocations} 
            onRefresh={fetchLocations} 
          />
        )}
        {activeTab === 'bookings' && (
          <BookingsPanel 
            bookings={bookings} 
            loading={loadingBookings} 
          />
        )}
      </div>

      {/* Embedded Animations Styling */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

    </div>
  );
};

export default Admin;
