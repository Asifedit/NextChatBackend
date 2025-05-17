const joindedGroup = require("../../model/Group/GroupJoindedModel");
const { redis } = require("../../Redis/redis");
const OnConnection = async (name, socket) => {
    console.log(`${name} connected with ${socket.id}`);
    socket.broadcast.emit("OnlineStutasdetails", {
        username: name,
        isonline: true,
    });

    // redis.hset(`Detailes:${name}`, "socketId", socket.id);
    socket.join(name);

    const joinded = await joindedGroup
        .find({ Member: name })
        .select(["GroupName", "-_id"]);
    if (joinded.length) {
        joinded.map((data) => {
            console.log(name, "joinded", data.GroupName);
            socket.join(data.GroupName);
        });
    }
};
module.exports = OnConnection;
