const Pagination = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [1];
    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="d-flex justify-content-between align-items-center px-3 py-3 border-top">
      <div className="d-flex align-items-center gap-3">
        <span className="text-muted small">
          {startItem}–{endItem} de {totalItems} {totalItems === 1 ? 'item' : 'itens'}
        </span>
        <select
          className="form-select form-select-sm"
          style={{ width: 'auto' }}
          value={itemsPerPage}
          onChange={(e) => { onItemsPerPageChange(Number(e.target.value)); onPageChange(1); }}
        >
          <option value={10}>10 / página</option>
          <option value={25}>25 / página</option>
          <option value={50}>50 / página</option>
        </select>
      </div>

      {totalPages > 1 && (
        <nav aria-label="Paginação">
          <ul className="pagination pagination-sm mb-0">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => onPageChange(currentPage - 1)}>‹</button>
            </li>
            {getPageNumbers().map((page, idx) =>
              page === '...' ? (
                <li key={`dot-${idx}`} className="page-item disabled">
                  <span className="page-link">…</span>
                </li>
              ) : (
                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => onPageChange(page)}>{page}</button>
                </li>
              )
            )}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => onPageChange(currentPage + 1)}>›</button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default Pagination;
