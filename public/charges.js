const token = localStorage.getItem('token');

    document.getElementById('chargeForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fixedCharge = parseFloat(document.getElementById('fixedCharge').value);
      const hourlyCharge = parseFloat(document.getElementById('hourlyCharge').value);

      const res = await fetch('/api/vendor/prices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ fixedCharge, hourlyCharge })
      });

      const data = await res.json();
      alert(data.message || data.error);
    });
// charges.js

// Function to display the username
function displayUsername() {
    const usernameDisplayElement = document.getElementById('usernameDisplay');
    // Get the username from localStorage (assuming it's stored there after login)
    const username = localStorage.getItem('username'); // 'username' is the key you used to store it

    if (username && usernameDisplayElement) {
        usernameDisplayElement.textContent = username;
    } else if (usernameDisplayElement) {
        // Fallback if username is not found, or remove if you don't want any text
        usernameDisplayElement.textContent = 'Guest';
    }
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', displayUsername);

// Your existing charges form submission logic (example, keep your actual logic)
document.getElementById('chargeForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    const fixedCharge = document.getElementById('fixedCharge').value;
    const hourlyCharge = document.getElementById('hourlyCharge').value;

    console.log('Updating Charges:', { fixedCharge, hourlyCharge });
    // In a real application, you would send this data to your backend
    // using fetch() or XMLHttpRequest.

    alert(`Charges updated!\nFixed: ${fixedCharge}, Hourly: ${hourlyCharge}`);
    // You might want to provide more robust feedback using a modal or status message
});

// Dummy function for modal (from your previous HTML, adjust if you have a real modal setup)
function showModal(message, isError = false) {
    const modal = document.getElementById('customModal');
    const modalMessage = document.getElementById('modalMessage');

    if (modal && modalMessage) {
        modalMessage.textContent = message;
        modal.className = 'modal show';
        if (isError) {
            modal.classList.add('error');
        } else {
            modal.classList.remove('error');
        }

        setTimeout(() => {
            modal.className = 'modal'; // Hide after a few seconds
        }, 3000);
    }
}