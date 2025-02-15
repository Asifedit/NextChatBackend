// generateVapidKeys.js

const webPush = require("web-push");

// Generate VAPID keys
const vapidKeys = webPush.generateVAPIDKeys();
console.log(vapidKeys);
