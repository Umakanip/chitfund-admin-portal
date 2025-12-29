import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Customer, ChitScheme } from '../types';
import Pagination from '../components/Pagination';

export default function CustomerList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [schemes, setSchemes] = useState<ChitScheme[]>([]);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [selectedSchemes, setSelectedSchemes] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadCustomers();
    loadSchemes();
  }, []);

  const loadSchemes = async () => {
    try {
      const data = await apiService.getSchemes();
      setSchemes(data);
    } catch (error) {
      console.error('Failed to load schemes:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await apiService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter(customer => {
      const searchLower = searchTerm.toLowerCase();
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        (customer.phone && customer.phone.includes(searchTerm)) ||
        (customer.whatsappNumber && customer.whatsappNumber.includes(searchTerm))
      );
    });

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    return filtered;
  }, [customers, searchTerm, statusFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter(c => c.status === 'active').length;
    const inactive = customers.filter(c => c.status === 'inactive').length;
    return { total, active, inactive };
  }, [customers]);

  // Reset to page 1 when search term or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to page 1 if current page exceeds total pages (e.g., when filtering reduces results)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, filteredCustomers.length]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    setDeletingId(id);
    try {
      await apiService.deleteCustomer(id);
      await loadCustomers();
    } catch (error: any) {
      alert(error.message || 'Failed to delete customer');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSchemeToggle = (schemeId: string) => {
    setSelectedSchemes(prev => 
      prev.includes(schemeId) 
        ? prev.filter(id => id !== schemeId)
        : [...prev, schemeId]
    );
  };

  const handleAssignToSchemes = async (customerId: string) => {
    if (selectedSchemes.length === 0) {
      alert('Please select at least one scheme');
      return;
    }

    setAssigning(true);
    try {
      let successCount = 0;
      let errorCount = 0;
      const errorMessages: string[] = [];
      
      for (const schemeId of selectedSchemes) {
        try {
          const result = await apiService.addCustomersToScheme(schemeId, [customerId]);
          console.log('Assignment result for scheme', schemeId, ':', result);
          
          // Check if customer was actually added (added > 0)
          if (result && typeof result.added === 'number' && result.added > 0) {
            successCount++;
          } else {
            // Customer might already be a member or scheme is full
            const scheme = schemes.find(s => s.id === schemeId);
            const schemeName = scheme?.name || schemeId;
            if (result && result.skipped > 0) {
              errorMessages.push(`${schemeName}: Customer is already a member`);
            } else if (result && result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
              errorMessages.push(`${schemeName}: ${result.errors.join(', ')}`);
            } else {
              errorMessages.push(`${schemeName}: Could not be added (may already be a member)`);
            }
            errorCount++;
          }
        } catch (error: any) {
          console.error(`Failed to assign to scheme ${schemeId}:`, error);
          const scheme = schemes.find(s => s.id === schemeId);
          const schemeName = scheme?.name || schemeId;
          const errorMsg = error?.response?.data?.message || error?.message || 'Failed to assign';
          errorMessages.push(`${schemeName}: ${errorMsg}`);
          errorCount++;
        }
      }

      if (successCount > 0) {
        const message = `Successfully assigned to ${successCount} scheme(s)${errorCount > 0 ? `\n\nFailed:\n${errorMessages.join('\n')}` : ''}`;
        alert(message);
        // Reload schemes to update member counts
        await loadSchemes();
        setShowAssignModal(null);
        setSelectedSchemes([]);
      } else {
        const message = `Failed to assign customer to any scheme:\n\n${errorMessages.join('\n')}`;
        alert(message);
      }
    } catch (error: any) {
      console.error('Assignment error:', error);
      alert(error.message || 'Failed to assign customer to schemes');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, color: '#333' }}>Customers</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '10px 15px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              minWidth: '250px',
              maxWidth: '300px',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#007bff';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 123, 255, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#ddd';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseEnter={(e) => {
              if (document.activeElement !== e.currentTarget) {
                e.currentTarget.style.borderColor = '#007bff';
              }
            }}
            onMouseLeave={(e) => {
              if (document.activeElement !== e.currentTarget) {
                e.currentTarget.style.borderColor = '#ddd';
              }
            }}
          />
          <Link 
            to="/customers/add" 
            className="btn btn-primary"
            style={{ textDecoration: 'none', fontWeight: 'bold' }}
          >
            Add New Customer
          </Link>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      {/* <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div className="card" style={{
          borderLeft: '4px solid #007bff',
          padding: '15px 20px',
          cursor: 'pointer',
          transition: 'transform 0.2s',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Total Customers</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#007bff' }}>{stats.total}</div>
            </div>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'rgba(0, 123, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              👥
            </div>
          </div>
        </div>

        <div className="card" style={{
          borderLeft: '4px solid #28a745',
          padding: '15px 20px',
          cursor: 'pointer',
          transition: 'transform 0.2s',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }}
        onClick={() => setStatusFilter('active')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Active Customers</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#28a745' }}>{stats.active}</div>
            </div>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'rgba(40, 167, 69, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              ✓
            </div>
          </div>
        </div>

        <div className="card" style={{
          borderLeft: '4px solid #dc3545',
          padding: '15px 20px',
          cursor: 'pointer',
          transition: 'transform 0.2s',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }}
        onClick={() => setStatusFilter('inactive')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Inactive Customers</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc3545' }}>{stats.inactive}</div>
            </div>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: 'rgba(220, 53, 69, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              ⚠
            </div>
          </div>
        </div>
      </div> */}

      {/* Status Filter Chips */}
      <div className="card" style={{ marginBottom: '20px', padding: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',boxShadow: 'none' }}>
          <span style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>Filter by Status:</span>
          <button
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: '20px',
              background: statusFilter === 'all' ? '#007bff' : '#f0f0f0',
              color: statusFilter === 'all' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: statusFilter === 'all' ? '600' : '400',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (statusFilter !== 'all') {
                e.currentTarget.style.background = '#e0e0e0';
              }
            }}
            onMouseLeave={(e) => {
              if (statusFilter !== 'all') {
                e.currentTarget.style.background = '#f0f0f0';
              }
            }}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: '20px',
              background: statusFilter === 'active' ? '#28a745' : '#f0f0f0',
              color: statusFilter === 'active' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: statusFilter === 'active' ? '600' : '400',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (statusFilter !== 'active') {
                e.currentTarget.style.background = '#e0e0e0';
              }
            }}
            onMouseLeave={(e) => {
              if (statusFilter !== 'active') {
                e.currentTarget.style.background = '#f0f0f0';
              }
            }}
          >
            Active ({stats.active})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: '20px',
              background: statusFilter === 'inactive' ? '#dc3545' : '#f0f0f0',
              color: statusFilter === 'inactive' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: statusFilter === 'inactive' ? '600' : '400',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (statusFilter !== 'inactive') {
                e.currentTarget.style.background = '#e0e0e0';
              }
            }}
            onMouseLeave={(e) => {
              if (statusFilter !== 'inactive') {
                e.currentTarget.style.background = '#f0f0f0';
              }
            }}
          >
            Inactive ({stats.inactive})
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper" style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
          <table className="table" style={{ minWidth: '1200px', width: '100%', tableLayout: 'auto', whiteSpace: 'nowrap' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>WhatsApp</th>
              <th>City</th>
              <th>Address</th>
              <th>Aadhar</th>
              <th>PAN</th>
              <th>Status</th>
              <th>Joined Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '40px' }}>
                  {searchTerm ? 'No customers found matching your search' : 'No customers found'}
                </td>
              </tr>
            ) : (
              paginatedCustomers.map(customer => (
                <tr key={customer.id}>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: '500' }}>{customer.name}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{customer.email}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{customer.phone}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{customer.whatsappNumber || 'N/A'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{customer.city || 'N/A'}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={customer.address}>
                    {customer.address}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{customer.aadharNumber}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{customer.panNumber}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className={`badge ${customer.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{customer.createdAt}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => navigate(`/customers/edit/${customer.id}`)}
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
                        onClick={() => handleDelete(customer.id)}
                        style={{
                          padding: '8px',
                          border: 'none',
                          borderRadius: '6px',
                          background: deletingId === customer.id ? '#e9ecef' : '#ffe7e7',
                          color: deletingId === customer.id ? '#6c757d' : '#dc3545',
                          cursor: deletingId === customer.id ? 'not-allowed' : 'pointer',
                          fontSize: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '36px',
                          height: '36px',
                          transition: 'all 0.2s',
                          opacity: deletingId === customer.id ? 0.6 : 1,
                          boxShadow: 'none'
                        }}
                        disabled={deletingId === customer.id}
                        onMouseEnter={(e) => {
                          if (deletingId !== customer.id) {
                            e.currentTarget.style.background = '#dc3545';
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (deletingId !== customer.id) {
                            e.currentTarget.style.background = '#ffe7e7';
                            e.currentTarget.style.color = '#dc3545';
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }
                        }}
                        title={deletingId === customer.id ? 'Deleting...' : 'Delete'}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredCustomers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Assign to Schemes Modal */}
      {showAssignModal && (() => {
        const customer = customers.find(c => c.id === showAssignModal);
        return (
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
          }} onClick={() => setShowAssignModal(null)}>
            <div className="card" style={{
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative'
            }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ marginTop: 0 }}>Assign to Schemes</h2>
              {customer && (
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  Assign <strong>{customer.name}</strong> to one or more schemes
                </p>
              )}
              
              {/* Selected Schemes Display */}
              {selectedSchemes.length > 0 && (
                <div style={{
                  marginBottom: '15px',
                  padding: '10px',
                  background: '#e7f3ff',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  <strong>Selected ({selectedSchemes.length}):</strong>{' '}
                  {selectedSchemes.map(id => {
                    const scheme = schemes.find(s => s.id === id);
                    return scheme?.name;
                  }).filter(Boolean).join(', ')}
                </div>
              )}

              {/* Scheme List with Checkboxes */}
              <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
                {schemes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    No schemes found
                  </div>
                ) : (
                  schemes.map(scheme => {
                    const isFull = scheme.currentMembers >= scheme.totalMembers;
                    const isActive = scheme.status === 'active';
                    return (
                      <div key={scheme.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px',
                        borderBottom: '1px solid #eee',
                        cursor: isFull ? 'not-allowed' : 'pointer',
                        opacity: isFull ? 0.6 : 1,
                        background: isFull ? '#f5f5f5' : 'transparent'
                      }} onClick={() => !isFull && handleSchemeToggle(scheme.id)}>
                        <input
                          type="checkbox"
                          checked={selectedSchemes.includes(scheme.id)}
                          onChange={() => !isFull && handleSchemeToggle(scheme.id)}
                          onClick={(e) => e.stopPropagation()}
                          disabled={isFull}
                          style={{ marginRight: '10px', cursor: isFull ? 'not-allowed' : 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {scheme.name}
                            {isFull && <span style={{ fontSize: '11px', color: '#dc3545', fontWeight: 'normal' }}>(Full)</span>}
                            {!isActive && <span style={{ fontSize: '11px', color: '#6c757d', fontWeight: 'normal' }}>({scheme.status})</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Members: {scheme.currentMembers} / {scheme.totalMembers} | Amount: ₹{scheme.totalAmount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowAssignModal(null);
                    setSelectedSchemes([]);
                  }}
                  className="btn"
                  style={{ background: '#6c757d', color: 'white' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAssignToSchemes(showAssignModal)}
                  disabled={selectedSchemes.length === 0 || assigning}
                  className="btn btn-primary"
                >
                  {assigning ? 'Assigning...' : `Assign to ${selectedSchemes.length} Scheme(s)`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

