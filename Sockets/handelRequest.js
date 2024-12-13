const Msg = require("../model/msg_model");
const jwt = require("jsonwebtoken");
const handelRequest = async (socket, io) => {
    console.log(`User connected: ${socket.id}`);
    let name;
    const token = socket.request.headers.cookie
        ?.split("; ")
        .find((c) => c.startsWith("AccessToken="));
    if (token) {
        try {
            const decoded = jwt.verify(
                token.split("=")[1],
                process.env.jwt_AcessToken_Secret
            );
            name = decoded.username;
            socket.join(name);
        } catch (error) {
            socket.disconnect();
            return;
        }
    } else {
        socket.disconnect();
        return;
    }
    //console.log(name);
    socket.on("Send", async (message) => {
        try {
            if (io.sockets.adapter.rooms.has(message.for)) {
                const newMessage = new Msg({
                    For: message.for,
                    Msg: message.text,
                    From: name,
                    isSend: true,
                });
                await newMessage.save();
                io.to(name).emit("receiveMessage", newMessage);
                io.to(message.for).emit("receiveMessage", newMessage);
                return;
            }
            const newMessage = new Msg({
                For: message.for,
                Msg: message.text,
                From: name,
                isSend: false,
            });
            await newMessage.save();
            io.to(name).emit("receiveMessage", newMessage);
            console.log(message.for);
            io.emit("receiveMessage", newMessage);
            io.to(message.for).emit("receiveMessage", newMessage);
        } catch (error) {
            console.log("Error saving message:", error);
        }
    });
    socket.on("UnSend:MSG", async (data) => {
        const oldMsg = await Msg.findOneAndUpdate(
            { username: data.username, isSend: false },
            { isSend: true }
        ).select(["-isSend", "-__v"]);
        io.to(name).emit("receiveMessage", oldMsg);
    });
    socket.on("disconnect", () => {
        socket.leave(name);
        console.log(`User disconnected: ${socket.id}`);
    });
};
module.exports = { handelRequest };
