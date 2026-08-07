initAdminPage();
setActiveNav('vehicles');

const userDetailContent = document.getElementById('userDetailContent');
const params = new URLSearchParams(window.location.search);
const vehicleId = params.get('vehicleId');

if (!vehicleId) {
  userDetailContent.innerHTML = `
    <section class="card admin-section">
      <p class="muted">No vehicle selected. <a href="admin-vehicles.html">Go back to vehicles</a></p>
    </section>
  `;
} else {
  loadVehicleDetails(vehicleId);
}

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

function badgeClass(status) {
  const base = statusClass(status);
  return base ? `status-badge ${base}` : '';
}

function renderField(label, value, isHtml = false) {
  return `
    <div class="detail-field">
      <label>${label}</label>
      ${isHtml ? `<span>${value}</span>` : `<span>${formatValue(value)}</span>`}
    </div>
  `;
}

async function loadVehicleDetails(id) {
  try {
    const response = await fetch(`${window.location.origin}/admin/api/vehicles/${id}`);
    const data = await response.json();

    if (!response.ok) {
      userDetailContent.innerHTML = `
        <section class="card admin-section">
          <p class="muted">${data.error || 'Vehicle not found.'}</p>
        </section>
      `;
      return;
    }

    const vehicle = data.vehicle || {};
    const statusBadge = `<span class="${badgeClass(vehicle.status)}">${formatValue(vehicle.status)}</span>`;
    const paymentCount = (data.payments || []).length;

    const paymentsHtml = paymentCount
      ? (data.payments || []).map(payment => `
          <tr>
            <td>${formatValue(payment.paymentId)}</td>
            <td>${formatAmount(payment.amount)}</td>
            <td><span class="${badgeClass(payment.status)}">${formatValue(payment.status)}</span></td>
            <td>${formatDateTime(payment.paymentDate)}</td>
            <td>${formatValue(payment.razorpayOrderId)}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="5" class="muted">No payment records found for this vehicle.</td></tr>';

    userDetailContent.innerHTML = `
      <section class="detail-summary">
        <div class="detail-summary-main">
          <span class="detail-tag">Registered Vehicle</span>
          <h2>${formatValue(vehicle.vehicleNumber)}</h2>
          <p>Owner: ${formatValue(data.name)} &nbsp;·&nbsp; ${formatValue(vehicle.vehicleType)}</p>
        </div>
        <div class="detail-summary-stats">
          <div class="stat-pill">
            <label>Strike Count</label>
            <span>${formatValue(vehicle.strikeCount)}</span>
          </div>
          <div class="stat-pill">
            <label>Status</label>
            <span>${statusBadge}</span>
          </div>
          <div class="stat-pill">
            <label>Payments</label>
            <span>${paymentCount}</span>
          </div>
        </div>
      </section>

      <div class="detail-cards-grid">
        <section class="card info-card">
          <h3 class="detail-section-title"><i class="fa-solid fa-user"></i> Owner Information</h3>
          ${renderField('Full Name', data.name)}
          ${renderField('Contact Number', data.contact)}
          ${renderField('Address', data.address)}
        </section>

        <section class="card info-card">
          <h3 class="detail-section-title"><i class="fa-solid fa-truck"></i> Vehicle Information</h3>
          ${renderField('Vehicle Number', vehicle.vehicleNumber)}
          ${renderField('Vehicle Type', vehicle.vehicleType)}
          ${renderField('Registration Date', formatDateTime(vehicle.registrationDate))}
          ${renderField('Strike Count', vehicle.strikeCount)}
          ${renderField('Current Status', statusBadge, true)}
        </section>
      </div>

      <section class="card admin-section">
        <h3 class="detail-section-title"><i class="fa-solid fa-receipt"></i> Payment History</h3>
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Order ID</th>
              </tr>
            </thead>
            <tbody>${paymentsHtml}</tbody>
          </table>
        </div>
      </section>
    `;
  } catch (error) {
    userDetailContent.innerHTML = `
      <section class="card admin-section">
        <p class="muted">Failed to load vehicle details.</p>
      </section>
    `;
    console.error(error);
  }
}
