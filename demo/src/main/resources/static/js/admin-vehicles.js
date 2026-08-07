initAdminPage();
setActiveNav('vehicles');

const vehiclesBody = document.getElementById('vehiclesBody');

async function loadVehicles() {
  try {
    const response = await fetch(`${window.location.origin}/admin/api/vehicles`);
    if (!response.ok) throw new Error('Unable to load vehicles');

    const vehicles = await response.json();
    if (!vehicles.length) {
      vehiclesBody.innerHTML = '<tr><td colspan="8" class="muted">No registered vehicles found.</td></tr>';
      return;
    }

    vehiclesBody.innerHTML = vehicles.map(vehicle => `
      <tr>
        <td>${formatValue(vehicle.vehicleNumber)}</td>
        <td>${formatValue(vehicle.ownerName)}</td>
        <td>${formatValue(vehicle.contact)}</td>
        <td>${formatValue(vehicle.vehicleType)}</td>
        <td>${formatValue(vehicle.registrationDate)}</td>
        <td>${formatValue(vehicle.strikeCount)}</td>
        <td><span class="${statusClass(vehicle.status)}">${formatValue(vehicle.status)}</span></td>
        <td>
          <a href="admin-user-detail.html?vehicleId=${vehicle.vehicleId}" class="btn secondary btn-sm">View Details</a>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    vehiclesBody.innerHTML = '<tr><td colspan="8" class="muted">Failed to load vehicles.</td></tr>';
    console.error(error);
  }
}

loadVehicles();
setInterval(loadVehicles, 5000);
