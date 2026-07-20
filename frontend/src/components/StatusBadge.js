import './StatusBadge.css';

const LABELS = {
  at_station: 'At Station',
  with_customer: 'With Customer',
  delivered: 'Delivered',
  undelivered: 'Undelivered',
  paid: 'Paid',
  unpaid: 'Unpaid',
};

const TONE = {
  at_station: 'badge-blue',
  with_customer: 'badge-amber',
  delivered: 'badge-green',
  undelivered: 'badge-red',
  paid: 'badge-green',
  unpaid: 'badge-red',
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  return <span className={`badge ${TONE[status] || 'badge-gray'}`}>{LABELS[status] || status}</span>;
}
