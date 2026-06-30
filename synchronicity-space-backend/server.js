import app from "./src/app.js";
import http from "http"; // 🚀 Added this missing import
import https from "https";
import fs from "fs";
import { sequelize } from './src/database.js';
// import { WebSocketServer } from "ws";
import { setBroadcast } from "./src/routers/generatorRouter.js";
import { createHandler } from 'graphql-http/lib/use/express';
import { schema } from './src/graphql/schema.ts';
import { rootValue } from './src/graphql/resolvers.ts';
import { connectNoSql } from "./src/nosql.js";
import { Server } from 'socket.io';
import dns from 'node:dns';
import './src/models/User.js';   // Replace with your exact path to UserModel
import './src/models/Album.js';  // Replace with your exact path to AlbumModel
import './src/models/Track.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const PORT = process.env.PORT || 3000;

// app.all('/graphql', createHandler({schema, rootValue}))

let server; // 🚀 Declared the server variable so it doesn't throw a ReferenceError

if (process.env.NODE_ENV === 'production') {
  // Render handles the HTTPS/SSL decryption certificate automatically in the cloud.
  server = http.createServer(app);
} else {
  // Local development uses your self-signed .pem files
  const options = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem'),
  };
  server = https.createServer(options, app);
}
// const wss = new WebSocketServer({ server });

const io = new Server(server, {
  cors: {
    origin: [
      "https://172.20.10.3:5173",
      "https://localhost:5173",
      "https://synchronicity-space.vercel.app",
      "https://synchronicity-space-deea-andreeas-projects.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

setBroadcast((payload) => {
  io.emit("broadcast_event", payload);
})

const userSocketMap = {};
const activeSpins = {}; // 🚀 Tracks active users in each spin room: { [spinId]: Set<userId> }

async function startServer() {
  try {
    // await sequelize.sync({ alter: true });
    console.log("Tables have been synchronized.");
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    await connectNoSql();
    io.on("connection", (socket) => {
      socket.on("register_user", (userId) => {
        userSocketMap[userId] = socket.id;
        console.log(`User ${userId} is now linked to socket ${socket.id}`);
      });
      

      socket.on("send_invite", ({ senderName, friendIds, sessionId }) => {
        console.log(`Invite from ${senderName} to friends:`, friendIds);
        friendIds.forEach((friendId) => {
          const targetSocketId = userSocketMap[friendId];
          if (targetSocketId) {
            console.log(`Sending invite to friend ${friendId} at socket ${targetSocketId}`);
            io.to(targetSocketId).emit("receive_invite", {
              message: `${senderName} invited you to a listening session!`,
              sessionId: sessionId,
              senderName: senderName
            });
          }
          else {
            console.log(`Friend ${friendId} is not online (no socket found)`);
          }
        });
      });

      // 🚀 Added: Handling Shared Spin Invites
      socket.on("send_spin_invite", ({ senderName, friendIds, sessionId, invitedFriends }) => {
        console.log(`Spin Invite from ${senderName} to friends:`, friendIds);
        friendIds.forEach((friendId) => {
          const targetSocketId = userSocketMap[friendId];
          if (targetSocketId) {
            console.log(`Sending spin invite to friend ${friendId} at socket ${targetSocketId}`);
            io.to(targetSocketId).emit("receive_spin_invite", {
              sessionId: sessionId,
              senderName: senderName,
              invitedFriends: invitedFriends
            });
          } else {
            console.log(`Friend ${friendId} is not online (no socket found for spin)`);
          }
        });
      });

      // Joining Shared Spin Room (Presence Registration)
      socket.on("join_spin_presence", ({ spinId, userId, username }) => {
        socket.join(spinId);
        console.log(`Socket ${socket.id} (User: ${username}/${userId}) joined spin presence room: ${spinId}`);
        
        socket.spinId = spinId;
        socket.userId = userId;

        if (!activeSpins[spinId]) {
          activeSpins[spinId] = {};
        }
        activeSpins[spinId][userId] = username;

        // Broadcast list of currently active userIds in the session [1]
        io.to(spinId).emit("spin_presence_update", Object.keys(activeSpins[spinId]));
      });

      // Manual Exit from Shared Spin Room
      socket.on("leave_spin_presence", ({ spinId, userId }) => {
        socket.leave(spinId);
        console.log(`User ${userId} left spin room ${spinId}`);

        if (activeSpins[spinId]) {
          delete activeSpins[spinId][userId];
          io.to(spinId).emit("spin_presence_update", Array.from(Object.keys(activeSpins[spinId])));
        }
      });

      // Synchronize Turntable Music selections across room members [1]
      socket.on("sync_playback", ({ spinId, album, trackIndex }) => {
        console.log(`Syncing playback in room ${spinId}: ${album.title} (Track index: ${trackIndex})`);
        socket.to(spinId).emit("receive_playback_sync", { album, trackIndex });
      });

      socket.on("disconnect", () => {
        for (const userId in userSocketMap) {
          if (userSocketMap[userId] === socket.id) {
            console.log(`User ${userId} disconnected. Removing socket ${socket.id}`);
            delete userSocketMap[userId];
            break;
          }
        }

        // Auto-cleanup of active spin presence on disconnection
        if (socket.spinId && socket.userId) {
          const { spinId, userId } = socket;
          if (activeSpins[spinId]) {
            delete activeSpins[spinId][userId];
            io.to(spinId).emit("spin_presence_update", Array.from(Object.keys(activeSpins[spinId])));
            console.log(`User ${userId} disconnected. Removed from spin presence room ${spinId}`);
          }
        }
      });
      
      socket.on("sync_playback", ({ spinId, album, trackIndex }) => {
        console.log(`Syncing playback in room ${spinId}: ${album.title} (Track index: ${trackIndex})`);
        socket.to(spinId).emit("receive_playback_sync", { album, trackIndex });
      });

      
    });

    server.listen(PORT, () => {
      if (process.env.NODE_ENV === 'production') {
        console.log(`Production server running and accessible via HTTPS on Render port ${PORT}`);
      } else {
        console.log(`Local development server running on https://172.20.10.3:${PORT}`);
      }
    });

  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();