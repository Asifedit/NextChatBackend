const webPush = require("web-push");

// Generate VAPID Keys
const vapidKeys = webPush.generateVAPIDKeys();

console.log("Public Key (URL safe Base64):", vapidKeys.publicKey);
console.log("Private Key:", vapidKeys.privateKey);
