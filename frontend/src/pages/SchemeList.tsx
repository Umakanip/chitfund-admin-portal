import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { ChitScheme, Customer } from '../types';

export default function SchemeList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [schemes, setSchemes] = useState<ChitScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddCustomersModal, setShowAddCustomersModal] = useState<string | null>(null);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [addingCustomers, setAddingCustomers] = useState(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('');

  useEffect(() => {
    loadSchemes();
    loadCustomers();
  }, []);

  // Refresh schemes when navigating to this page
  useEffect(() => {
    if (location.pathname === '/schemes' || location.pathname === '/schemes/') {
      loadSchemes(false); // Don't show loading spinner on refresh
    }
  }, [location.pathname]);

  // Refresh schemes when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadSchemes(false); // Don't show loading spinner on refresh
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadSchemes = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const data = await apiService.getSchemes();
      setSchemes(data);
    } catch (error) {
      console.error('Failed to load schemes:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await apiService.getCustomers();
      setAllCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const filteredSchemes = useMemo(() => {
    let filtered = filter === 'all'
      ? schemes
      : schemes.filter(s => s.status === filter);
    
    // Filter by selected scheme if one is selected
    if (selectedSchemeId) {
      filtered = filtered.filter(s => s.id === selectedSchemeId);
    }
    
    return filtered;
  }, [schemes, filter, selectedSchemeId]);

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

  const handleCustomerToggle = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleAddCustomers = async (schemeId: string) => {
    if (selectedCustomers.length === 0) {
      alert('Please select at least one customer');
      return;
    }

    setAddingCustomers(true);
    try {
      const result = await apiService.addCustomersToScheme(schemeId, selectedCustomers);
      alert(result.message || `Added ${result.added} customer(s) successfully`);
      setShowAddCustomersModal(null);
      setSelectedCustomers([]);
      await loadSchemes();
    } catch (error: any) {
      alert(error.message || 'Failed to add customers');
    } finally {
      setAddingCustomers(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, color: '#333' }}>Chit Schemes</h1>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedSchemeId}
            onChange={(e) => setSelectedSchemeId(e.target.value)}
            style={{
              padding: '10px 15px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              minWidth: '250px',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">All Schemes</option>
            {schemes.map(scheme => (
              <option key={scheme.id} value={scheme.id}>
                {scheme.name} - {formatCurrency(scheme.totalAmount)}
              </option>
            ))}
          </select>
          <Link 
            to="/schemes/add" 
            className="btn btn-primary"
            style={{ textDecoration: 'none', fontWeight: 'bold' }}
          >
            Create New Scheme
          </Link>
        </div>
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
                      e.currentTarget.style.background = '#0056b3';
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
                  <strong>Duration:</strong> {scheme.duration} {scheme.chitFrequency === 'week' ? 'weeks' : 'months'}
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
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <button
                  onClick={() => {
                    setSelectedCustomers([]);
                    setShowAddCustomersModal(scheme.id);
                  }}
                  disabled={scheme.currentMembers >= scheme.totalMembers}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: scheme.currentMembers >= scheme.totalMembers ? 0.6 : 1,
                    cursor: scheme.currentMembers >= scheme.totalMembers ? 'not-allowed' : 'pointer'
                  }}
                  title={scheme.currentMembers >= scheme.totalMembers ? 'Scheme is full. Cannot assign more members.' : 'Assign members to this scheme'}
                >
                  {scheme.currentMembers >= scheme.totalMembers ? 'Scheme Full' : 'Assign Members'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
        Showing {filteredSchemes.length} of {schemes.length} schemes
      </div>

      {/* Add Customers Modal */}
      {showAddCustomersModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowAddCustomersModal(null)}>
          <div className="card" style={{
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Add Customers to Scheme</h2>
            
            {/* Selected Customers Display */}
            {selectedCustomers.length > 0 && (
              <div style={{
                marginBottom: '15px',
                padding: '10px',
                background: '#e7f3ff',
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                <strong>Selected ({selectedCustomers.length}):</strong>{' '}
                {selectedCustomers.map(id => {
                  const customer = allCustomers.find(c => c.id === id);
                  return customer?.name;
                }).filter(Boolean).join(', ')}
              </div>
            )}

            {/* Customer List with Checkboxes */}
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
              {allCustomers.filter(c => c.status === 'active').map(customer => (
                <div key={customer.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer'
                }} onClick={() => handleCustomerToggle(customer.id)}>
                  <input
                    type="checkbox"
                    checked={selectedCustomers.includes(customer.id)}
                    onChange={() => handleCustomerToggle(customer.id)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ marginRight: '10px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>{customer.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {customer.email} | {customer.phone}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddCustomersModal(null);
                  setSelectedCustomers([]);
                }}
                className="btn"
                style={{ background: '#6c757d', color: 'white' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddCustomers(showAddCustomersModal)}
                disabled={selectedCustomers.length === 0 || addingCustomers}
                className="btn btn-primary"
              >
                {addingCustomers ? 'Adding...' : `Add ${selectedCustomers.length} Customer(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

