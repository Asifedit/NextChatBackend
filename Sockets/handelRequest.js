const MsgModel = require("../model/msg_model");
const MesseageModel = require("../model/Group/Messeage");
const OnConnection = require("./Event/OnConnection");
const { Deletvalue, redis } = require("../Middleware/redis");
const handelRequest = async (socket, io) => {
    let name = socket.username;

    // console.log(Array.from(socket.rooms));
    OnConnection(name, socket);
    if (!name) {
        socket.disconnect();
        return;
    }
    await redis.sadd("OnlineUserList", name);

    socket.on("start:call", async ({ username }, callback) => {
        if (!io.sockets.adapter.rooms.has(username)) {
            callback("failed");
            socket.emit("Error", { message: "User Not Connected" });
            return;
        }
        socket.to(username).emit("incoming:call", { username: name });
    });

    socket.on("call:responce", async ({ username, responce }) => {
        socket.to(username).emit("call:responce", { From: name, responce });
    });

    // Assuming you're using Socket.IO to emit and listen to events
    socket.on("offer", ({ offer, username }) => {
        // Check if the user is connected before forwarding the offer
        if (!io.sockets.adapter.rooms.has(username)) {
            socket.emit("Error", { message: "User Not Connected" });
            return;
        }

        // Forward the offer to the other user
        socket.to(username).emit("offer", { offer, username: name });
    });

    socket.on("answer", ({ answer, username }) => {
        // Forward the answer to the appropriate user
        socket.to(username).emit("answer", { answer, username: name });
    });

    socket.on("candidate", ({ eventCandidate, username }) => {
        // Forward the ICE candidate to the other user
        socket.to(username).emit("candidate", eventCandidate);
    });

    // Handling direct and group messages
    socket.on("Send", async (message, callback) => {
        const { text, for: target } = message;
        try {
            if (io.sockets.adapter.rooms.has(target)) {
                const newMessage = new MsgModel({
                    For: target,
                    Msg: text,
                    From: name,
                    isSend: true,
                });
                await newMessage.save();

                const { For, Msg, createdAt, isSend, From } = newMessage;
                socket.to(target).emit("receiveMessage", {
                    For,
                    Msg,
                    createdAt,
                    isSend,
                    From,
                });
                callback(newMessage);
            } else {
                const newMessage = new MsgModel({
                    For: target,
                    Msg: text,
                    From: name,
                    isSend: false,
                });
                await newMessage.save();
                const { For, Msg, createdAt, isSend, From } = newMessage;

                callback(newMessage);
            }
        } catch (error) {
            console.log("Error while sending message.", error);
        }
    });

    // Handle unsending a message
    socket.on("UnSend:MSG", async (data) => {
        const { username } = data;
        try {
            const oldMsg = await MsgModel.findOneAndUpdate(
                { username, isSend: false },
                { isSend: true },
                { new: true }
            ).select("-isSend -__v");

            if (oldMsg) {
                socket.to(name).emit("receiveMessage", oldMsg); // Send updated message to the user
            }
        } catch (error) {
            console.log("Error while unsending message.", error);
        }
    });

    // Handle joining a group
    socket.on("Join:group", async (data) => {
        const { groupname } = data;

        try {
            if (socket.rooms.has(groupname)) {
                return;
            }

            socket.join(groupname);

            socket.to(groupname).emit("User:Join", name); // Notify other group members of the new user
        } catch (error) {
            console.log("Error while joining the group.", error);
        }
    });

    // Handle sending group messages
    socket.on("Group:msg:send", async (data) => {
        const { groupname, value } = data;
        try {
            const newMessage = new MesseageModel({
                Msg: value,
                Sender: name,
                GroupId: groupname,
            });
            await newMessage.save();

            socket.to(groupname).emit("Group:Msg:Receved", newMessage);
        } catch (error) {
            console.log("Error while sending group message.", error);
        }
    });

    socket.on("poolVote", async (data) => {
        socket.to(data.groupname).emit("poolVote", data);
    });
    socket.on("vote:pool:add", async (data) => {
        const { GroupId, selectedOption, time, PollID } = data;
        io.to(GroupId).emit("vote:pool:Update", data);
    });

    socket.on("typing", async (username) => {
        socket.to(username).emit("typing", { username: name, istyping: true });
    });

    socket.on("not:typing", async (username) => {
        socket.to(username).emit("typing", { username: name, istyping: false });
    });

    socket.on("OnlineStutas", async (username) => {
        const isonline = await redis.sismember("OnlineUserList", username);
        if (isonline) {
            io.to(name).emit("OnlineStutasdetails", {
                username,
                isonline: true,
            });
        } else {
            io.to(name).emit("OnlineStutasdetails", {
                username,
                isonline: false,
            });
        }
    });
    // Handle disconnecting from the socket
    socket.on("disconnect", async () => {
        socket.broadcast.emit("OnlineStutasdetails", {
            username: name,
            isonline: false,
        });
        socket.leave(name);
        await redis.srem("OnlineUserList", name);
    });
};

module.exports = { handelRequest };
