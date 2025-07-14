const token = localStorage.getItem('token');
    let allVehicles = [];

    async function fetchVehicles() {
      const res = await fetch('/api/vehicles', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      allVehicles = data.vehicles || [];
      renderTable(allVehicles);
    }

    function renderTable(vehicles) {
      const tbody = document.querySelector('#vehicleTable tbody');
      tbody.innerHTML = '';
      vehicles.forEach(v => {
        const row = `<tr>
          <td>${v.entryId}</td>
          <td>${v.numberPlate}</td>
          <td>${new Date(v.entryTime).toLocaleString()}</td>
          <td>${v.exitTime ? new Date(v.exitTime).toLocaleString() : '-'}</td>
          <td>${v.parkingLot}</td>
          <td>${v.status}</td>
          <td>${v.status === 'parked' ? 'Active' : v.amount}</td>
        </tr>`;
        tbody.innerHTML += row;
      });
    }

    function filterVehicles() {
      const plate = document.getElementById('searchPlate').value.trim().toUpperCase();
      const lot = document.getElementById('searchLot').value;
      const status = document.getElementById('status').value;
      const from = document.getElementById('fromDate').value;
      const to = document.getElementById('toDate').value;

      let filtered = allVehicles;

      if (plate) filtered = filtered.filter(v => v.numberPlate.includes(plate));
      if (lot) filtered = filtered.filter(v => v.parkingLot == lot);
      if (status) filtered = filtered.filter(v => v.status === status);
      if (from) filtered = filtered.filter(v => new Date(v.entryTime) >= new Date(from));
      if (to) filtered = filtered.filter(v => new Date(v.entryTime) <= new Date(to));

      renderTable(filtered);
    }

    fetchVehicles();