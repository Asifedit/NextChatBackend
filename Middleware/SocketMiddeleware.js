const { DecryptData } = require("../config/Crtipto")
const jwt =require('jsonwebtoken')
const DecryptedData = (socket, next) => {
    const originalEmit = socket.emit;
    const originalOn = socket.on;

    socket.emit = function (event, data, callback) {
        if (typeof callback === "function") {
            const wrappedCallback = (...args) => {
                console.log(`Callback for event "${event}" called with:`, args);
                callback(...args);
            };
            originalEmit.apply(socket, [event, data, wrappedCallback]);
        } else {
            originalEmit.apply(socket, [event, data]);
        }
    };

    // Intercept on (incoming data)
    socket.on = function (event, callback) {
        if (typeof callback !== "function") {
            console.error(`Callback for event "${event}" is not a function`);
            return next();
        }

        originalOn.call(socket, event, async (encryptedData, replyCallback) => {
            try {
                if (!encryptedData.encryptedData) return;
                const decryptedData = DecryptData(encryptedData);
                const parsedData = JSON.parse(decryptedData);
                callback(parsedData, replyCallback);
            } catch (error) {
                console.error(
                    `Error processing data for event "${event}":`,
                    error
                );
            }
        });
    };

    next();
};


module.exports = {
    DecryptedData,
};