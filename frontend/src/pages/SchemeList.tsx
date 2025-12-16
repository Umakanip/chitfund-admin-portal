import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { ChitScheme } from '../types';

export default function SchemeList() {
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState<ChitScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadSchemes();
  }, []);

  const loadSchemes = async () => {
    try {
      const data = await apiService.getSchemes();
      setSchemes(data);
    } catch (error) {
      console.error('Failed to load schemes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchemes = useMemo(() => {
    return filter === 'all'
      ? schemes
      : schemes.filter(s => s.status === filter);
  }, [schemes, filter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = schemes.length;
    const active = schemes.filter(s => s.status === 'active').length;
    const completed = schemes.filter(s => s.status === 'completed').length;
    const cancelled = schemes.filter(s => s.status === 'cancelled').length;
    return { total, active, completed, cancelled };
  }, [schemes]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this scheme?')) {
      return;
    }

    setDeletingId(id);
    try {
      await apiService.deleteScheme(id);
      await loadSchemes();
    } catch (error: any) {
      alert(error.message || 'Failed to delete scheme');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, color: '#333' }}>Chit Schemes</h1>
        <Link 
          to="/schemes/add" 
          className="btn btn-primary"
          style={{ textDecoration: 'none', fontWeight: 'bold' }}
        >
          Create New Scheme
        </Link>
      </div>

      {/* Status Filter Chips */}
      <div className="card" style={{ marginBottom: '20px', padding: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', boxShadow: 'none' }}>
          <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Filter by Status:</span>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: '20px',
              background: filter === 'all' ? '#007bff' : '#f0f0f0',
              color: filter === 'all' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: filter === 'all' ? '600' : '400',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (filter !== 'all') {
                e.currentTarget.style.background = '#e0e0e0';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== 'all') {
                e.currentTarget.style.background = '#f0f0f0';
              }
            }}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('active')}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: '20px',
              background: filter === 'active' ? '#28a745' : '#f0f0f0',
              color: filter === 'active' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: filter === 'active' ? '600' : '400',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (filter !== 'active') {
                e.currentTarget.style.background = '#e0e0e0';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== 'active') {
                e.currentTarget.style.background = '#f0f0f0';
              }
            }}
          >
            Active ({stats.active})
          </button>
          <button
            onClick={() => setFilter('completed')}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: '20px',
              background: filter === 'completed' ? '#007bff' : '#f0f0f0',
              color: filter === 'completed' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: filter === 'completed' ? '600' : '400',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (filter !== 'completed') {
                e.currentTarget.style.background = '#e0e0e0';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== 'completed') {
                e.currentTarget.style.background = '#f0f0f0';
              }
            }}
          >
            Completed ({stats.completed})
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: '20px',
              background: filter === 'cancelled' ? '#dc3545' : '#f0f0f0',
              color: filter === 'cancelled' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: filter === 'cancelled' ? '600' : '400',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (filter !== 'cancelled') {
                e.currentTarget.style.background = '#e0e0e0';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== 'cancelled') {
                e.currentTarget.style.background = '#f0f0f0';
              }
            }}
          >
            Cancelled ({stats.cancelled})
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px'
      }}>
        {filteredSchemes.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            No schemes found
          </div>
        ) : (
          filteredSchemes.map(scheme => (
            <div key={scheme.id} className="card" style={{
              borderLeft: `4px solid ${
                scheme.status === 'active' ? '#28a745' :
                scheme.status === 'completed' ? '#007bff' : '#dc3545'
              }`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#333' }}>{scheme.name}</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => navigate(`/schemes/edit/${scheme.id}`)}
                    style={{
                      padding: '8px',
                      border: 'none',
                      borderRadius: '6px',
                      background: '#e7f3ff',
                      color: '#007bff',
                      cursor: 'pointer',
                      fontSize: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      transition: 'all 0.2s',
                      position: 'relative',
                      boxShadow: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#007bff';
                      e.currentTarget.style.color = 'white';
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#e7f3ff';
                      e.currentTarget.style.color = '#007bff';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(scheme.id)}
                    style={{
                      padding: '8px',
                      border: 'none',
                      borderRadius: '6px',
                      background: deletingId === scheme.id ? '#e9ecef' : '#ffe7e7',
                      color: deletingId === scheme.id ? '#6c757d' : '#dc3545',
                      cursor: deletingId === scheme.id ? 'not-allowed' : 'pointer',
                      fontSize: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '36px',
                      height: '36px',
                      transition: 'all 0.2s',
                      opacity: deletingId === scheme.id ? 0.6 : 1,
                      boxShadow: 'none'
                    }}
                    disabled={deletingId === scheme.id}
                    onMouseEnter={(e) => {
                      if (deletingId !== scheme.id) {
                        e.currentTarget.style.background = '#dc3545';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (deletingId !== scheme.id) {
                        e.currentTarget.style.background = '#ffe7e7';
                        e.currentTarget.style.color = '#dc3545';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }
                    }}
                    title={deletingId === scheme.id ? 'Deleting...' : 'Delete'}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <span className={`badge ${
                  scheme.status === 'active' ? 'badge-success' :
                  scheme.status === 'completed' ? 'badge-info' : 'badge-danger'
                }`}>
                  {scheme.status.toUpperCase()}
                </span>
              </div>
              <div style={{ color: '#666', lineHeight: '1.8' }}>
                <p style={{ margin: '5px 0' }}>
                  <strong>Total Amount:</strong> {formatCurrency(scheme.totalAmount)}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Installment ({scheme.chitFrequency === 'week' ? 'Week' : 'Month'}):</strong> {formatCurrency(scheme.monthlyInstallment)}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Duration:</strong> {scheme.duration} months
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Chit Frequency:</strong> {scheme.chitFrequency === 'week' ? 'Week' : 'Month'}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Chit Type:</strong> {scheme.chitType === 'fixed' ? 'Fixed' : 'Auction'}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Members:</strong> {scheme.currentMembers} / {scheme.totalMembers}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Start Date:</strong> {scheme.startDate}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>End Date:</strong> {scheme.endDate}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
        Showing {filteredSchemes.length} of {schemes.length} schemes
      </div>
    </div>
  );
}

