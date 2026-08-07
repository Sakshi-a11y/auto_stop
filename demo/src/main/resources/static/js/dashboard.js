const currentUser = JSON.parse(sessionStorage.getItem('vo_currentUser') || 'null');
if (!currentUser) {
  window.location.href = 'login.html';
}

const ownerName = document.getElementById('ownerName');
const nameEl = document.getElementById('name');
const contactEl = document.getElementById('contact');
const addressEl = document.getElementById('address');
const vehicleNumberEl = document.getElementById('vehicleNumber');
const vehicleTypeEl = document.getElementById('vehicleType');
const strikeCountEl = document.getElementById('strikeCount');
const vehicleStatusEl = document.getElementById('vehicleStatus');
const blockedPanel = document.getElementById('blockedPanel');
const payFineBtn = document.getElementById('payFineBtn');
const fineAmountEl = document.getElementById('fineAmount');

if (ownerName) ownerName.textContent = currentUser.fullName || currentUser.vehicleNumber;
if (nameEl) nameEl.textContent = currentUser.fullName || '-';
if (contactEl) contactEl.textContent = currentUser.contact || '-';
if (addressEl) addressEl.textContent = currentUser.address || '-';
if (vehicleNumberEl) vehicleNumberEl.textContent = currentUser.vehicleNumber || '-';
if (vehicleTypeEl) vehicleTypeEl.textContent = currentUser.vehicleType || currentUser.vehicletype || 'N/A';

function updateDashboardView(strikeCount, status, vehicleType) {
  if (strikeCountEl) strikeCountEl.textContent = strikeCount ?? '0';

  const normalizedStatus = status || ((strikeCount ?? 0) >= 3 ? 'blocked' : 'active');
  if (vehicleStatusEl) {
    vehicleStatusEl.textContent = normalizedStatus;
    vehicleStatusEl.className = normalizedStatus === 'blocked'
      ? 'status-badge status-blocked'
      : 'status-badge status-active';
  }

  if (vehicleTypeEl && vehicleType) {
    vehicleTypeEl.textContent = vehicleType;
  }

  if (blockedPanel) {
    blockedPanel.classList.toggle('hidden', normalizedStatus !== 'blocked');
  }
}

updateDashboardView(currentUser.strikeCount || 0, currentUser.status, currentUser.vehicleType || currentUser.vehicletype);

async function refreshVehicleDetails(vehicleNumber) {
  if (!vehicleNumber) return;

  try {
    const response = await fetch(
      `${window.location.origin}/violation/details?vehicleNumber=${encodeURIComponent(vehicleNumber)}`
    );
    if (!response.ok) return;

    const data = await response.json();
    updateDashboardView(data.strikeCount, data.status, data.vehicleType);

    const updatedUser = {
      ...currentUser,
      strikeCount: data.strikeCount,
      status: data.status,
      vehicleType: data.vehicleType || currentUser.vehicleType || currentUser.vehicletype
    };
    sessionStorage.setItem('vo_currentUser', JSON.stringify(updatedUser));
    Object.assign(currentUser, updatedUser);
  } catch (error) {
    console.error('Unable to refresh vehicle details:', error);
  }
}

async function loadPaymentConfig() {
  try {
    const response = await fetch(`${window.location.origin}/payment/config`);
    if (!response.ok) return;

    const config = await response.json();
    if (fineAmountEl && config.amount) {
      fineAmountEl.textContent = Math.round(config.amount / 100);
    }
  } catch (error) {
    console.error('Unable to load payment config:', error);
  }
}

async function verifyPayment(vehicleNumber, paymentResponse) {
  const verifyResponse = await fetch(`${window.location.origin}/payment/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vehicleNumber,
      razorpay_order_id: paymentResponse.razorpay_order_id,
      razorpay_payment_id: paymentResponse.razorpay_payment_id,
      razorpay_signature: paymentResponse.razorpay_signature
    })
  });

  const result = await verifyResponse.json();
  if (!verifyResponse.ok) {
    throw new Error(result.error || 'Payment verification failed.');
  }

  return result;
}

async function startPayment() {
  const vehicleNumber = currentUser.vehicleNumber;
  if (!vehicleNumber) {
    alert('Vehicle number not found in session.');
    return;
  }

  if (payFineBtn) {
    payFineBtn.disabled = true;
    payFineBtn.textContent = 'Opening payment...';
  }

  try {
    const orderResponse = await fetch(
      `${window.location.origin}/payment/create-order?vehicleNumber=${encodeURIComponent(vehicleNumber)}`,
      { method: 'POST' }
    );
    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      throw new Error(orderData.error || 'Unable to create payment order.');
    }

    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Vehicle Overload System',
      description: 'Fine payment after 3 strikes',
      order_id: orderData.orderId,
      handler: async function (response) {
        try {
          const result = await verifyPayment(vehicleNumber, response);
          updateDashboardView(result.strikeCount, result.status);
          sessionStorage.setItem(
            'vo_currentUser',
            JSON.stringify({
              ...currentUser,
              strikeCount: result.strikeCount,
              status: result.status
            })
          );
          alert(result.message || 'Payment successful. Vehicle reactivated.');
        } catch (error) {
          alert(error.message || 'Payment verification failed.');
        }
      },
      prefill: {
        name: currentUser.fullName || '',
        contact: currentUser.contact || ''
      },
      theme: { color: '#0b3d91' }
    };

    const razorpay = new Razorpay(options);
    razorpay.on('payment.failed', function (response) {
      alert(response.error?.description || 'Payment failed. Please try again.');
    });
    razorpay.open();
  } catch (error) {
    alert(error.message || 'Unable to start payment.');
  } finally {
    if (payFineBtn) {
      payFineBtn.disabled = false;
      payFineBtn.textContent = 'Proceed to Payment';
    }
  }
}

payFineBtn?.addEventListener('click', startPayment);
refreshVehicleDetails(currentUser.vehicleNumber);
loadPaymentConfig();

// Refresh strike count when hardware sends new violations
setInterval(() => refreshVehicleDetails(currentUser.vehicleNumber), 5000);

const logoutBtn = document.getElementById('logoutBtn');
logoutBtn?.addEventListener('click', function () {
  sessionStorage.removeItem('vo_currentUser');
  window.location.href = 'login.html';
});
