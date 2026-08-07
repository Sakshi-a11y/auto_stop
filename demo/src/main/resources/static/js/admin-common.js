const currentAdmin = JSON.parse(sessionStorage.getItem('admin_currentUser') || 'null');

function requireAdminAuth() {
  if (!currentAdmin) {
    window.location.href = 'admin-login.html';
    return false;
  }
  return true;
}

function initAdminPage() {
  if (!requireAdminAuth()) return;

  const adminNameEl = document.getElementById('adminName');
  if (adminNameEl) {
    adminNameEl.textContent = currentAdmin.name || 'Admin';
  }

  document.getElementById('logoutBtn')?.addEventListener('click', logoutAdmin);
  document.getElementById('navLogout')?.addEventListener('click', function (e) {
    e.preventDefault();
    logoutAdmin();
  });
}

function logoutAdmin() {
  sessionStorage.removeItem('admin_currentUser');
  window.location.href = 'admin-login.html';
}

function formatValue(value) {
  return value ?? '-';
}

function formatAmount(amount) {
  if (amount == null) return '-';
  return `₹${amount}`;
}

function statusClass(status) {
  if (!status) return 'status-badge';
  const normalized = String(status).toLowerCase();
  if (normalized === 'active' || normalized === 'success') return 'status-badge status-active';
  if (normalized === 'blocked' || normalized === 'failed') return 'status-badge status-blocked';
  if (normalized === 'pending') return 'status-badge status-pending';
  return 'status-badge';
}

function setActiveNav(page) {
  document.querySelectorAll('[data-nav]').forEach(link => {
    link.classList.toggle('active', link.dataset.nav === page);
  });
}
