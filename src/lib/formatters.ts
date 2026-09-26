export function formatCurrency(amount: number, symbol = '₹'): string {
  return `${symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateTime(timestamp: number): string {
  return `${formatDate(timestamp)} • ${formatTime(timestamp)}`;
}

export function formatShortDateTime(timestamp: number): string {
  const d = new Date(timestamp);
  const day = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${day}, ${time}`;
}

export function generateUPIPaymentUrl(upiId: string, payeeName: string, amount: number, billNo: number): string {
  const note = encodeURIComponent(`Bill #${billNo} - ${payeeName}`);
  const pn = encodeURIComponent(payeeName);
  return `upi://pay?pa=${upiId}&pn=${pn}&am=${amount.toFixed(2)}&cu=INR&tn=${note}`;
}
