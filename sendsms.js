// Authorisation details
const username = "asifhossin867@gmail.com"; // Your Textlocal username
const hash = "a5997ef2714059f35407d225b82d21193a3904e9789ad1b0cb420878d13d8ade"; // Your API key (hash)

// Config variables
const test = "0"; // Set to "1" for testing purposes, or "0" for live

// Data for the message
const sender = "TXTLCL"; // This is who the message appears to be from
const numbers = "917439563364"; // A single number or a comma-separated list of numbers
const message = "This is a test message from the JavaScript API script."; // The message text

// URL encode the message (for special characters handling)
const encodedMessage = encodeURIComponent(message);

// Prepare data to send via POST request
const data = new URLSearchParams({
    username: username,
    hash: hash,
    message: encodedMessage,
    sender: sender,
    numbers: numbers,
    test: test,
});

// URL of the Textlocal API
const url = "http://api.textlocal.in/send/?";

// Use `fetch` to send the POST request
fetch(url, {
    method: "POST",
    body: data,
    headers: {
        "Content-Type": "application/x-www-form-urlencoded", // Required for form-encoded body
    },
})
    .then((response) => response.json()) // Parse the JSON response
    .then((data) => {
        console.log("Response:", data); // Log the response from Textlocal API
    })
    .catch((error) => {
        console.error("Error sending SMS:", error); // Log any errors
    });
