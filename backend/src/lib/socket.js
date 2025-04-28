import { Server } from "socket.io";

let io;

function initSocket(serverInstance) {
  io = new Server(serverInstance, {
    cors: {
      origin: ["http://localhost:5173"],
    },
  });

  const userSocketMap = {}; // Để lưu socketId của người dùng

  io.on("connection", (socket) => {
    console.log("A user connected", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) userSocketMap[userId] = socket.id;

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
      console.log("A user disconnected", socket.id);
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });
}

export { initSocket };
