import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';

interface PaymentSchedule {
  monthNumber: number;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paymentDate: string | null;
  paidAmount: number | null;
}

interface SchemeDetail {
  membershipId: string;
  joinedDate: string;
  membershipStatus: string;
  schemeId: string;
  schemeName: string;
  totalAmount: number;
  duration: number;
  monthlyInstallment: number;
  chitFrequency: 'week' | 'month';
  chitType: 'fixed' | 'auction';
  startDate: string;
  endDate: string;
  schemeStatus: string;
  schedule: PaymentSchedule[];
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [schemes, setSchemes] = useState<SchemeDetail[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadCustomerDetail(id);
    }
  }, [id]);

  const loadCustomerDetail = async (customerId: string) => {
    try {
      setLoading(true);
      const data = await apiService.getCustomerDetail(customerId);
      setCustomer(data.customer);
      setSchemes(data.schemes);
    } catch (err: any) {
      setError(err.message || 'Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: { bg: string; color: string } } = {
      paid: { bg: '#d4edda', color: '#155724' },
      pending: { bg: '#fff3cd', color: '#856404' },
      overdue: { bg: '#f8d7da', color: '#721c24' }
    };
    const style = styles[status] || styles.pending;
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500',
        background: style.bg,
        color: style.color
      }}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  if (error || !customer) {
    return (
      <div>
        <div className="card" style={{ background: '#f8d7da', color: '#721c24' }}>
          {error || 'Customer not found'}
        </div>
        <Link to="/customers" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#333' }}>Customer Details</h1>
        <Link to="/customers" className="btn" style={{ background: '#6c757d', color: 'white', textDecoration: 'none' }}>
          ← Back to Customers
        </Link>
      </div>

      {/* Customer Info Card */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h2 style={{ marginTop: 0, color: '#007bff' }}>{customer.name}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <strong>Email:</strong> {customer.email}
          </div>
          <div>
            <strong>Phone:</strong> {customer.phone}
          </div>
          {customer.whatsappNumber && (
            <div>
              <strong>WhatsApp:</strong> {customer.whatsappNumber}
            </div>
          )}
          {customer.city && (
            <div>
              <strong>City:</strong> {customer.city}
            </div>
          )}
          <div>
            <strong>Address:</strong> {customer.address}
          </div>
          <div>
            <strong>Aadhar:</strong> {customer.aadharNumber}
          </div>
          <div>
            <strong>PAN:</strong> {customer.panNumber}
          </div>
          <div>
            <strong>Status:</strong>{' '}
            <span className={`badge ${customer.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
              {customer.status}
            </span>
          </div>
        </div>
      </div>

      {/* Schemes Summary */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginTop: 0 }}>
          Chit Schemes ({schemes.length})
        </h3>
        {schemes.length === 0 ? (
          <p style={{ color: '#666' }}>This customer is not enrolled in any chit schemes.</p>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {schemes.map((scheme, index) => {
              const paidCount = scheme.schedule.filter(s => s.status === 'paid').length;
              const pendingCount = scheme.schedule.filter(s => s.status === 'pending').length;
              const overdueCount = scheme.schedule.filter(s => s.status === 'overdue').length;
              const totalPaid = scheme.schedule
                .filter(s => s.status === 'paid' && s.paidAmount)
                .reduce((sum, s) => sum + (s.paidAmount || 0), 0);

              return (
                <div key={scheme.schemeId} style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '20px',
                  background: '#f8f9fa'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div>
                      <h4 style={{ margin: 0, color: '#007bff' }}>{scheme.schemeName}</h4>
                      <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                        Joined: {scheme.joinedDate} | 
                        {scheme.chitFrequency === 'week' ? ' Weekly' : ' Monthly'} | 
                        {scheme.chitType === 'fixed' ? ' Fixed' : ' Auction'}
                      </div>
                    </div>
                    <span className={`badge ${
                      scheme.schemeStatus === 'active' ? 'badge-success' :
                      scheme.schemeStatus === 'completed' ? 'badge-info' : 'badge-danger'
                    }`}>
                      {scheme.schemeStatus.toUpperCase()}
                    </span>
                  </div>

                  {/* Payment Summary */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '10px',
                    marginBottom: '20px',
                    padding: '10px',
                    background: 'white',
                    borderRadius: '4px'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Total Amount</div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{formatCurrency(scheme.totalAmount)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Installment</div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                        {formatCurrency(scheme.monthlyInstallment)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Paid</div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#28a745' }}>
                        {formatCurrency(totalPaid)} ({paidCount}/{scheme.duration})
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Pending</div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#ffc107' }}>
                        {pendingCount}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Overdue</div>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#dc3545' }}>
                        {overdueCount}
                      </div>
                    </div>
                  </div>

                  {/* Payment Schedule Table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ minWidth: '700px' }}>
                      <thead>
                        <tr>
                          <th>{scheme.chitFrequency === 'week' ? 'Week' : 'Month'}</th>
                          <th>Due Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Payment Date</th>
                          <th>Paid Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scheme.schedule.map((item) => (
                          <tr key={item.monthNumber}>
                            <td style={{ fontWeight: '600' }}>{item.monthNumber}</td>
                            <td>{item.dueDate}</td>
                            <td>{formatCurrency(item.amount)}</td>
                            <td>{getStatusBadge(item.status)}</td>
                            <td>{item.paymentDate || '-'}</td>
                            <td>{item.paidAmount ? formatCurrency(item.paidAmount) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

