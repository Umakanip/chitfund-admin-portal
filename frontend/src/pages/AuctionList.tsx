import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { Auction } from '../types';

export default function AuctionList() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadAuctions();
  }, []);

  const loadAuctions = async () => {
    try {
      const data = await apiService.getAuctions();
      setAuctions(data);
    } catch (error) {
      console.error('Failed to load auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAuctions = filter === 'all'
    ? auctions
    : auctions.filter(a => a.status === filter);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '20px', color: '#333' }}>Auctions</h1>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ margin: 0 }}>Filter by Status:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          >
            <option value="all">All Auctions</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px'
      }}>
        {filteredAuctions.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
            No auctions found
          </div>
        ) : (
          filteredAuctions.map(auction => (
            <div key={auction.id} className="card" style={{
              borderLeft: `4px solid ${
                auction.status === 'completed' ? '#28a745' :
                auction.status === 'scheduled' ? '#007bff' : '#dc3545'
              }`
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{auction.schemeName}</h3>
              <div style={{ marginBottom: '15px' }}>
                <span className={`badge ${
                  auction.status === 'completed' ? 'badge-success' :
                  auction.status === 'scheduled' ? 'badge-info' : 'badge-danger'
                }`}>
                  {auction.status.toUpperCase()}
                </span>
              </div>
              <div style={{ color: '#666', lineHeight: '1.8' }}>
                <p style={{ margin: '5px 0' }}>
                  <strong>Auction Date:</strong> {auction.auctionDate}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Base Amount:</strong> {formatCurrency(auction.baseAmount)}
                </p>
                {auction.status === 'completed' && auction.winnerName ? (
                  <>
                    <p style={{ margin: '5px 0' }}>
                      <strong>Highest Bid:</strong> {formatCurrency(auction.highestBid)}
                    </p>
                    <p style={{ margin: '5px 0' }}>
                      <strong>Winner:</strong> {auction.winnerName}
                    </p>
                    <p style={{ margin: '5px 0', color: '#28a745', fontWeight: 'bold' }}>
                      Discount: {formatCurrency(auction.baseAmount - auction.highestBid)}
                    </p>
                  </>
                ) : auction.status === 'scheduled' ? (
                  <p style={{ margin: '5px 0', color: '#007bff' }}>
                    <strong>Status:</strong> Awaiting bids
                  </p>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
        Showing {filteredAuctions.length} of {auctions.length} auctions
      </div>
    </div>
  );
}

