import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

export default function AddCustomer() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    aadharNumber: '',
    panNumber: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiService.addCustomer(formData);
      navigate('/customers');
    } catch (err: any) {
      setError(err.message || 'Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '20px', color: '#333' }}>Add New Customer</h1>

      {error && (
        <div className="card" style={{
          background: '#f8d7da',
          color: '#721c24',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Row 1: Name, Email, Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter customer full name"
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter email address"
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Enter phone number"
                pattern="[0-9]{10}"
              />
            </div>
          </div>

          {/* Row 2: Address (Full Width) */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Address *</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="Enter address"
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '16px'
              }}
            />
          </div>

          {/* Row 3: Aadhar, PAN, Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label>Aadhar Number *</label>
              <input
                type="text"
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={handleChange}
                required
                placeholder="XXXX-XXXX-XXXX"
                pattern="[0-9]{4}-[0-9]{4}-[0-9]{4}"
              />
            </div>

            <div className="form-group">
              <label>PAN Number *</label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleChange}
                required
                placeholder="ABCDE1234F"
                pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-group">
              <label>Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add Customer'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/customers')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

