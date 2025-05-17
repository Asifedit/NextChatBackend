const { redis } = require("./redis");

const publish = async (channel, data) => {
    await redis.publish(channel, JSON.stringify(data));
};

module.exports = { publish };
