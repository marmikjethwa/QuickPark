const token = localStorage.getItem('token');
    if (!token) window.location.href = "index.html";

    function isValidPlate(plate) {
      const cleaned = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const regex1 = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/;
      const regex2 = /^[A-Z]{2}[0-9]{2}[A-Z]{1}[0-9]{4}$/;
      return regex1.test(cleaned) || regex2.test(cleaned);
    }

    function showModal(message, isError = false) {
      const modal = document.getElementById('customModal');
      const content = document.getElementById('modalMessage');
      content.innerText = (isError ? "❌ " : "✅ ") + message;
      modal.classList.add('show');
      modal.classList.toggle('error', isError);
      setTimeout(() => {
        modal.classList.remove('show', 'error');
      }, 3000);
    }

    async function submitEntry() {
      const numberPlate = document.getElementById('numberPlate').value.trim().toUpperCase();

      if (!numberPlate || !isValidPlate(numberPlate)) {
        return showModal("Invalid number plate format.", true);
      }

      try {
        const res = await fetch('/api/vehicle/entry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ numberPlate })
        });

        const data = await res.json();

        if (res.ok) {
          const lot = data.vehicle.parkingLot;
          const plate = data.vehicle.numberPlate;
          showModal(`Vehicle ${plate} parked at Lot ${lot}`);
          speakText(`Vehicle ${plate} parked at Lot ${lot}`);
          document.getElementById('numberPlate').value = '';
        } else {
          showModal(`${data.error}`, true);
        }
      } catch (err) {
        console.error("Entry error:", err);
        showModal("Something went wrong while processing the entry.", true);
      }
    }

    let currentStream;

    async function openCamera() {
      document.getElementById('cameraSection').style.display = 'block';
      const cameraSelect = document.getElementById('cameraSelect');
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      cameraSelect.innerHTML = videoDevices.map(
        (device, i) => `<option value="${device.deviceId}">${device.label || `Camera ${i + 1}`}</option>`
      ).join('');

      cameraSelect.onchange = () => {
        if (currentStream) currentStream.getTracks().forEach(track => track.stop());
        startCamera(cameraSelect.value);
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
        showModal('Could not access camera', true);
        console.error(err);
      }
    }

    async function captureAndScan() {
      const video = document.getElementById('video');
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');
      const status = document.getElementById('statusMsg');

      canvas.width = 640;
      canvas.height = 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const base64 = await blobToBase64(imageBlob);

      status.innerText = "📷 Scanning plate...";

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
        let text = data?.text?.trim?.().toUpperCase().replace(/IND/g, '') || '';
        text = text.replace(/[^A-Z0-9]/g, '');

        document.getElementById('numberPlate').value = text;
        status.innerText = text ? `✅ Detected: ${text}` : '❌ OCR failed';
      } catch (err) {
        console.error("OCR error:", err);
        status.innerText = "❌ Failed to scan.";
      }
    }

    function blobToBase64(blob) {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }

    function speakText(text) {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 1.1;

      const setVoice = () => {
        const voices = synth.getVoices();
        const femaleVoice = voices.find(v => /female|woman|zira|eva|susan|samantha/i.test(v.name));
        if (femaleVoice) utterance.voice = femaleVoice;
        synth.speak(utterance);
      };

      if (synth.getVoices().length === 0) {
        synth.onvoiceschanged = setVoice;
      } else {
        setVoice();
      }
    }