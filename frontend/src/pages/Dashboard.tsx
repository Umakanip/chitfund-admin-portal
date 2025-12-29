import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { Customer, ChitScheme, Payment } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeSchemes: 0,
    totalPayments: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [customers, schemes, payments] = await Promise.all([
        apiService.getCustomers(),
        apiService.getSchemes(),
        apiService.getPayments()
      ]);

      setStats({
        totalCustomers: customers.length,
        activeSchemes: schemes.filter(s => s.status === 'active').length,
        totalPayments: payments.length,
        pendingPayments: payments.filter(p => p.status === 'pending').length
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  const statCards = [
    { title: 'Total Customers', value: stats.totalCustomers, color: '#007bff', link: '/customers' },
    { title: 'Active Schemes', value: stats.activeSchemes, color: '#28a745', link: '/schemes' },
    { title: 'Total Payments', value: stats.totalPayments, color: '#ffc107', link: '/payments' },
    { title: 'Pending Payments', value: stats.pendingPayments, color: '#dc3545', link: '/payments' }
  ];

  return (
    <div>
      <h1 style={{ marginBottom: '30px', color: '#333' }}>Dashboard</h1>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {statCards.map((card, index) => (
          <Link
            key={index}
            to={card.link}
            style={{ textDecoration: 'none' }}
          >
            <div className="card" style={{
              borderLeft: `4px solid ${card.color}`,
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <h3 style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px', fontWeight: '500' }}>
                {card.title}
              </h3>
              <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: card.color }}>
                {card.value}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <h2 style={{ marginBottom: '15px', color: '#333' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link to="/customers/add" className="btn btn-primary" style={{ textAlign: 'center', textDecoration: 'none' }}>
              Add New Customer
            </Link>
            <Link to="/schemes/add" className="btn btn-primary" style={{ textAlign: 'center', textDecoration: 'none' }}>
              Create New Scheme
            </Link>
            <Link to="/payments" className="btn btn-secondary" style={{ textAlign: 'center', textDecoration: 'none' }}>
              View Payments
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '15px', color: '#333' }}>Recent Activity</h2>
          <div style={{ color: '#666' }}>
            <p>• Welcome to Chit Fund Admin Portal</p>
            <p>• Manage customers, schemes, and payments</p>
            <p>• Use the navigation menu to access different sections</p>
            <p>• All data is currently mocked for frontend development</p>
          </div>
        </div>
      </div>
    </div>
  );
}

