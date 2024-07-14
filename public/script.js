document.getElementById('registrationForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const location = document.getElementById('location').value;

    try {
        const response = await fetch('/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, location })
        });

        const data = await response.json();
        if (response.ok) {
            document.getElementById('message').innerText = 'Registration successful!';
            // Optionally redirect to another page or show a success message
        } else {
            document.getElementById('message').innerText = data.msg || 'Registration failed.';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('message').innerText = 'Error registering user. Please try again later.';
    }
});
