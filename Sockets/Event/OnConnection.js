const joindedGroup = require("../../model/Group/GroupJoindedModel");
const { SetValue, GrtValue } = require("../../Middleware/redis");
const OnConnection = async (name, socket) => {
    console.log(`${name} connected with ${socket.id}`);
    socket.broadcast.emit("OnlineStutasdetails", {
        username: name,
        isonline: true,
    });

    await SetValue(`onlineStutas${name}`, new Date().toISOString());
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