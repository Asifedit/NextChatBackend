const { decryptData } = require('../Utils/Decrypt');

const decript = (socket, next) => {
    const originalOnevent = socket.onevent;

    socket.onevent = function (packet) {
        const [event, ...args] = packet.data;

        // Only decrypt if the payload looks encrypted
        if (args.length && args[0]?.iv && args[0]?.data) {
            try {
                const decrypted = decryptData(args[0]);

                // Replace encrypted arg with decrypted
                packet.data = [event, decrypted];
            } catch (err) {}
        }

        // Call original event handler
        originalOnevent.call(this, packet);
    };

    next();
};
module.exports = decript;