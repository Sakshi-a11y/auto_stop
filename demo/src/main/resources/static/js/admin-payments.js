initAdminPage();
setActiveNav('payments');

const paymentsBody = document.getElementById('paymentsBody');
const paymentCountEl = document.getElementById('paymentCount');

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderCell(value, className = '') {
  const text = formatValue(value);
  return `<td class="${className}" title="${escapeHtml(text)}">${escapeHtml(text)}</td>`;
}

async function loadPayments() {
  try {
    const response = await fetch(`${window.location.origin}/admin/api/payments`);
    if (!response.ok) throw new Error('Unable to load payments');

    const payments = await response.json();
    if (paymentCountEl) {
      paymentCountEl.textContent = `${payments.length} record${payments.length === 1 ? '' : 's'}`;
    }

    if (!payments.length) {
      paymentsBody.innerHTML = '<tr><td colspan="8" class="table-empty">No payment records found.</td></tr>';
      return;
    }

    paymentsBody.innerHTML = payments.map(payment => `
      <tr>
        ${renderCell(payment.paymentId)}
        ${renderCell(payment.vehicleNumber)}
        ${renderCell(payment.ownerName)}
        <td class="cell-amount">${formatAmount(payment.amount)}</td>
        <td><span class="${statusClass(payment.status)}">${formatValue(payment.status)}</span></td>
        ${renderCell(formatDateTime(payment.paymentDate))}
        ${renderCell(payment.razorpayOrderId, 'cell-mono cell-truncate')}
        ${renderCell(payment.razorpayPaymentId, 'cell-mono cell-truncate')}
      </tr>
    `).join('');
  } catch (error) {
    if (paymentCountEl) paymentCountEl.textContent = 'Unable to load';
    paymentsBody.innerHTML = '<tr><td colspan="8" class="table-empty">Failed to load payments.</td></tr>';
    console.error(error);
  }
}

loadPayments();
