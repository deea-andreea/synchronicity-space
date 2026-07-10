import app from "./src/app.js";
import http from "http";
import https from "https";
import fs from "fs";
import { sequelize } from './src/database.js';
import { setBroadcast } from "./src/routers/generatorRouter.js";
import { createHandler } from 'graphql-http/lib/use/express';
import { schema } from './src/graphql/schema.ts';
import { rootValue } from './src/graphql/resolvers.ts';
import { connectNoSql } from "./src/nosql.js";
import { Server } from 'socket.io';
import dns from 'node:dns';
import './src/models/User.js';
import './src/models/Album.js';
import './src/models/Track.js';
import './src/models/Chat.js';

// Correct DNS Configuration
dns.setServers(['8.8.8.8', '1.1.1.1']);

const PORT = process.env.PORT || 3000;

let server;

if (process.env.NODE_ENV === 'production') {
  server = http.createServer(app);
} else {
  const options = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem'),
  };
  server = https.createServer(options, app);
}

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
});

const userSocketMap = {};
const activeSpins = {}; // Tracks active users in each spin room: { [spinId]: { [userId]: username } }
const roomPolls = {}; // Persists poll state per room

async function startServer() {
  try {
    console.log("Tables have been synchronized.");
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    await connectNoSql();

    io.on("connection", (socket) => {
      socket.on("register_user", (userId) => {
        userSocketMap[userId] = socket.id;
        console.log(`User ${userId} is now linked to socket ${socket.id}`);
      });

      socket.on("join_session", (sessionId, cb) => {
        socket.join(sessionId);
        console.log(`Socket ${socket.id} joined session ${sessionId}`);
        if (roomPolls[sessionId]) {
          socket.emit("sync_poll", roomPolls[sessionId]);
        }
        if (typeof cb === 'function') cb({ joined: true });
      });

      socket.on("move_avatar", (data) => {
        io.to(data.roomId).emit("avatar_moved", data);
      });

      socket.on("send_message", (msgData) => {
        io.to(msgData.sessionId).emit("receive_message", msgData);
      });

      // --- Collision-Free Poll Event Handlers ---
      socket.on("add_suggestion", ({ roomId, suggestion }) => {
        if (!roomId || !suggestion) return;
        if (!roomPolls[roomId]) {
          roomPolls[roomId] = [];
        }

        const existingIndex = roomPolls[roomId].findIndex(s => String(s.userId) === String(suggestion.userId));
        if (existingIndex !== -1) {
          // Replace their existing suggestion with the new track, resetting votes
          roomPolls[roomId][existingIndex] = {
            userId: suggestion.userId,
            username: suggestion.username,
            track: suggestion.track,
            album: suggestion.album,
            trackIndex: suggestion.trackIndex,
            votes: []
          };
        } else {
          // Add as a new suggestion
          roomPolls[roomId].push({
            userId: suggestion.userId,
            username: suggestion.username,
            track: suggestion.track,
            album: suggestion.album,
            trackIndex: suggestion.trackIndex,
            votes: []
          });
        }

        // Sort by votes and keep top 10
        roomPolls[roomId].sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));
        roomPolls[roomId] = roomPolls[roomId].slice(0, 10);

        io.to(roomId).emit("sync_poll", roomPolls[roomId]);
      });

      socket.on("toggle_vote", ({ roomId, userId, suggestionUserId }) => {
        if (!roomId || !userId || !suggestionUserId || !roomPolls[roomId]) return;

        roomPolls[roomId] = roomPolls[roomId].map(s => {
          if (String(s.userId) === String(suggestionUserId)) {
            const currentVotes = s.votes || [];
            if (!currentVotes.includes(userId)) {
              return { ...s, votes: [...currentVotes, userId] };
            } else {
              return { ...s, votes: currentVotes.filter(id => id !== userId) };
            }
          }
          return s;
        });

        // Re-sort after votes change
        roomPolls[roomId].sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0));

        io.to(roomId).emit("sync_poll", roomPolls[roomId]);
      });

      socket.on("clear_poll", ({ roomId }) => {
        if (!roomId) return;
        roomPolls[roomId] = [];
        io.to(roomId).emit("sync_poll", []);
      });

      socket.on("send_invite", ({ senderName, friendIds, sessionId }) => {
        console.log(`Invite from ${senderName} to friends:`, friendIds);
        friendIds.forEach((friendId) => {
          const targetSocketId = userSocketMap[friendId];
          if (targetSocketId) {
            io.to(targetSocketId).emit("receive_invite", {
              message: `${senderName} invited you to a listening session!`,
              sessionId,
              senderName
            });
          } else {
            console.log(`Friend ${friendId} is not online (no socket found)`);
          }
        });
      });

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

      socket.on("join_spin_presence", ({ spinId, userId, username }, cb) => {
        socket.join(spinId);
        console.log(`Socket ${socket.id} (User: ${username}/${userId}) joined spin presence room: ${spinId}`);
        socket.spinId = spinId;
        socket.userId = userId;
        if (!activeSpins[spinId]) {
          activeSpins[spinId] = {};
        }
        activeSpins[spinId][userId] = username;
        io.to(spinId).emit("spin_presence_update", Object.keys(activeSpins[spinId]));
        if (roomPolls[spinId]) {
          socket.emit("sync_poll", roomPolls[spinId]);
        }
        if (typeof cb === 'function') cb({ joined: true });
      });

      socket.on("leave_spin_presence", ({ spinId, userId }) => {
        socket.leave(spinId);
        console.log(`User ${userId} left spin room ${spinId}`);
        if (activeSpins[spinId]) {
          delete activeSpins[spinId][userId];
          io.to(spinId).emit("spin_presence_update", Object.keys(activeSpins[spinId]));
        }
      });

      socket.on("sync_playback", ({ spinId, album, trackIndex }) => {
        console.log(`Syncing playback in room ${spinId}: ${album.title} (Track index: ${trackIndex})`);
        socket.to(spinId).emit("receive_playback_sync", { album, trackIndex });
      });

      socket.on("request_nearby_chat", async ({ roomId, participants }) => {
        try {
          const Chat = (await import('./src/models/Chat.js')).default;
          const sorted = [...participants].sort();
          let chat = await Chat.findOne({ participants: { $all: sorted, $size: sorted.length } });
          if (!chat) {
            chat = await Chat.create({ participants: sorted, messages: [] });
          }
          const payload = { chatId: String(chat._id), participants: sorted, messages: chat.messages || [] };
          socket.emit("chat_ready", payload);
          sorted.forEach(uid => {
            const targetSocket = userSocketMap[uid];
            if (targetSocket && targetSocket !== socket.id) {
              io.to(targetSocket).emit("chat_ready", payload);
            }
          });
        } catch (e) {
          console.error('Chat request error', e);
        }
      });

      socket.on("send_proximity_message", async ({ chatId, senderId, senderName, text }) => {
        try {
          const Chat = (await import('./src/models/Chat.js')).default;
          const msg = { senderId, senderName, text, createdAt: new Date() };
          const chat = await Chat.findByIdAndUpdate(chatId, { $push: { messages: msg } }, { new: true });
          if (chat) {
            socket.emit("receive_proximity_message", { chatId, msg });
            chat.participants.forEach(uid => {
              const targetSocket = userSocketMap[uid];
              if (targetSocket && targetSocket !== socket.id) {
                io.to(targetSocket).emit("receive_proximity_message", { chatId, msg });
              }
            });
          }
        } catch (e) {
          console.error('Proximity message error', e);
        }
      });

      socket.on("disconnect", () => {
        for (const userId in userSocketMap) {
          if (userSocketMap[userId] === socket.id) {
            console.log(`User ${userId} disconnected. Removing socket ${socket.id}`);
            delete userSocketMap[userId];
            break;
          }
        }
        if (socket.spinId && socket.userId) {
          const { spinId, userId } = socket;
          if (activeSpins[spinId]) {
            delete activeSpins[spinId][userId];
            io.to(spinId).emit("spin_presence_update", Object.keys(activeSpins[spinId]));
            console.log(`User ${userId} disconnected. Removed from spin presence room ${spinId}`);
          }
        }
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