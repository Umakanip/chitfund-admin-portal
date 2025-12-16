import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { Customer, ChitScheme } from '../types';

export default function EditCustomer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    address: '',
    city: '',
    aadharNumber: '',
    panNumber: '',
    schemeId: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [schemes, setSchemes] = useState<ChitScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSchemes, setLoadingSchemes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSchemes();
    loadCustomer();
  }, [id]);

  const loadSchemes = async () => {
    try {
      const data = await apiService.getSchemes();
      // Filter only active schemes
      const activeSchemes = data.filter(s => s.status === 'active');
      setSchemes(activeSchemes);
    } catch (err) {
      console.error('Failed to load schemes:', err);
    } finally {
      setLoadingSchemes(false);
    }
  };

  const loadCustomer = async () => {
    if (!id) {
      navigate('/customers');
      return;
    }

    try {
      const customer = await apiService.getCustomerById(id);
      if (customer) {
        setFormData({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          whatsappNumber: customer.whatsappNumber || '',
          address: customer.address,
          city: customer.city || '',
          aadharNumber: customer.aadharNumber,
          panNumber: customer.panNumber,
          schemeId: customer.schemeId || '',
          status: customer.status
        });
      } else {
        setError('Customer not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setError('');
    setSaving(true);

    try {
      await apiService.updateCustomer(id, formData);
      navigate('/customers');
    } catch (err: any) {
      setError(err.message || 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '20px', color: '#333' }}>Edit Customer</h1>

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

          {/* Row 2: WhatsApp Number, City */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label>WhatsApp Number</label>
              <input
                type="tel"
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleChange}
                placeholder="Enter WhatsApp number"
                pattern="[0-9]{10}"
              />
            </div>

            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Enter city"
              />
            </div>

            <div className="form-group">
              {/* Empty space for alignment */}
            </div>
          </div>

          {/* Row 3: Address (Full Width) */}
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

          {/* Row 4: Chit Scheme Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label>Chit Scheme</label>
              {loadingSchemes ? (
                <select disabled>
                  <option>Loading schemes...</option>
                </select>
              ) : (
                <select
                  name="schemeId"
                  value={formData.schemeId}
                  onChange={handleChange}
                >
                  <option value="">No scheme selected</option>
                  {schemes.map(scheme => (
                    <option key={scheme.id} value={scheme.id}>
                      {scheme.name} - ₹{scheme.totalAmount.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              )}
              {schemes.length === 0 && !loadingSchemes && (
                <small style={{ color: '#dc3545', display: 'block', marginTop: '5px' }}>
                  No active schemes available.
                </small>
              )}
            </div>

            <div className="form-group">
              {/* Empty space for alignment */}
            </div>

            <div className="form-group">
              {/* Empty space for alignment */}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Updating...' : 'Update Customer'}
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

