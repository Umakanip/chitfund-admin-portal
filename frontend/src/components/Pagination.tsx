interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: '15px',
      padding: '10px 0'
    }}>
      <div style={{ color: '#666', fontSize: '14px' }}>
        {startItem}-{endItem} of {totalItems}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '8px 12px',
            fontSize: '16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: currentPage === 1 ? '#f5f5f5' : 'white',
            color: currentPage === 1 ? '#999' : '#333',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '40px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (currentPage !== 1) {
              e.currentTarget.style.background = '#f8f9fa';
              e.currentTarget.style.borderColor = '#007bff';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 1) {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#ddd';
            }
          }}
          title="Previous"
        >
          ←
        </button>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 12px',
            fontSize: '16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: currentPage === totalPages ? '#f5f5f5' : 'white',
            color: currentPage === totalPages ? '#999' : '#333',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '40px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (currentPage !== totalPages) {
              e.currentTarget.style.background = '#f8f9fa';
              e.currentTarget.style.borderColor = '#007bff';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== totalPages) {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#ddd';
            }
          }}
          title="Next"
        >
          →
        </button>
      </div>
    </div>
  );
}

