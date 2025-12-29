import { useEffect, useState, useMemo } from 'react';
import { apiService } from '../services/api';
import { ChitScheduleGroup, ChitSchedule as ChitScheduleType, ChitScheme, Customer } from '../types';
import Pagination from '../components/Pagination';

interface MemberSummary {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  allocationCount: number;
}

export default function ChitSchedule() {
  const [scheduleGroups, setScheduleGroups] = useState<ChitScheduleGroup[]>([]);
  const [schemes, setSchemes] = useState<ChitScheme[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<{ customerId: string; amount: string; date: string }>({
    customerId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [schemeMembers, setSchemeMembers] = useState<Customer[]>([]);
  const [memberSummary, setMemberSummary] = useState<MemberSummary[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [showAddCustomersModal, setShowAddCustomersModal] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [addingCustomers, setAddingCustomers] = useState(false);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerPayments, setCustomerPayments] = useState<any[]>([]);
  const [editingPayment, setEditingPayment] = useState<{ installmentNumber: number; amount: string; date: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSchemeId && schemes.length > 0) {
      loadSchedule(selectedSchemeId);
      loadMemberSummary(selectedSchemeId);
      setCurrentPage(1); // Reset to first page when scheme changes
      setSelectedCustomerId(null); // Reset selected customer when scheme changes
      // Load all payments for this scheme
      loadAllPaymentsForScheme(selectedSchemeId);
    }
  }, [selectedSchemeId, schemes]);

  // Reload payments when customer is selected
  useEffect(() => {
    if (selectedCustomerId && selectedSchemeId) {
      loadAllPaymentsForScheme(selectedSchemeId);
    }
  }, [selectedCustomerId, selectedSchemeId]);

  const loadAllPaymentsForScheme = async (schemeId: string) => {
    try {
      const payments = await apiService.getPayments();
      const filteredPayments = payments.filter(
        (p: any) => p.schemeId === schemeId || p.scheme_id === schemeId
      );
      setCustomerPayments(filteredPayments);
    } catch (err: any) {
      console.error('Failed to load payments:', err);
      setCustomerPayments([]);
    }
  };

  const loadData = async () => {
    try {
      const [schemesData, customersData] = await Promise.all([
        apiService.getSchemes(),
        apiService.getCustomers()
      ]);
      setSchemes(schemesData);
      setCustomers(customersData);
      setAllCustomers(customersData);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      setLoading(false);
    }
  };

  const loadSchedule = async (schemeId: string) => {
    try {
      const schedules = await apiService.getSchedules(schemeId) as ChitScheduleType[];
      const scheme = schemes.find(s => s.id === schemeId);
      
      if (scheme) {
        // Load members of this scheme using dedicated API
        try {
          const members = await apiService.getSchemeMembers(schemeId);
          console.log(`Loaded ${members.length} members for scheme ${schemeId}:`, members);
          setSchemeMembers(members);
        } catch (err) {
          console.error('Failed to load scheme members:', err);
          setSchemeMembers([]);
        }
        
        // Ensure we have all months (1 to duration)
        const allSchedules: ChitScheduleType[] = [];
        for (let month = 1; month <= scheme.duration; month++) {
          const existing = schedules.find(s => s.monthNumber === month);
          if (existing) {
            allSchedules.push(existing);
          } else {
            allSchedules.push({
              id: '',
              schemeId,
              monthNumber: month,
              status: 'pending',
              allocationType: 'pending'
            });
          }
        }
        
        setScheduleGroups([{
          schemeId,
          schemeName: scheme.name,
          duration: scheme.duration,
          totalAmount: scheme.totalAmount,
          chitType: scheme.chitType,
          chitFrequency: scheme.chitFrequency,
          schedules: allSchedules
        }]);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load schedule';
      setError(errorMsg);
    }
  };

  const handleGenerateSchedule = async (schemeId: string) => {
    if (!window.confirm('Generate schedule for this scheme? This will create rows for all months.')) {
      return;
    }

    try {
      setError('');
      await apiService.generateSchedule(schemeId);
      await loadSchedule(schemeId);
      alert('Schedule generated successfully!');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to generate schedule';
      setError(errorMsg);
      alert(errorMsg);
    }
  };

  const handleEditSchedule = (schedule: ChitScheduleType | { id?: string; customerId?: string; amountReceived?: number; allocationDate?: string }) => {
    if (!schedule.id) {
      // If schedule doesn't exist, we need to create it first
      // For now, we'll use a temporary ID based on the row
      const tempId = `temp-${schedule.customerId || 'new'}`;
      setEditingSchedule(tempId);
    } else {
      setEditingSchedule(schedule.id);
    }
    setEditingData({
      customerId: schedule.customerId || '',
      amount: schedule.amountReceived ? schedule.amountReceived.toString() : '',
      date: schedule.allocationDate || new Date().toISOString().split('T')[0]
    });
  };

  const handleCancelEdit = () => {
    setEditingSchedule(null);
    setEditingData({ customerId: '', amount: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleSaveAllocation = async (scheduleId: string) => {
    if (!editingData.customerId) {
      alert('Please select a customer');
      return;
    }

    try {
      setSaving(scheduleId);
      setError('');
      await apiService.allocateSchedule(
        scheduleId,
        editingData.customerId,
        editingData.date,
        editingData.amount ? parseFloat(editingData.amount) : undefined
      );
      await loadSchedule(selectedSchemeId);
      setEditingSchedule(null);
      setEditingData({ customerId: '', amount: '', date: new Date().toISOString().split('T')[0] });
      alert('Customer allocated successfully!');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to allocate customer';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setSaving(null);
    }
  };

  const handleRemoveAllocation = async (scheduleId: string) => {
    if (!window.confirm('Remove customer allocation for this month?')) {
      return;
    }

    try {
      setSaving(scheduleId);
      setError('');
      // Update schedule to remove customer allocation
      await apiService.allocateSchedule(scheduleId, '', '', undefined);
      await loadSchedule(selectedSchemeId);
      alert('Allocation removed successfully!');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to remove allocation';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setSaving(null);
    }
  };

  const loadMemberSummary = async (schemeId: string) => {
    try {
      const summary = await apiService.getMemberSummary(schemeId);
      setMemberSummary(summary.members || []);
    } catch (err: any) {
      console.error('Failed to load member summary:', err);
    }
  };

  const loadCustomerPayments = async (customerId: string, schemeId: string) => {
    try {
      // Load payments for this customer and scheme
      const payments = await apiService.getPayments();
      const filteredPayments = payments.filter(
        (p: any) => p.customerId === customerId && p.schemeId === schemeId
      );
      setCustomerPayments(filteredPayments);
    } catch (err: any) {
      console.error('Failed to load customer payments:', err);
      setCustomerPayments([]);
    }
  };

  const handleCustomerClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  const handleBackToCustomers = () => {
    setSelectedCustomerId(null);
  };

  const handlePaymentEntry = async (installmentNumber: number, amount: string, date: string) => {
    if (!selectedCustomerId || !selectedSchemeId) return;
    
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    try {
      // Create payment
      await apiService.createPayment({
        customerId: selectedCustomerId,
        schemeId: selectedSchemeId,
        amount: parseFloat(amount),
        paymentDate: date,
        installmentNumber
      });
      
      // Reload payments for the scheme to update the UI
      // Use a small delay to ensure the database has been updated
      await new Promise(resolve => setTimeout(resolve, 100));
      await loadAllPaymentsForScheme(selectedSchemeId);
      
      // Clear editing state
      setEditingPayment(null);
      
      // Show success message
      alert('Payment recorded successfully!');
    } catch (err: any) {
      alert('Failed to record payment: ' + (err.message || 'Unknown error'));
    }
  };

  const handleAutoAllocate = async (schemeId: string) => {
    if (!window.confirm('Auto allocate all members to remaining months? This will distribute all active members across unallocated months.')) {
      return;
    }

    try {
      setError('');
      setLoading(true);
      const result = await apiService.autoAllocateMembers(schemeId);
      await loadSchedule(schemeId);
      await loadMemberSummary(schemeId);
      
      // Show summary
      let summaryMsg = result.message + '\n\n';
      if (result.summary && result.summary.length > 0) {
        summaryMsg += 'Allocation Summary:\n';
        result.summary.forEach((item: any) => {
          summaryMsg += `- ${item.customerName}: ${item.allocations} month(s)\n`;
        });
      }
      
      alert(summaryMsg);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to auto allocate members';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReallocateAll = async (schemeId: string) => {
    if (!window.confirm('Re-allocate all members? This will CLEAR all existing allocations and redistribute all members fairly across all months. Continue?')) {
      return;
    }

    try {
      setError('');
      setLoading(true);
      const result = await apiService.reallocateAllMembers(schemeId);
      await loadSchedule(schemeId);
      
      // Show summary
      let summaryMsg = result.message + '\n\n';
      if (result.summary && result.summary.length > 0) {
        summaryMsg += 'Re-allocation Summary:\n';
        result.summary.forEach((item: any) => {
          summaryMsg += `- ${item.customerName}: ${item.allocations} month(s)\n`;
        });
      }
      
      alert(summaryMsg);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to reallocate all members';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerToggle = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleAddCustomers = async () => {
    if (!selectedSchemeId) {
      alert('Please select a scheme first');
      return;
    }

    if (selectedCustomers.length === 0) {
      alert('Please select at least one customer');
      return;
    }

    setAddingCustomers(true);
    try {
      const result = await apiService.addCustomersToScheme(selectedSchemeId, selectedCustomers);
      alert(result.message || `Added ${result.added} customer(s) successfully`);
      setShowAddCustomersModal(false);
      setSelectedCustomers([]);
      await loadSchedule(selectedSchemeId);
    } catch (error: any) {
      alert(error.message || 'Failed to add customers');
    } finally {
      setAddingCustomers(false);
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
      pending: { bg: '#fff3cd', color: '#856404' },
      allocated: { bg: '#d4edda', color: '#155724' },
      completed: { bg: '#d1ecf1', color: '#0c5460' },
      cancelled: { bg: '#f8d7da', color: '#721c24' }
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

  // Generate schedule rows: members × duration
  const scheduleRows = useMemo(() => {
    if (!selectedSchemeId || schemeMembers.length === 0) {
      return [];
    }

    const scheme = schemes.find(s => s.id === selectedSchemeId);
    if (!scheme) return [];

    // Calculate duration in periods (weeks or months)
    const duration = scheme.chitFrequency === 'week' 
      ? scheme.duration * 4 // Convert months to weeks (approximate)
      : scheme.duration; // Keep as months

    const rows: Array<{
      memberId: string;
      memberName: string;
      memberPhone: string;
      memberEmail: string;
      period: number;
      periodLabel: string;
      scheduleId?: string;
      customerId?: string;
      allocationType?: string;
      allocationDate?: string;
      amountReceived?: number;
      status?: string;
    }> = [];

    // Generate rows for each member × each period
    for (let period = 1; period <= duration; period++) {
      for (const member of schemeMembers) {
        // Find matching schedule if exists
        const schedule = scheduleGroups[0]?.schedules.find(
          s => s.monthNumber === period && s.customerId === member.id
        );

        rows.push({
          memberId: member.id,
          memberName: member.name,
          memberPhone: member.phone,
          memberEmail: member.email,
          period: period,
          periodLabel: scheme.chitFrequency === 'week' ? `Week ${period}` : `Month ${period}`,
          scheduleId: schedule?.id,
          customerId: schedule?.customerId,
          allocationType: schedule?.allocationType,
          allocationDate: schedule?.allocationDate,
          amountReceived: schedule?.amountReceived,
          status: schedule?.status || 'pending'
        });
      }
    }

    return rows;
  }, [selectedSchemeId, schemeMembers, schemes, scheduleGroups]);

  // Pagination calculations
  const totalRows = scheduleRows.length;
  const totalPages = Math.ceil(totalRows / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRows = scheduleRows.slice(startIndex, endIndex);

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, scheduleRows.length]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, color: '#333' }}>Chit Schedule</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={selectedSchemeId}
            onChange={(e) => setSelectedSchemeId(e.target.value)}
            style={{
              padding: '10px 15px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              minWidth: '250px'
            }}
          >
            <option value="">Select a Chit Scheme</option>
            {schemes.filter(s => s.status === 'active').map(scheme => (
              <option key={scheme.id} value={scheme.id}>
                {scheme.name} - {scheme.duration} months
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="card" style={{ background: '#f8d7da', color: '#721c24', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Show Customer List or Installment Table based on selection */}
      {selectedSchemeId && !selectedCustomerId && (() => {
        const selectedScheme = schemes.find(s => s.id === selectedSchemeId);
        if (!selectedScheme) return null;
        
        const duration = selectedScheme.chitFrequency === 'week' 
          ? (selectedScheme.duration || 0) * 4 
          : (selectedScheme.duration || 0);
        
        return (
          <div>
            {/* Scheme Details */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#007bff', marginBottom: '15px' }}>{selectedScheme.name}</h2>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '14px', color: '#666' }}>
                <span><strong>Duration:</strong> {selectedScheme.chitFrequency === 'week' ? `${duration} weeks` : `${selectedScheme.duration} months`}</span>
                <span><strong>Total Amount:</strong> {formatCurrency(selectedScheme.totalAmount)}</span>
                <span><strong>Type:</strong> {selectedScheme.chitType === 'fixed' ? 'Fixed' : 'Auction'}</span>
              </div>
            </div>

            {/* Customer List Table */}
            <div className="card">
              <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Customers</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ minWidth: '800px' }}>
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Phone Number</th>
                      <th>WhatsApp Number</th>
                      <th>Due Date</th>
                      <th>Total Amount Paid</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemeMembers.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                          No customers found for this scheme
                        </td>
                      </tr>
                    ) : (
                      schemeMembers.map((member) => {
                        // Calculate payment summary for this customer
                        // Filter payments for this customer and sum all amounts
                        const memberPayments = customerPayments.filter((p: any) => {
                          const customerMatch = String(p.customerId || p.customer_id) === String(member.id);
                          return customerMatch;
                        });
                        
                        // Sum all payment amounts for this customer across all installments
                        const totalPaid = memberPayments.reduce((sum: number, p: any) => {
                          return sum + (Number(p.amount) || 0);
                        }, 0);
                        
                        const installmentAmount = selectedScheme.monthlyInstallment || 0;
                        const totalDue = duration * installmentAmount;
                        const remaining = totalDue - totalPaid;
                        
                        // Determine status: Paid if fully paid, Partial if some payment but not full, Pending if no payment
                        let status = 'Pending';
                        if (remaining <= 0) {
                          status = 'Paid';
                        } else if (totalPaid > 0 && totalPaid < totalDue) {
                          status = 'Partial';
                        } else {
                          status = 'Pending';
                        }
                        
                        // Show entry number if customer appears multiple times
                        const displayName = (member as any).totalEntriesForCustomer > 1 
                          ? `${member.name} (Entry #${(member as any).entryNumber})`
                          : member.name;
                        
                        return (
                          <tr 
                            key={(member as any).entryId || member.id}
                            onClick={() => handleCustomerClick(member.id)}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f5f5f5';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <td style={{ whiteSpace: 'nowrap', fontWeight: '500' }}>{displayName}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{member.phone}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>{member.whatsappNumber || '-'}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              {/* Calculate next due date based on scheme start */}
                              {(() => {
                                if (!selectedScheme.startDate) return '-';
                                const startDate = new Date(selectedScheme.startDate);
                                const paidCount = memberPayments.length;
                                if (selectedScheme.chitFrequency === 'week') {
                                  startDate.setDate(startDate.getDate() + paidCount * 7);
                                } else {
                                  startDate.setMonth(startDate.getMonth() + paidCount);
                                }
                                return startDate.toISOString().split('T')[0];
                              })()}
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>{formatCurrency(totalPaid)}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                background: status === 'Paid' ? '#d4edda' : status === 'Partial' ? '#fff3cd' : '#f8d7da',
                                color: status === 'Paid' ? '#155724' : status === 'Partial' ? '#856404' : '#721c24'
                              }}>
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Show Installment/Payment Table when customer is selected */}
      {selectedCustomerId && selectedSchemeId && (() => {
        const selectedScheme = schemes.find(s => s.id === selectedSchemeId);
        const selectedCustomer = schemeMembers.find(m => m.id === selectedCustomerId);
        const duration = selectedScheme?.chitFrequency === 'week' 
          ? (selectedScheme?.duration || 0) * 4 
          : (selectedScheme?.duration || 0);
        const installmentAmount = selectedScheme?.monthlyInstallment || 0;
        
        // Generate installment rows
        const installmentRows = [];
        const schemeStartDate = selectedScheme?.startDate ? new Date(selectedScheme.startDate) : new Date();
        
        for (let i = 1; i <= duration; i++) {
          // Find all payments for this installment (match by month/installmentNumber field)
          // Check both customerId formats and installment number formats
          // Sum all payments for this installment in case there are multiple records
          const payments = customerPayments.filter((p: any) => {
            const customerMatch = String(p.customerId || p.customer_id) === String(selectedCustomerId);
            const installmentMatch = 
              Number(p.month) === i || 
              Number(p.installmentNumber) === i || 
              Number(p.installment_number) === i;
            return customerMatch && installmentMatch;
          });
          
          // Sum all payment amounts for this installment
          const paidAmount = payments.reduce((sum: number, p: any) => {
            return sum + (Number(p.amount) || 0);
          }, 0);
          
          // Get the most recent payment date
          const latestPayment = payments.length > 0 
            ? payments.reduce((latest: any, current: any) => {
                const currentDate = current.paymentDate || current.payment_date || current.date || '';
                const latestDate = latest.paymentDate || latest.payment_date || latest.date || '';
                return currentDate > latestDate ? current : latest;
              })
            : null;
          
          // Calculate due date based on frequency
          const dueDate = new Date(schemeStartDate);
          if (selectedScheme?.chitFrequency === 'week') {
            dueDate.setDate(dueDate.getDate() + (i - 1) * 7);
          } else {
            dueDate.setMonth(dueDate.getMonth() + (i - 1));
          }
          
          // Format payment date if it exists
          let formattedPaymentDate = '';
          
          if (latestPayment && latestPayment.paymentDate) {
            const paymentDateValue = latestPayment.paymentDate || latestPayment.payment_date || latestPayment.date || '';
            if (paymentDateValue) {
              // If it's already a date string, use it; otherwise format it
              formattedPaymentDate = typeof paymentDateValue === 'string' 
                ? paymentDateValue.split('T')[0] // Extract date part if it includes time
                : new Date(paymentDateValue).toISOString().split('T')[0];
            }
          }
          
          // Determine status based on payment amount and due date
          let status = 'Pending';
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time to compare dates only
          const dueDateOnly = new Date(dueDate);
          dueDateOnly.setHours(0, 0, 0, 0);
          
          if (paidAmount >= installmentAmount) {
            // Fully paid
            status = 'Paid';
          } else if (paidAmount > 0 && paidAmount < installmentAmount) {
            // Partially paid - check if overdue
            if (dueDateOnly < today) {
              status = 'Overdue';
            } else {
              status = 'Pending';
            }
          } else {
            // Not paid at all - check if overdue
            if (dueDateOnly < today) {
              status = 'Overdue';
            } else {
              status = 'Pending';
            }
          }
          
          installmentRows.push({
            installmentNumber: i,
            dueDate: dueDate.toISOString().split('T')[0],
            installmentAmount,
            paidAmount,
            paymentDate: formattedPaymentDate,
            status
          });
        }
        
        if (!selectedScheme || !selectedCustomer) return null;
        
        return (
          <div>
            {/* Back Button and Customer Info */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <button
                onClick={handleBackToCustomers}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginBottom: '15px'
                }}
              >
                ← Back to Customers
              </button>
              <h2 style={{ margin: 0, color: '#007bff' }}>{selectedCustomer.name} - {selectedScheme.name}</h2>
              <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                <span><strong>Phone:</strong> {selectedCustomer?.phone}</span>
                <span style={{ marginLeft: '20px' }}><strong>Email:</strong> {selectedCustomer?.email}</span>
              </div>
            </div>

            {/* Installment/Payment Table */}
            <div className="card">
              <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Installment Details ({duration} {selectedScheme?.chitFrequency === 'week' ? 'Weeks' : 'Months'})</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ minWidth: '1000px' }}>
                  <thead>
                    <tr>
                      <th>Installment #</th>
                      <th>Due Date</th>
                      <th>Installment Amount</th>
                      <th>Amount Paid</th>
                      <th>Payment Date</th>
                      <th>Status</th>
                      <th>Enter Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installmentRows.map((row) => (
                      <tr key={row.installmentNumber}>
                        <td style={{ fontWeight: '600', textAlign: 'center', whiteSpace: 'nowrap' }}>{row.installmentNumber}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{row.dueDate || '-'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatCurrency(row.installmentAmount)}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{row.paidAmount > 0 ? formatCurrency(row.paidAmount) : '-'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{row.paymentDate || '-'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            background: 
                              row.status === 'Paid' ? '#d4edda' : 
                              row.status === 'Overdue' ? '#f8d7da' : 
                              '#fff3cd',
                            color: 
                              row.status === 'Paid' ? '#155724' : 
                              row.status === 'Overdue' ? '#721c24' : 
                              '#856404'
                          }}>
                            {row.status}
                          </span>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {editingPayment?.installmentNumber === row.installmentNumber ? (
                            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                              <input
                                type="number"
                                placeholder="Amount"
                                value={editingPayment.amount}
                                onChange={(e) => setEditingPayment({ ...editingPayment, amount: e.target.value })}
                                style={{
                                  padding: '4px 8px',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  width: '100px'
                                }}
                              />
                              <input
                                type="date"
                                value={editingPayment.date}
                                onChange={(e) => setEditingPayment({ ...editingPayment, date: e.target.value })}
                                style={{
                                  padding: '4px 8px',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                  fontSize: '12px'
                                }}
                              />
                              <button
                                onClick={() => {
                                  if (editingPayment.amount && editingPayment.date) {
                                    handlePaymentEntry(row.installmentNumber, editingPayment.amount, editingPayment.date);
                                  }
                                }}
                                style={{
                                  padding: '4px 8px',
                                  background: '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingPayment(null)}
                                style={{
                                  padding: '4px 8px',
                                  background: '#6c757d',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingPayment({ 
                                installmentNumber: row.installmentNumber, 
                                amount: row.paidAmount > 0 ? String(row.installmentAmount - row.paidAmount) : '', 
                                date: new Date().toISOString().split('T')[0] 
                              })}
                              disabled={row.status === 'Paid'}
                              style={{
                                padding: '4px 8px',
                                background: row.status === 'Paid' ? '#6c757d' : '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: row.status === 'Paid' ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                opacity: row.status === 'Paid' ? 0.6 : 1
                              }}
                            >
                              {row.status === 'Paid' ? 'Paid' : row.paidAmount > 0 ? 'Add Payment' : 'Enter Payment'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}
      {showAddCustomersModal && selectedSchemeId && (
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
        }} onClick={() => setShowAddCustomersModal(false)}>
          <div className="card" style={{
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Add Customers to Scheme</h2>
            
            {/* Show Selected Scheme */}
            {selectedSchemeId && (
              <div style={{
                marginBottom: '15px',
                padding: '10px',
                background: '#f0f8ff',
                borderRadius: '4px',
                fontSize: '14px',
                border: '1px solid #007bff'
              }}>
                <strong>Scheme:</strong> {schemes.find(s => s.id === selectedSchemeId)?.name || 'Unknown Scheme'}
              </div>
            )}
            
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
                  setShowAddCustomersModal(false);
                  setSelectedCustomers([]);
                }}
                className="btn"
                style={{ background: '#6c757d', color: 'white' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomers}
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

