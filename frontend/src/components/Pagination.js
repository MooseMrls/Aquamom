import './Pagination.css';

// Builds a compact page list with ellipses, e.g. 1 ... 4 5 [6] 7 8 ... 20
function getPageList(current, total) {
  const pages = [];
  const add = (p) => pages.push(p);
  const windowSize = 1;

  add(1);
  if (current - windowSize > 2) add('...');
  for (let p = Math.max(2, current - windowSize); p <= Math.min(total - 1, current + windowSize); p++) {
    add(p);
  }
  if (current + windowSize < total - 1) add('...');
  if (total > 1) add(total);

  return pages;
}

export default function Pagination({ page, pages, total, limit, onPageChange }) {
  if (!pages || pages <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const pageList = getPageList(page, pages);

  return (
    <div className="pagination">
      <span className="pagination-range">
        Showing {start}–{end} of {total}
      </span>
      <div className="pagination-controls">
        <button
          className="pagination-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          ‹
        </button>
        {pageList.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
          ) : (
            <button
              key={p}
              className={`pagination-btn ${p === page ? 'pagination-btn-active' : ''}`}
              onClick={() => onPageChange(p)}
              disabled={p === page}
            >
              {p}
            </button>
          )
        )}
        <button
          className="pagination-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
}