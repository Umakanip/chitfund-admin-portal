import { useEffect, useState, useMemo } from 'react';
import { apiService } from '../services/api';
import { Payment } from '../types';
import Pagination from '../components/Pagination';

export default function PaymentList() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    loadPayments();
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

  // Calculate statistics
  const stats = useMemo(() => {
    const total = payments.length;
    const paid = payments.filter(p => p.status === 'paid').length;
    const pending = payments.filter(p => p.status === 'pending').length;
    const overdue = payments.filter(p => p.status === 'overdue').length;
    return { total, paid, pending, overdue };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return filter === 'all'
      ? payments
      : payments.filter(p => p.status === filter);
  }, [payments, filter]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

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

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, color: '#333' }}>Payments</h1>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
          Total: {formatCurrency(getTotalAmount())}
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
        <table className="table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Scheme Name</th>
              <th>Amount</th>
              <th>Month</th>
              <th>Payment Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPayments.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                  No payments found
                </td>
              </tr>
            ) : (
              paginatedPayments.map(payment => (
                <tr key={payment.id}>
                  <td>{payment.customerName}</td>
                  <td>{payment.schemeName}</td>
                  <td>{formatCurrency(payment.amount)}</td>
                  <td>Month {payment.month}</td>
                  <td>{payment.paymentDate || 'N/A'}</td>
                  <td>
                    <span className={`badge ${
                      payment.status === 'paid' ? 'badge-success' :
                      payment.status === 'pending' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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

