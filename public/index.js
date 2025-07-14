let tempUserId = "";
let signupUserId = "";

// Switch to Sign Up
function switchToSignup() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('signup-form').style.display = 'block';
  document.getElementById('otp-form').style.display = 'none';
  document.getElementById('form-title').innerText = 'Sign Up';
}

// Switch to Login
function switchToLogin() {
  document.getElementById('signup-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('otp-form').style.display = 'none';
  document.getElementById('form-title').innerText = 'Login';
}

// Login form submit
async function login(event) {
  event.preventDefault();
  const userId = document.getElementById('loginUserId').value;
  const password = document.getElementById('loginPassword').value;

  const res = await fetch('/api/vendor/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, password })
  });

  const data = await res.json();
  if (res.ok) {
    tempUserId = data.tempUserId;
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('otp-form').style.display = 'block';
    document.getElementById('form-title').innerText = 'Verify OTP';
  } else {
    alert(data.error || 'Login failed');
  }
}
function togglePassword() {
  const passwordInput = document.getElementById("loginPassword");
  const toggleBtn = document.getElementById("togglePassBtn");
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleBtn.textContent = "🙈"; // closed eye emoji
  } else {
    passwordInput.type = "password";
    toggleBtn.textContent = "👁️"; // open eye emoji
  }
}


// Verify OTP after login
async function verifyOtp(event) {
  event.preventDefault();
  const otp = document.getElementById('otpInput').value;

  const res = await fetch('/api/vendor/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: tempUserId, otp })
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', tempUserId); // ✅ Save username
    window.location.href = 'entry.html';
  } else {
    document.getElementById('otpMessage').innerText = 'Invalid OTP. Please try again.';
  }
}

// Send signup OTP
async function sendSignupOtp() {
  signupUserId = document.getElementById('registerUserId').value;
  if (!signupUserId) return alert("Enter valid email");

  const res = await fetch('/api/vendor/send-signup-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: signupUserId })
  });

  const data = await res.json();
  if (res.ok) {
    document.getElementById('signup-otp-section').style.display = 'block';
    alert("OTP sent to your email");
  } else {
    alert(data.error || 'Failed to send OTP');
  }
}

// Verify signup OTP
async function verifySignupOtp() {
  const otp = document.getElementById('signupOtpInput').value;

  const res = await fetch('/api/vendor/verify-signup-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: signupUserId, otp })
  });

  const data = await res.json();
  if (res.ok) {
    document.getElementById('signup-extra-fields').style.display = 'block';
    document.getElementById('signupOtpMessage').innerText = 'OTP Verified. Continue with registration.';
  } else {
    document.getElementById('signupOtpMessage').innerText = 'Invalid OTP. Try again.';
  }
}

// Final register submit
async function register(event) {
  event.preventDefault();
  const userId = document.getElementById('registerUserId').value;

  const password = document.getElementById('registerPassword').value;
  const fixedCharge = document.getElementById('fixedCharge').value;
  const hourlyCharge = document.getElementById('hourlyCharge').value;

  if (!userId || !password || !fixedCharge || !hourlyCharge) {
    return alert("All fields are required");
  }

  const res = await fetch('/api/vendor/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, password, fixedCharge, hourlyCharge })
  });

  const data = await res.json();
  if (res.ok) {
    alert('Registration successful! You can now log in.');
    switchToLogin();
  } else {
    alert(data.error || 'Registration failed');
  }
}

// Optional logout function
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  window.location.href = 'index.html';
}
