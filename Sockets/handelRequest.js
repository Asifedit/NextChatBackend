const Msg = require("../model/msg_model");
const jwt = require("jsonwebtoken");
const MesseageModel = require("../model/Group/Messeage");
const GroupModel = require("../model/Group/GroupModel");
const handelRequest = async (socket, io) => {
    let name = socket.username;
    console.log(`${name} connected with ${socket.id}`);

    // WebRTC signaling (offer/answer/candidate)
    socket.on("offer", (offer) => {
        socket.broadcast.emit("offer", offer);
    });

    socket.on("answer", (answer) => {
        socket.broadcast.emit("answer", answer);
    });

    socket.on("candidate", (candidate) => {
        socket.broadcast.emit("candidate", candidate);
    });

    // Handling direct and group messages
    socket.on("Send", async (message) => {
        try {
            const { text, for: target } = message;

            // If the target is a group, ensure the group exists and broadcast the message
            if (io.sockets.adapter.rooms.has(target)) {
                const newMessage = new Msg({
                    For: target,
                    Msg: text,
                    From: name,
                    isSend: true,
                });
                await newMessage.save();
                socket.to(target).emit("receiveMessage", newMessage); // Broadcast to the group
                socket.to(name).emit("receiveMessage", newMessage); // Send confirmation to the sender
            } else {
                // If the target is a direct message, treat it as unsent message
                const newMessage = new Msg({
                    For: target,
                    Msg: text,
                    From: name,
                    isSend: false,
                });
                await newMessage.save();
                socket.to(name).emit("receiveMessage", newMessage); // Send confirmation to the sender
                io.emit("receiveMessage", newMessage); // Broadcast to everyone (for the receiver)
                socket.to(target).emit("receiveMessage", newMessage); // Send the message to the receiver
            }
        } catch (error) {
            sendError(socket, "Error while sending message.");
        }
    });

    // Handle unsending a message
    socket.on("UnSend:MSG", async (data) => {
        const { username } = data;
        try {
            const oldMsg = await Msg.findOneAndUpdate(
                { username, isSend: false },
                { isSend: true },
                { new: true }
            ).select("-isSend -__v");

            if (oldMsg) {
                socket.to(name).emit("receiveMessage", oldMsg); // Send updated message to the user
            } else {
                sendError(socket, "Message not found or already sent.");
            }
        } catch (error) {
            sendError(socket, "Error while unsending message.");
        }
    });

    // Handle joining a group
    socket.on("Join:group", async (data) => {
        const { groupname } = data;

        try {
            // Check if the user is already in the group
            // if (socket.rooms.has(groupname)) {
            //     sendError(
            //         socket,
            //         `You are already in the group "${groupname}".`
            //     );
            //     return;
            // }

            socket.join(groupname);

            // Notify other users in the group about the new user
            socket.to(groupname).emit("User:Join", name); // Notify other group members of the new user
        } catch (error) {
            sendError(socket, "Error while joining the group.");
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
            sendError("Error while sending group message.");
        }
    });

    // Handle disconnecting from the socket
    socket.on("disconnect", () => {
        socket.leave(name);
    });
};

module.exports = { handelRequest };
