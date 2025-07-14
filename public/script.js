const BASE_URL = 'http://localhost:5000/api'; // Change if deployed

// Save token to localStorage after login
async function login(event) {
    event.preventDefault();
    const userId = document.getElementById('loginUserId').value;
    const password = document.getElementById('loginPassword').value;

    const res = await fetch(`${BASE_URL}/vendor/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password })
    });

    const data = await res.json();
    if (res.ok) {
        localStorage.setItem('token', data.token);
        alert('Login successful!');
        window.location.href = 'dashboard.html';
    } else {
        alert(data.error || 'Login failed');
    }
}

// Sign up new vendor
async function register(event) {
    event.preventDefault();
    const userId = document.getElementById('registerUserId').value;
    const password = document.getElementById('registerPassword').value;
    const fixedCharge = parseFloat(document.getElementById('fixedCharge').value);
    const hourlyCharge = parseFloat(document.getElementById('hourlyCharge').value);

    const res = await fetch(`${BASE_URL}/vendor/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password, fixedCharge, hourlyCharge })
    });

    const data = await res.json();
    if (res.ok) {
        alert('Registration successful!');
        window.location.href = 'index.html';
    } else {
        alert(data.error || 'Registration failed');
    }
}

// Vehicle Entry
async function vehicleEntry(event) {
    event.preventDefault();
    const plate = document.getElementById('entryPlate').value.trim().toUpperCase();

    const res = await fetch(`${BASE_URL}/vehicle/entry`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ numberPlate: plate })
    });

    const data = await res.json();
    if (res.ok) {
        alert(`Vehicle parked at Lot ${data.vehicle.parkingLot}`);
    } else {
        alert(data.error || 'Entry failed');
    }
}

// Vehicle Exit
async function vehicleExit(event) {
    event.preventDefault();
    const plate = document.getElementById('exitPlate').value.trim().toUpperCase();

    const res = await fetch(`${BASE_URL}/vehicle/exit`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ numberPlate: plate })
    });

    const data = await res.json();
    if (res.ok) {
        alert(`Bill: ₹${data.bill.totalAmount} for ${data.bill.hoursParked} hour(s)`);
    } else {
        alert(data.error || 'Exit failed');
    }
}

// View Vehicles
async function loadVehicles() {
    const res = await fetch(`${BASE_URL}/vehicles`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });

    const data = await res.json();
    if (res.ok) {
        const table = document.getElementById('vehicleTableBody');
        table.innerHTML = '';
        data.vehicles.forEach(v => {
            const row = `
                <tr>
                    <td>${v.entryId}</td>
                    <td>${v.numberPlate}</td>
                    <td>${new Date(v.entryTime).toLocaleString()}</td>
                    <td>${v.exitTime ? new Date(v.exitTime).toLocaleString() : '-'}</td>
                    <td>${v.parkingLot}</td>
                    <td>${v.status}</td>
                    <td>${v.amount}</td>
                </tr>`;
            table.innerHTML += row;
        });
    } else {
        alert(data.error || 'Could not load vehicles');
    }
}

