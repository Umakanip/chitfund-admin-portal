import { useEffect, useState, useMemo } from 'react';
import { apiService } from '../services/api';
import { Payment, ChitScheme } from '../types';
import Pagination from '../components/Pagination';

export default function PaymentList() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [schemes, setSchemes] = useState<ChitScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('');
  const [phoneSearchTerm, setPhoneSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadPayments();
    loadSchemes();
  }, []);

  const loadPayments = async () => {
    try {
      const data = await apiService.getPayments();
      setPayments(data);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSchemes = async () => {
    try {
      const data = await apiService.getSchemes();
      setSchemes(data);
    } catch (error) {
      console.error('Failed to load schemes:', error);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = payments.length;
    const paid = payments.filter(p => p.status === 'paid').length;
    const pending = payments.filter(p => p.status === 'pending').length;
    const overdue = payments.filter(p => p.status === 'overdue').length;
    return { total, paid, pending, overdue };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    let filtered = filter === 'all'
      ? payments
      : payments.filter(p => p.status === filter);
    
    // Filter by selected scheme
    if (selectedSchemeId) {
      filtered = filtered.filter(p => p.schemeId === selectedSchemeId);
    }
    
    // Filter by customer name search
    if (customerSearchTerm) {
      const searchLower = customerSearchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.customerName && p.customerName.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by phone number search
    if (phoneSearchTerm) {
      filtered = filtered.filter(p => 
        (p.customerPhone && p.customerPhone.includes(phoneSearchTerm))
      );
    }
    
    return filtered;
  }, [payments, filter, selectedSchemeId, customerSearchTerm, phoneSearchTerm]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, selectedSchemeId, customerSearchTerm, phoneSearchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex);

  // Reset to page 1 if current page exceeds total pages (e.g., when filtering reduces results)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, filteredPayments.length]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTotalAmount = () => {
    return filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  };

  const getTotalPaidAmount = () => {
    return filteredPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getTotalPendingAmount = () => {
    return filteredPayments
      .filter(p => p.status === 'pending' || p.status === 'overdue')
      .reduce((sum, p) => sum + p.amount, 0);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, color: '#333' }}>Reports</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#28a745',
            padding: '8px 16px',
            background: '#d4edda',
            borderRadius: '6px',
            border: '1px solid #c3e6cb'
          }}>
            Total Paid Amount: {formatCurrency(getTotalPaidAmount())}
          </div>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#ffc107',
            padding: '8px 16px',
            background: '#fff3cd',
            borderRadius: '6px',
            border: '1px solid #ffeaa7'
          }}>
            Total Pending Amount: {formatCurrency(getTotalPendingAmount())}
          </div>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#007bff',
            padding: '8px 16px',
            background: '#e7f3ff',
            borderRadius: '6px',
            border: '1px solid #b3d9ff'
          }}>
            Total Amount: {formatCurrency(getTotalAmount())}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px', padding: '15px' }}>
        {/* Scheme and Search Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', boxShadow: 'none', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', color: '#666', fontWeight: '500', whiteSpace: 'nowrap' }}>Filter by Scheme:</span>
            <select
              value={selectedSchemeId}
              onChange={(e) => setSelectedSchemeId(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                minWidth: '200px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="">All Schemes</option>
              {schemes.map(scheme => (
                <option key={scheme.id} value={scheme.id}>
                  {scheme.name}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '200px' }}>
            <span style={{ fontSize: '14px', color: '#666', fontWeight: '500', whiteSpace: 'nowrap' }}>Search Customer:</span>
            <input
              type="text"
              placeholder="Customer name..."
              value={customerSearchTerm}
              onChange={(e) => setCustomerSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                flex: '1',
                minWidth: '150px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '200px' }}>
            <span style={{ fontSize: '14px', color: '#666', fontWeight: '500', whiteSpace: 'nowrap' }}>Search Phone:</span>
            <input
              type="text"
              placeholder="Phone number..."
              value={phoneSearchTerm}
              onChange={(e) => setPhoneSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                flex: '1',
                minWidth: '150px'
              }}
            />
          </div>
        </div>
        
        {/* Status Filter Chips */}
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
            onClick={() => setFilter('paid')}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: '20px',
              background: filter === 'paid' ? '#28a745' : '#f0f0f0',
              color: filter === 'paid' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: filter === 'paid' ? '600' : '400',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (filter !== 'paid') {
                e.currentTarget.style.background = '#e0e0e0';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== 'paid') {
                e.currentTarget.style.background = '#f0f0f0';
              }
            }}
          >
            Paid ({stats.paid})
          </button>
          <button
            onClick={() => setFilter('pending')}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: '20px',
              background: filter === 'pending' ? '#ffc107' : '#f0f0f0',
              color: filter === 'pending' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: filter === 'pending' ? '600' : '400',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (filter !== 'pending') {
                e.currentTarget.style.background = '#e0e0e0';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== 'pending') {
                e.currentTarget.style.background = '#f0f0f0';
              }
            }}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: '20px',
              background: filter === 'overdue' ? '#dc3545' : '#f0f0f0',
              color: filter === 'overdue' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: filter === 'overdue' ? '600' : '400',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (filter !== 'overdue') {
                e.currentTarget.style.background = '#e0e0e0';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== 'overdue') {
                e.currentTarget.style.background = '#f0f0f0';
              }
            }}
          >
            Overdue ({stats.overdue})
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: '1400px' }}>
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>Payment ID</th>
                <th style={{ whiteSpace: 'nowrap' }}>Customer Name</th>
                <th style={{ whiteSpace: 'nowrap' }}>Phone</th>
                <th style={{ whiteSpace: 'nowrap' }}>Email</th>
                <th style={{ whiteSpace: 'nowrap' }}>Scheme Name</th>
                <th style={{ whiteSpace: 'nowrap' }}>Installment Amount</th>
                <th style={{ whiteSpace: 'nowrap' }}>Installment #</th>
                <th style={{ whiteSpace: 'nowrap' }}>Paid Amount</th>
                <th style={{ whiteSpace: 'nowrap' }}>Payment Date</th>
                <th style={{ whiteSpace: 'nowrap' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px' }}>
                    No payments found
                  </td>
                </tr>
              ) : (
                paginatedPayments.map(payment => (
                  <tr key={payment.id}>
                    <td style={{ whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>
                      #{payment.id}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: '500' }}>{payment.customerName || 'N/A'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{payment.customerPhone || 'N/A'}</td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>{payment.customerEmail || 'N/A'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{payment.schemeName || 'N/A'}</td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '13px', fontWeight: '500', color: '#495057' }}>
                      {payment.installmentAmount ? formatCurrency(payment.installmentAmount) : 'N/A'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        background: '#e7f3ff',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#007bff'
                      }}>
                        #{payment.month || 'N/A'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: '600', color: '#28a745' }}>
                      {formatCurrency(payment.amount)}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {payment.paymentDate 
                        ? new Date(payment.paymentDate).toLocaleDateString('en-IN', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })
                        : 'N/A'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        background: 
                          payment.status === 'paid' ? '#d4edda' :
                          payment.status === 'pending' ? '#fff3cd' :
                          '#f8d7da',
                        color: 
                          payment.status === 'paid' ? '#155724' :
                          payment.status === 'pending' ? '#856404' :
                          '#721c24'
                      }}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredPayments.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

