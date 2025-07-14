const token = localStorage.getItem('token');
    let currentStream;
    let latestBill = null;

    function showModal(message, isError = false) {
      const modal = document.getElementById('modal');
      modal.innerText = message;
      modal.className = isError ? 'error' : 'success';
      modal.style.display = 'block';
      setTimeout(() => {
        modal.style.display = 'none';
      }, 3000);
    }

    async function processExit() {
      const plate = document.getElementById('numberPlate').value.trim().toUpperCase();
      if (!plate) return showModal("Enter number plate", true);

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
        latestBill = data.bill;
        const { numberPlate, parkingLot, totalAmount } = data.bill;
        document.getElementById("billContainer").style.display = "block";
        generateBillPDF(data.bill);
        speakText(`Vehicle ${numberPlate} exited. Total amount is ${totalAmount} rupees.`);
        showModal(`✅ Exit successful. Total ₹${totalAmount}`);
      } else {
        showModal(`❌ ${data.error}`, true);
      }
    }

    function speakText(text) {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1.1;

      const setVoice = () => {
        const voices = synth.getVoices();
        const preferred = voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira'));
        if (preferred) utterance.voice = preferred;
        synth.speak(utterance);
      };

      if (synth.getVoices().length === 0) {
        synth.onvoiceschanged = setVoice;
      } else {
        setVoice();
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
        showModal("❌ Cannot access camera", true);
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
        if (!text) showModal('❌ No plate detected', true);
      } catch (err) {
        console.error("OCR error:", err);
        status.innerText = '❌ OCR Failed';
        showModal("OCR failed", true);
      }
    }

    function generateBillPDF(bill) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const { numberPlate, parkingLot, entryTime, exitTime, hoursParked, totalAmount } = bill;

      const qrText = `upi://pay?pa=jethwa@fam&pn=Momentum PMS&am=${totalAmount}&cu=INR`;

      const tempDiv = document.createElement('div');
      tempDiv.style.display = 'none';
      document.body.appendChild(tempDiv);
      const qr = new QRCode(tempDiv, {
        text: qrText,
        width: 128,
        height: 128
      });

      setTimeout(() => {
        const qrCanvas = tempDiv.querySelector('canvas');
        const qrImgData = qrCanvas.toDataURL('image/png');

        doc.setFontSize(16);
        doc.text("Momentum Parking System - Vehicle Exit Bill", 20, 20);

        doc.setFontSize(12);
        doc.text(`Number Plate : ${numberPlate}`, 20, 40);
        doc.text(`Lot Number   : ${parkingLot}`, 20, 50);
        doc.text(`Entry Time   : ${new Date(entryTime).toLocaleString()}`, 20, 60);
        doc.text(`Exit Time    : ${new Date(exitTime).toLocaleString()}`, 20, 70);
        doc.text(`Hours Parked : ${hoursParked} hour(s)`, 20, 80);
        doc.text(`Total Amount : ₹${totalAmount}`, 20, 90);

        doc.addImage(qrImgData, 'PNG', 150, 40, 40, 40);
        doc.setFontSize(10);
        doc.text("Scan QR above to pay via UPI", 140, 85);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("Thank you for using", 75, 280);
        doc.setTextColor(0, 102, 204);
        doc.text("Momentum Parking System", 130, 280);

        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        document.getElementById('billFrame').src = url;
        document.body.removeChild(tempDiv);
      }, 400);
    }

    function printPDF() {
      const frame = document.getElementById('billFrame');
      frame.contentWindow.focus();
      frame.contentWindow.print();
    }
