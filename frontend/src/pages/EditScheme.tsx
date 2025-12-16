import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';

export default function EditScheme() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    totalAmount: '',
    duration: '',
    monthlyInstallment: '',
    startDate: '',
    endDate: '',
    chitFrequency: 'month' as 'week' | 'month',
    chitType: 'auction' as 'fixed' | 'auction',
    totalMembers: '',
    currentMembers: '',
    status: 'active' as 'active' | 'completed' | 'cancelled'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadScheme();
  }, [id]);

  const loadScheme = async () => {
    if (!id) {
      navigate('/schemes');
      return;
    }

    try {
      const scheme = await apiService.getSchemeById(id);
      if (scheme) {
        setFormData({
          name: scheme.name,
          totalAmount: String(scheme.totalAmount),
          duration: String(scheme.duration),
          monthlyInstallment: String(scheme.monthlyInstallment),
          startDate: scheme.startDate,
          endDate: scheme.endDate,
          chitFrequency: scheme.chitFrequency || 'month',
          chitType: scheme.chitType || 'auction',
          totalMembers: String(scheme.totalMembers),
          currentMembers: String(scheme.currentMembers),
          status: scheme.status
        });
      } else {
        setError('Scheme not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load scheme');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updatedFormData = {
        ...prev,
        [name]: value
      };
      
      // Auto-calculate installment if total amount, duration, and frequency are provided
      if (name === 'totalAmount' || name === 'duration' || name === 'chitFrequency') {
        const totalAmount = name === 'totalAmount' ? parseFloat(value) : parseFloat(updatedFormData.totalAmount);
        const duration = name === 'duration' ? parseInt(value) : parseInt(updatedFormData.duration);
        const frequency = name === 'chitFrequency' ? value : updatedFormData.chitFrequency;
        
        if (totalAmount && duration && duration > 0) {
          let installment = 0;
          if (frequency === 'week') {
            // For weekly: total amount divided by (duration in months * 4 weeks per month)
            installment = totalAmount / (duration * 4);
          } else {
            // For monthly: total amount divided by duration in months
            installment = totalAmount / duration;
          }
          
          updatedFormData.monthlyInstallment = installment.toFixed(2);
        }
      }

      // Auto-calculate end date if start date and duration are provided
      if (name === 'startDate' || name === 'duration') {
        const startDate = name === 'startDate' ? value : updatedFormData.startDate;
        const duration = name === 'duration' ? parseInt(value) : parseInt(updatedFormData.duration);
        if (startDate && duration) {
          const start = new Date(startDate);
          start.setMonth(start.getMonth() + duration);
          const endDate = start.toISOString().split('T')[0];
          updatedFormData.endDate = endDate;
        }
      }
      
      return updatedFormData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setError('');
    setSaving(true);

    try {
      await apiService.updateScheme(id, {
        name: formData.name,
        totalAmount: parseFloat(formData.totalAmount),
        duration: parseInt(formData.duration),
        monthlyInstallment: parseFloat(formData.monthlyInstallment),
        startDate: formData.startDate,
        endDate: formData.endDate,
        chitFrequency: formData.chitFrequency,
        chitType: formData.chitType,
        totalMembers: parseInt(formData.totalMembers),
        currentMembers: parseInt(formData.currentMembers),
        status: formData.status
      });
      navigate('/schemes');
    } catch (err: any) {
      setError(err.message || 'Failed to update scheme');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '20px', color: '#333' }}>Edit Chit Scheme</h1>

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
          {/* Row 1: Scheme Name (Full Width) */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label>Scheme Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Monthly Chit Scheme - 1 Lakh"
            />
          </div>

          {/* Row 2: Total Amount, Duration, Monthly Installment */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label>Total Amount (₹) *</label>
              <input
                type="number"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                required
                min="1000"
                step="1000"
                placeholder="100000"
              />
            </div>

            <div className="form-group">
              <label>Duration (months) *</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                required
                min="1"
                placeholder="12"
              />
            </div>

            <div className="form-group">
              <label>
                Installment ({formData.chitFrequency === 'week' ? 'Week' : 'Month'}) (₹) *
              </label>
              <input
                type="number"
                name="monthlyInstallment"
                value={formData.monthlyInstallment}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="Auto-calculated"
              />
            </div>
          </div>

          {/* Row 3: Start Date, End Date, Chit Frequency */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>End Date *</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Chit Frequency *</label>
              <select
                name="chitFrequency"
                value={formData.chitFrequency}
                onChange={handleChange}
                required
              >
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
          </div>

          {/* Row 4: Chit Type, Total Members, Current Members */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label>Chit Type *</label>
              <select
                name="chitType"
                value={formData.chitType}
                onChange={handleChange}
                required
              >
                <option value="fixed">Fixed</option>
                <option value="auction">Auction</option>
              </select>
            </div>

            <div className="form-group">
              <label>Total Members *</label>
              <input
                type="number"
                name="totalMembers"
                value={formData.totalMembers}
                onChange={handleChange}
                required
                min="1"
                placeholder="20"
              />
            </div>

            <div className="form-group">
              <label>Current Members</label>
              <input
                type="number"
                name="currentMembers"
                value={formData.currentMembers}
                onChange={handleChange}
                min="0"
                placeholder="0"
              />
            </div>
          </div>

          {/* Row 5: Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label>Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
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
              {saving ? 'Updating...' : 'Update Scheme'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/schemes')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