// Update Charges
async function updateCharges(event) {
    event.preventDefault();
    const fixed = parseFloat(document.getElementById('newFixedCharge').value);
    const hourly = parseFloat(document.getElementById('newHourlyCharge').value);

    const res = await fetch(`${BASE_URL}/vendor/prices`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fixedCharge: fixed, hourlyCharge: hourly })
    });

    const data = await res.json();
    if (res.ok) {
        alert('Charges updated successfully!');
    } else {
        alert(data.error || 'Failed to update charges');
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

const token = localStorage.getItem('token');
    let currentStream;

    async function processExit() {
      const plate = document.getElementById('numberPlate').value.trim().toUpperCase();
      if (!plate) return alert("Enter number plate");

      const res = await fetch('/api/vehicle/exit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ numberPlate: plate })
      });

      const data = await res.json();
      if (res.ok && data.bill) {
        alert(`✅ Exit Successful\nAmount: ₹${data.bill.totalAmount}`);
        await generateBillPDF(data.bill);
      } else {
        alert(`❌ ${data.error}`);
      }
    }

    async function openCamera() {
      document.getElementById('cameraSection').style.display = 'block';
      const select = document.getElementById('cameraSelect');
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === 'videoinput');

      select.innerHTML = videoDevices.map(
        (d, i) => `<option value="${d.deviceId}">${d.label || 'Camera ' + (i + 1)}</option>`
      ).join('');

      select.onchange = () => {
        if (currentStream) {
          currentStream.getTracks().forEach(t => t.stop());
        }
        startCamera(select.value);
      };

      if (videoDevices.length > 0) {
        startCamera(videoDevices[0].deviceId);
      }
    }

    async function startCamera(deviceId) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } });
        currentStream = stream;
        document.getElementById('video').srcObject = stream;
      } catch (err) {
        alert("❌ Cannot access camera");
      }
    }

    function blobToBase64(blob) {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }

    async function captureAndScan() {
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      const video = document.getElementById('video');

      canvas.width = 640;
      canvas.height = 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const base64 = await blobToBase64(blob);

      const status = document.getElementById('statusMsg');
      status.innerText = "🔍 Scanning...";

      try {
        const res = await fetch('/api/ocr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            base64Image: base64.replace(/^data:image\/(png|jpeg);base64,/, '')
          })
        });

        const data = await res.json();
        let text = data?.text?.toUpperCase().replace(/IND/g, '').replace(/[^A-Z0-9]/g, '');
        document.getElementById('numberPlate').value = text;
        status.innerText = text ? `✅ Detected: ${text}` : '❌ No plate detected';
      } catch (err) {
        console.error("OCR error:", err);
        status.innerText = '❌ OCR Failed';
      }
    }

    async function generateBillPDF(bill) {
      const { jsPDF } = window.jspdf;
      const { numberPlate, parkingLot, entryTime, exitTime, hoursParked, amount } = bill;
      const upiId = 'jethwa@fam';
      const upiString = `upi://pay?pa=${upiId}&pn=MomentumApp&am=${amount}&cu=INR`;

      // Generate QR code
      const qrDiv = document.createElement("div");
      const qr = new QRCode(qrDiv, { text: upiString, width: 100, height: 100 });
      
      // Wait briefly to allow QR to render
      await new Promise(r => setTimeout(r, 500));
      const qrCanvas = qrDiv.querySelector("canvas");
      const qrBase64 = qrCanvas.toDataURL("image/png");

      // Generate PDF
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Momentum Parking Exit Bill", 60, 20);

      doc.setFontSize(12);
      doc.text(`Number Plate : ${numberPlate}`, 20, 40);
      doc.text(`Lot Number   : ${parkingLot}`, 20, 50);
      doc.text(`Entry Time   : ${new Date(entryTime).toLocaleString()}`, 20, 60);
      doc.text(`Exit Time    : ${new Date(exitTime).toLocaleString()}`, 20, 70);
      doc.text(`Hours Parked : ${hoursParked} hour(s)`, 20, 80);
      doc.text(`Total Amount : ₹${amount}`, 20, 90);

      doc.text("Pay using UPI:", 20, 105);
      doc.addImage(qrBase64, "PNG", 120, 100, 50, 50);
      doc.text(`${upiId}`, 20, 160);

      // Show PDF in iframe for printing
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      document.getElementById("billFrame").src = blobUrl;
      document.getElementById("billContainer").style.display = 'block';
    }
  async function generateBillPDF(bill) {
    const { jsPDF } = window.jspdf;
    const { numberPlate, parkingLot, entryTime, exitTime, hoursParked, amount } = bill;
    const upiId = 'jethwa@fam';
    const upiString = `upi://pay?pa=${upiId}&pn=MomentumApp&am=${amount}&cu=INR`;

    // Generate QR Code
    const qrDiv = document.createElement("div");
    new QRCode(qrDiv, { text: upiString, width: 100, height: 100 });
    await new Promise(r => setTimeout(r, 300)); // Wait for QR render
    const qrCanvas = qrDiv.querySelector("canvas");
    const qrBase64 = qrCanvas.toDataURL("image/png");

    // Create PDF
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(18);
    doc.text("Momentum Parking Exit Bill", 60, 20);

    doc.setFontSize(12);
    let y = 40;
    doc.text(`Number Plate  : ${numberPlate}`, 20, y); y += 10;
    doc.text(`Lot Number    : ${parkingLot}`, 20, y); y += 10;
    doc.text(`Entry Time    : ${new Date(entryTime).toLocaleString()}`, 20, y); y += 10;
    doc.text(`Exit Time     : ${new Date(exitTime).toLocaleString()}`, 20, y); y += 10;
    doc.text(`Hours Parked  : ${hoursParked} hour(s)`, 20, y); y += 10;
    doc.text(`Total Amount  : ₹${amount}`, 20, y); y += 20;

    doc.text("Pay via UPI (Scan Below):", 20, y); y += 5;
    doc.addImage(qrBase64, 'PNG', 20, y, 60, 60);
    y += 75;

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("Thank you for using Momentum Parking System", 20, 290);

    // Show PDF in iframe
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    document.getElementById("billFrame").src = blobUrl;
    document.getElementById("billContainer").style.display = 'block';
  }

    function printPDF() {
      const iframe = document.getElementById('billFrame');
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }

function showModal(message, isError = false) {
  const modal = document.getElementById("customModal");
  const content = document.getElementById("modalMessage");

  content.innerText = message;
  modal.classList.add("show");
  modal.classList.toggle("error", isError);

  // Auto-hide after 3 seconds
  setTimeout(() => {
    modal.classList.remove("show", "error");
  }, 3000);
}
    //const token = localStorage.getItem('token');
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